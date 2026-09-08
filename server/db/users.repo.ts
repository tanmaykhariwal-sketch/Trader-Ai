import { db } from './connection';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  created_at: string;
  trading_mode: 'simple' | 'advanced';
  currency: 'INR' | 'USD';
  disclaimer_acknowledged_at: string | null;
}

export function createUser(email: string, passwordHash: string, displayName?: string): UserRow {
  const info = db
    .prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)')
    .run(email.toLowerCase().trim(), passwordHash, displayName || null);
  return getUserById(info.lastInsertRowid as number)!;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function getUserById(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function setTradingMode(userId: number, mode: 'simple' | 'advanced'): void {
  db.prepare('UPDATE users SET trading_mode = ? WHERE id = ?').run(mode, userId);
}

export function acknowledgeDisclaimer(userId: number): void {
  db.prepare("UPDATE users SET disclaimer_acknowledged_at = datetime('now') WHERE id = ?").run(userId);
}

export function createSession(sessionId: string, userId: number, expiresAt: Date): void {
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
    sessionId,
    userId,
    expiresAt.toISOString()
  );
}

export function getSession(sessionId: string): { user_id: number; expires_at: string } | undefined {
  return db.prepare('SELECT user_id, expires_at FROM sessions WHERE id = ?').get(sessionId) as
    | { user_id: number; expires_at: string }
    | undefined;
}

export function deleteSession(sessionId: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}
