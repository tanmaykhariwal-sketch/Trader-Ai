import { PurchasedHolding, JournalEntry, CapitalRecord, TradeType, MarketSignal } from '../types';

/**
 * Every timestamp column in the SQLite schema defaults to `datetime('now')`,
 * which yields "YYYY-MM-DD HH:MM:SS" in UTC with no 'Z'/'T' — a format the
 * JS Date constructor treats as LOCAL time, not UTC, silently shifting every
 * displayed time by the browser's UTC offset. Converting to real ISO before
 * parsing is what keeps these correct.
 */
function parseServerTimestamp(raw: string): Date {
  return new Date(raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`);
}

function formatServerTime(raw: string): string {
  return parseServerTimestamp(raw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatServerDate(raw: string): string {
  return parseServerTimestamp(raw).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new ApiError(body?.error || `Request to ${path} failed (${res.status})`, res.status);
  }
  return body as T;
}

// ---- Auth ----

export interface ServerUser {
  id: number;
  username: string;
  displayName: string | null;
  tradingMode: string;
  currency: string;
  capital: number;
  disclaimerAcknowledged: boolean;
  isAdmin: boolean;
}

export function apiMe() {
  return request<{ success: true; user: ServerUser | null }>('/auth/me');
}
export function apiLogin(username: string, password: string) {
  return request<{ success: true; user: ServerUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}
export function apiRegister(username: string, password: string, displayName?: string) {
  return request<{ success: true; user: ServerUser }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, displayName }) });
}
export function apiLogout() {
  return request<{ success: true }>('/auth/logout', { method: 'POST' });
}

// ---- Portfolio ----

interface ServerHolding {
  id: string;
  symbol: string;
  stockName: string;
  purchasePrice: number;
  quantity: number;
  currency: 'INR' | 'USD';
  sellZone: string;
  stopLoss: string;
  probableTimeWindow: string;
  targetPriceNum: number | null;
  stopLossPriceNum: number | null;
  tradeType: TradeType;
  source?: 'MANUAL' | 'AUTO';
  purchasedAt: string;
}

interface ServerCapitalRecord {
  id: string;
  amount: number;
  type: string;
  resultingCapital: number;
  note: string | null;
  createdAt: string;
}

interface ServerJournalEntry {
  id: string;
  holdingId: string | null;
  symbol: string;
  stockName: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  boughtAt: string | null;
  boughtDate: string | null;
  soldAt: string;
  soldDate: string | null;
  dataQualityNote?: string | null;
}

function mapHolding(h: ServerHolding): PurchasedHolding {
  return {
    id: h.id,
    symbol: h.symbol,
    stockName: h.stockName,
    purchasePrice: h.purchasePrice,
    quantity: h.quantity,
    purchaseTime: formatServerTime(h.purchasedAt),
    purchaseDate: formatServerDate(h.purchasedAt),
    currency: h.currency,
    sellZone: h.sellZone,
    stopLoss: h.stopLoss,
    probableTimeWindow: h.probableTimeWindow,
    targetPriceNum: h.targetPriceNum ?? undefined,
    stopLossPriceNum: h.stopLossPriceNum ?? undefined,
    tradeType: h.tradeType,
    source: h.source
  };
}

const RAW_SQL_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

// A real sale (via /portfolio/sell) stores bought_at/sold_at as raw SQL UTC
// datetimes and leaves bought_date/sold_date NULL; a manual "Log Past Trade"
// entry instead stores already-formatted display strings directly ("11:44
// AM" / "29 Aug 2026") with no raw datetime to convert at all. Detecting
// which shape a given value actually is (rather than assuming based on which
// route produced it) lets both paths display correctly without
// double-formatting an already-formatted manual-entry string.
function mapJournalEntry(e: ServerJournalEntry): JournalEntry {
  const boughtIsRaw = !!e.boughtAt && RAW_SQL_DATETIME.test(e.boughtAt);
  const soldIsRaw = RAW_SQL_DATETIME.test(e.soldAt);

  return {
    id: e.id,
    holdingId: e.holdingId ?? undefined,
    symbol: e.symbol,
    stockName: e.stockName,
    buyPrice: e.buyPrice,
    sellPrice: e.sellPrice,
    quantity: e.quantity,
    pnl: e.pnl,
    pnlPercent: e.pnlPercent,
    boughtAt: boughtIsRaw ? formatServerTime(e.boughtAt!) : e.boughtAt ?? undefined,
    boughtDate: boughtIsRaw ? formatServerDate(e.boughtAt!) : e.boughtDate ?? undefined,
    soldAt: soldIsRaw ? formatServerTime(e.soldAt) : e.soldAt,
    soldDate: soldIsRaw ? formatServerDate(e.soldAt) : e.soldDate ?? undefined,
    dataQualityNote: e.dataQualityNote ?? undefined
  };
}

function mapCapitalRecord(r: ServerCapitalRecord): CapitalRecord {
  return {
    id: r.id,
    amount: r.amount,
    type: r.type as CapitalRecord['type'],
    timestamp: formatServerTime(r.createdAt),
    date: formatServerDate(r.createdAt),
    sortKey: parseServerTimestamp(r.createdAt).getTime(),
    resultingCapital: r.resultingCapital,
    note: r.note ?? undefined
  };
}

export interface PortfolioState {
  capital: number;
  capitalRecords: CapitalRecord[];
  holdings: PurchasedHolding[];
}

export async function apiGetPortfolioState(): Promise<PortfolioState> {
  const res = await request<{ success: true; capital: number; capitalRecords: ServerCapitalRecord[]; holdings: ServerHolding[] }>('/portfolio/state');
  return {
    capital: res.capital,
    capitalRecords: res.capitalRecords.map(mapCapitalRecord),
    holdings: res.holdings.map(mapHolding)
  };
}

export async function apiAddCapital(amountToAdd: number, note?: string): Promise<number> {
  const res = await request<{ success: true; capital: number }>('/portfolio/capital', { method: 'POST', body: JSON.stringify({ amountToAdd, note }) });
  return res.capital;
}

export async function apiSetCapital(setTo: number): Promise<number> {
  const res = await request<{ success: true; capital: number }>('/portfolio/capital', { method: 'POST', body: JSON.stringify({ setTo }) });
  return res.capital;
}

type BuySignalFields = Pick<MarketSignal, 'currency' | 'sellZone' | 'stopLoss' | 'probableTimeWindow'> & {
  targetPriceNum?: number;
  stopLossPriceNum?: number;
};

export async function apiBuyHolding(params: { symbol: string; stockName: string; purchasePrice: number; quantity: number; signal: BuySignalFields; tradeType: TradeType }): Promise<{ holding: PurchasedHolding; capital: number }> {
  const res = await request<{ success: true; holding: ServerHolding; capital: number }>('/portfolio/buy', { method: 'POST', body: JSON.stringify(params) });
  return { holding: mapHolding(res.holding), capital: res.capital };
}

export async function apiSellHolding(holdingId: string, sellPrice: number, quantitySold: number): Promise<{ journalEntry: JournalEntry; remainingQuantity: number; capital: number }> {
  const res = await request<{ success: true; journalEntry: ServerJournalEntry; remainingQuantity: number; capital: number }>('/portfolio/sell', { method: 'POST', body: JSON.stringify({ holdingId, sellPrice, quantitySold }) });
  return { journalEntry: mapJournalEntry(res.journalEntry), remainingQuantity: res.remainingQuantity, capital: res.capital };
}

export async function apiUpdateHoldingTradeType(holdingId: string, tradeType: TradeType): Promise<PurchasedHolding> {
  const res = await request<{ success: true; holding: ServerHolding }>(`/portfolio/holdings/${holdingId}/trade-type`, { method: 'POST', body: JSON.stringify({ tradeType }) });
  return mapHolding(res.holding);
}

export async function apiUpdateHoldingLevels(holdingId: string, levels: { stopLossPriceNum?: number; targetPriceNum?: number }): Promise<PurchasedHolding> {
  const res = await request<{ success: true; holding: ServerHolding }>(`/portfolio/holdings/${holdingId}/levels`, { method: 'POST', body: JSON.stringify(levels) });
  return mapHolding(res.holding);
}

// Only succeeds server-side for a MANUAL holding — the server 403s if this
// is called on an AUTO holding (a relic of the removed autonomous engine).
export async function apiCorrectHoldingPurchase(holdingId: string, correction: { purchasePrice?: number; quantity?: number }): Promise<{ holding: PurchasedHolding; capital: number }> {
  const res = await request<{ success: true; holding: ServerHolding; capital: number }>(`/portfolio/holdings/${holdingId}/correct-purchase`, { method: 'POST', body: JSON.stringify(correction) });
  return { holding: mapHolding(res.holding), capital: res.capital };
}

export async function apiDeleteHolding(holdingId: string): Promise<number> {
  const res = await request<{ success: true; capital: number }>(`/portfolio/holdings/${holdingId}`, { method: 'DELETE' });
  return res.capital;
}

// ---- Journal ----

export async function apiListJournal(): Promise<JournalEntry[]> {
  const res = await request<{ success: true; entries: ServerJournalEntry[] }>('/journal');
  return res.entries.map(mapJournalEntry);
}

export async function apiAddJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
  const res = await request<{ success: true; entry: ServerJournalEntry }>('/journal', { method: 'POST', body: JSON.stringify(entry) });
  return mapJournalEntry(res.entry);
}

// ---- Watchlist ----

export async function apiListWatchlist(): Promise<string[]> {
  const res = await request<{ success: true; symbols: string[] }>('/watchlist');
  return res.symbols;
}

export async function apiAddWatchlist(symbol: string): Promise<string[]> {
  const res = await request<{ success: true; symbols: string[] }>(`/watchlist/${encodeURIComponent(symbol)}`, { method: 'POST' });
  return res.symbols;
}

export async function apiRemoveWatchlist(symbol: string): Promise<string[]> {
  const res = await request<{ success: true; symbols: string[] }>(`/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
  return res.symbols;
}

// ---- Admin ----

export interface AdminUserRecord {
  id: number;
  username: string;
  displayName: string | null;
  createdAt: string;
  tradingMode: string;
  currency: string;
  capital: number;
  disclaimerAcknowledged: boolean;
  holdings: ServerHolding[];
  journal: ServerJournalEntry[];
  capitalRecords: ServerCapitalRecord[];
  watchlist: string[];
}

export async function apiGetAllUsersAdmin(): Promise<AdminUserRecord[]> {
  const res = await request<{ success: true; users: AdminUserRecord[] }>('/admin/users');
  return res.users;
}
