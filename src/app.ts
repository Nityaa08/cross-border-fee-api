import express from "express";
import calculateRouter from "./routes/calculate";
import healthRouter from "./routes/health";
import metaRouter from "./routes/meta";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimit } from "./middleware/rateLimit";
import { DEMO_PAGE } from "./ui/page";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

// Public demo: cap each client at RATE_LIMIT_PER_MINUTE calculations a minute
// (per running instance, see middleware/rateLimit.ts).
const perMinute = Number(process.env.RATE_LIMIT_PER_MINUTE) || 30;
const calculateLimit = rateLimit({ limit: perMinute, windowMs: 60_000 });

app.get("/", (req, res) => {
  // Browsers get the demo page; API clients (curl, fetch with JSON) get the index.
  if (req.accepts(["json", "html"]) === "html") {
    res.type("html").send(DEMO_PAGE);
    return;
  }
  res.json({
    name: "Cross-Border Fee Calculation API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      calculate: "POST /api/v1/calculate",
      config: "GET /api/v1/config",
    },
    example: {
      method: "POST",
      url: "/api/v1/calculate",
      body: {
        original_amount: 100,
        original_currency: "USD",
        customer_country: "MX",
        merchant_country: "US",
        payment_method: "card",
      },
    },
  });
});

// A stable link to the demo page for anything that can't send a browser Accept header
// (LinkedIn and other link previews fetch with Accept: */*, which "/" answers with JSON).
app.get("/demo", (_req, res) => {
  res.type("html").send(DEMO_PAGE);
});

app.use("/api/v1/calculate", calculateLimit, calculateRouter);
app.use("/api/v1/config", metaRouter);
app.use("/health", healthRouter);

app.use(errorHandler);

export default app;
