import { Router, Request, Response } from "express";
import config from "../config/fees";

const router = Router();

/**
 * GET /api/v1/config
 *
 * The configured markets, rates and their dates, so a client (and the demo
 * page) can show where every number comes from.
 */
router.get("/", (_req: Request, res: Response) => {
  const countries = Object.entries(config.countries).map(([code, c]) => ({
    code,
    currency: c.currency,
    tax_withholding_pct: c.tax_withholding_pct,
    tax_rule: c.tax_rule,
    cross_border_fee_pct: c.cross_border_fee_pct,
    payment_methods: c.payment_methods,
  }));
  res.json({
    countries,
    fx_rates: config.fx_rates,
    payment_methods: ["card", "bank_transfer", "cash_voucher"],
    notes: [
      "Rates are illustrative constants, not live quotes.",
      "FX rates are dated 2026-02-21.",
      "Brazil IOF is 3.5% on card purchases abroad (Decree 12,499/2025), checked 2026-11-14.",
      "The Argentina 30% rule labelled PAIS is out of date, and the MX and CO IVA rates have not been checked against a source; see the README.",
    ],
  });
});

export default router;
