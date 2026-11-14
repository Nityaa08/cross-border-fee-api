import request from "supertest";
import app from "../src/app";
import { calculateFees } from "../src/engine/calculator";
import { CHECKS, quoteGrid, runSelfCheck } from "../src/engine/selfcheck";
import { FeeCalculationRequest } from "../src/types";

describe("Self-check", () => {
  test("every invariant holds on every quote in the grid", () => {
    const report = runSelfCheck();
    expect(report.quotes).toBeGreaterThan(10000);
    expect(report.passed).toBe(true);
    for (const inv of report.invariants) {
      expect(inv).toMatchObject({ checked: report.quotes, failed: 0, example: null });
    }
    expect(report.invariants.map((i) => i.name)).toEqual(CHECKS.map((c) => c.name));
  });

  test("the grid covers every market, method, merchant side and currency", () => {
    const grid = quoteGrid();
    expect(new Set(grid.map((q) => q.customer_country))).toEqual(new Set(["MX", "CO", "BR", "AR"]));
    expect(new Set(grid.map((q) => q.payment_method)).size).toBe(3);
    expect(grid.some((q) => q.merchant_country === q.customer_country)).toBe(true);
    expect(grid.some((q) => q.original_currency !== "USD")).toBe(true);
    expect(Math.min(...grid.map((q) => q.original_amount))).toBe(0.01);
  });

  test("it catches a calculator whose total drifts by a cent", () => {
    // Like the bug fixed on 2026-11-13 (totals summed from unrounded amounts),
    // but on one grid price so the test controls exactly where it happens.
    const broken = (req: FeeCalculationRequest) => {
      const r = calculateFees(req);
      return req.original_amount === 1.38 ? { ...r, total_fees: r.total_fees + 0.01 } : r;
    };
    const report = runSelfCheck(broken);
    expect(report.passed).toBe(false);
    const lines = report.invariants.find((i) => i.name === "lines_add_up")!;
    expect(lines.failed).toBeGreaterThan(0);
    expect(lines.example!.original_amount).toBe(1.38);
  });

  test("GET /api/v1/selfcheck serves the report", async () => {
    const res = await request(app).get("/api/v1/selfcheck");
    expect(res.status).toBe(200);
    expect(res.body.passed).toBe(true);
    expect(res.body.invariants).toHaveLength(CHECKS.length);
  });
});
