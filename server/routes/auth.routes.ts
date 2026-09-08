import { Router } from 'express';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { createUser, getUserByEmail, createSession, deleteSession } from '../db/users.repo';
import { SESSION_COOKIE, requireAuth } from '../middleware/requireAuth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { db } from '../db/connection';

export const authRouter = Router();

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BCRYPT_COST = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user: { id: number; email: string; display_name: string | null; trading_mode: string; currency: string; disclaimer_acknowledged_at: string | null }) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    tradingMode: user.trading_mode,
    currency: user.currency,
    disclaimerAcknowledged: Boolean(user.disclaimer_acknowledged_at)
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
    const { email, password, displayName } = req.body || {};
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }
    if (getUserByEmail(email)) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const sessionId = randomBytes(32).toString('hex');

    // One transaction: a user must never be created without their first
    // session landing too, so a mid-request crash can't leave an account
    // that exists but can't be reported as successfully registered.
    const user = db.transaction(() => {
      const u = createUser(email, passwordHash, typeof displayName === 'string' ? displayName.slice(0, 60) : undefined);
      createSession(sessionId, u.id, new Date(Date.now() + SESSION_DURATION_MS));
      return u;
    })();
    setSessionCookie(res, sessionId);

    res.json({ success: true, user: publicUser(user) });
  } catch (err: any) {
    // A concurrent registration with the same email can pass the earlier
    // getUserByEmail check before either insert commits — the DB's own
    // UNIQUE constraint is the real guard for that race, so surface it as
    // the same 409 a non-racing duplicate would get, not a generic 500.
    if (typeof err?.message === 'string' && err.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }
    console.error('Error in /api/auth/register:', err);
    res.status(500).json({ success: false, error: 'Could not create account.' });
  }
});

authRouter.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = getUserByEmail(email);
    // Constant-shape response whether the account exists or not, so login
    // failures don't reveal which emails are registered.
    const passwordHash = user?.password_hash || '$2b$12$invalidsaltinvalidsaltinvalidsalOu';
    const valid = await bcrypt.compare(password, passwordHash);
    if (!user || !valid) {
      return res.status(401).json({ success: false, error: 'Incorrect email or password.' });
    }

    const sessionId = randomBytes(32).toString('hex');
    createSession(sessionId, user.id, new Date(Date.now() + SESSION_DURATION_MS));
    setSessionCookie(res, sessionId);

    res.json({ success: true, user: publicUser(user) });
  } catch (err: any) {
    console.error('Error in /api/auth/login:', err);
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
