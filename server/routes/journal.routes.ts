import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { listJournalEntries, createJournalEntry, serializeJournalEntry } from '../db/journal.repo';
import { getHolding } from '../db/holdings.repo';

export const journalRouter = Router();
journalRouter.use(requireAuth);

journalRouter.get('/', (req, res) => {
  res.json({ success: true, entries: listJournalEntries(req.user!.id).map(serializeJournalEntry) });
});

const OPTIONAL_STRING_FIELDS = ['boughtAt', 'boughtDate', 'soldAt', 'soldDate'] as const;

journalRouter.post('/', (req, res) => {
  try {
    const { symbol, stockName, buyPrice, sellPrice, quantity, boughtAt, boughtDate, soldAt, soldDate, holdingId } = req.body || {};
    if (
      typeof symbol !== 'string' ||
      typeof stockName !== 'string' ||
      !Number.isFinite(buyPrice) ||
      !Number.isFinite(sellPrice) ||
      !Number.isFinite(quantity)
    ) {
      return res.status(400).json({ success: false, error: 'symbol, stockName, buyPrice, sellPrice and quantity are required.' });
    }
    if (buyPrice <= 0 || sellPrice <= 0 || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'buyPrice, sellPrice and quantity must be positive.' });
    }
    if (!Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, error: 'quantity must be a whole number of shares.' });
    }
    for (const field of OPTIONAL_STRING_FIELDS) {
      const value = req.body?.[field];
      if (value !== undefined && typeof value !== 'string') {
        return res.status(400).json({ success: false, error: `${field} must be a string if provided.` });
      }
    }
    if (holdingId !== undefined && holdingId !== null && typeof holdingId !== 'string') {
      return res.status(400).json({ success: false, error: 'holdingId must be a string if provided.' });
    }
    // Only type-checked before, never verified to exist or belong to this
    // user — journal_entries.holding_id has no foreign-key constraint, so
    // nothing stopped a caller submitting any string (including another
    // user's real holding id) as a fabricated link. Not currently readable
    // cross-account (nothing joins back through this column today), but a
    // real integrity gap for any future feature that does.
    if (holdingId && !getHolding(holdingId, req.user!.id)) {
      return res.status(400).json({ success: false, error: 'holdingId does not refer to one of your holdings.' });
    }

    const pnl = Math.round((sellPrice - buyPrice) * quantity * 100) / 100;
    const pnlPercent = buyPrice > 0 ? Math.round(((sellPrice - buyPrice) / buyPrice) * 100 * 100) / 100 : 0;

    // `holdingId` was accepted by NewJournalEntry and read back out by
    // serializeJournalEntry, but this handler never forwarded it — a
    // silent write drop. Reachable via App.tsx's one-time local-data
    // import, which replays old journal entries (with their real
    // holdingId) through this exact endpoint.
    const entry = createJournalEntry(req.user!.id, {
      holdingId,
      symbol,
      stockName,
      buyPrice,
      sellPrice,
      quantity,
      pnl,
      pnlPercent,
      boughtAt,
      boughtDate,
      soldAt,
      soldDate
    });
    res.json({ success: true, entry: serializeJournalEntry(entry) });
  } catch (err: any) {
    console.error('Error in /api/journal:', err);
    res.status(500).json({ success: false, error: 'Could not save journal entry.' });
  }
});
