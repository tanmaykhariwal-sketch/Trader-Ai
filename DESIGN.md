# Design system

The conventions actually followed across the app's components — written down
so future changes stay consistent instead of drifting page by page. This
documents existing practice (Tailwind v4 utility classes); it isn't a new
abstraction layer or token file to import from.

## Typography scale

| Role | Classes | Used for |
|---|---|---|
| Page title (H1) | `text-lg sm:text-xl font-black text-white tracking-tight` | Exactly one per page, in the page's header card |
| Section heading | `text-sm font-bold text-white uppercase tracking-wider` | A named block within a page (e.g. "Recommended Position Size") |
| Card title | `text-xs sm:text-sm font-bold text-white` | Individual card/row headings |
| Body text | `text-xs text-slate-300` / `text-slate-400` | Descriptions, paragraph copy |
| Label / caption | `text-[10px] text-slate-400 uppercase tracking-wider` | Field labels above a value |
| Data value | `font-mono font-bold` (color per meaning, see below) | Prices, percentages, counts |

Every page header follows the same structure: an icon in a tinted rounded
box, the H1, then a one-line `text-xs text-slate-400` description directly
underneath. Don't introduce a page with a different heading size or a title
that skips the description line.

## Color meaning (semantic, not decorative)

- **Emerald** — positive/bullish/success (price up, buy signal, confirmed action)
- **Rose** — negative/bearish/danger (price down, stop loss, invalid state)
- **Amber** — caution/warning (approaching a zone, high exposure, pending)
- **Cyan** — informational/neutral accent (targets, timestamps, secondary data)
- **Purple** — Pro/Advanced-mode-only content (SMC analysis, confluence internals)
- **Slate** — structure (backgrounds, borders, muted text) — never used to
  convey a signal's direction or status

Red/green for price direction is the standard financial-app convention, not
something to soften — inverting or removing it would make the app less
scannable, not more professional.

## Spacing

- Page-level vertical rhythm: `space-y-6` between major sections
- Card internal padding: `p-4` (compact) or `p-5`/`p-6` (hero cards)
- Card-to-card gaps in a grid: `gap-3` (dense) or `gap-4` (spacious)
- Never use manual margins between siblings that could instead be a parent's
  `gap-*`/`space-y-*` — keeps spacing predictable when a sibling is added or removed

## Horizontal-scroll rows

Any `overflow-x-auto` row of chips/pills/tickers gets the `.scroll-fade-x`
utility class (defined in `src/index.css`) so the trailing edge fades instead
of hard-clipping — a visual cue that more content scrolls sideways.

## Data provenance labels

Anywhere live prices or headlines are shown, the real source is labeled in
plain text nearby ("Yahoo Finance (unofficial)", "Google News RSS") — both
are free, unofficial, unlicensed feeds with no SLA, and the UI says so rather
than implying an official/licensed data source.
