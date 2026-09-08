import { db } from './connection';

export function listWatchlist(userId: number): string[] {
  const rows = db.prepare('SELECT symbol FROM watchlist_items WHERE user_id = ? ORDER BY added_at ASC').all(userId) as {
    symbol: string;
  }[];
  return rows.map((r) => r.symbol);
}

export function addToWatchlist(userId: number, symbol: string): void {
  db.prepare('INSERT OR IGNORE INTO watchlist_items (user_id, symbol) VALUES (?, ?)').run(userId, symbol);
}

export function removeFromWatchlist(userId: number, symbol: string): void {
  db.prepare('DELETE FROM watchlist_items WHERE user_id = ? AND symbol = ?').run(userId, symbol);
}
