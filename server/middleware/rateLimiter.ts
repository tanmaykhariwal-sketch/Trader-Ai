import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

/** Per-user (falling back to per-IP for anonymous callers) rate limit for the
 * Gemini-backed routes, so one caller can't burn the operator's LLM quota.
 * Anonymous callers are keyed via ipKeyGenerator, which normalizes IPv6
 * addresses to a /64 prefix — using req.ip raw would let an IPv6 client
 * bypass the limit by requesting a new address from its /64 block. */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip || '')}`),
  message: { success: false, error: 'Rate limit reached for AI-backed requests. Try again in a while.' }
});

/** Per-IP rate limit on login/register — without this, bcrypt's own cost
 * factor is the only thing slowing down credential-stuffing or brute-force
 * attempts. Keyed by IP only (there's no authenticated user yet on these
 * routes), and generous enough not to lock out a real user who mistypes
 * their password a few times. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => `ip:${ipKeyGenerator(req.ip || '')}`,
  message: { success: false, error: 'Too many attempts. Please wait a few minutes and try again.' }
});

/** Per-IP rate limit for routes that proxy an external API (Yahoo Finance,
 * Google News) with no auth requirement of their own. Without this, an
 * anonymous caller can force an unbounded number of outbound fetches by
 * rotating the requested symbol/query on every call (defeating any
 * per-symbol response cache), risking the operator's outbound IP getting
 * rate-limited or banned by the upstream provider. Generous enough for
 * normal browsing (candles + a quote per ticker click) since, unlike the
 * Gemini routes, these calls are free, not billed. */
export const externalApiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip || '')}`),
  message: { success: false, error: 'Too many requests. Please slow down.' }
});
