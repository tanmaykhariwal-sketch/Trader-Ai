import { db } from './connection';
import { randomUUID } from 'crypto';

export interface JournalRow {
  id: string;
  user_id: number;
  holding_id: string | null;
  symbol: string;
  stock_name: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  pnl: number;
  pnl_percent: number;
  bought_at: string | null;
  bought_date: string | null;
  sold_at: string;
  sold_date: string | null;
  // Non-null only for entries confirmed to have executed against a data
  // defect (e.g. the confirmedLive stale-seed-price bug) rather than a real
  // market price. Kept in the table and still shown in the full trade list
  // for an honest audit trail — never deleted — but excluded from the
  // aggregate stats (Total Realized P&L, Profit Rate, equity curve) so
  // those reflect real trading performance instead of a data bug.
  data_quality_note: string | null;
  exit_reason: string | null;
}

export interface NewJournalEntry {
  holdingId?: string | null;
  symbol: string;
  stockName: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  boughtAt?: string;
  boughtDate?: string;
  soldAt?: string;
  soldDate?: string;
  exitReason?: string;
}

// Shared with journal.routes.ts AND portfolio.routes.ts (the /sell endpoint
// used to return the raw snake_case DB row directly instead of this shape —
// leaking the internal user_id field and returning stockName/buyPrice/etc.
// as undefined to any consumer expecting the JournalEntry camelCase shape
// the rest of the API always returns).
export function serializeJournalEntry(e: JournalRow) {
  return {
    id: e.id,
    holdingId: e.holding_id,
    symbol: e.symbol,
    stockName: e.stock_name,
    buyPrice: e.buy_price,
    sellPrice: e.sell_price,
    quantity: e.quantity,
    pnl: e.pnl,
    pnlPercent: e.pnl_percent,
    boughtAt: e.bought_at,
    boughtDate: e.bought_date,
    soldAt: e.sold_at,
    soldDate: e.sold_date,
    dataQualityNote: e.data_quality_note,
    exitReason: e.exit_reason
  };
}

/** Flags an entry as executed against a confirmed data defect rather than a
 * real market price — never used to hide a trade the user simply dislikes,
 * only for a provable software bug (see the confirmedLive incident this was
 * built for). Ownership-checked so one user can never flag another's row. */
export function setJournalDataQualityNote(id: string, userId: number, note: string): void {
  db.prepare('UPDATE journal_entries SET data_quality_note = ? WHERE id = ? AND user_id = ?').run(note, id, userId);
}

export function listJournalEntries(userId: number): JournalRow[] {
  return db.prepare('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY sold_at DESC').all(userId) as JournalRow[];
}

export function createJournalEntry(userId: number, e: NewJournalEntry): JournalRow {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO journal_entries
      (id, user_id, holding_id, symbol, stock_name, buy_price, sell_price, quantity, pnl, pnl_percent, bought_at, bought_date, sold_at, sold_date, exit_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?, ?)`
  ).run(
    id,
    userId,
    e.holdingId ?? null,
    e.symbol,
    e.stockName,
    e.buyPrice,
    e.sellPrice,
    e.quantity,
    e.pnl,
    e.pnlPercent,
    e.boughtAt ?? null,
    e.boughtDate ?? null,
    e.soldAt ?? null,
    e.soldDate ?? null,
    e.exitReason ?? null
  );
  return db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id) as JournalRow;
}
