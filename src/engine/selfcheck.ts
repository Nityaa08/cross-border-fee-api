import { calculateFees, round2 } from "./calculator";
import config from "../config/fees";
import {
  Currency,
  CustomerCountry,
  FeeCalculationRequest,
  FeeCalculationResponse,
  PaymentMethod,
} from "../types";

/**
 * Self-check: run the calculator over a grid of quotes and verify the
 * properties every receipt must have. The grid covers every market, payment
 * method, domestic and cross-border merchant, both price currencies, and
 * prices from 0.01 to about 300 in uneven steps (so rounding edge cases show).
 *
 * Served at GET /api/v1/selfcheck so the demo page can show the result live.
 */

export interface Invariant {
  name: string;
  description: string;
  checked: number;
  failed: number;
  /** First failing request, to reproduce it. */
  example: FeeCalculationRequest | null;
}

export interface SelfCheckReport {
  quotes: number;
  passed: boolean;
  invariants: Invariant[];
  ms: number;
}

type Check = {
  name: string;
  description: string;
  holds: (r: FeeCalculationResponse, req: FeeCalculationRequest) => boolean;
};

export const CHECKS: Check[] = [
  {
    name: "lines_add_up",
    description: "The fee lines add up to total_fees",
    holds: (r) => round2(r.fees.reduce((s, f) => s + f.amount, 0)) === r.total_fees,
  },
  {
    name: "price_adds_up",
    description: "Base amount + total_fees = final price",
    holds: (r) => round2(r.settlement_amount + r.total_fees) === r.final_customer_price,
  },
  {
    name: "no_negative_fees",
    description: "No fee line is negative",
    holds: (r) => r.fees.every((f) => f.amount >= 0),
  },
  {
    name: "local_currency",
    description: "Every line is in the customer's currency",
    holds: (r) => r.fees.every((f) => f.currency === r.final_currency),
  },
  {
    name: "domestic_has_no_cross_border_fee",
    description: "A domestic payment has no cross-border fee",
    holds: (r, req) =>
      req.merchant_country !== req.customer_country ||
      !r.fees.some((f) => f.name === "cross_border_fee"),
  },
];

export function quoteGrid(): FeeCalculationRequest[] {
  const methods: PaymentMethod[] = ["card", "bank_transfer", "cash_voucher"];
  const grid: FeeCalculationRequest[] = [];
  for (const [code, c] of Object.entries(config.countries)) {
    const country = code as CustomerCountry;
    for (const method of methods) {
      if (!c.payment_methods[method]) continue;
      for (const merchant of [country, "US"]) {
        for (const currency of ["USD", c.currency] as Currency[]) {
          for (let cents = 1; cents < 30000; cents += 137) {
            grid.push({
              original_amount: cents / 100,
              original_currency: currency,
              customer_country: country,
              merchant_country: merchant,
              payment_method: method,
            });
          }
        }
      }
    }
  }
  return grid;
}

export function runSelfCheck(
  calc: (req: FeeCalculationRequest) => FeeCalculationResponse = calculateFees,
  checks: Check[] = CHECKS
): SelfCheckReport {
  const started = Date.now();
  const grid = quoteGrid();
  const invariants: Invariant[] = checks.map((c) => ({
    name: c.name,
    description: c.description,
    checked: 0,
    failed: 0,
    example: null,
  }));
  for (const req of grid) {
    const res = calc(req);
    checks.forEach((c, i) => {
      const inv = invariants[i];
      inv.checked++;
      if (!c.holds(res, req)) {
        inv.failed++;
        inv.example ??= req;
      }
    });
  }
  return {
    quotes: grid.length,
    passed: invariants.every((i) => i.failed === 0),
    invariants,
    ms: Date.now() - started,
  };
}
