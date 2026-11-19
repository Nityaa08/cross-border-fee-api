import { Router, Request, Response } from "express";
import { methodNotAllowed } from "../middleware/notFound";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Any other method on this path: a JSON 405, not Express's HTML 404.
router.all("/", methodNotAllowed(["GET", "HEAD"]));

export default router;
