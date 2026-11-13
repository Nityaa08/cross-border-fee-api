import {
  FeeCalculationRequest,
  FeeCalculationResponse,
  FeeLineItem,
  CustomerCountry,
} from "../types";
import config from "../config/fees";
import { convertCurrency, usdMidMarketRate } from "./fx";

/**
 * Round to 2 decimal places, halves up.
 *
 * `toPrecision(15)` first drops binary noise, so an amount that is exactly
 * half a cent in decimal (1,715 × 2.5% = 42.875) rounds up to 42.88 instead
 * of down because the double is stored as 42.87499999…
 */
export function round2(n: number): number {
  return Math.round(Number((n * 100).toPrecision(15))) / 100;
}

/**
 * Core fee calculation — pure function, deterministic for identical inputs.
 *
 * Calculation order:
 * 1. Convert original amount to customer's local currency (if needed)
 * 2. Apply payment method processing fee (on base amount)
 * 3. Apply cross-border fee (only if customer ≠ merchant country)
 * 4. Apply tax withholding (on the fee portion, country-dependent)
 * 5. Sum everything into final customer price
 */
export function calculateFees(
  req: FeeCalculationRequest
): FeeCalculationResponse {
  const countryConfig = config.countries[req.customer_country as CustomerCountry];
  if (!countryConfig) {
    throw new Error(`Unsupported customer country: ${req.customer_country}`);
  }

  const paymentFeeConfig = countryConfig.payment_methods[req.payment_method];
  if (!paymentFeeConfig) {
    throw new Error(
      `Unsupported payment method ${req.payment_method} for ${req.customer_country}`
    );
  }

  const settlementCurrency = countryConfig.currency;
  const fees: FeeLineItem[] = [];

  // ── Step 1: FX conversion ──
  const fxResult = convertCurrency(
    req.original_amount,
    req.original_currency,
    settlementCurrency
  );

  const baseAmountLocal = fxResult
    ? fxResult.converted_amount
    : req.original_amount;

  // The "base" that fees are calculated on (mid-market equivalent in local currency)
  const midMarketLocal = fxResult
    ? req.original_amount * fxResult.mid_market_rate
    : req.original_amount;

  if (fxResult) {
    fees.push({
      name: "fx_conversion_cost",
      rate: fxResult.spread_pct,
      amount: round2(fxResult.spread_cost),
      currency: settlementCurrency,
      description: `FX spread (${(fxResult.spread_pct * 100).toFixed(1)}%) on ${req.original_currency} → ${settlementCurrency} conversion. Mid-market: ${fxResult.mid_market_rate}, effective: ${round2(fxResult.effective_rate)}`,
    });
  }

  // ── Step 2: Payment method fee ──
  // The flat fee is configured in USD, so it always needs converting to the
  // settlement currency, even when the price itself is already local (no FX).
  // Mid-market rate, so the customer is not charged the spread on a fee.
  const flatFeeLocal =
    paymentFeeConfig.flat_fee_usd * usdMidMarketRate(settlementCurrency);

  const paymentPercentageFee = midMarketLocal * paymentFeeConfig.percentage_fee;
  const totalPaymentFee = flatFeeLocal + paymentPercentageFee;

  fees.push({
    name: "payment_processing_fee",
    rate: paymentFeeConfig.percentage_fee,
    amount: round2(totalPaymentFee),
    currency: settlementCurrency,
    description: `${req.payment_method} processing: ${(paymentFeeConfig.percentage_fee * 100).toFixed(1)}% + ${paymentFeeConfig.flat_fee_usd} USD flat`,
  });

  // ── Step 3: Cross-border fee ──
  const isCrossBorder =
    req.customer_country.toUpperCase() !== req.merchant_country.toUpperCase();

  let crossBorderFee = 0;
  if (isCrossBorder) {
    crossBorderFee = midMarketLocal * countryConfig.cross_border_fee_pct;
    fees.push({
      name: "cross_border_fee",
      rate: countryConfig.cross_border_fee_pct,
      amount: round2(crossBorderFee),
      currency: settlementCurrency,
      description: `Cross-border surcharge (${(countryConfig.cross_border_fee_pct * 100).toFixed(1)}%) — merchant in ${req.merchant_country}, customer in ${req.customer_country}`,
    });
  }

  // ── Step 4: Tax withholding ──
  // Applied on the base amount for cross-border digital purchases.
  // Only applied when the transaction involves foreign currency or is cross-border.
  const taxApplies = fxResult !== null || isCrossBorder;
  let taxAmount = 0;
  if (taxApplies && countryConfig.tax_withholding_pct > 0) {
    taxAmount = midMarketLocal * countryConfig.tax_withholding_pct;
    fees.push({
      name: "tax_withholding",
      rate: countryConfig.tax_withholding_pct,
      amount: round2(taxAmount),
      currency: settlementCurrency,
      description: `Tax/withholding (${(countryConfig.tax_withholding_pct * 100).toFixed(1)}%) on cross-border/foreign-currency transaction`,
    });
  }

  // ── Step 5: Totals ──
  // Totals are built from the rounded amounts the customer sees, so the
  // fee lines always add up to total_fees, and settlement_amount plus
  // total_fees is always final_customer_price.
  const settlementAmount = round2(midMarketLocal);
  const totalFees = round2(fees.reduce((sum, fee) => sum + fee.amount, 0));
  const finalPrice = round2(settlementAmount + totalFees);
  const totalFeesPct = settlementAmount > 0 ? totalFees / settlementAmount : 0;

  return {
    original_amount: req.original_amount,
    original_currency: req.original_currency,
    settlement_currency: settlementCurrency,
    settlement_amount: settlementAmount,
    fx_rate: fxResult ? round2(fxResult.effective_rate) : null,
    fx_spread_pct: fxResult ? fxResult.spread_pct : null,
    fees,
    total_fees: totalFees,
    total_fees_pct: Math.round(totalFeesPct * 10000) / 10000, // 4 decimal places
    final_customer_price: finalPrice,
    final_currency: settlementCurrency,
  };
}
