import request from "supertest";
import app from "../src/app";
import * as calculator from "../src/engine/calculator";

describe("API Integration Tests", () => {
  test("POST /api/v1/calculate — valid request returns 200", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({
        original_amount: 100,
        original_currency: "USD",
        customer_country: "MX",
        merchant_country: "US",
        payment_method: "card",
      });

    expect(res.status).toBe(200);
    expect(res.body.original_amount).toBe(100);
    expect(res.body.final_customer_price).toBeGreaterThan(0);
    expect(res.body.fees).toBeInstanceOf(Array);
    expect(res.body.fees.length).toBeGreaterThanOrEqual(1);
  });

  test("POST /api/v1/calculate — missing fields returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({ original_amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.length).toBeGreaterThanOrEqual(3);
  });

  test("POST /api/v1/calculate — negative amount returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({
        original_amount: -50,
        original_currency: "USD",
        customer_country: "MX",
        merchant_country: "US",
        payment_method: "card",
      });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("original_amount");
  });

  test("POST /api/v1/calculate — invalid country returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({
        original_amount: 100,
        original_currency: "USD",
        customer_country: "CL",
        merchant_country: "US",
        payment_method: "card",
      });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("customer_country");
  });

  test("POST /api/v1/calculate — invalid payment method returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({
        original_amount: 100,
        original_currency: "USD",
        customer_country: "MX",
        merchant_country: "US",
        payment_method: "crypto",
      });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("payment_method");
  });

  test("POST /api/v1/calculate — malformed JSON returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .set("Content-Type", "application/json")
      .send('{"original_amount": 100,');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Malformed JSON");
  });

  test("POST /api/v1/calculate — currency with no rate to the customer's currency returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({
        original_amount: 100,
        original_currency: "MXN",
        customer_country: "CO",
        merchant_country: "MX",
        payment_method: "card",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toEqual([
      {
        field: "original_currency",
        message: "original_currency must be USD or COP for customer_country CO",
      },
    ]);
  });

  test("POST /api/v1/calculate — price already in local currency is accepted", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({
        original_amount: 1000,
        original_currency: "BRL",
        customer_country: "BR",
        merchant_country: "BR",
        payment_method: "bank_transfer",
      });

    expect(res.status).toBe(200);
    expect(res.body.settlement_currency).toBe("BRL");
  });

  test("POST /api/v1/calculate — server errors return 500 without internal detail", async () => {
    const spy = jest
      .spyOn(calculator, "calculateFees")
      .mockImplementation(() => {
        throw new Error("secret internal detail");
      });
    const log = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app)
      .post("/api/v1/calculate")
      .send({
        original_amount: 100,
        original_currency: "USD",
        customer_country: "MX",
        merchant_country: "US",
        payment_method: "card",
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(res.body)).not.toContain("secret");

    spy.mockRestore();
    log.mockRestore();
  });

  const valid = {
    original_amount: 100,
    original_currency: "USD",
    customer_country: "MX",
    merchant_country: "US",
    payment_method: "card",
  };

  test.each(["ZZ", "zz", "XX", "U1", "USA", 42])(
    "POST /api/v1/calculate — merchant_country %p that is not an ISO code returns 400",
    async (merchant_country) => {
      const res = await request(app)
        .post("/api/v1/calculate")
        .send({ ...valid, merchant_country });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([
        expect.objectContaining({ field: "merchant_country" }),
      ]);
    }
  );

  test("POST /api/v1/calculate — lower-case merchant_country is accepted as upper case", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({ ...valid, merchant_country: "de" });

    expect(res.status).toBe(200);
    const crossBorder = res.body.fees.find((f: { name: string }) => f.name === "cross_border_fee");
    expect(crossBorder.description).toContain("merchant in DE");
  });

  test("POST /api/v1/calculate — lower-case currency, customer country and method match upper case", async () => {
    const upper = await request(app).post("/api/v1/calculate").send(valid);
    const lower = await request(app)
      .post("/api/v1/calculate")
      .send({
        ...valid,
        original_currency: valid.original_currency.toLowerCase(),
        customer_country: valid.customer_country.toLowerCase(),
        payment_method: valid.payment_method.toUpperCase(),
      });

    expect(lower.status).toBe(200);
    expect(lower.body).toEqual(upper.body);
    expect(lower.body.original_currency).toBe(valid.original_currency);
  });

  test("POST /api/v1/calculate — the amount cap uses the currency even when it is lower case", async () => {
    // 1,000,000 USD = 4,150,000,000 COP; "cop" must get the COP cap, not skip it.
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({ ...valid, original_amount: 4_150_000_001, original_currency: "cop", customer_country: "co" });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("original_amount");
  });

  test("POST /api/v1/calculate — a form-encoded body (curl -d without a JSON header) returns 415", async () => {
    // curl -d '{...}' sends application/x-www-form-urlencoded. This used to answer
    // 400 with all five fields "required", though the client had sent them all.
    const res = await request(app)
      .post("/api/v1/calculate")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send(JSON.stringify(valid));

    expect(res.status).toBe(415);
    expect(res.body.error).toBe("Unsupported Media Type");
    expect(res.body.message).toContain("application/x-www-form-urlencoded");
  });

  test("POST /api/v1/calculate — a text/plain body returns 415", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .set("Content-Type", "text/plain")
      .send(JSON.stringify(valid));

    expect(res.status).toBe(415);
  });

  test("POST /api/v1/calculate — JSON with a charset parameter is still accepted", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .set("Content-Type", "application/json; charset=utf-8")
      .send(JSON.stringify(valid));

    expect(res.status).toBe(200);
  });

  test("POST /api/v1/calculate — no body at all is still a 400 listing the required fields", async () => {
    const res = await request(app).post("/api/v1/calculate");

    expect(res.status).toBe(400);
    expect(res.body.details).toHaveLength(5);
  });

  test.each([0.001, 0.009])(
    "POST /api/v1/calculate — amount %p below 0.01 returns 400",
    async (original_amount) => {
      const res = await request(app)
        .post("/api/v1/calculate")
        .send({ ...valid, original_amount });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([
        { field: "original_amount", message: "original_amount must be at least 0.01" },
      ]);
    }
  );

  test("POST /api/v1/calculate — amount of exactly 0.01 is accepted", async () => {
    const res = await request(app)
      .post("/api/v1/calculate")
      .send({ ...valid, original_amount: 0.01 });

    expect(res.status).toBe(200);
  });

  test.each([
    ["COP", "CO", 41.49, 41.5, "41.50 COP"],
    ["ARS", "AR", 10.49, 10.5, "10.50 ARS"],
    ["MXN", "MX", 0.17, 0.18, "0.18 MXN"],
    ["BRL", "BR", 0.05, 0.06, "0.06 BRL"],
  ])(
    "POST /api/v1/calculate — the minimum is one US cent in %s too",
    async (currency, country, below, atMin, shown) => {
      // The 0.01 minimum used to be in the price's own currency: 0.01 COP
      // (about 0.000002 USD) was accepted and charged a 1,245 COP flat fee,
      // so total_fees_pct came back as 124,500.
      const local = { ...valid, original_currency: currency, customer_country: country, merchant_country: country };
      const low = await request(app).post("/api/v1/calculate").send({ ...local, original_amount: below });
      expect(low.status).toBe(400);
      expect(low.body.details).toEqual([
        { field: "original_amount", message: `original_amount must be at least ${shown} (0.01 USD)` },
      ]);
      const ok = await request(app).post("/api/v1/calculate").send({ ...local, original_amount: atMin });
      expect(ok.status).toBe(200);
    }
  );

  test("POST /api/v1/calculate — the maximum amount is 1,000,000 USD or its local equivalent", async () => {
    // The cap was 1,000,000 in any currency: a 1,200,000 COP price (about
    // 289 USD) was rejected, while 1,000,000 USD was accepted.
    const cop = { ...valid, original_currency: "COP", customer_country: "CO", merchant_country: "CO" };
    const ok = await request(app).post("/api/v1/calculate").send({ ...cop, original_amount: 1_200_000 });
    expect(ok.status).toBe(200);
    expect(ok.body.settlement_amount).toBe(1_200_000);

    // 1,000,000 USD × 4,150 = 4,150,000,000 COP is the limit.
    const atLimit = await request(app).post("/api/v1/calculate").send({ ...cop, original_amount: 4_150_000_000 });
    expect(atLimit.status).toBe(200);
    const over = await request(app).post("/api/v1/calculate").send({ ...cop, original_amount: 4_150_000_001 });
    expect(over.status).toBe(400);
    expect(over.body.details[0].field).toBe("original_amount");
    expect(over.body.details[0].message).toContain("4,150,000,000 COP");

    const usdOver = await request(app).post("/api/v1/calculate").send({ ...valid, original_amount: 1_000_000.01 });
    expect(usdOver.status).toBe(400);
    expect(usdOver.body.details[0].field).toBe("original_amount");
  });

  test("GET /health — returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
