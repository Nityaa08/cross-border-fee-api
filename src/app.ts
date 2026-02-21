import express from "express";
import calculateRouter from "./routes/calculate";
import healthRouter from "./routes/health";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "Cross-Border Fee Calculation API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      calculate: "POST /api/v1/calculate",
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

app.use("/api/v1/calculate", calculateRouter);
app.use("/health", healthRouter);

app.use(errorHandler);

export default app;
