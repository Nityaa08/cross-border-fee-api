import { calculateFees, round2 } from "../src/engine/calculator";
import {
  Currency,
  CustomerCountry,
  FeeCalculationRequest,
  FeeCalculationResponse,
  PaymentMethod,
} from "../src/types";

function findFee(res: FeeCalculationResponse, name: string) {
  return res.fees.find((f) => f.name === name);
}

/** Fee lines as { name: amount }, in the order the engine lists them. */
function feeAmounts(res: FeeCalculationResponse): Record<string, number> {
  return Object.fromEntries(res.fees.map((f) => [f.name, f.amount]));
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

    // Exact amounts. Mid-market base: 100 × 17.15 = 1,715 MXN.
    expect(res.settlement_amount).toBe(1715);
    expect(res.fx_rate).toBe(17.58); // 17.15 × 1.025 = 17.57875
    expect(feeAmounts(res)).toEqual({
      fx_conversion_cost: 42.88, // 2.5% of 1,715 = 42.875
      payment_processing_fee: 65.17, // 3.5% of 1,715 = 60.025, + 0.30 × 17.15 = 5.145
      cross_border_fee: 20.58, // 1.2% of 1,715
      tax_withholding: 274.4, // IVA 16% of 1,715
    });
    expect(res.total_fees).toBe(403.03);
    expect(res.total_fees_pct).toBe(0.235);
    expect(res.final_customer_price).toBe(2118.03);
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

    expect(res.settlement_amount).toBe(1715);
    expect(feeAmounts(res)).toEqual({
      fx_conversion_cost: 42.88, // 2.5% of 1,715 = 42.875
      payment_processing_fee: 30.87, // 1.8% of 1,715, no flat fee
      tax_withholding: 274.4, // IVA 16% of 1,715
    });
    expect(res.total_fees).toBe(348.15);
    expect(res.total_fees_pct).toBe(0.203);
    expect(res.final_customer_price).toBe(2063.15);
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

    // IOF on card purchases abroad: 3.5% (Decree 12,499/2025, art. 15-B VII).
    const tax = findFee(res, "tax_withholding")!;
    expect(tax.rate).toBe(0.035);
    expect(tax.description).toContain("IOF");

    // Mid-market base: 250 × 5.85 = 1,462.50 BRL.
    expect(res.settlement_amount).toBe(1462.5);
    expect(res.fx_rate).toBe(6); // 5.85 × 1.025 = 5.99625
    expect(feeAmounts(res)).toEqual({
      fx_conversion_cost: 36.56, // 2.5% of 1,462.50 = 36.5625
      payment_processing_fee: 62.89, // 4.2% = 61.425, + 0.25 × 5.85 = 1.4625
      cross_border_fee: 29.25, // 2.0% of 1,462.50
      tax_withholding: 51.19, // 3.5% of 1,462.50 = 51.1875
    });
    expect(res.total_fees).toBe(179.89);
    expect(res.total_fees_pct).toBe(0.123);
    expect(res.final_customer_price).toBe(1642.39);
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

    // Mid-market base: 50 × 1,050 = 52,500 ARS.
    expect(res.settlement_amount).toBe(52500);
    expect(feeAmounts(res)).toEqual({
      fx_conversion_cost: 2625, // 5% of 52,500
      payment_processing_fee: 3727.5, // 5.5% = 2,887.50, + 0.80 × 1,050 = 840
      cross_border_fee: 1312.5, // 2.5% of 52,500
      tax_withholding: 15750, // 30% of 52,500
    });
    expect(res.total_fees).toBe(23415);
    expect(res.total_fees_pct).toBe(0.446);
    expect(res.final_customer_price).toBe(75915);
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

    // 2% of 500,000, no flat fee for bank transfer
    expect(res.settlement_amount).toBe(500000);
    expect(feeAmounts(res)).toEqual({ payment_processing_fee: 10000 });
    expect(res.total_fees).toBe(10000);
    expect(res.total_fees_pct).toBe(0.02);
    expect(res.final_customer_price).toBe(510000);
  });

  // ── Flat fee is converted even when the price needs no FX ──
  test("Local-currency price: USD flat fee is converted to local currency", () => {
    const res = calculateFees({
      original_amount: 500000,
      original_currency: "COP",
      customer_country: "CO",
      merchant_country: "CO",
      payment_method: "card",
    });

    // 3.9% of 500,000 = 19,500, plus 0.30 USD × 4,150 = 1,245 COP
    const fee = findFee(res, "payment_processing_fee")!;
    expect(fee.amount).toBe(20745);
    expect(fee.currency).toBe("COP");
    expect(res.total_fees).toBe(20745);
    expect(res.final_customer_price).toBe(520745);
  });

  test("Flat fee is the same in local terms with or without FX", () => {
    // 100 USD into MXN vs the same amount already priced in MXN (1,715 MXN):
    // the processing fee must match, because both are the same payment.
    const viaFx = calculateFees({
      original_amount: 100,
      original_currency: "USD",
      customer_country: "MX",
      merchant_country: "MX",
      payment_method: "cash_voucher",
    });
    const local = calculateFees({
      original_amount: 1715,
      original_currency: "MXN",
      customer_country: "MX",
      merchant_country: "MX",
      payment_method: "cash_voucher",
    });

    // 4% of 1,715 = 68.60, plus 0.50 USD × 17.15 = 8.575 → 77.18 MXN
    expect(findFee(local, "payment_processing_fee")!.amount).toBe(77.18);
    expect(findFee(viaFx, "payment_processing_fee")!.amount).toBe(
      findFee(local, "payment_processing_fee")!.amount
    );
  });

  // ── The breakdown adds up ──
  test("Fee lines add up to total_fees, and base + fees = final price", () => {
    // Before the fix, totals were summed from unrounded amounts, so about a
    // third of quotes were a cent off: 0.38 USD → MX by card showed lines of
    // 0.16 + 5.37 + 1.04 = 6.57 MXN but total_fees of 6.58.
    const local: Record<CustomerCountry, Currency> = {
      MX: "MXN",
      CO: "COP",
      BR: "BRL",
      AR: "ARS",
    };
    const methods: PaymentMethod[] = ["card", "bank_transfer", "cash_voucher"];
    let checked = 0;

    for (const country of Object.keys(local) as CustomerCountry[]) {
      for (const method of methods) {
        for (const merchant of [country, "US"]) {
          for (const currency of ["USD", local[country]] as Currency[]) {
            for (let cents = 1; cents < 30000; cents += 137) {
              const res = calculateFees({
                original_amount: cents / 100,
                original_currency: currency,
                customer_country: country,
                merchant_country: merchant,
                payment_method: method,
              });
              const lines = round2(res.fees.reduce((s, f) => s + f.amount, 0));
              expect(lines).toBe(res.total_fees);
              expect(round2(res.settlement_amount + res.total_fees)).toBe(
                res.final_customer_price
              );
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(10000);
  });

  test("Half a cent rounds up, despite binary floating point", () => {
    // 2.5% of 1,715 MXN is exactly 42.875. Computed as converted − mid-market
    // it came out as 42.87499999999954 and was shown as 42.87.
    const res = calculateFees({
      original_amount: 100,
      original_currency: "USD",
      customer_country: "MX",
      merchant_country: "MX",
      payment_method: "bank_transfer",
    });
    expect(findFee(res, "fx_conversion_cost")!.amount).toBe(42.88);

    expect(round2(42.875)).toBe(42.88);
    expect(round2(1.005)).toBe(1.01); // stored as 1.00499999999999989…
    expect(round2(0.125)).toBe(0.13);
    expect(round2(20745)).toBe(20745);
  });

  test("total_fees_pct has at most 4 decimal places", () => {
    const res = calculateFees({
      original_amount: 0.38,
      original_currency: "USD",
      customer_country: "MX",
      merchant_country: "MX",
      payment_method: "card",
    });
    expect(Math.round(res.total_fees_pct * 10000) / 10000).toBe(
      res.total_fees_pct
    );
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
