import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAuth';
import { listAllUsers } from '../db/users.repo';
import { listHoldings } from '../db/holdings.repo';
import { listJournalEntries, serializeJournalEntry } from '../db/journal.repo';
import { listWatchlist } from '../db/watchlist.repo';
import { listCapitalRecords } from '../db/capital.repo';
import { serializeHolding, serializeCapitalRecord } from './portfolio.routes';

export const adminRouter = Router();

// Owner-only: every registered account's profile plus their full trade
// history (holdings, closed trades, capital ledger, watchlist). Never
// includes password_hash -- there is no way to recover a real password from
// it (bcrypt is one-way by design), and returning the hash itself would be
// a pointless security exposure with no legitimate use here.
adminRouter.get('/users', requireAdmin, (_req, res) => {
  try {
    const users = listAllUsers().map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      createdAt: u.created_at,
      tradingMode: u.trading_mode,
      currency: u.currency,
      capital: u.capital,
      disclaimerAcknowledged: Boolean(u.disclaimer_acknowledged_at),
      holdings: listHoldings(u.id).map(serializeHolding),
      journal: listJournalEntries(u.id).map(serializeJournalEntry),
      capitalRecords: listCapitalRecords(u.id).map(serializeCapitalRecord),
      watchlist: listWatchlist(u.id)
    }));
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Could not load user data.' });
  }
});
