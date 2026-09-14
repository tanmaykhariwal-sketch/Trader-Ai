import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Clock,
  PlusCircle,
  ArrowUpRight,
  Trash2,
  CheckCircle2,
  PieChart,
  DollarSign,
  ExternalLink,
  ArrowRight,
  Zap,
  CalendarClock,
  Pencil,
  Check,
  X,
  Search
} from 'lucide-react';
import { PurchasedHolding, MarketSignal, MarketTicker, JournalEntry, CapitalRecord, TradeType } from '../../types';
import { CumulativePnLChart } from '../CumulativePnLChart';
import { CapitalGrowthChart } from '../CapitalGrowthChart';
import { computeHoldingMetrics } from '../../utils/holdingMetrics';
import { ConfirmButton } from '../ConfirmButton';
import { DecimalInput } from '../DecimalInput';

interface PortfolioViewProps {
  purchasedHoldings: PurchasedHolding[];
  capital: number;
  currency: 'INR' | 'USD';
  journalEntries?: JournalEntry[];
  capitalRecords?: CapitalRecord[];
  onAddCapitalClick?: () => void;
  onSellHolding: (holding: PurchasedHolding) => void;
  onRemoveHolding: (holdingId: string) => void;
  onUpdateHoldingTradeType?: (holdingId: string, tradeType: TradeType) => void;
  // Lets the user move the stop-loss/target on an already-open position —
  // purchase price/quantity/timestamp are never editable, since those
  // describe a trade that already executed. Returns the server's error
  // message on failure, or null on success.
  onUpdateHoldingLevels?: (holdingId: string, levels: { stopLossPriceNum?: number; targetPriceNum?: number }) => Promise<string | null>;
  // Corrects a typo in a MANUALLY-logged purchase price/quantity. The
  // control that calls this is only ever shown for holding.source !== 'AUTO'
  // — an engine-executed trade has no "typo" to correct, and the server
  // refuses (403) even if called anyway.
  onCorrectHoldingPurchase?: (holdingId: string, correction: { purchasePrice?: number; quantity?: number }) => Promise<string | null>;
  onNavigateToStudio: (symbol: string) => void;
  onNavigateToMarketHub: () => void;
  onNavigateToJournal?: () => void;
  liveSignals: MarketSignal[];
  tickers?: MarketTicker[];
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  purchasedHoldings,
  capital,
  currency,
  journalEntries = [],
  capitalRecords = [],
  onAddCapitalClick,
  onSellHolding,
  onRemoveHolding,
  onUpdateHoldingTradeType,
  onUpdateHoldingLevels,
  onCorrectHoldingPurchase,
  onNavigateToStudio,
  onNavigateToMarketHub,
  onNavigateToJournal,
  liveSignals,
  tickers = []
}) => {
  // Which holding+field is currently being edited (only one at a time),
  // its draft numeric value, and any error from the last save attempt.
  // Search/filter for the holdings list below — purely client-side over
  // already-loaded holdings, same pattern as the signal search/filter
  // toolbar on the Market Hub page.
  const [holdingSearch, setHoldingSearch] = useState('');
  const [holdingFilter, setHoldingFilter] = useState<'ALL' | 'INTRADAY' | 'DELIVERY' | 'PROFIT' | 'LOSS'>('ALL');

  const [editingLevel, setEditingLevel] = useState<{ holdingId: string; field: 'stopLoss' | 'target' } | null>(null);
  const [draftValue, setDraftValue] = useState<number>(0);
  const [levelError, setLevelError] = useState<string | null>(null);
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  // Mirrors editingLevel synchronously so an in-flight save can tell, after
  // its await, whether the state has moved on to a different holding/field
  // in the meantime — reading the `editingLevel` closure variable directly
  // would be stale (it's fixed at the render that started the save).
  const editingLevelRef = useRef(editingLevel);
  useEffect(() => { editingLevelRef.current = editingLevel; }, [editingLevel]);

  const startEditingLevel = (holdingId: string, field: 'stopLoss' | 'target', currentValue: number) => {
    // Mutual exclusion with the purchase-correction editor below — without
    // this, opening both on the same card (confirmed reproducible) showed
    // two live, independent edit forms describing the same trade at once.
    setCorrectingHoldingId(null);
    setCorrectionError(null);
    setEditingLevel({ holdingId, field });
    setDraftValue(currentValue);
    setLevelError(null);
  };

  const cancelEditingLevel = () => {
    setEditingLevel(null);
    setLevelError(null);
  };

  const saveEditingLevel = async () => {
    if (!editingLevel || !onUpdateHoldingLevels) return;
    if (!Number.isFinite(draftValue) || draftValue <= 0) {
      setLevelError('Enter a positive number.');
      return;
    }
    // Capture which holding/field THIS save is for — editingLevel is a
    // single, page-wide value, and the pencil on every OTHER holding stays
    // clickable while this request is in flight. Found live: start editing
    // Holding A's target, click Save (slow network), then open Holding B's
    // stop-loss editor while A's request is still pending — when A's save
    // resolves, it was unconditionally closing/erroring INTO B's now-open
    // editor. Only apply the result if the state hasn't moved on since.
    const target = editingLevel;
    setIsSavingLevel(true);
    setLevelError(null);
    const key = target.field === 'stopLoss' ? 'stopLossPriceNum' : 'targetPriceNum';
    const err = await onUpdateHoldingLevels(target.holdingId, { [key]: draftValue });
    setIsSavingLevel(false);
    const current = editingLevelRef.current;
    const stillSameEdit = !!current && current.holdingId === target.holdingId && current.field === target.field;
    if (!stillSameEdit) return;
    if (err) {
      setLevelError(err);
      return;
    }
    setEditingLevel(null);
  };

  // Separate editor for correcting a mistyped purchase price/quantity —
  // deliberately its own state rather than reusing editingLevel above, since
  // it edits two fields together and only applies to MANUAL holdings (an
  // AUTO holding's "Edit purchase" control is never rendered at all).
  const [correctingHoldingId, setCorrectingHoldingId] = useState<string | null>(null);
  const [correctionDraft, setCorrectionDraft] = useState<{ price: number; qty: number }>({ price: 0, qty: 0 });
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);
  // Same stale-save race guard as editingLevelRef above, for this editor.
  const correctingHoldingIdRef = useRef(correctingHoldingId);
  useEffect(() => { correctingHoldingIdRef.current = correctingHoldingId; }, [correctingHoldingId]);

  const startCorrectingPurchase = (holdingId: string, price: number, qty: number) => {
    // Mutual exclusion with the level editor above — see its own comment.
    setEditingLevel(null);
    setLevelError(null);
    setCorrectingHoldingId(holdingId);
    setCorrectionDraft({ price, qty });
    setCorrectionError(null);
  };

  const cancelCorrectingPurchase = () => {
    setCorrectingHoldingId(null);
    setCorrectionError(null);
  };

  const saveCorrectingPurchase = async () => {
    if (!correctingHoldingId || !onCorrectHoldingPurchase) return;
    if (!Number.isFinite(correctionDraft.price) || correctionDraft.price <= 0) {
      setCorrectionError('Enter a positive price.');
      return;
    }
    if (!Number.isInteger(correctionDraft.qty) || correctionDraft.qty <= 0) {
      setCorrectionError('Enter a whole number of shares.');
      return;
    }
    // Same reasoning as saveEditingLevel above: capture which holding THIS
    // save is for, and only apply the result if the state hasn't since moved
    // on to editing a different holding's purchase correction.
    const targetHoldingId = correctingHoldingId;
    setIsSavingCorrection(true);
    setCorrectionError(null);
    const err = await onCorrectHoldingPurchase(targetHoldingId, { purchasePrice: correctionDraft.price, quantity: correctionDraft.qty });
    setIsSavingCorrection(false);
    if (correctingHoldingIdRef.current !== targetHoldingId) return;
    if (err) {
      setCorrectionError(err);
      return;
    }
    setCorrectingHoldingId(null);
  };

  // A holding being edited can disappear server-side at any moment — the
  // autoTrader engine sells/buys independently of this tab, and both the
  // 30s structural poll and a save's own 404-triggered reconciliation
  // (see App.tsx) remove it from purchasedHoldings without this component
  // knowing why. Without this, editingLevel/correctingHoldingId kept
  // referencing an id that no longer existed in the list — harmless only
  // because the card itself had already vanished, but a real dangling
  // reference that would resurface as broken state if the card-matching
  // logic below ever changed.
  useEffect(() => {
    if (editingLevel && !purchasedHoldings.some(h => h.id === editingLevel.holdingId)) {
      setEditingLevel(null);
      setLevelError(null);
    }
    if (correctingHoldingId && !purchasedHoldings.some(h => h.id === correctingHoldingId)) {
      setCorrectingHoldingId(null);
      setCorrectionError(null);
    }
  }, [purchasedHoldings, editingLevel, correctingHoldingId]);

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Calculate live portfolio statistics
  let totalInvested = 0;
  let currentPortfolioValue = 0;

  const holdingsWithMetrics = purchasedHoldings.map(holding => {
    const matchingSignal = liveSignals.find(s => s.symbol === holding.symbol);
    const matchingTicker = tickers.find(t => t.symbol === holding.symbol);
    const metrics = computeHoldingMetrics(holding, matchingSignal, matchingTicker?.lastPrice);

    totalInvested += metrics.investedAmount;
    currentPortfolioValue += metrics.currentValue;

    return {
      // `stopLoss` deliberately NOT overridden here: PurchasedHolding.stopLoss
      // is the real display string (e.g. "₹1,268", already what line ~336
      // below renders) — overwriting it with the numeric metrics.stopLossPrice
      // silently corrupted every holding passed to onSellHolding, since that
      // object gets threaded straight into MarkAsSoldModal -> computeHoldingMetrics
      // again, which calls .replace() on holding.stopLoss expecting a string
      // and threw "holding.stopLoss.replace is not a function", crashing the
      // whole app on every "Record Sale & Log to Journal" click.
      ...holding,
      livePrice: metrics.livePrice,
      investedAmount: metrics.investedAmount,
      currentVal: metrics.currentValue,
      unrealizedPnL: metrics.pnl,
      pnlPercentage: metrics.pnlPct,
      target1: metrics.target1,
      // Numeric-only field, distinct from the `stopLoss` display string above
      // — used to pre-fill the stop-loss edit input with the real current
      // value, never rendered directly (that's what `stopLoss` is for).
      stopLossPrice: metrics.stopLossPrice,
      targetProgress: metrics.targetProgress
    };
  });

  // Search/filter is applied AFTER the metrics/totals above are computed
  // from the FULL holdings list — the KPI cards and capital-utilization bar
  // must always reflect the whole real portfolio, never just what's
  // currently visible in a filtered/searched list below.
  const visibleHoldings = holdingsWithMetrics.filter((holding) => {
    if (holdingSearch.trim()) {
      const q = holdingSearch.trim().toLowerCase();
      const matches = holding.symbol.toLowerCase().includes(q) || holding.stockName.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (holdingFilter === 'INTRADAY' && holding.tradeType !== 'INTRADAY') return false;
    if (holdingFilter === 'DELIVERY' && holding.tradeType !== 'DELIVERY') return false;
    if (holdingFilter === 'PROFIT' && holding.unrealizedPnL < 0) return false;
    if (holdingFilter === 'LOSS' && holding.unrealizedPnL >= 0) return false;
    return true;
  });

  const totalUnrealizedPnL = currentPortfolioValue - totalInvested;
  const totalPnLPercentage = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
  // `capital` is already net of every purchase (debited on buy, credited on
  // sell — see App.tsx's handleConfirmPurchase/handleConfirmSale), so it IS
  // the free cash; it must never be treated as the account's original total.
  // The correct total for a utilization ratio is cash-on-hand plus whatever
  // is currently deployed in holdings.
  const freeCash = capital;
  const totalAccountValue = capital + totalInvested;
  const capitalUtilizationPercent = totalAccountValue > 0 ? Math.min(100, (totalInvested / totalAccountValue) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Briefcase className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Active Portfolio & Positions</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {purchasedHoldings.length} {purchasedHoldings.length === 1 ? 'Holding' : 'Holdings'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Live tracking of your purchased BSE equities, real-time target sell alerts, and capital allocation.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToMarketHub}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Browse Active Signals</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Capital */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Account Capital
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-white">
            {currSymbol}{capital.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Free Cash: {currSymbol}{freeCash.toLocaleString()}</span>
            <span className="text-emerald-400">{(100 - capitalUtilizationPercent).toFixed(0)}% Free</span>
          </div>
        </div>

        {/* Invested Capital — clickable per explicit request: jumps down to
            the real Capital Balance Trajectory chart already on this page,
            instead of leaving it disconnected from the number that
            summarizes it. */}
        <button
          type="button"
          onClick={() => {
            // With prefers-reduced-motion active, 'smooth' silently no-ops in
            // some Chromium builds instead of falling back to instant —
            // confirmed live (a click would do visibly nothing). Respect the
            // preference explicitly instead of leaving that to chance.
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            document.getElementById('capital-growth-chart-anchor')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
          }}
          className="text-left bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 p-4 rounded-2xl shadow-md transition-colors cursor-pointer group"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Capital Deployed</span>
            <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] normal-case font-semibold">View chart ↓</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-cyan-400">
            {currSymbol}{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            {capitalUtilizationPercent.toFixed(1)}% of total portfolio deployed
          </div>
        </button>

        {/* Current Valuation */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Current Holdings Value
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-white">
            {currSymbol}{currentPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            Across {purchasedHoldings.length} BSE equities
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className={`p-4 rounded-2xl border shadow-md ${
          totalUnrealizedPnL >= 0 
            ? 'bg-emerald-950/20 border-emerald-500/30' 
            : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Live Unrealized P&L
          </div>
          <div className={`font-mono text-xl sm:text-2xl font-black flex items-center space-x-1.5 ${
            totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {totalUnrealizedPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <span>
              {totalUnrealizedPnL >= 0 ? '+' : ''}{currSymbol}{totalUnrealizedPnL.toFixed(2)}
            </span>
          </div>
          <div className={`mt-1 text-[10px] font-mono font-bold ${
            totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}% net return
          </div>
        </div>
      </div>

      {/* Capital Allocation Progress Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center space-x-1.5">
            <PieChart className="h-4 w-4 text-cyan-400" />
            <span>Capital Utilization & Risk Allocation</span>
          </span>
          <span className="font-mono text-slate-400">
            {currSymbol}{totalInvested.toLocaleString()} / {currSymbol}{totalAccountValue.toLocaleString()} ({capitalUtilizationPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-500"
            style={{ width: `${capitalUtilizationPercent}%` }}
          />
        </div>
      </div>

      {/* Capital Balance Trajectory & Growth Chart (Recharts) */}
      <div id="capital-growth-chart-anchor" className="scroll-mt-4">
        <CapitalGrowthChart
          capitalRecords={capitalRecords}
          currentCapital={capital}
          currency={currency}
          onAddCapitalClick={onAddCapitalClick}
        />
      </div>

      {/* 30-Day Cumulative P&L Growth Section (Closed Journal Trades) —
          excludes any entry with a dataQualityNote (executed against a
          confirmed data defect, not a real market price) so this equity
          curve reflects real trading performance, same reasoning as the
          Journal page's own stats. */}
      <CumulativePnLChart
        journalEntries={journalEntries.filter(e => !e.dataQualityNote)}
        currency={currency}
        onNavigateToJournal={onNavigateToJournal}
      />

      {/* Holdings List / Empty State */}
      {holdingsWithMetrics.length === 0 ? (
        <div className="bg-slate-900/90 border border-dashed border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
            <Briefcase className="h-8 w-8 text-slate-400" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white">No Active Stock Positions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When you buy a stock based on our AI signals, click <strong className="text-emerald-400">"I Bought This Stock"</strong> to track real-time target prices, auto-dismissing alerts, and live P&L.
            </p>
          </div>
          <button
            onClick={onNavigateToMarketHub}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center space-x-2"
          >
            <span>Explore High-Probability BSE Signals</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Active Holdings ({visibleHoldings.length}{visibleHoldings.length !== holdingsWithMetrics.length ? ` of ${holdingsWithMetrics.length}` : ''})
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Live price ticks every 5s
            </span>
          </div>

          {/* Search / Filter Toolbar — same pattern as Market Hub's signal
              toolbar. Purely client-side over the already-loaded holdings. */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={holdingSearch}
                onChange={(e) => setHoldingSearch(e.target.value)}
                placeholder="Search holdings by symbol or name..."
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
              {([
                ['ALL', 'All'],
                ['PROFIT', 'In Profit'],
                ['LOSS', 'In Loss'],
                ['INTRADAY', 'Intraday'],
                ['DELIVERY', 'Delivery']
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setHoldingFilter(value)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    holdingFilter === value
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visibleHoldings.length === 0 ? (
            <div className="text-center py-10 space-y-2 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
              <Search className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No holdings match your search or filter</p>
              <button
                onClick={() => { setHoldingSearch(''); setHoldingFilter('ALL'); }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                Reset search & filter
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4">
            {visibleHoldings.map((holding) => {
              const isProfit = holding.unrealizedPnL >= 0;

              return (
                <div
                  key={holding.id}
                  className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all space-y-4"
                >
                  {/* Top Row: Symbol, Price, P&L */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-sm text-emerald-400">
                        {holding.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-base text-white">{holding.stockName}</h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {holding.symbol}
                          </span>
                          {holding.tradeType === 'INTRADAY' ? (
                            // INTRADAY -> DELIVERY is the safe direction (removes the
                            // same-day forced-close obligation) — no confirmation needed.
                            <button
                              type="button"
                              onClick={() => onUpdateHoldingTradeType?.(holding.id, 'DELIVERY')}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors flex items-center space-x-1 cursor-pointer bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                              title="Click to switch to Delivery"
                            >
                              <Zap className="h-2.5 w-2.5" />
                              <span>Intraday</span>
                            </button>
                          ) : (
                            // DELIVERY -> INTRADAY now has a real consequence: the
                            // autoTrader engine force-sells any INTRADAY holding at
                            // 15:15 IST regardless of its stop-loss/target/signal state
                            // (confirmed real bug otherwise — a single accidental click
                            // could trigger an irreversible same-day liquidation with no
                            // warning). Same two-click confirm already used for Delete.
                            <ConfirmButton
                              onConfirm={() => onUpdateHoldingTradeType?.(holding.id, 'INTRADAY')}
                              title="Switching to Intraday means the auto-trading engine will force-sell this position by 3:15 PM today, regardless of price"
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors flex items-center space-x-1 cursor-pointer bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25"
                              armedClassName="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors flex items-center space-x-1 cursor-pointer bg-rose-500/20 text-rose-300 border-rose-500/40"
                              armedLabel={<><Zap className="h-2.5 w-2.5" /><span>Force-sell by 3:15?</span></>}
                            >
                              <CalendarClock className="h-2.5 w-2.5" />
                              <span>Delivery</span>
                            </ConfirmButton>
                          )}
                        </div>
                        {correctingHoldingId === holding.id ? (
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                              <span className="text-slate-400 font-mono">Qty:</span>
                              <DecimalInput
                                value={correctionDraft.qty}
                                onChange={(v) => setCorrectionDraft(d => ({ ...d, qty: Math.round(v) }))}
                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                              />
                              <span className="text-slate-400 font-mono">@ {currSymbol}</span>
                              <DecimalInput
                                value={correctionDraft.price}
                                onChange={(v) => setCorrectionDraft(d => ({ ...d, price: v }))}
                                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                              />
                              <button type="button" onClick={saveCorrectingPurchase} disabled={isSavingCorrection} className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 cursor-pointer" title="Save" aria-label="Save purchase correction">
                                <Check className="h-3 w-3" />
                              </button>
                              <button type="button" onClick={cancelCorrectingPurchase} className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white cursor-pointer" title="Cancel" aria-label="Cancel purchase correction">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            {correctionError && <div className="text-[10px] text-rose-400">{correctionError}</div>}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center space-x-1.5">
                            <span>
                              Bought at {holding.purchaseTime || 'Today'} • {holding.quantity} shares @ {currSymbol}{holding.purchasePrice}
                            </span>
                            {onCorrectHoldingPurchase && holding.source !== 'AUTO' && (
                              <button
                                type="button"
                                onClick={() => startCorrectingPurchase(holding.id, holding.purchasePrice, holding.quantity)}
                                className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                                title="Correct a typo in the logged purchase price/quantity"
                                aria-label="Correct purchase price or quantity"
                              >
                                <Pencil className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live P&L Block */}
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Live Market Price</div>
                        <div className="font-mono text-base font-extrabold text-white">
                          {currSymbol}{holding.livePrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Unrealized P&L</div>
                        <div className={`font-mono text-base font-black flex items-center justify-end space-x-1 ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span>{isProfit ? '+' : ''}{currSymbol}{holding.unrealizedPnL.toFixed(2)}</span>
                          <span className="text-xs font-bold">({isProfit ? '+' : ''}{holding.pnlPercentage.toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Selling Zones & Stop Loss Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px] font-semibold flex items-center space-x-1.5 mb-0.5">
                        <Target className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Advisable Target Selling Zone</span>
                        {onUpdateHoldingLevels && editingLevel?.holdingId !== holding.id && (
                          <button
                            type="button"
                            onClick={() => startEditingLevel(holding.id, 'target', holding.target1)}
                            className="text-slate-500 hover:text-emerald-400 cursor-pointer"
                            title="Edit target"
                            aria-label="Edit target price"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {editingLevel?.holdingId === holding.id && editingLevel.field === 'target' ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <DecimalInput
                              value={draftValue}
                              onChange={setDraftValue}
                              className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                              autoFocus
                            />
                            <button type="button" onClick={saveEditingLevel} disabled={isSavingLevel} className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 cursor-pointer" title="Save" aria-label="Save target price">
                              <Check className="h-3 w-3" />
                            </button>
                            <button type="button" onClick={cancelEditingLevel} className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white cursor-pointer" title="Cancel" aria-label="Cancel editing target price">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          {levelError && <div className="text-[10px] text-rose-400">{levelError}</div>}
                        </div>
                      ) : (
                        <div className="font-mono font-bold text-emerald-300">
                          {holding.sellZone}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px] font-semibold flex items-center space-x-1.5 mb-0.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                        <span>Protective Stop Loss</span>
                        {onUpdateHoldingLevels && editingLevel?.holdingId !== holding.id && (
                          <button
                            type="button"
                            onClick={() => startEditingLevel(holding.id, 'stopLoss', holding.stopLossPrice)}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Edit stop loss"
                            aria-label="Edit stop loss price"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {editingLevel?.holdingId === holding.id && editingLevel.field === 'stopLoss' ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <DecimalInput
                              value={draftValue}
                              onChange={setDraftValue}
                              className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                              autoFocus
                            />
                            <button type="button" onClick={saveEditingLevel} disabled={isSavingLevel} className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 cursor-pointer" title="Save" aria-label="Save stop loss price">
                              <Check className="h-3 w-3" />
                            </button>
                            <button type="button" onClick={cancelEditingLevel} className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white cursor-pointer" title="Cancel" aria-label="Cancel editing stop loss price">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          {levelError && <div className="text-[10px] text-rose-400">{levelError}</div>}
                        </div>
                      ) : (
                        <div className="font-mono font-bold text-rose-300">
                          {holding.stopLoss}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px] font-semibold flex items-center space-x-1.5 mb-0.5">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Probable Time Window</span>
                      </div>
                      <div className="font-mono text-slate-200">
                        {holding.probableTimeWindow || '10:00 - 11:30 AM IST'}
                      </div>
                    </div>
                  </div>

                  {/* Target 1 Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Progress to Target 1 ({currSymbol}{holding.target1.toFixed(2)})</span>
                      <span className="text-emerald-400 font-bold">{holding.targetProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${holding.targetProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => onNavigateToStudio(holding.symbol)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Deep Dive Charts & Indicators</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {/* Server now refuses this for AUTO holdings too (a
                          real engine-executed trade has no "typo" to delete
                          away), but hiding it here as well means an AUTO
                          holding's only close-out path is "Record Sale",
                          which correctly logs the real result. */}
                      {holding.source !== 'AUTO' && (
                        <ConfirmButton
                          onConfirm={() => onRemoveHolding(holding.id)}
                          title="Remove holding without logging sale"
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 text-xs font-semibold transition-all flex items-center space-x-1"
                          armedClassName="px-3 py-1.5 rounded-xl bg-rose-500 text-white border border-rose-400 text-xs font-bold transition-all flex items-center space-x-1"
                          armedLabel={<><Trash2 className="h-3.5 w-3.5" /><span>Confirm Delete?</span></>}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </ConfirmButton>
                      )}

                      <button
                        onClick={() => onSellHolding(holding)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Record Sale & Log to Journal</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}
    </div>
  );
};
