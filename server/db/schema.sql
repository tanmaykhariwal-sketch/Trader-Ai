CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  trading_mode TEXT NOT NULL DEFAULT 'simple',
  currency TEXT NOT NULL DEFAULT 'INR',
  disclaimer_acknowledged_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
