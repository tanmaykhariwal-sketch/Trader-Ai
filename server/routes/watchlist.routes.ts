import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { listWatchlist, addToWatchlist, removeFromWatchlist } from '../db/watchlist.repo';

export const watchlistRouter = Router();
watchlistRouter.use(requireAuth);

watchlistRouter.get('/', (req, res) => {
  res.json({ success: true, symbols: listWatchlist(req.user!.id) });
});

watchlistRouter.post('/:symbol', (req, res) => {
  const symbol = (req.params.symbol || '').toUpperCase().trim();
  if (!symbol) return res.status(400).json({ success: false, error: 'symbol is required.' });
  addToWatchlist(req.user!.id, symbol);
  res.json({ success: true, symbols: listWatchlist(req.user!.id) });
});

watchlistRouter.delete('/:symbol', (req, res) => {
  const symbol = (req.params.symbol || '').toUpperCase().trim();
  removeFromWatchlist(req.user!.id, symbol);
  res.json({ success: true, symbols: listWatchlist(req.user!.id) });
});
