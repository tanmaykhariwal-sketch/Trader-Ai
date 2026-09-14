CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  trading_mode TEXT NOT NULL DEFAULT 'simple',
  currency TEXT NOT NULL DEFAULT 'INR',
  capital REAL NOT NULL DEFAULT 0,
  disclaimer_acknowledged_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS capital_records (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DEPOSIT','SET','SALE_CREDIT','PURCHASE_DEBIT','REFUND')),
  resulting_capital REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per buy (a "lot"), not one row per symbol: a partial sell decrements
-- or deletes exactly the targeted lot instead of ever touching a sibling lot
-- of the same symbol.
CREATE TABLE IF NOT EXISTS holdings (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  purchase_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  currency TEXT NOT NULL CHECK (currency IN ('INR', 'USD')),
  sell_zone TEXT,
  stop_loss TEXT,
  probable_time_window TEXT,
  target_price_num REAL,
  stop_loss_price_num REAL,
  trade_type TEXT NOT NULL DEFAULT 'DELIVERY' CHECK (trade_type IN ('INTRADAY', 'DELIVERY')),
  -- MANUAL = user-entered (purchase price/quantity correctable if mistyped).
  -- Only value used now that autonomous execution has been removed; kept as
  -- an enum (not dropped) since existing rows/exports may still carry it.
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'AUTO')),
  purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_dip_buy_add INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  holding_id TEXT,
  symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  buy_price REAL NOT NULL,
  sell_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  pnl REAL NOT NULL,
  pnl_percent REAL NOT NULL,
  bought_at TEXT,
  bought_date TEXT,
  sold_at TEXT NOT NULL DEFAULT (datetime('now')),
  sold_date TEXT,
  -- Non-null only when this entry is confirmed to have executed against a
  -- data defect rather than a real market price. Row stays visible in the
  -- full trade list for an honest audit trail; only excluded from aggregate
  -- stats (Total Realized P&L, Profit Rate, equity curve).
  data_quality_note TEXT,
  exit_reason TEXT
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_capital_records_user ON capital_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
