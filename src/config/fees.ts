import { AppConfig } from "../types";

/**
 * All fee rates, FX spreads, and tax rules are defined here.
 * In production this would be loaded from a database or external config service.
 *
 * Assumptions documented in README:
 * - FX rates are mocked mid-market rates (as of early 2026 approximations)
 * - Spread markups reflect typical PSP markups for LATAM corridors
 * - Tax withholding reflects VAT/IVA on cross-border digital services
 * - Payment method fees reflect typical acquiring costs in each country
 */
const config: AppConfig = {
  fx_cache_ttl_seconds: 300, // 5 min cache for FX rates

  countries: {
    MX: {
      currency: "MXN",
      tax_withholding_pct: 0.16, // IVA 16%
      cross_border_fee_pct: 0.012, // 1.2%
      payment_methods: {
        card: { flat_fee_usd: 0.30, percentage_fee: 0.035 },
        bank_transfer: { flat_fee_usd: 0.0, percentage_fee: 0.018 },
        cash_voucher: { flat_fee_usd: 0.50, percentage_fee: 0.04 },
      },
    },
    CO: {
      currency: "COP",
      tax_withholding_pct: 0.19, // IVA 19%
      cross_border_fee_pct: 0.015, // 1.5%
      payment_methods: {
        card: { flat_fee_usd: 0.30, percentage_fee: 0.039 },
        bank_transfer: { flat_fee_usd: 0.0, percentage_fee: 0.02 },
        cash_voucher: { flat_fee_usd: 0.60, percentage_fee: 0.045 },
      },
    },
    BR: {
      currency: "BRL",
      tax_withholding_pct: 0.065, // IOF 6.38% on cross-border card, simplified to 6.5%
      cross_border_fee_pct: 0.02, // 2.0%
      payment_methods: {
        card: { flat_fee_usd: 0.25, percentage_fee: 0.042 },
        bank_transfer: { flat_fee_usd: 0.0, percentage_fee: 0.015 }, // PIX-like
        cash_voucher: { flat_fee_usd: 0.70, percentage_fee: 0.05 }, // Boleto
      },
    },
    AR: {
      currency: "ARS",
      tax_withholding_pct: 0.30, // PAIS tax ~30% on foreign currency purchases
      cross_border_fee_pct: 0.025, // 2.5%
      payment_methods: {
        card: { flat_fee_usd: 0.35, percentage_fee: 0.045 },
        bank_transfer: { flat_fee_usd: 0.0, percentage_fee: 0.025 },
        cash_voucher: { flat_fee_usd: 0.80, percentage_fee: 0.055 },
      },
    },
  },

  fx_rates: [
    {
      from: "USD",
      to: "MXN",
      mid_market_rate: 17.15,
      spread_pct: 0.025, // 2.5% spread
      updated_at: "2026-02-21T00:00:00Z",
    },
    {
      from: "USD",
      to: "COP",
      mid_market_rate: 4150.0,
      spread_pct: 0.03, // 3% spread
      updated_at: "2026-02-21T00:00:00Z",
    },
    {
      from: "USD",
      to: "BRL",
      mid_market_rate: 5.85,
      spread_pct: 0.025, // 2.5% spread
      updated_at: "2026-02-21T00:00:00Z",
    },
    {
      from: "USD",
      to: "ARS",
      mid_market_rate: 1050.0,
      spread_pct: 0.05, // 5% spread (volatile currency)
      updated_at: "2026-02-21T00:00:00Z",
    },
  ],
};

export default config;
