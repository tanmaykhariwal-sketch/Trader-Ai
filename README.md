# Trader AI

A paper-trading and signal-tracking terminal for the Bombay Stock Exchange (BSE). Trader AI shows live-ish BSE quotes, AI-assisted trade signals, and lets you log paper positions, track P&L, and journal trades — without ever placing a real order.

**This is an educational / paper-trading tool. It is not investment advice, and it never executes a real trade.**

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Backend:** Express, SQLite (`better-sqlite3`), session-cookie auth (`bcrypt` + `cookie-parser`)
- **AI:** Google Gemini (`@google/genai`) for trade-signal generation and the in-app assistant — optional; the app falls back to a deterministic mock signal engine if no API key is configured
- **Market data:** Yahoo Finance (unofficial, unauthenticated endpoint) for live quotes and historical candles; Google News RSS for headline aggregation

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:3000` — the same Express process serves both the API and the Vite dev server, so no separate frontend server or proxy config is needed.

### Environment variables

Copy `.env.example` to `.env` and fill in what you need:

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | No | Enables real AI-generated trade signals and assistant replies. Without it, the app uses a local mock signal engine (clearly labeled as simulated) instead of failing. |
| `PORT` | No | Server port. Defaults to `3000`. |
| `DATABASE_PATH` | No | SQLite file location. Defaults to `./data/trader-ai.db`, created automatically. |

`APP_URL` in `.env.example` is only relevant if you deploy behind a reverse proxy that needs a canonical self-referential URL — safe to leave unset for local development.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Express + Vite middleware mode) with hot reload |
| `npm run build` | Build the frontend bundle and bundle the server into `dist/server.cjs` |
| `npm start` | Run the production build (`dist/server.cjs`) |
| `npm run lint` | Type-check the whole project (`tsc --noEmit`) |
| `npm test` | Run the Vitest suite |

## Project layout

```
src/            React frontend
  components/   UI components and page views (components/views/)
  context/      React context providers (auth, news/predictions)
  utils/        Shared client-side logic (API client, position sizing, market hours, etc.)
server/         Express backend
  routes/       API route handlers (auth, portfolio, journal, watchlist, market, news, AI)
  services/     External integrations (Yahoo Finance, Google News, Gemini)
  db/           SQLite schema and repository modules
  middleware/   Auth and rate-limiting middleware
```

## Data & accounts

Each account gets its own paper-trading capital balance, holdings, journal, and watchlist, stored server-side in SQLite — nothing is tied to browser localStorage. Signing up creates a real account (email + password, bcrypt-hashed); sessions are opaque cookies, not JWTs, so they can be revoked server-side at any time.

## Known limitations

- Chart candle data and technical indicators are currently simulated (clearly labeled where shown) rather than computed from real historical prices — real historical OHLCV fetching exists server-side (`GET /api/candles/:symbol`) but indicator computation and full frontend wiring are in progress.
- The candlestick pattern scanner currently only detects bullish patterns.
- Market data comes from free, unofficial endpoints with no uptime guarantee — acceptable for a paper-trading tool, not suitable as a sole data source for real trading decisions.
