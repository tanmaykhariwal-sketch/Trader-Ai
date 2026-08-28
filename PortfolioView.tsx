import React from 'react';
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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PurchasedHolding, MarketSignal, JournalEntry, CapitalRecord } from '../../types';
import { CumulativePnLChart } from '../CumulativePnLChart';
import { CapitalGrowthChart } from '../CapitalGrowthChart';

interface PortfolioViewProps {
  purchasedHoldings: PurchasedHolding[];
  capital: number;
  currency: 'INR' | 'USD';
  journalEntries?: JournalEntry[];
  capitalRecords?: CapitalRecord[];
  onAddCapitalClick?: () => void;
  onSellHolding: (holding: PurchasedHolding) => void;
  onRemoveHolding: (symbol: string) => void;
  onNavigateToStudio: (symbol: string) => void;
  onNavigateToMarketHub: () => void;
  onNavigateToJournal?: () => void;
  liveSignals: MarketSignal[];
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
  onNavigateToStudio,
  onNavigateToMarketHub,
  onNavigateToJournal,
  liveSignals
}) => {
  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Calculate live portfolio statistics
  let totalInvested = 0;
  let currentPortfolioValue = 0;

  const holdingsWithMetrics = purchasedHoldings.map(holding => {
    const matchingSignal = liveSignals.find(s => s.symbol === holding.symbol);
    const livePrice = matchingSignal ? matchingSignal.currentPrice : holding.purchasePrice;
    const investedAmount = holding.purchasePrice * holding.quantity;
    const currentVal = livePrice * holding.quantity;
    const unrealizedPnL = currentVal - investedAmount;
    const pnlPercentage = investedAmount > 0 ? (unrealizedPnL / investedAmount) * 100 : 0;
    
    // Parse target price numbers
    const target1 = holding.targetPriceNum || holding.purchasePrice * 1.04;
    const stopLoss = holding.stopLossPriceNum || holding.purchasePrice * 0.98;
    
    // Calculate progress towards Target 1
    const priceDelta = livePrice - holding.purchasePrice;
    const targetDelta = target1 - holding.purchasePrice;
    const targetProgress = targetDelta > 0 
      ? Math.min(100, Math.max(0, Math.round((priceDelta / targetDelta) * 100)))
      : 0;

    totalInvested += investedAmount;
    currentPortfolioValue += currentVal;

    return {
      ...holding,
      livePrice,
      investedAmount,
      currentVal,
      unrealizedPnL,
      pnlPercentage,
      target1,
      stopLoss,
      targetProgress
    };
  });

  const totalUnrealizedPnL = currentPortfolioValue - totalInvested;
  const totalPnLPercentage = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
  const freeCash = Math.max(0, capital - totalInvested);
  const capitalUtilizationPercent = capital > 0 ? Math.min(100, (totalInvested / capital) * 100) : 0;

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

        {/* Invested Capital */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Capital Deployed
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-cyan-400">
            {currSymbol}{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            {capitalUtilizationPercent.toFixed(1)}% of total portfolio deployed
          </div>
        </div>

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
            {currSymbol}{totalInvested.toLocaleString()} / {currSymbol}{capital.toLocaleString()} ({capitalUtilizationPercent.toFixed(1)}%)
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
      <CapitalGrowthChart
        capitalRecords={capitalRecords}
        currentCapital={capital}
        currency={currency}
        onAddCapitalClick={onAddCapitalClick}
      />

      {/* 30-Day Cumulative P&L Growth Section (Closed Journal Trades) */}
      <CumulativePnLChart
        journalEntries={journalEntries}
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Active Holdings ({holdingsWithMetrics.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Live price ticks every 4.5s
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {holdingsWithMetrics.map((holding) => {
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
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Bought at {holding.purchaseTime || 'Today'} • {holding.quantity} shares @ {currSymbol}{holding.purchasePrice}
                        </div>
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
                      </div>
                      <div className="font-mono font-bold text-emerald-300">
                        {holding.sellZone}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px] font-semibold flex items-center space-x-1.5 mb-0.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                        <span>Protective Stop Loss</span>
                      </div>
                      <div className="font-mono font-bold text-rose-300">
                        {holding.stopLoss}
                      </div>
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
                      <button
                        onClick={() => onRemoveHolding(holding.symbol)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 text-xs font-semibold transition-all flex items-center space-x-1"
                        title="Remove holding without logging sale"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>

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
        </div>
      )}
    </div>
  );
};
