# Operations notes

Honest notes on what's actually durable in this deployment and what isn't.

## Database persistence

The app stores everything (accounts, watchlists) in a single SQLite file at
`DATABASE_PATH` (defaults to `./data/trader-ai.db`).

**On Render's free tier: this file does NOT survive a redeploy.** Free web
services on Render have no persistent disk — every deploy starts from a
clean filesystem, so the database resets. There's no code fix for this; it's
a hosting-tier limitation. Real options if this matters to you:

- Upgrade to a paid Render plan and attach a persistent disk, mounting it at
  the path `DATABASE_PATH` points to.
- Move to Fly.io instead (a `Dockerfile` is already in this repo for that).
  Fly's free allowance includes a real persistent volume:
  ```bash
  fly volumes create data --size 1
  ```
  then add to `fly.toml`:
  ```toml
  [mounts]
    source = "data"
    destination = "/data"
  ```
  and set `DATABASE_PATH=/data/trader-ai.db` as an env var/secret.

Until one of those is done, treat every Render redeploy as a full data wipe.

## Backups

`npm run db:backup` copies the live database to `data/backups/` with a
timestamped filename, using SQLite's online-backup API (safe to run while
the server is live — a raw file copy of a WAL-mode database can miss data
still sitting in the WAL file).

This only works against whatever `DATABASE_PATH` points to on the machine
you run it on. There's currently no way to run it against the deployed
Render instance directly (no shell access on the free tier) — it's a local
dev-time backup, or something you'd run on a Fly.io machine via `fly ssh
console` if you migrate there.

There is no automated/scheduled backup — running it is a manual step.

## Health check

`GET /health` returns:
```json
{ "status": "ok" | "degraded", "db": "ok" | "error", "lastSuccessfulSync": "<ISO timestamp>" | null, "lastSyncError": "<string>" | null }
```
`status` is `degraded` if the DB query fails or the background quote sync
hasn't succeeded in the last 30 seconds (twice its normal 15s interval).
There's no external uptime monitor wired up to this — it's there for you to
check manually or point a free service like UptimeRobot at.

## Logs

All server-side logging goes through `server/utils/logger.ts`, one JSON
object per line to stdout/stderr (`{ level, ts, module, event, ...fields }`).
No log aggregator is set up — on Render, view these in the service's own
"Logs" tab in the dashboard. Nothing is persisted beyond whatever retention
Render's dashboard gives you for free.

## Secrets

`GEMINI_API_KEY` and any others live as plain environment variables (Render
dashboard / local `.env`, never committed — `.env.example` shows the shape).
No rotation policy, no secrets manager. If a key leaks, the only fix is to
revoke/regenerate it at the provider and update the env var.
