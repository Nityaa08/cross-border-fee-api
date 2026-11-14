import express from "express";
import request from "supertest";
import app from "../src/app";
import { rateLimit } from "../src/middleware/rateLimit";

describe("Demo page and config", () => {
  test("GET / with a browser Accept header returns the HTML demo page", async () => {
    const res = await request(app).get("/").set("Accept", "text/html,application/xhtml+xml,*/*;q=0.8");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("<title>Cross-Border Fee API</title>");
    expect(res.text).toContain("/api/v1/calculate");
  });

  test("GET / for an API client still returns the JSON index", async () => {
    const res = await request(app).get("/").set("Accept", "*/*");
    expect(res.status).toBe(200);
    expect(res.body.endpoints.calculate).toBe("POST /api/v1/calculate");
  });

  test("GET /api/v1/config lists the 4 markets with dated FX rates", async () => {
    const res = await request(app).get("/api/v1/config");
    expect(res.status).toBe(200);
    expect(res.body.countries.map((c: { code: string }) => c.code).sort()).toEqual(["AR", "BR", "CO", "MX"]);
    expect(res.body.fx_rates.every((r: { updated_at: string }) => /^\d{4}-\d{2}-\d{2}/.test(r.updated_at))).toBe(true);
  });

  test("GET /api/v1/config says where each tax rate comes from", async () => {
    const res = await request(app).get("/api/v1/config");
    const byCode = Object.fromEntries(
      res.body.countries.map((c: { code: string }) => [c.code, c])
    );
    for (const c of Object.values(byCode) as { tax_rule: { name: string; basis: string } }[]) {
      expect(c.tax_rule.name).toBeTruthy();
      expect(c.tax_rule.basis).toBeTruthy();
    }
    // Brazil's rate is checked against a source and dated; Argentina's is not.
    expect(byCode.BR.tax_withholding_pct).toBe(0.035);
    expect(byCode.BR.tax_rule.basis).toContain("12,499/2025");
    expect(byCode.BR.tax_rule.checked_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(byCode.AR.tax_rule.checked_on).toBeNull();
  });

  test("the calculate endpoint sends rate-limit headers", async () => {
    const res = await request(app).post("/api/v1/calculate").send({
      original_amount: 100,
      original_currency: "USD",
      customer_country: "MX",
      merchant_country: "US",
      payment_method: "card",
    });
    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"]).toBeDefined();
  });

  test("x-powered-by is not sent", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("rateLimit middleware", () => {
  function appWith(limit: number, clock: { t: number }) {
    const a = express();
    a.get("/", rateLimit({ limit, windowMs: 60_000, now: () => clock.t }), (_req, res) => {
      res.json({ ok: true });
    });
    return a;
  }

  test("allows `limit` requests, then answers 429 with Retry-After", async () => {
    const clock = { t: 1_000_000 };
    const a = appWith(2, clock);
    expect((await request(a).get("/")).status).toBe(200);
    expect((await request(a).get("/")).status).toBe(200);
    const blocked = await request(a).get("/");
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBe("60");
    expect(blocked.body.error).toBe("Too many requests");
  });

  test("the window resets after windowMs", async () => {
    const clock = { t: 1_000_000 };
    const a = appWith(1, clock);
    expect((await request(a).get("/")).status).toBe(200);
    expect((await request(a).get("/")).status).toBe(429);
    clock.t += 60_001;
    expect((await request(a).get("/")).status).toBe(200);
  });

  test("on Vercel, clients are told apart by x-real-ip", async () => {
    const prev = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const clock = { t: 1_000_000 };
      const a = appWith(1, clock);
      expect((await request(a).get("/").set("x-real-ip", "203.0.113.1")).status).toBe(200);
      expect((await request(a).get("/").set("x-real-ip", "203.0.113.1")).status).toBe(429);
      expect((await request(a).get("/").set("x-real-ip", "203.0.113.2")).status).toBe(200);
    } finally {
      if (prev === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prev;
    }
  });
});

describe("GET /demo", () => {
  it("always serves the demo page, even to link-preview bots that send Accept: */*", async () => {
    const res = await request(app).get("/demo").set("Accept", "*/*");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain('property="og:title"');
  });
});
