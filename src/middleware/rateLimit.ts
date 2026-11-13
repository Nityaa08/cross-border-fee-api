import { Request, Response, NextFunction } from "express";

/**
 * Fixed-window rate limit per client IP, kept in memory.
 *
 * The public demo runs on serverless functions, so each running instance
 * counts on its own: this caps abuse of one instance, it is not a global
 * quota. A shared store (for example Redis) would be needed for that.
 */
export interface RateLimitOptions {
  limit: number; // requests allowed per window
  windowMs: number;
  now?: () => number; // injectable clock for tests
}

/**
 * The caller's IP. Behind Vercel the socket address is the platform's proxy,
 * so on Vercel (which sets x-real-ip / x-forwarded-for itself) use those.
 */
export function clientIp(req: Request): string {
  if (process.env.VERCEL) {
    const real = req.headers["x-real-ip"];
    if (typeof real === "string" && real) return real;
    const fwd = req.headers["x-forwarded-for"];
    if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

export function rateLimit({ limit, windowMs, now = Date.now }: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const t = now();
    const ip = clientIp(req);

    // Drop expired windows now and then so the map cannot grow without bound.
    if (hits.size > 10_000) {
      for (const [key, v] of hits) if (v.resetAt <= t) hits.delete(key);
    }

    let entry = hits.get(ip);
    if (!entry || entry.resetAt <= t) {
      entry = { count: 0, resetAt: t + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, limit - entry.count);
    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(Math.ceil((entry.resetAt - t) / 1000)));

    if (entry.count > limit) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - t) / 1000)));
      res.status(429).json({
        error: "Too many requests",
        message: `Limit is ${limit} requests per ${Math.round(windowMs / 1000)} seconds. Try again shortly.`,
      });
      return;
    }
    next();
  };
}
