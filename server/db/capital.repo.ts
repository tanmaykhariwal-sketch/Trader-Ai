import { db } from './connection';
import { randomUUID } from 'crypto';
import { getUserById } from './users.repo';

export type CapitalRecordType = 'DEPOSIT' | 'SET' | 'SALE_CREDIT' | 'PURCHASE_DEBIT' | 'REFUND';

export interface CapitalRecordRow {
  id: string;
  user_id: number;
  amount: number;
  type: CapitalRecordType;
  resulting_capital: number;
  note: string | null;
  created_at: string;
}

export function listCapitalRecords(userId: number): CapitalRecordRow[] {
  return db
    .prepare('SELECT * FROM capital_records WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as CapitalRecordRow[];
}

function insertRecord(userId: number, amount: number, type: CapitalRecordType, resultingCapital: number, note?: string) {
  db.prepare(
    'INSERT INTO capital_records (id, user_id, amount, type, resulting_capital, note) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(randomUUID(), userId, amount, type, resultingCapital, note ?? null);
}

/** Adjusts a user's capital by `delta` (positive or negative), floors at 0,
 * records the movement, and returns the resulting balance — all in one
 * transaction so the ledger and the balance can never drift apart.
 *
 * `amount` in the ledger is always the ACTUAL applied change
 * (next - previous), never the raw requested `delta` — if the floor clamps
 * a large withdrawal to 0, the ledger records the real partial change, so
 * summing `amount` across a user's history always reconciles with their
 * current capital. */
export const adjustCapital = db.transaction(
  (userId: number, delta: number, type: CapitalRecordType, note?: string): number => {
    const user = getUserById(userId);
    if (!user) throw new Error('User not found');
    // Rounded to paise (2dp) — otherwise float addition here can leave
    // trailing binary-decimal garbage (e.g. 4999.999999999998) that then
    // compounds across every subsequent buy/sell/deposit for this user.
    const next = Math.round(Math.max(0, user.capital + delta) * 100) / 100;
    const appliedDelta = Math.round((next - user.capital) * 100) / 100;
    db.prepare('UPDATE users SET capital = ? WHERE id = ?').run(next, userId);
    insertRecord(userId, appliedDelta, type, next, note);
    return next;
  }
);

/** Sets capital to an absolute value. `amount` in the ledger is still the
 * applied delta (next - previous), matching every other record type, so a
 * consumer can always reconstruct capital history by summing `amount` —
 * `resulting_capital` is what carries the absolute balance. */
export const setCapitalAbsolute = db.transaction((userId: number, amount: number, note?: string): number => {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  const next = Math.round(Math.max(0, amount) * 100) / 100;
  const appliedDelta = Math.round((next - user.capital) * 100) / 100;
  db.prepare('UPDATE users SET capital = ? WHERE id = ?').run(next, userId);
  insertRecord(userId, appliedDelta, 'SET', next, note ?? 'Capital Balance Set');
  return next;
});
