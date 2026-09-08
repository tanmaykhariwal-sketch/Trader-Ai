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
  email: string;
  displayName: string | null;
  tradingMode: string;
  currency: string;
  disclaimerAcknowledged: boolean;
}

export function apiMe() {
  return request<{ success: true; user: ServerUser | null }>('/auth/me');
}
export function apiLogin(email: string, password: string) {
  return request<{ success: true; user: ServerUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export function apiRegister(email: string, password: string, displayName?: string) {
  return request<{ success: true; user: ServerUser }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) });
}
export function apiLogout() {
  return request<{ success: true }>('/auth/logout', { method: 'POST' });
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
