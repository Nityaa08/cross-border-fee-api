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

  test("GET /health — returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
