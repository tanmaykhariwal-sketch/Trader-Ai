// Must be the very first import: gemini.service.ts reads process.env.GEMINI_API_KEY
// at module-load time, so .env has to be loaded before anything else executes.
// The `dotenv` package was already a listed dependency but never actually
// imported anywhere — the .env.example comments describe a different runtime
// (AI Studio) injecting these vars directly, which doesn't apply when running
// locally via `tsx server/index.ts`, so GEMINI_API_KEY never reached
// process.env despite a real .env file existing.
import 'dotenv/config';

import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { attachUser } from './middleware/requireAuth';
import { authRouter } from './routes/auth.routes';
import { portfolioRouter } from './routes/portfolio.routes';
import { journalRouter } from './routes/journal.routes';
import { watchlistRouter } from './routes/watchlist.routes';
import { adminRouter } from './routes/admin.routes';
import { marketRouter } from './routes/market.routes';
import { newsRouter } from './routes/news.routes';
import { predictionsRouter } from './routes/predictions.routes';
import { analyzeRouter } from './routes/analyze.routes';
import { syncAllExchangeRates } from './services/yahooFinance.service';
import { getBseMarketStatus } from '../src/utils/marketHours';
import { logger, errorDetail } from './utils/logger';

import { db } from './db/connection'; // opens the DB and applies schema.sql as a side effect

// Tracked for the /health endpoint below.
let lastSyncSuccessAt: number | null = null;
let lastSyncError: string | null = null;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Deployed behind Cloud Run's own reverse proxy (see .env.example's APP_URL
  // note) — trust its X-Forwarded-For so req.ip is the real client, not the
  // proxy, which matters for the per-IP AI rate limiter. Only trusted in
  // production: trusting it locally would let any direct caller spoof their
  // own X-Forwarded-For and bypass the rate limit.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(attachUser);

  // Minimal health check — cheap enough to hit from an uptime monitor or
  // just to eyeball manually. Reports the DB connection and how long ago
  // the background quote sync last actually succeeded, since a hung/failing
  // sync otherwise fails silently (the UI just shows stale prices with no
  // indication anything is wrong).
  app.get('/health', (_req, res) => {
    let dbOk = true;
    try {
      db.prepare('SELECT 1').get();
    } catch {
      dbOk = false;
    }
    const syncAgeMs = lastSyncSuccessAt ? Date.now() - lastSyncSuccessAt : null;
    // Twice the 15s sync interval — comfortably past one missed tick, so a
    // single slow cycle doesn't falsely report degraded.
    const syncStale = syncAgeMs === null || syncAgeMs > 30000;
    const status = dbOk && !syncStale ? 'ok' : 'degraded';
    res.status(status === 'ok' ? 200 : 503).json({
      status,
      db: dbOk ? 'ok' : 'error',
      lastSuccessfulSync: lastSyncSuccessAt ? new Date(lastSyncSuccessAt).toISOString() : null,
      lastSyncError
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/journal', journalRouter);
  app.use('/api/watchlist', watchlistRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', marketRouter);
  app.use('/api', newsRouter);
  app.use('/api', predictionsRouter);
  app.use('/api', analyzeRouter);

  // Safety net for any /api route that throws without its own try/catch
  // (or middleware like attachUser, which runs on every request). Without
  // this, Express's default handler renders a full HTML stack trace —
  // including real file paths — to the client whenever NODE_ENV isn't
  // 'production' (the default in local/dev). Every route is expected to
  // catch its own errors and return a sanitized JSON message; this only
  // fires for the ones that don't, so it never overrides a route's own
  // more specific error response.
  app.use('/api', (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ module: 'index', event: 'unhandled_api_error', path: req.path, error: errorDetail(err) });
    if (res.headersSent) return;
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  // Background quote synchronizer — only fetches while the market is open;
  // rates stay frozen at the last real close otherwise. The very first call
  // is forced through regardless of market state: liveQuotesCache is seeded
  // at module load with hardcoded placeholder prices (see
  // yahooFinance.service.ts), and if the server starts or restarts while
  // the market is closed, those placeholders would otherwise never get
  // replaced with the real last close until the market reopens — silently
  // showing fake prices as if they were genuine frozen closing rates.
  syncAllExchangeRates(true, true).then(() => { lastSyncSuccessAt = Date.now(); }).catch((err) => {
    lastSyncError = errorDetail(err);
    logger.error({ module: 'index', event: 'initial_sync_failed', error: lastSyncError });
  });
  // .catch() added alongside the trading-cycle interval right below, which
  // already had one — an unhandled rejection here (Node terminates the
  // process on one by default) would silently kill the server the same way
  // today's duplicate-process incident did, just from a sync failure instead
  // of a stray leftover process.
  const runSync = () => syncAllExchangeRates(getBseMarketStatus().isOpen)
    .then(() => { lastSyncSuccessAt = Date.now(); lastSyncError = null; })
    .catch((err) => {
      lastSyncError = errorDetail(err);
      logger.error({ module: 'index', event: 'sync_failed', error: lastSyncError });
    });
  setInterval(runSync, 15000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info({ module: 'index', event: 'server_started', port: PORT });
  });
  // Real incident this addresses (2026-09-03): a leftover process from an
  // earlier run kept holding the port, and every later restart's failure
  // showed up only as a generic crash with nothing pointing at the real
  // cause — it took hours to notice a duplicate process was still trading
  // on stale code. EADDRINUSE now says exactly that, immediately.
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error({
        module: 'index',
        event: 'port_in_use',
        port: PORT,
        detail: 'Another instance of this server (or a leftover process from a previous run) is likely still running. Find and stop it before starting a new one.'
      });
      process.exit(1);
    }
    throw err;
  });
}

startServer().catch((err) => {
  logger.error({ module: 'index', event: 'startup_failed', error: errorDetail(err) });
  process.exit(1);
});
