import request from "supertest";
import app from "../src/app";

// What a recruiter gets opening the API in a browser or with a bare curl:
// every answer should be JSON that says what to do, never Express's HTML page.
describe("wrong method and unknown path", () => {
  test("GET /api/v1/calculate is a JSON 405 that says to POST", async () => {
    const res = await request(app).get("/api/v1/calculate");
    expect(res.status).toBe(405);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.headers["allow"]).toBe("POST");
    expect(res.body.error).toBe("Method not allowed");
    expect(res.body.message).toContain("use POST");
    expect(res.body.example).toContain("curl -X POST");
    expect(res.text).not.toContain("Cannot GET");
  });

  test("PUT and DELETE on /api/v1/calculate are 405 too", async () => {
    for (const method of ["put", "delete", "patch"] as const) {
      const res = await request(app)[method]("/api/v1/calculate");
      expect(res.status).toBe(405);
      expect(res.headers["allow"]).toBe("POST");
    }
  });

  test("a trailing slash still reaches the 405", async () => {
    const res = await request(app).get("/api/v1/calculate/");
    expect(res.status).toBe(405);
  });

  test.each(["/health", "/api/v1/config", "/api/v1/selfcheck"])(
    "POST %s is a JSON 405 allowing GET",
    async (path) => {
      const res = await request(app).post(path).send({});
      expect(res.status).toBe(405);
      expect(res.headers["allow"]).toBe("GET, HEAD");
      expect(res.body.message).toContain("POST is not supported");
      expect(res.body.example).toBeUndefined();
    }
  );

  test("GET endpoints still work", async () => {
    expect((await request(app).get("/health")).status).toBe(200);
    expect((await request(app).get("/api/v1/config")).status).toBe(200);
  });

  test("an unknown path is a JSON 404 listing the endpoints", async () => {
    const res = await request(app).get("/api/v2/calculate");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.error).toBe("Not found");
    expect(res.body.endpoints.calculate).toBe("POST /api/v1/calculate");
    expect(res.text).not.toContain("<pre>");
  });

  test("markup in an unknown path comes back as JSON text, not HTML", async () => {
    const res = await request(app).get("/%3Cscript%3Ealert(1)%3C%2Fscript%3E");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  test("the index lists the same endpoints as the 404", async () => {
    const res = await request(app).get("/").set("Accept", "application/json");
    expect(res.body.endpoints.calculate).toBe("POST /api/v1/calculate");
    expect(res.body.endpoints.demo).toBe("GET /demo");
  });
});
