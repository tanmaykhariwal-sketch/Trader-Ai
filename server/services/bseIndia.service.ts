/** BSE's own public live-quote feed — used per explicit user instruction
 * ("don't use Yahoo Finance, use BSE's own website for live rates"). This
 * is the same unofficial-but-real endpoint bseindia.com's own quote pages
 * call client-side; there is no public documentation or API key, same
 * category of source as the Yahoo chart endpoint this app already used.
 *
 * Every scrip code below was individually verified against this exact
 * endpoint before being trusted — the response's own company name was
 * checked to actually match the expected symbol, not just assumed correct
 * from memory. A handful of symbols (JSWSTEEL, ADANIPORTS, CIPLA)
 * consistently failed to resolve from this environment across several
 * retries with increasing delays — rather than guess a code for them, they
 * simply have no entry here and fall back to the existing Yahoo live-quote
 * path in yahooFinance.service.ts.
 *
 * BSE does NOT publicly expose multi-day historical OHLC candles the way
 * Yahoo's chart API does (its own public graph endpoint only returns
 * today's minute-by-minute tick series, no real open/high/low/close
 * structure and no history before today) — so historical candles for
 * RSI/MACD/EMA/SMA/ATR computation intentionally still come from Yahoo.
 * This file only ever supplies the LIVE price.
 */
export const BSE_SCRIP_CODES: Record<string, number> = {
  RELIANCE: 500325, TCS: 532540, HDFCBANK: 500180, INFY: 500209, ICICIBANK: 532174,
  SBIN: 500112, BHARTIARTL: 532454, LT: 500510, ADANIENT: 512599, MARUTI: 532500,
  ITC: 500875, AXISBANK: 532215, TATAMOTORS: 500570, HINDUNILVR: 500696, KOTAKBANK: 500247,
  BAJFINANCE: 500034, BAJAJFINSV: 532978, ASIANPAINT: 500820, WIPRO: 507685, HCLTECH: 532281,
  SUNPHARMA: 524715, TITAN: 500114, ULTRACEMCO: 532538, NESTLEIND: 500790, POWERGRID: 532898,
  NTPC: 532555, ONGC: 500312, COALINDIA: 533278, TATASTEEL: 500470,
  HINDALCO: 500440, GRASIM: 500300, INDUSINDBK: 532187, TECHM: 532755,
  DRREDDY: 500124, DIVISLAB: 532488, BRITANNIA: 500825, EICHERMOT: 505200,
  HEROMOTOCO: 500182, 'BAJAJ-AUTO': 532977, 'M&M': 500520, SHREECEM: 500387, APOLLOHOSP: 508869,
  SBILIFE: 540719, HDFCLIFE: 540777, BPCL: 500547, IOC: 530965, VEDL: 500295,
  PIDILITIND: 500331, DABUR: 500096, GODREJCP: 532424, SIEMENS: 500550, DLF: 532868,
  ZOMATO: 543320, PAYTM: 543396, IRCTC: 542830, TATAPOWER: 500400, BANKBARODA: 532134,
  PNB: 532461, CANBK: 532483
};

const BSE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface BseLiveQuote {
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  name?: string;
  // BSE's own getScripHeaderdata response doesn't include a volume figure
  // in the shape this app fetches — always undefined for a BSE-sourced
  // quote, same as Yahoo's own optional volume when it doesn't report one;
  // the caller already falls back to the previous cached volume in that case.
  volume?: string;
}

/** Fetches a single symbol's real live quote from BSE's own site. Returns
 * null on any failure (network error, unexpected shape, missing scrip
 * code) — caller falls back to the existing Yahoo path, same "keep the
 * last known-good price rather than introduce a false movement" contract
 * fetchLiveFeedForSymbol already follows. */
export async function fetchBseLiveQuote(scripCode: number): Promise<BseLiveQuote | null> {
  try {
    const res = await fetch(
      `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderdata/w?Debtflag=&scripcode=${scripCode}&seriesid=`,
      {
        headers: {
          'User-Agent': BSE_USER_AGENT,
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.bseindia.com/'
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const ltp = Number(json?.CurrRate?.LTP);
    const prevClose = Number(json?.Header?.PrevClose);
    if (!Number.isFinite(ltp) || !Number.isFinite(prevClose) || ltp <= 0) return null;
    const price = Number(ltp.toFixed(2));
    const change = Number((price - prevClose).toFixed(2));
    const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;
    const high = Number(json?.Header?.High) || price;
    const low = Number(json?.Header?.Low) || price;
    const name: string | undefined = json?.Cmpname?.FullN || undefined;
    return { price, prevClose, change, changePercent, high, low, name };
  } catch {
    return null;
  }
}
