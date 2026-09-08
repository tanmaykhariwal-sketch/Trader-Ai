import type { Request, Response, NextFunction } from 'express';
import { getSession, getUserById, type UserRow } from '../db/users.repo';

export const SESSION_COOKIE = 'trader_ai_session';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserRow;
    }
  }
}

/** Populates req.user from the session cookie if present and valid, but
 * never rejects the request — used on routes that behave differently for
 * signed-in vs anonymous callers without requiring login. */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (sessionId) {
    const session = getSession(sessionId);
    if (session && new Date(session.expires_at) > new Date()) {
      req.user = getUserById(session.user_id);
    }
  }
  next();
}

/** Rejects the request with 401 unless a valid session is present. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Sign in required.' });
  }
  next();
}
