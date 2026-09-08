import { Router } from 'express';
import { getBseMarketStatus } from '../../src/utils/marketHours';
import { externalApiRateLimiter } from '../middleware/rateLimiter';
import {
  liveQuotesCache,
  quoteDirectory,
  fetchLiveFeedForSymbol,
  fetchHistoricalCandles,
  type CachedQuote
} from '../services/yahooFinance.service';

export const marketRouter = Router();

function istTimestamp(): string {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

marketRouter.get('/bse-status', (_req, res) => {
  const bseStatus = getBseMarketStatus(new Date());
  res.json({ success: true, timestamp: istTimestamp(), ...bseStatus });
});

marketRouter.get('/live-quotes', (_req, res) => {
  try {
    const bseStatus = getBseMarketStatus(new Date());
    const quotes = Array.from(liveQuotesCache.values()).map((q) => ({
      symbol: q.symbol,
      name: q.name,
      lastPrice: q.lastPrice,
      change: q.change,
      changePercent: q.changePercent,
      dayHigh: q.dayHigh,
      dayLow: q.dayLow,
      volume: q.volume,
      currency: q.currency,
      exchange: q.exchange,
      timestamp: istTimestamp(),
      feedSource: bseStatus.isOpen ? 'YAHOO_FINANCE_LIVE' : 'BSE_OFFICIAL_FROZEN_CLOSE'
    }));

    res.json({
      success: true,
      timestamp: istTimestamp(),
      isMarketOpen: bseStatus.isOpen,
      marketStatus: bseStatus.status,
      statusLabel: bseStatus.statusLabel,
      frozen: !bseStatus.isOpen,
      nextSessionLabel: bseStatus.nextSessionLabel,
      feedSource: bseStatus.isOpen ? 'YAHOO_FINANCE_LIVE' : 'BSE_OFFICIAL_CLOSING_RATES',
      quotes
    });
  } catch (err: any) {
    console.error('Error generating live quotes:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch live quotes' });
  }
});

// Symbols outside the curated quoteDirectory are cached here on first
// search, but syncAllExchangeRates only ever re-syncs quoteDirectory's own
// keys — a dynamically-cached symbol was never refreshed again after its
// first lookup, no matter how stale, and the cache is a module-level global
// with no size limit, so it grows without bound as different callers search
// different arbitrary symbols. QUOTE_STALE_MS makes an old dynamic entry
// re-fetch instead of being served forever, and MAX_DYNAMIC_CACHE_ENTRIES
// evicts the oldest dynamic entries once the cache grows past a sane size.
const QUOTE_STALE_MS = 30_000;
const MAX_DYNAMIC_CACHE_ENTRIES = 300;

function evictOldestDynamicEntriesIfNeeded() {
  const dynamicEntries = Array.from(liveQuotesCache.entries()).filter(([sym]) => !(sym in quoteDirectory));
  if (dynamicEntries.length <= MAX_DYNAMIC_CACHE_ENTRIES) return;
  dynamicEntries
    .sort((a, b) => a[1].lastFetched - b[1].lastFetched)
    .slice(0, dynamicEntries.length - MAX_DYNAMIC_CACHE_ENTRIES)
    .forEach(([sym]) => liveQuotesCache.delete(sym));
}

marketRouter.get('/quote/:symbol', externalApiRateLimiter, async (req, res) => {
  try {
    const sym = (req.params.symbol || '').toUpperCase().trim();
    const cached = liveQuotesCache.get(sym);
    const isCuratedSymbol = sym in quoteDirectory;
    // Curated symbols are kept fresh by the 15s background sync regardless
    // of age, so only dynamically-cached (searched) symbols need this
    // staleness check — they have no other refresh path at all.
    const isFresh = !!cached && (isCuratedSymbol || (Date.now() - cached.lastFetched) < QUOTE_STALE_MS);
    if (cached && isFresh) {
      return res.json({ success: true, timestamp: istTimestamp(), quote: { ...cached, timestamp: istTimestamp() } });
    }

    const queryKey = `${sym}.BO`;
    const liveData = await fetchLiveFeedForSymbol(queryKey);
    if (liveData) {
      // Real name/volume from Yahoo's own response when available, instead
      // of the previous hardcoded '5.4M' and a guessed "${sym} India Ltd" —
      // both were fabricated and served under feedSource: 'YAHOO_FINANCE_LIVE'.
      const item: CachedQuote = {
        symbol: sym,
        name: liveData.name || `${sym} Ltd`,
        querySymbol: queryKey,
        lastPrice: liveData.price,
        prevClose: liveData.prevClose,
        change: liveData.change,
        changePercent: liveData.changePercent,
        dayHigh: liveData.high,
        dayLow: liveData.low,
        volume: liveData.volume || 'N/A',
        currency: 'INR',
        exchange: 'BSE',
        lastFetched: Date.now(),
        confirmedLive: true
      };
      liveQuotesCache.set(sym, item);
      if (!isCuratedSymbol) evictOldestDynamicEntriesIfNeeded();
      return res.json({ success: true, timestamp: istTimestamp(), quote: { ...item, timestamp: istTimestamp() } });
    }

    res.json({ success: false, error: `Could not resolve live quote for ${sym}` });
  } catch (e: any) {
    console.error('Error fetching quote:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch quote' });
  }
});

// Maps a UI timeframe button to a real Yahoo Finance (range, interval) pair.
const TIMEFRAME_TO_RANGE: Record<string, { range: string; interval: string }> = {
  '5m': { range: '5d', interval: '5m' },
  '15m': { range: '5d', interval: '15m' },
  '1h': { range: '1mo', interval: '60m' },
  '1D': { range: '6mo', interval: '1d' },
  '1W': { range: '2y', interval: '1wk' }
};

marketRouter.get('/candles/:symbol', externalApiRateLimiter, async (req, res) => {
  try {
    const sym = (req.params.symbol || '').toUpperCase().trim();
    const timeframe = (req.query.timeframe as string) || '1D';
    // A plain object literal inherits Object.prototype — an unvalidated key
    // like "constructor" or "toString" resolves truthily to a function,
    // silently bypassing the intended '1D' fallback and passing undefined
    // range/interval to fetchHistoricalCandles. hasOwnProperty guards against
    // exactly that without needing an explicit allow-list of timeframe values.
    const { range, interval } = Object.prototype.hasOwnProperty.call(TIMEFRAME_TO_RANGE, timeframe)
      ? TIMEFRAME_TO_RANGE[timeframe]
      : TIMEFRAME_TO_RANGE['1D'];
    const info = quoteDirectory[sym];
    const querySymbol = info?.query || `${sym}.BO`;

    const candles = await fetchHistoricalCandles(querySymbol, range, interval);
    if (!candles) {
      return res.json({
        success: false,
        error: `Could not fetch real historical data for ${sym} from Yahoo Finance.`,
        dataProvenance: 'UNAVAILABLE'
      });
    }

    res.json({
      success: true,
      symbol: sym,
      timeframe,
      range,
      interval,
      dataProvenance: 'LIVE',
      feedSource: 'YAHOO_FINANCE_HISTORICAL',
      candles
    });
  } catch (err: any) {
    console.error('Error fetching candles:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch candles' });
  }
});
