import express from "express";
import calculateRouter from "./routes/calculate";
import healthRouter from "./routes/health";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.use("/api/v1/calculate", calculateRouter);
app.use("/health", healthRouter);

app.use(errorHandler);

export default app;
