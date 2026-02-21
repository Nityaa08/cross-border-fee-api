// ── Supported enums ──

export type CustomerCountry = "MX" | "CO" | "BR" | "AR";
export type Currency = "USD" | "MXN" | "COP" | "BRL" | "ARS";
export type PaymentMethod = "card" | "bank_transfer" | "cash_voucher";

// ── Request / Response ──

export interface FeeCalculationRequest {
  original_amount: number;
  original_currency: Currency;
  customer_country: CustomerCountry;
  merchant_country: string;
  payment_method: PaymentMethod;
}

export interface FeeLineItem {
  name: string;
  rate: number | null; // percentage rate applied, null if flat
  amount: number; // absolute amount in settlement currency
  currency: Currency;
  description: string;
}

export interface FeeCalculationResponse {
  original_amount: number;
  original_currency: Currency;
  settlement_currency: Currency;
  settlement_amount: number;
  fx_rate: number | null; // null if no conversion needed
  fx_spread_pct: number | null;
  fees: FeeLineItem[];
  total_fees: number;
  total_fees_pct: number;
  final_customer_price: number;
  final_currency: Currency;
}

// ── Configuration types ──

export interface FxRateEntry {
  from: Currency;
  to: Currency;
  mid_market_rate: number;
  spread_pct: number; // markup over mid-market
  updated_at: string;
}

export interface PaymentMethodFee {
  flat_fee_usd: number;
  percentage_fee: number; // as decimal, e.g. 0.035 = 3.5%
}

export interface CountryConfig {
  currency: Currency;
  tax_withholding_pct: number; // VAT / IVA on digital services
  cross_border_fee_pct: number;
  payment_methods: Record<PaymentMethod, PaymentMethodFee>;
}

export interface AppConfig {
  countries: Record<CustomerCountry, CountryConfig>;
  fx_rates: FxRateEntry[];
  fx_cache_ttl_seconds: number;
}

// ── Validation ──

export interface ValidationError {
  field: string;
  message: string;
}
