import { BSE_SCRIP_CODES, fetchBseLiveQuote } from './bseIndia.service';

export interface CachedQuote {
  symbol: string;
  name: string;
  querySymbol: string;
  lastPrice: number;
  prevClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: string;
  currency: string;
  exchange: string;
  isIndex?: boolean;
  lastFetched: number;
  // False for the module-load seed (a hardcoded fallbackPrice that can be
  // years stale — real BSE prices drift, split, and bonus-adjust over time),
  // true only once a real Yahoo fetch has actually succeeded for this
  // symbol. Confirmed live: BAJFINANCE's seed price (₹7,145) and
  // KOTAKBANK's (₹1,789) were both wildly stale versus their real current
  // prices (₹1,037 / ₹421) — the autoTrader engine bought at the stale seed
  // before the first real sync tick corrected it, then "sold" moments later
  // at the real price, recording a catastrophic fake loss that was really
  // just the seed being wrong, not a real market move.
  confirmedLive: boolean;
}

export const quoteDirectory: Record<
  string,
  { name: string; query: string; fallbackPrice: number; prevClose: number; isIndex?: boolean }
> = {
  SENSEX: { name: 'BSE SENSEX Index', query: '^BSESN', fallbackPrice: 76552.55, prevClose: 77656.1, isIndex: true },
  // A real, individually-tradeable BSE-listed ETF that actually holds the
  // SENSEX basket — added per explicit user request for real SENSEX-level
  // exposure. The raw index above (^BSESN) has no shares to buy; this does.
  // Verified live via Yahoo's search + chart endpoints before adding (not
  // guessed): SENSEXADD.BO resolves to "DSP BSE Sensex ETF" on BSE with a
  // real regularMarketPrice and real 15m candle history. NOT marked isIndex
  // — it must be included in buyScanUniverse() like any other tradeable
  // symbol, unlike SENSEX itself above.
  SENSEXADD: { name: 'DSP BSE Sensex ETF', query: 'SENSEXADD.BO', fallbackPrice: 79.08, prevClose: 79.08 },
  RELIANCE: { name: 'Reliance Industries Ltd', query: 'RELIANCE.BO', fallbackPrice: 1289.25, prevClose: 1299.0 },
  TCS: { name: 'Tata Consultancy Services', query: 'TCS.BO', fallbackPrice: 2255.7, prevClose: 2271.0 },
  HDFCBANK: { name: 'HDFC Bank Ltd', query: 'HDFCBANK.BO', fallbackPrice: 714.75, prevClose: 727.1 },
  INFY: { name: 'Infosys Ltd', query: 'INFY.BO', fallbackPrice: 1111.0, prevClose: 1120.8 },
  ICICIBANK: { name: 'ICICI Bank Ltd', query: 'ICICIBANK.BO', fallbackPrice: 1446.5, prevClose: 1430.7 },
  SBIN: { name: 'State Bank of India', query: 'SBIN.BO', fallbackPrice: 1043.65, prevClose: 1053.8 },
  BHARTIARTL: { name: 'Bharti Airtel Ltd', query: 'BHARTIARTL.BO', fallbackPrice: 1886.95, prevClose: 1905.0 },
  LT: { name: 'Larsen & Toubro Ltd', query: 'LT.BO', fallbackPrice: 4036.0, prevClose: 4043.8 },
  ADANIENT: { name: 'Adani Enterprises Ltd', query: 'ADANIENT.BO', fallbackPrice: 3156.4, prevClose: 3125.0 },
  MARUTI: { name: 'Maruti Suzuki India Ltd', query: 'MARUTI.BO', fallbackPrice: 13466.0, prevClose: 13381.0 },
  ITC: { name: 'ITC Ltd', query: 'ITC.BO', fallbackPrice: 268.4, prevClose: 270.85 },
  AXISBANK: { name: 'Axis Bank Ltd', query: 'AXISBANK.BO', fallbackPrice: 1255.05, prevClose: 1246.55 },
  TATAMOTORS: { name: 'Tata Motors Passenger Vehicles', query: 'TATAMOTORS.BO', fallbackPrice: 986.5, prevClose: 975.2 },
  HINDUNILVR: { name: 'Hindustan Unilever Ltd', query: 'HINDUNILVR.BO', fallbackPrice: 2385.0, prevClose: 2398.5 },
  KOTAKBANK: { name: 'Kotak Mahindra Bank Ltd', query: 'KOTAKBANK.BO', fallbackPrice: 1789.0, prevClose: 1802.4 },
  BAJFINANCE: { name: 'Bajaj Finance Ltd', query: 'BAJFINANCE.BO', fallbackPrice: 7145.0, prevClose: 7098.2 },
  BAJAJFINSV: { name: 'Bajaj Finserv Ltd', query: 'BAJAJFINSV.BO', fallbackPrice: 1782.0, prevClose: 1795.6 },
  ASIANPAINT: { name: 'Asian Paints Ltd', query: 'ASIANPAINT.BO', fallbackPrice: 2412.0, prevClose: 2429.1 },
  WIPRO: { name: 'Wipro Ltd', query: 'WIPRO.BO', fallbackPrice: 268.0, prevClose: 270.4 },
  HCLTECH: { name: 'HCL Technologies Ltd', query: 'HCLTECH.BO', fallbackPrice: 1785.0, prevClose: 1798.3 },
  SUNPHARMA: { name: 'Sun Pharmaceutical Industries', query: 'SUNPHARMA.BO', fallbackPrice: 1745.0, prevClose: 1752.8 },
  TITAN: { name: 'Titan Company Ltd', query: 'TITAN.BO', fallbackPrice: 3385.0, prevClose: 3410.2 },
  ULTRACEMCO: { name: 'UltraTech Cement Ltd', query: 'ULTRACEMCO.BO', fallbackPrice: 11245.0, prevClose: 11312.7 },
  NESTLEIND: { name: 'Nestle India Ltd', query: 'NESTLEIND.BO', fallbackPrice: 2185.0, prevClose: 2199.4 },
  POWERGRID: { name: 'Power Grid Corp of India', query: 'POWERGRID.BO', fallbackPrice: 298.0, prevClose: 301.5 },
  NTPC: { name: 'NTPC Ltd', query: 'NTPC.BO', fallbackPrice: 342.0, prevClose: 345.9 },
  ONGC: { name: 'Oil & Natural Gas Corp', query: 'ONGC.BO', fallbackPrice: 248.0, prevClose: 250.6 },
  COALINDIA: { name: 'Coal India Ltd', query: 'COALINDIA.BO', fallbackPrice: 402.0, prevClose: 405.7 },
  TATASTEEL: { name: 'Tata Steel Ltd', query: 'TATASTEEL.BO', fallbackPrice: 148.0, prevClose: 149.6 },
  JSWSTEEL: { name: 'JSW Steel Ltd', query: 'JSWSTEEL.BO', fallbackPrice: 985.0, prevClose: 992.3 },
  HINDALCO: { name: 'Hindalco Industries Ltd', query: 'HINDALCO.BO', fallbackPrice: 645.0, prevClose: 650.2 },
  GRASIM: { name: 'Grasim Industries Ltd', query: 'GRASIM.BO', fallbackPrice: 2545.0, prevClose: 2561.8 },
  ADANIPORTS: { name: 'Adani Ports & SEZ Ltd', query: 'ADANIPORTS.BO', fallbackPrice: 1385.0, prevClose: 1398.4 },
  INDUSINDBK: { name: 'IndusInd Bank Ltd', query: 'INDUSINDBK.BO', fallbackPrice: 985.0, prevClose: 992.7 },
  TECHM: { name: 'Tech Mahindra Ltd', query: 'TECHM.BO', fallbackPrice: 1685.0, prevClose: 1698.5 },
  DRREDDY: { name: "Dr. Reddy's Laboratories", query: 'DRREDDY.BO', fallbackPrice: 1245.0, prevClose: 1252.9 },
  CIPLA: { name: 'Cipla Ltd', query: 'CIPLA.BO', fallbackPrice: 1512.0, prevClose: 1519.4 },
  DIVISLAB: { name: "Divi's Laboratories Ltd", query: 'DIVISLAB.BO', fallbackPrice: 5985.0, prevClose: 6012.3 },
  BRITANNIA: { name: 'Britannia Industries Ltd', query: 'BRITANNIA.BO', fallbackPrice: 4985.0, prevClose: 5012.8 },
  EICHERMOT: { name: 'Eicher Motors Ltd', query: 'EICHERMOT.BO', fallbackPrice: 4785.0, prevClose: 4812.6 },
  HEROMOTOCO: { name: 'Hero MotoCorp Ltd', query: 'HEROMOTOCO.BO', fallbackPrice: 4285.0, prevClose: 4312.9 },
  'BAJAJ-AUTO': { name: 'Bajaj Auto Ltd', query: 'BAJAJ-AUTO.BO', fallbackPrice: 8985.0, prevClose: 9042.5 },
  'M&M': { name: 'Mahindra & Mahindra Ltd', query: 'M&M.BO', fallbackPrice: 2985.0, prevClose: 3002.4 },
  SHREECEM: { name: 'Shree Cement Ltd', query: 'SHREECEM.BO', fallbackPrice: 26485.0, prevClose: 26612.3 },
  APOLLOHOSP: { name: 'Apollo Hospitals Enterprise', query: 'APOLLOHOSP.BO', fallbackPrice: 6985.0, prevClose: 7024.6 },
  SBILIFE: { name: 'SBI Life Insurance Co', query: 'SBILIFE.BO', fallbackPrice: 1585.0, prevClose: 1598.2 },
  HDFCLIFE: { name: 'HDFC Life Insurance Co', query: 'HDFCLIFE.BO', fallbackPrice: 685.0, prevClose: 690.4 },
  BPCL: { name: 'Bharat Petroleum Corp', query: 'BPCL.BO', fallbackPrice: 312.0, prevClose: 314.7 },
  IOC: { name: 'Indian Oil Corp Ltd', query: 'IOC.BO', fallbackPrice: 142.0, prevClose: 143.5 },
  VEDL: { name: 'Vedanta Ltd', query: 'VEDL.BO', fallbackPrice: 445.0, prevClose: 448.9 },
  PIDILITIND: { name: 'Pidilite Industries Ltd', query: 'PIDILITIND.BO', fallbackPrice: 2985.0, prevClose: 3005.7 },
  DABUR: { name: 'Dabur India Ltd', query: 'DABUR.BO', fallbackPrice: 512.0, prevClose: 515.8 },
  GODREJCP: { name: 'Godrej Consumer Products', query: 'GODREJCP.BO', fallbackPrice: 1145.0, prevClose: 1152.4 },
  SIEMENS: { name: 'Siemens Ltd', query: 'SIEMENS.BO', fallbackPrice: 6185.0, prevClose: 6224.9 },
  DLF: { name: 'DLF Ltd', query: 'DLF.BO', fallbackPrice: 785.0, prevClose: 791.3 },
  ZOMATO: { name: 'Eternal Ltd (Zomato)', query: 'ZOMATO.BO', fallbackPrice: 265.0, prevClose: 267.8 },
  PAYTM: { name: 'One97 Communications (Paytm)', query: 'PAYTM.BO', fallbackPrice: 895.0, prevClose: 902.1 },
  IRCTC: { name: 'Indian Railway Catering & Tourism', query: 'IRCTC.BO', fallbackPrice: 785.0, prevClose: 791.6 },
  TATAPOWER: { name: 'Tata Power Company Ltd', query: 'TATAPOWER.BO', fallbackPrice: 412.0, prevClose: 415.3 },
  BANKBARODA: { name: 'Bank of Baroda', query: 'BANKBARODA.BO', fallbackPrice: 245.0, prevClose: 247.2 },
  PNB: { name: 'Punjab National Bank', query: 'PNB.BO', fallbackPrice: 112.0, prevClose: 113.1 },
  CANBK: { name: 'Canara Bank', query: 'CANBK.BO', fallbackPrice: 105.0, prevClose: 106.0 }
};

export const liveQuotesCache: Map<string, CachedQuote> = new Map();

// Seed the cache with realistic initial values so the app has something to
// show before the first live fetch completes.
for (const [sym, info] of Object.entries(quoteDirectory)) {
  const chg = Number((info.fallbackPrice - info.prevClose).toFixed(2));
  const chgPct = Number(((chg / info.prevClose) * 100).toFixed(2));
  liveQuotesCache.set(sym, {
    symbol: sym,
    name: info.name,
    querySymbol: info.query,
    lastPrice: info.fallbackPrice,
    prevClose: info.prevClose,
    change: chg,
    changePercent: chgPct,
    dayHigh: Number((Math.max(info.fallbackPrice, info.prevClose) * 1.008).toFixed(2)),
    dayLow: Number((Math.min(info.fallbackPrice, info.prevClose) * 0.992).toFixed(2)),
    volume: info.isIndex ? '1.9B' : `${(Math.random() * 15 + 3).toFixed(1)}M`,
    currency: 'INR',
    exchange: 'BSE',
    isIndex: info.isIndex,
    lastFetched: Date.now(),
    confirmedLive: false
  });
}

const YAHOO_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/** Formats a raw share-volume count the same "16.2M" / "1.9B" style already
 * used throughout the UI, from a REAL number instead of `Math.random()`. */
export function formatVolume(vol: number): string {
  if (!Number.isFinite(vol) || vol <= 0) return 'N/A';
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return String(Math.round(vol));
}

/** Fetches a single current quote from Yahoo Finance's unofficial chart API. */
export async function fetchLiveFeedForSymbol(query: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(query)}?interval=1d&range=1d`,
      { headers: { 'User-Agent': YAHOO_USER_AGENT }, signal: AbortSignal.timeout(3500) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (meta && meta.regularMarketPrice) {
      const price = Number(meta.regularMarketPrice.toFixed(2));
      const prev = meta.chartPreviousClose || meta.previousClose || price;
      const change = Number((price - prev).toFixed(2));
      const changePercent = Number(((change / prev) * 100).toFixed(2));
      const high = Number((meta.regularMarketDayHigh || Math.max(price, prev * 1.005)).toFixed(2));
      const low = Number((meta.regularMarketDayLow || Math.min(price, prev * 0.995)).toFixed(2));
      // Real volume/name from Yahoo's own response instead of a hardcoded
      // '5.4M' and a guessed "${sym} India Ltd" — both were previously
      // fabricated and served under a feedSource explicitly labeled
      // YAHOO_FINANCE_LIVE.
      const volume = typeof meta.regularMarketVolume === 'number' ? formatVolume(meta.regularMarketVolume) : undefined;
      const name: string | undefined = meta.longName || meta.shortName || undefined;
      return { price, prevClose: prev, change, changePercent, high, low, volume, name };
    }
  } catch {
    // Silent — caller keeps the last known-good cached price rather than
    // introducing a false movement on a transient network failure.
  }
  return null;
}

export interface HistoricalCandle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Fetches real historical OHLCV candles from Yahoo's chart API for the given
 * range/interval (e.g. range=6mo&interval=1d) — the same endpoint used for
 * live quotes, just not limited to a single current-day point. Returns null
 * on any failure so the caller can fall back to a clearly-labeled simulation
 * instead of silently mixing real and fake data. */
export async function fetchHistoricalCandles(
  query: string,
  range: string,
  interval: string
): Promise<HistoricalCandle[] | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(query)}?interval=${encodeURIComponent(
        interval
      )}&range=${encodeURIComponent(range)}`,
      { headers: { 'User-Agent': YAHOO_USER_AGENT }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp;
    const quote = result?.indicators?.quote?.[0];
    if (!timestamps || !quote) return null;

    const candles: HistoricalCandle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i];
      // Yahoo pads gaps (holidays/pre-market) with nulls — skip incomplete bars.
      if ([open, high, low, close].some((v) => v === null || v === undefined)) continue;
      candles.push({
        time: new Date(timestamps[i] * 1000).toISOString(),
        timestamp: timestamps[i],
        open,
        high,
        low,
        close,
        volume: volume ?? 0
      });
    }
    return candles.length > 0 ? candles : null;
  } catch {
    return null;
  }
}

let syncInFlight = false;

/** Refreshes every tracked symbol's live quote. Only runs while the market
 * is open — when closed, rates stay frozen at the last real close rather
 * than drifting from a stale background fetch. Fetches concurrently (not
 * one-symbol-at-a-time) since the tracked list is now 60+ symbols — a
 * sequential loop at ~60 symbols could take longer than the poll interval
 * itself and pile up overlapping runs. A guard skips a tick if the previous
 * one is still in flight (e.g. a feed responding slowly) rather than
 * stacking.
 *
 * Per explicit user instruction ("don't use Yahoo Finance, use BSE's own
 * website for live rates"): BSE's own feed (bseIndia.service.ts) is tried
 * FIRST for every symbol with a verified scrip code; Yahoo is now only the
 * fallback when BSE has no mapping for that symbol or its request fails.
 * Historical candles (RSI/MACD/EMA/SMA/ATR) still come from Yahoo
 * exclusively — BSE's own public feed doesn't expose multi-day OHLC
 * history, only today's intraday ticks. */
export async function syncAllExchangeRates(isMarketOpen: boolean, force = false) {
  if ((!isMarketOpen && !force) || syncInFlight) return;
  syncInFlight = true;
  try {
    await Promise.all(
      Object.entries(quoteDirectory).map(async ([sym, info]) => {
        const bseScripCode = BSE_SCRIP_CODES[sym];
        const bseData = bseScripCode ? await fetchBseLiveQuote(bseScripCode) : null;
        const liveData = bseData ?? await fetchLiveFeedForSymbol(info.query);
        if (liveData) {
          // Real volume from Yahoo when it reports one; otherwise keep
          // whatever the cache already had rather than inventing a fresh
          // random figure every 15s (which made the volume column visibly
          // jitter on every poll tick for a number that never actually
          // changed on the exchange).
          const previousVolume = liveQuotesCache.get(sym)?.volume;
          liveQuotesCache.set(sym, {
            symbol: sym,
            name: info.name,
            querySymbol: info.query,
            lastPrice: liveData.price,
            prevClose: liveData.prevClose,
            change: liveData.change,
            changePercent: liveData.changePercent,
            dayHigh: liveData.high,
            dayLow: liveData.low,
            volume: liveData.volume ?? previousVolume ?? (info.isIndex ? '1.9B' : 'N/A'),
            currency: 'INR',
            exchange: 'BSE',
            isIndex: info.isIndex,
            lastFetched: Date.now(),
            confirmedLive: true
          });
        }
        // If liveData is unavailable, keep the existing cached price rather than
        // introducing a false movement.
      })
    );
  } finally {
    syncInFlight = false;
  }
}
