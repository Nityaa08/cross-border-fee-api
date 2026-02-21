import {
  FeeCalculationRequest,
  FeeCalculationResponse,
  FeeLineItem,
  CustomerCountry,
} from "../types";
import config from "../config/fees";
import { convertCurrency } from "./fx";

/**
 * Round to 2 decimal places using banker's rounding approach.
 */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
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
  // Flat fee converted to local currency if needed
  const flatFeeLocal = fxResult
    ? paymentFeeConfig.flat_fee_usd * fxResult.mid_market_rate
    : paymentFeeConfig.flat_fee_usd;

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
  const totalFees =
    (fxResult ? fxResult.spread_cost : 0) +
    totalPaymentFee +
    crossBorderFee +
    taxAmount;

  const finalPrice = midMarketLocal + totalFees;
  const totalFeesPct = midMarketLocal > 0 ? totalFees / midMarketLocal : 0;

  return {
    original_amount: req.original_amount,
    original_currency: req.original_currency,
    settlement_currency: settlementCurrency,
    settlement_amount: round2(midMarketLocal),
    fx_rate: fxResult ? round2(fxResult.effective_rate) : null,
    fx_spread_pct: fxResult ? fxResult.spread_pct : null,
    fees,
    total_fees: round2(totalFees),
    total_fees_pct: round2(totalFeesPct * 10000) / 10000, // 4 decimal places
    final_customer_price: round2(finalPrice),
    final_currency: settlementCurrency,
  };
}
