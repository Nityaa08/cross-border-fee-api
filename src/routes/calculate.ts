import { Router, Request, Response } from "express";
import { methodNotAllowed } from "../middleware/notFound";
import { validateFeeRequest } from "../middleware/validate";
import { calculateFees } from "../engine/calculator";
import { FeeCalculationRequest } from "../types";

const router = Router();

/**
 * POST /api/v1/calculate
 *
 * Calculate all-in customer price for a cross-border transaction.
 */
router.post("/", validateFeeRequest, (req: Request, res: Response) => {
  const input: FeeCalculationRequest = {
    original_amount: req.body.original_amount,
    original_currency: req.body.original_currency,
    customer_country: req.body.customer_country,
    merchant_country: req.body.merchant_country,
    payment_method: req.body.payment_method,
  };

  const result = calculateFees(input);
  res.json(result);
});

// Any other method on this path: a JSON 405, not Express's HTML 404.
router.all("/", methodNotAllowed(["POST"]));

export default router;
