// Copies the live SQLite database to a timestamped backup file using
// better-sqlite3's online-backup API (safe to run while the server is
// running in WAL mode — unlike a raw file copy, which can grab the main
// file mid-write and miss data still sitting in the WAL).
//
// Usage: npm run db:backup
//
// This only touches whatever DATABASE_PATH points at on the machine it
// runs on. On Render's free tier there is no way to run this against the
// deployed instance (no shell access, no persistent disk) -- it's meant
// for local development. See OPS.md for the full picture on persistence.

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'trader-ai.db');

if (!fs.existsSync(DB_PATH)) {
  console.error(`No database found at ${DB_PATH} -- nothing to back up.`);
  process.exit(1);
}

const backupDir = path.join(path.dirname(DB_PATH), 'backups');
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `trader-ai-${stamp}.db`);

const db = new Database(DB_PATH);
await db.backup(backupPath);
db.close();

console.log(`Backed up ${DB_PATH} -> ${backupPath}`);
