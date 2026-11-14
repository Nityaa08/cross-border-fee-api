import { AppConfig } from "../types";

/**
 * All fee rates, FX spreads, and tax rules are defined here.
 * In production this would be loaded from a database or external config service.
 *
 * Assumptions documented in README:
 * - FX rates are mocked mid-market rates (as of early 2026 approximations)
 * - Spread markups reflect typical PSP markups for LATAM corridors
 * - Tax withholding reflects VAT/IVA on cross-border digital services; each
 *   country's tax_rule says where its rate comes from and when it was checked
 * - Payment method fees reflect typical acquiring costs in each country
 */
const config: AppConfig = {
  fx_cache_ttl_seconds: 300, // 5 min cache for FX rates

  countries: {
    MX: {
      currency: "MXN",
      tax_withholding_pct: 0.16, // IVA 16%
      tax_rule: {
        name: "IVA",
        basis: "Mexican VAT, 16% standard rate",
        source: null,
        checked_on: null,
      },
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
      tax_rule: {
        name: "IVA",
        basis: "Colombian VAT, 19% standard rate",
        source: null,
        checked_on: null,
      },
      cross_border_fee_pct: 0.015, // 1.5%
      payment_methods: {
        card: { flat_fee_usd: 0.30, percentage_fee: 0.039 },
        bank_transfer: { flat_fee_usd: 0.0, percentage_fee: 0.02 },
        cash_voucher: { flat_fee_usd: 0.60, percentage_fee: 0.045 },
      },
    },
    BR: {
      currency: "BRL",
      // IOF on card purchases abroad: 3.5%. Decree 6,306/2007 art. 15-B VII,
      // as worded by Decree 12,499/2025 (first set at 3.5% by Decree
      // 12,466/2025 from 23 May 2025). Congress suspended the decrees on
      // 25 June 2025; the Supreme Federal Court reinstated Decree 12,499 on
      // 17 July 2025, not retroactively (EY Global Tax News, 18 July 2025).
      // Was 6.5% here, from the old 6.38% rate.
      tax_withholding_pct: 0.035,
      tax_rule: {
        name: "IOF",
        basis:
          "Decree 6,306/2007 art. 15-B VII, as worded by Decree 12,499/2025; in force again since the Supreme Federal Court decision of 17 July 2025",
        source:
          "Decree 12,499/2025 text (Câmara dos Deputados, legin/fed/decret/2025/decreto-12499-11-junho-2025); EY Global Tax News 2025-1533, 18 July 2025",
        checked_on: "2026-11-14",
      },
      cross_border_fee_pct: 0.02, // 2.0%
      payment_methods: {
        card: { flat_fee_usd: 0.25, percentage_fee: 0.042 },
        bank_transfer: { flat_fee_usd: 0.0, percentage_fee: 0.015 }, // PIX-like
        cash_voucher: { flat_fee_usd: 0.70, percentage_fee: 0.05 }, // Boleto
      },
    },
    AR: {
      currency: "ARS",
      // Out of date: Impuesto PAIS ended on 23 December 2024 (EY Global Tax
      // News 2025-0160, 7 January 2025). A separate 30% income-tax reverse
      // withholding continued on card purchases abroad, per the same report;
      // its current scope is not verified, so the rate is left unchanged.
      tax_withholding_pct: 0.30,
      tax_rule: {
        name: "30% rule labelled PAIS (out of date)",
        basis:
          "Impuesto PAIS, which ended on 23 December 2024; a 30% income-tax reverse withholding continued on card purchases abroad (scope not verified)",
        source: "EY Global Tax News 2025-0160, 7 January 2025",
        checked_on: null,
      },
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
