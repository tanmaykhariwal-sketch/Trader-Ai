---
target: trader-ai (whole app)
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-09-14T08-22-48Z
slug: trader-ai-whole-app
---
Method: dual-agent (A: design review · B: detector + browser evidence), run independently and isolated per the Impeccable critique protocol.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Ticker-chip selection and the active signal/chart can visibly desync (chip shows one stock, chart header shows another) |
| 2 | Match Between System and Real World | 2 | Support FAQ describes an "I Bought This Stock" feature that was removed from the app — active misinformation |
| 3 | User Control and Freedom | 3 | Filters reset cleanly, modals close properly, no real traps |
| 4 | Consistency and Standards | 2 | "AI Confidence" / "Confidence Score" / "Setup Quality Score" / "Forecast Confidence" label at least two different underlying numbers as if interchangeable; Simple/Pro toggle independently re-implemented 3 times |
| 5 | Error Prevention | 1 | Risk & Sizing loads with a self-generated invalid setup (stop-loss above entry) and an over-allocation warning, from the app's own defaults, before any user input — confirmed independently by both assessments |
| 6 | Recognition Rather Than Recall | 2 | Mobile drawer nav buttons expose no accessible name to assistive tech despite visible icon+text |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no bulk/compare actions anywhere in a data-dense analytics tool |
| 8 | Aesthetic and Minimalist Design | 2 | Heavy emoji use clashes with "Institutional Formula" / "Intelligent Terminal" framing; 5 of 6 "Other Opportunities" cards carry an identical badge combination, conveying no differentiation |
| 9 | Error Recovery | 2 | Empty/not-found states are well-written; but the Risk Calculator's invalid-setup state has no reset-to-valid escape hatch |
| 10 | Help and Documentation | 2 | FAQ exists but documents a feature that no longer exists |

**Total: 19/40 — Poor.** Several of these are functional/informational defects (a stale FAQ, self-contradicting default calculator output), not stylistic nitpicks.

## Design Specificity Verdict

**LLM assessment (Assessment A):** Mixed. The BSE-specific scaffolding is real and well done — IST clocks, the canonical holiday calendar reused everywhere so the app can't contradict itself about a trading day, ₹ formatting, RBI/Fed/crude macro copy. But the domain model underneath leaks: SENSEX and SENSEXADD (an index and an ETF) flow through the exact same buy-zone/stop-loss/position-sizing pipeline as individual equities. Live-confirmed: selecting SENSEX in Stock Studio produced a real stop-loss and, in Risk & Sizing, "Buy Exactly 1 Shares for SENSEX @ ₹74,781.76 (74.8% of account)" — a BSE-literate user would immediately recognize this as templated logic with no domain awareness, since nobody "buys 1 share of the index."

**Deterministic scan (Assessment B):** The mechanical detector flagged 40 findings, all one rule (`gray-on-color`), across 15 files. On manual verification, **all 40 are false positives** — two systemic causes: (1) the detector reads both branches of a conditional Tailwind className as if they render simultaneously (they're mutually exclusive states, e.g. an active-vs-inactive nav item), and (2) it mislabels Tailwind's near-black `slate-950` as "gray," when `slate-950`-on-bright-500 is the standard, genuinely high-contrast black-on-color CTA pattern — confirmed directly in-browser (Sign In button, Add-to-Watchlist button) as bold and perfectly legible. Treat this rule's output as noise for this codebase.

**Visual overlays:** The protocol's `live-server.mjs` injection script does not exist in the installed skill version (only `live-inject.mjs`/`live-poll.mjs`/`live-status.mjs` are present) — Assessment B substituted direct browser JS execution for DOM/console/network inspection instead. No user-visible overlay was produced; that's a skill-tooling gap, not an app defect.

## Overall Impression

The visual shell is genuinely BSE-specific and the underlying engineering (race-condition guards throughout `App.tsx`, a single canonical holiday-calendar source of truth) is more disciplined than the surface styling suggests. But the app currently ships two real functional defects that both assessments found independently — a stale FAQ describing a removed feature, and a risk calculator that contradicts itself on first load — plus a domain-modeling gap (indices treated as tradable equities) that undercuts the "built for BSE" premise the rest of the UI earns. The single biggest opportunity: fix the two P0s (they're both quick, targeted edits) and the "index-as-stock" P1, and this jumps from Poor to a credible Acceptable/Good baseline — the underlying architecture already supports it.

## What's Working

1. **Session/holiday awareness is genuinely correct engineering.** `MarketClocksView.tsx` derives its holiday list from the same `BSE_HOLIDAYS` source the sidebar and ticker bar use — the app cannot show conflicting "is today a trading day" answers in different places, which is exactly the kind of cross-cutting correctness a real BSE product needs.
2. **Race-condition guarding is unusually disciplined for a dashboard** (`signalRequestSeq`, `quotesFetchSeq`, `watchlistToggleSeq` in `App.tsx`) — stale slow responses can't silently overwrite newer ones. This is real trust-preserving engineering, not just visual polish.
3. **Copy tone matches the product's actual claim.** "AI-generated buy zones, targets & time windows — you decide when and whether to act on them" is a well-chosen, liability-conscious line for an analysis-only tool — no hype, no implied guarantee.

## Priority Issues

**[P0] Support FAQ describes a removed feature as current functionality.**
Why it matters: `SupportView.tsx` (~lines 246-261) still explains that T1/T2 targets "unlock" after clicking "I Bought This Stock" and tracks live P&L — that feature was deliberately removed from the app. This is the one place meant to be authoritative, actively misinforming confused first-time users about how the product works.
Fix: Rewrite/remove that FAQ entry to reflect that targets are always visible; no "bought" gating exists anywhere anymore.
Suggested command: `/impeccable clarify`

**[P0] Risk & Sizing renders self-contradicting output on its own default load — confirmed independently by both assessments.**
Why it matters: with zero user input, the page's own seeded values put the stop-loss above the entry for a long position, and simultaneously shows a red "Invalid Setup" banner, an amber "High Capital Allocation" warning, AND fully-computed-looking profit/risk-reward numbers as if the trade were valid ("Potential Profit: +₹8024.00... 1:5.36 High Quality Ratio"). A brand-new user's first impression of the tool meant to build trust in risk math is contradictory nonsense before they've touched anything.
Fix: Sanity-check the derived stop-loss/entry ordering in `deriveLevelsFromSignal` (`RiskCalculatorView.tsx`) before using it as an initial value, and suppress the profit/R:R numbers entirely when `isInvertedSetup` is true instead of showing them alongside the warning.
Suggested command: `/impeccable harden`

**[P1] Indices/ETF proxies (SENSEX, SENSEXADD) are processed identically to tradable equities**, producing nonsensical output like "buy 1 share of the index."
Why it matters: this is the single clearest "not actually built for BSE" tell a domain-literate user would catch immediately — directly undercutting the app's own well-executed BSE-specific scaffolding elsewhere.
Fix: Exclude index/ETF-proxy symbols from the buy-zone/position-sizing signal pipeline, or give them an explicitly distinct "index — informational only, not tradable" treatment.
Suggested command: `/impeccable shape`

**[P1] Global ticker selection and the active per-page signal can visibly desync.**
Why it matters: confirmed live on mobile Stock Studio — the selected chip read SENSEX/SENSEXADD while the chart header still said "RELIANCE Price Action & AI Forecast Chart." In a tool whose single most safety-critical fact is "which stock am I looking at right now," this directly violates visibility-of-system-status.
Fix: Make the ticker-selection → signal-state transition atomic, or show an explicit loading/transition state instead of a stale mismatched header.
Suggested command: `/impeccable audit`

**[P2] Mobile drawer navigation is inaccessible to screen readers.**
Why it matters: every nav button in the mobile slide-in drawer exposed zero accessible name in the accessibility tree despite visible icon+text — a screen-reader user cannot distinguish "Market Hub" from "Support & Help" on mobile at all.
Fix: Add an `aria-label` matching the visible label to each nav button in `Sidebar.tsx`'s mobile drawer.
Suggested command: `/impeccable audit`

**[P2] Floating assistant button overlaps scrolled content near the bottom-right on mobile.**
Why it matters: confirmed on Market Hours (a holiday-list row partially hidden behind it), Support & Help (FAQ header), Stock Studio (confidence text), and Market Hub (stop-loss text) — any card content landing in that ~70×70px zone gets obscured.
Fix: Add safe-area padding to the last section of scrollable content on each page, or make the button auto-collapse/fade while scrolling.
Suggested command: `/impeccable layout`

**[P3] Confidence/confluence/score terminology is used interchangeably across 4+ pages** without a shared vocabulary ("AI Confidence" vs "Confidence Score" vs "Setup Quality Score" vs "Forecast Confidence" — at least two are genuinely different numbers).
Why it matters: erodes trust that the numbers mean something precise and consistent.
Fix: Pick one canonical term per concept, define it once via a shared badge/tooltip component, and apply it everywhere that concept appears.
Suggested command: `/impeccable clarify`

## Persona Red Flags

**Alex (Power User)** — directly relevant for a data-heavy analytics tool: zero keyboard shortcuts anywhere. Comparing two stocks' risk setups requires opening Risk & Sizing, clicking one chip, reading, clicking the next chip, reading again — no side-by-side or saved-comparison path exists. The 8-item sidebar shows a full description under every label even after a user has memorized the icons, with no compact/dense mode.

**Sam (Accessibility)** — confirmed, not hypothetical: mobile drawer nav buttons carry no accessible name (verified via the accessibility tree, not just visual read), so a screen-reader user cannot navigate the app's own primary nav on mobile at all.

**Riley (Stress Tester)** — the Risk & Sizing self-contradiction (see P0 above) is exactly the class of bug this persona exists to catch: the app broke its own happy path with zero deliberate bad input from a user, and the "index as tradable stock" bug is a silent domain-logic failure that looks superficially valid.

## Minor Observations

- Version badge ("PRO"/"BASIC") in the sidebar header duplicates information already shown two rows below by the Simple/Pro toggle itself.
- News page's BSE-impact filter row still shows 6 tabs at once (plus a separate 7-item category-pill row directly below) even inside its own "Filters" disclosure — two >4-option decision points stacked back to back.
- The Market Hub "Search signals by symbol or name" box and Advanced Data's "Filter stock metrics..." box are visually near-identical inputs with different scopes, on adjacent nav items, with no distinguishing affordance beyond placeholder text.
- `MarketTickerBar.tsx` accepts both a `bseStatus` and `marketStatus` prop for backward compatibility (`currentBse = bseStatus || marketStatus`) — leftover prop-naming churn that was never fully migrated.
- Horizontal-scroll ticker/filter strips (ticker tape, Stock Studio chips, Advanced Data chips, News category pills) all cut hard at the viewport edge on mobile with zero fade/arrow affordance hinting more content scrolls sideways.
- Mobile "Support & Help" heading wraps to three lines at 375px, pushing all page content down — a smaller mobile type scale would recover meaningful above-the-fold space.
- Recurring dev-only noise in the console (`ws://localhost:24678` HMR websocket failures, bursty `ERR_CONNECTION_REFUSED` on `/api/live-quotes` that self-recovers) — almost certainly local dev-server/sandbox flakiness, not an application defect; worth a quick sanity check against the deployed Render instance rather than treating as confirmed.
- A one-time, unreproduced glitch where the mobile nav drawer's labels appeared left-clipped on first open, correct on the second — possibly a first-paint race in the slide-in animation; flagged as low-confidence, not a confirmed bug.
