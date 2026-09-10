import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const ipAttemptMap = new Map<string, RateLimitEntry>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipAttemptMap.entries()) {
    if (now > entry.resetTime) {
      ipAttemptMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
};

/**
 * Enforces a maximum of 3 login requests per minute per IP address.
 */
export const loginIpRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = ipAttemptMap.get(ip);

  if (!entry || now > entry.resetTime) {
    ipAttemptMap.set(ip, { count: 1, resetTime: now + 60 * 1000 });
    return next();
  }

  if (entry.count >= 3) {
    const remainingSecs = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    res.setHeader("Retry-After", remainingSecs);
    return res.status(429).json({
      success: false,
      message: `Too many login attempts from this IP address. Please wait ${remainingSecs} second(s) before trying again.`,
      retryAfter: remainingSecs,
    });
  }

  entry.count += 1;
  next();
};
