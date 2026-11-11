import { Request, Response, NextFunction } from "express";

// Errors raised by express.json() carry an HTTP status (e.g. 400 for
// malformed JSON, 413 for an oversized body) and a machine-readable type.
type HttpError = Error & { status?: number; type?: string };

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.type === "entity.parse.failed") {
    res.status(400).json({
      error: "Malformed JSON",
      message: "Request body must be valid JSON",
    });
    return;
  }

  if (err.status && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Genuine server error: log the detail, but don't leak it to the client.
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
}
