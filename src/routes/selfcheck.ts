import { Router, Request, Response } from "express";
import { runSelfCheck, SelfCheckReport } from "../engine/selfcheck";

const router = Router();

// The config is static, so one run per process is enough.
let cached: SelfCheckReport | null = null;

/**
 * GET /api/v1/selfcheck
 *
 * Runs the calculator over the quote grid and reports each invariant.
 */
router.get("/", (_req: Request, res: Response) => {
  cached ??= runSelfCheck();
  res.json(cached);
});

export default router;
