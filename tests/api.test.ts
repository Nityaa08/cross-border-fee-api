import request from "supertest";
import app from "../src/app";

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

  test("GET /health — returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
