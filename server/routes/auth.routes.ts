import { Router } from 'express';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { createUser, getUserByUsername, createSession, deleteSession } from '../db/users.repo';
import { SESSION_COOKIE, requireAuth, ADMIN_USERNAME } from '../middleware/requireAuth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { db } from '../db/connection';
import { logger, errorDetail } from '../utils/logger';

export const authRouter = Router();

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BCRYPT_COST = 12;
// Letters, digits, underscore, dot, hyphen — no length upper bound issue
// since it's capped separately below.
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;

function publicUser(user: { id: number; username: string; display_name: string | null; trading_mode: string; currency: string; capital: number; disclaimer_acknowledged_at: string | null }) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    tradingMode: user.trading_mode,
    currency: user.currency,
    capital: user.capital,
    disclaimerAcknowledged: Boolean(user.disclaimer_acknowledged_at),
    isAdmin: user.username === ADMIN_USERNAME
  };
}

function setSessionCookie(res: import('express').Response, sessionId: string) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_MS,
    path: '/'
  });
}

authRouter.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { username, password, displayName } = req.body || {};
    if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
      return res.status(400).json({ success: false, error: 'Username must be 3-30 characters: letters, numbers, dots, underscores, or hyphens.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }
    if (getUserByUsername(username)) {
      return res.status(409).json({ success: false, error: 'This username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const sessionId = randomBytes(32).toString('hex');

    // One transaction: a user must never be created without their first
    // session landing too, so a mid-request crash can't leave an account
    // that exists but can't be reported as successfully registered.
    const user = db.transaction(() => {
      const u = createUser(username, passwordHash, typeof displayName === 'string' ? displayName.slice(0, 60) : undefined);
      createSession(sessionId, u.id, new Date(Date.now() + SESSION_DURATION_MS));
      return u;
    })();
    setSessionCookie(res, sessionId);

    res.json({ success: true, user: publicUser(user) });
  } catch (err: any) {
    // A concurrent registration with the same username can pass the earlier
    // getUserByUsername check before either insert commits — the DB's own
    // UNIQUE constraint is the real guard for that race, so surface it as
    // the same 409 a non-racing duplicate would get, not a generic 500.
    if (typeof err?.message === 'string' && err.message.includes('UNIQUE') && err.message.includes('username')) {
      return res.status(409).json({ success: false, error: 'This username is already taken.' });
    }
    logger.error({ module: 'auth.routes', event: 'register_failed', error: errorDetail(err) });
    res.status(500).json({ success: false, error: 'Could not create account.' });
  }
});

authRouter.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const user = getUserByUsername(username);
    // Constant-shape response whether the account exists or not, so login
    // failures don't reveal which usernames are registered.
    const passwordHash = user?.password_hash || '$2b$12$invalidsaltinvalidsaltinvalidsalOu';
    const valid = await bcrypt.compare(password, passwordHash);
    if (!user || !valid) {
      // No username/PII in the log line itself — just the fact and source
      // IP, enough to spot a credential-stuffing pattern without logging
      // who was targeted.
      logger.warn({ module: 'auth.routes', event: 'login_failed', ip: req.ip });
      return res.status(401).json({ success: false, error: 'Incorrect username or password.' });
    }

    const sessionId = randomBytes(32).toString('hex');
    createSession(sessionId, user.id, new Date(Date.now() + SESSION_DURATION_MS));
    setSessionCookie(res, sessionId);

    res.json({ success: true, user: publicUser(user) });
  } catch (err: any) {
    logger.error({ module: 'auth.routes', event: 'login_error', error: errorDetail(err) });
    res.status(500).json({ success: false, error: 'Could not sign in.' });
  }
});

authRouter.post('/logout', (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (sessionId) deleteSession(sessionId);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ success: true });
});

authRouter.get('/me', (req, res) => {
  if (!req.user) return res.json({ success: true, user: null });
  res.json({ success: true, user: publicUser(req.user) });
});
