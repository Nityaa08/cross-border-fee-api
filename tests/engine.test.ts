import { calculateFees } from "../src/engine/calculator";
import { FeeCalculationRequest, FeeCalculationResponse } from "../src/types";

function findFee(res: FeeCalculationResponse, name: string) {
  return res.fees.find((f) => f.name === name);
}

describe("Fee Calculation Engine", () => {
  // ── Scenario 1: Standard USD→MXN card payment, cross-border ──
  test("Scenario 1: US merchant → MX customer, $100 USD, card", () => {
    const req: FeeCalculationRequest = {
      original_amount: 100,
      original_currency: "USD",
      customer_country: "MX",
      merchant_country: "US",
      payment_method: "card",
    };

    const res = calculateFees(req);

    expect(res.original_amount).toBe(100);
    expect(res.original_currency).toBe("USD");
    expect(res.settlement_currency).toBe("MXN");
    expect(res.fx_rate).not.toBeNull();
    expect(res.final_customer_price).toBeGreaterThan(res.settlement_amount);

    // Should have FX, payment, cross-border, and tax fees
    expect(findFee(res, "fx_conversion_cost")).toBeDefined();
    expect(findFee(res, "payment_processing_fee")).toBeDefined();
    expect(findFee(res, "cross_border_fee")).toBeDefined();
    expect(findFee(res, "tax_withholding")).toBeDefined();
  });

  // ── Scenario 2: Domestic MX→MX transaction, no cross-border fee ──
  test("Scenario 2: MX merchant → MX customer, $100 USD, bank_transfer", () => {
    const req: FeeCalculationRequest = {
      original_amount: 100,
      original_currency: "USD",
      customer_country: "MX",
      merchant_country: "MX",
      payment_method: "bank_transfer",
    };

    const res = calculateFees(req);

    // No cross-border fee for domestic
    expect(findFee(res, "cross_border_fee")).toBeUndefined();
    // Still has FX conversion since USD → MXN
    expect(findFee(res, "fx_conversion_cost")).toBeDefined();
    // Still has tax since foreign currency
    expect(findFee(res, "tax_withholding")).toBeDefined();
  });

  // ── Scenario 3: Brazilian customer, card, cross-border (IOF) ──
  test("Scenario 3: US merchant → BR customer, $250 USD, card", () => {
    const req: FeeCalculationRequest = {
      original_amount: 250,
      original_currency: "USD",
      customer_country: "BR",
      merchant_country: "US",
      payment_method: "card",
    };

    const res = calculateFees(req);

    expect(res.settlement_currency).toBe("BRL");
    expect(findFee(res, "cross_border_fee")).toBeDefined();
    expect(findFee(res, "tax_withholding")).toBeDefined();

    // IOF-like tax should be ~6.5%
    const tax = findFee(res, "tax_withholding")!;
    expect(tax.rate).toBe(0.065);
  });

  // ── Scenario 4: Argentine customer, cash_voucher, high tax ──
  test("Scenario 4: US merchant → AR customer, $50 USD, cash_voucher", () => {
    const req: FeeCalculationRequest = {
      original_amount: 50,
      original_currency: "USD",
      customer_country: "AR",
      merchant_country: "US",
      payment_method: "cash_voucher",
    };

    const res = calculateFees(req);

    expect(res.settlement_currency).toBe("ARS");

    // AR has 30% PAIS tax — total fees should be very high
    const tax = findFee(res, "tax_withholding")!;
    expect(tax.rate).toBe(0.3);
    expect(res.total_fees_pct).toBeGreaterThan(0.35); // >35% total
  });

  // ── Scenario 5: Colombian customer, domestic bank_transfer ──
  test("Scenario 5: CO merchant → CO customer, 500000 COP, bank_transfer", () => {
    const req: FeeCalculationRequest = {
      original_amount: 500000,
      original_currency: "COP",
      customer_country: "CO",
      merchant_country: "CO",
      payment_method: "bank_transfer",
    };

    const res = calculateFees(req);

    // Same currency, domestic — no FX, no cross-border, no tax
    expect(res.fx_rate).toBeNull();
    expect(findFee(res, "fx_conversion_cost")).toBeUndefined();
    expect(findFee(res, "cross_border_fee")).toBeUndefined();
    expect(findFee(res, "tax_withholding")).toBeUndefined();

    // Only payment processing fee
    expect(res.fees).toHaveLength(1);
    expect(res.fees[0].name).toBe("payment_processing_fee");

    // Final price = base + processing fee only
    expect(res.final_customer_price).toBeGreaterThan(500000);
    expect(res.final_customer_price).toBeLessThan(520000); // <4% fee
  });

  // ── Determinism ──
  test("Identical inputs produce identical outputs", () => {
    const req: FeeCalculationRequest = {
      original_amount: 100,
      original_currency: "USD",
      customer_country: "MX",
      merchant_country: "US",
      payment_method: "card",
    };

    const res1 = calculateFees(req);
    const res2 = calculateFees(req);

    expect(res1).toEqual(res2);
  });

  // ── Edge case: unsupported country ──
  test("Throws for unsupported country", () => {
    const req: FeeCalculationRequest = {
      original_amount: 100,
      original_currency: "USD",
      customer_country: "CL" as any,
      merchant_country: "US",
      payment_method: "card",
    };

    expect(() => calculateFees(req)).toThrow("Unsupported customer country");
  });
});
