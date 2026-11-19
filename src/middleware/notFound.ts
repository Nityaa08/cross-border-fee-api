import { Request, Response } from "express";

// The public endpoints, so a JSON error can tell the caller where to go.
export const ENDPOINTS = {
  health: "GET /health",
  calculate: "POST /api/v1/calculate",
  config: "GET /api/v1/config",
  selfcheck: "GET /api/v1/selfcheck",
  demo: "GET /demo",
};

/**
 * Answer a known path called with the wrong method: 405 with an Allow header,
 * in JSON. Without this Express answers with its HTML page "Cannot GET ...",
 * which is what someone gets opening POST /api/v1/calculate in a browser.
 */
export function methodNotAllowed(allowed: string[]) {
  const allow = allowed.join(", ");
  return (req: Request, res: Response): void => {
    res.setHeader("Allow", allow);
    res.status(405).json({
      error: "Method not allowed",
      message: `${req.method} is not supported here; use ${allow}.`,
      allowed,
      ...(allowed.includes("POST") && {
        example:
          'curl -X POST <host>/api/v1/calculate -H "Content-Type: application/json" ' +
          '-d \'{"original_amount":100,"original_currency":"USD","customer_country":"MX","merchant_country":"US","payment_method":"card"}\'',
      }),
    });
  };
}

/** Unknown path: a JSON 404 listing the real endpoints, instead of an HTML page. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: "Not found",
    message: `No endpoint at ${req.method} ${req.path}.`,
    endpoints: ENDPOINTS,
  });
}
