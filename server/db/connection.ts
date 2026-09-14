import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'trader-ai.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Migration guard: an existing DB file from before the email->username
// switch already has a `users` table (so schema.sql's CREATE TABLE IF NOT
// EXISTS is a no-op on it) with an `email` column but no `username`/`capital`
// columns. Add what's missing and backfill `username` from the local part
// of the old email so existing accounts keep working instead of being
// orphaned by the rename.
const usersColumns = (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(c => c.name);
if (!usersColumns.includes('username')) {
  db.exec('ALTER TABLE users ADD COLUMN username TEXT');
  if (usersColumns.includes('email')) {
    const rows = db.prepare('SELECT id, email FROM users').all() as { id: number; email: string }[];
    const takeUsername = db.prepare('UPDATE users SET username = ? WHERE id = ?');
    for (const row of rows) {
      const base = (row.email.split('@')[0] || `user${row.id}`).toLowerCase();
      let candidate = base;
      let suffix = 1;
      // Guard against two old emails sharing the same local part, which
      // would otherwise collide once the UNIQUE index below is created.
      while (db.prepare('SELECT 1 FROM users WHERE username = ? AND id != ?').get(candidate, row.id)) {
        candidate = `${base}${suffix++}`;
      }
      takeUsername.run(candidate, row.id);
    }
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');
}
if (!usersColumns.includes('capital')) {
  db.exec('ALTER TABLE users ADD COLUMN capital REAL NOT NULL DEFAULT 0');
}

// The old `email` column (if present) is still `NOT NULL` — SQLite has no
// `ALTER TABLE ... DROP CONSTRAINT`, so a plain `ADD COLUMN username` above
// leaves every future insert (which never sets email) failing with "NOT
// NULL constraint failed: users.email". Rebuilding the table without the
// column is the only way to actually drop it. Render's free tier has no
// persistent disk (the live DB resets on every deploy), so this path only
// ever runs against a local dev DB file that predates this rebuild.
if (usersColumns.includes('email')) {
  db.pragma('foreign_keys = OFF');
  db.exec(`
    CREATE TABLE users_rebuild (
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
    INSERT INTO users_rebuild (id, username, password_hash, display_name, created_at, trading_mode, currency, capital, disclaimer_acknowledged_at)
      SELECT id, username, password_hash, display_name, created_at, trading_mode, currency, capital, disclaimer_acknowledged_at FROM users;
    DROP TABLE users;
    ALTER TABLE users_rebuild RENAME TO users;
  `);
  db.pragma('foreign_keys = ON');
}
