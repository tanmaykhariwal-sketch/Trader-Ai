import React, { useState } from 'react';
import { 
  Cpu,
  Search,
  ShieldAlert, 
  Layers, 
  BarChart2, 
  TrendingUp, 
  Compass, 
  Target, 
  SlidersHorizontal,
  ArrowUpRight,
  Calculator,
  ChevronRight,
  Activity
} from 'lucide-react';
import { MarketTicker, MarketSignal, AppPage } from '../../types';
import { ConfluenceMatrix } from '../ConfluenceMatrix';

interface AdvancedAnalyticsViewProps {
  currentSignal: MarketSignal | null;
  savedSignals: MarketSignal[];
  tickers: MarketTicker[];
  selectedTicker: MarketTicker;
  onSelectTicker: (ticker: MarketTicker) => void;
  onSelectPage: (page: AppPage) => void;
  onOpenCalculatorForSignal: (signal: MarketSignal) => void;
  currency: 'INR' | 'USD';
}

export const AdvancedAnalyticsView: React.FC<AdvancedAnalyticsViewProps> = ({
  currentSignal,
  savedSignals,
  tickers,
  selectedTicker,
  onSelectTicker,
  onSelectPage,
  onOpenCalculatorForSignal,
  currency
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  // `selectedTicker` is what the user actually just clicked (App.tsx updates
  // it unconditionally on every chip/ticker click); `currentSignal` is only
  // updated when a saved signal exists for that click, so it can lag behind
  // pointing at a totally different, previously-viewed stock. Trusting
  // currentSignal.symbol here meant clicking any ticker without a generated
  // signal (most of the 60-stock tape) did nothing visible at all — the
  // header, chip highlight, and every panel below kept showing the old stock.
  const activeSymbol = selectedTicker.symbol;
  const activeSignal = savedSignals.find(s => s.symbol === activeSymbol)
    || (currentSignal?.symbol === activeSymbol ? currentSignal : null);

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Filtered tickers
  const filteredTickers = tickers.filter(t => 
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <Cpu className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Advanced Institutional Data & Matrix
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeSymbol}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional confluence scoring, Smart Money Concepts (SMC), algorithmic liquidity sweeps, and multi-timeframe scenario models.
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full lg:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter stock metrics..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Stock Switcher Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
          {filteredTickers.map(t => {
            const isSelected = activeSymbol === t.symbol;
            const isPositive = t.changePercent >= 0;

            return (
              <button
                key={t.symbol}
                onClick={() => onSelectTicker(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-500 text-slate-950 border-purple-400 font-black shadow-md shadow-purple-500/20'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{t.symbol}</span>
                <span className={`text-[10px] ${
                  isSelected 
                    ? 'text-slate-950 font-black' 
                    : isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isPositive ? '+' : ''}{t.changePercent.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeSignal ? (
        <div className="space-y-6">
          {/* Top Quick Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Current Market Price</span>
              <div className="text-lg font-black text-white font-mono">
                {currSymbol}{activeSignal.currentPrice.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">BSE Real-time Feed</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Setup Quality Score</span>
              <div className="text-lg font-black text-purple-400 font-mono">
                {activeSignal.confidenceScore}% Confluence
              </div>
              <div className="text-[11px] text-slate-400 font-medium">{activeSignal.signalType}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Execution Window</span>
              <div className="text-sm font-bold text-cyan-300 font-mono">
                {activeSignal.probableTimeWindow}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Zone: {activeSignal.buyZone}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 flex flex-col justify-between">
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase">Direct Actions</span>
                <div className="text-xs font-bold text-slate-200">Switch Workspace</div>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => onSelectPage('stock-studio')}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all text-center flex items-center justify-center space-x-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  <span>Chart Studio</span>
                </button>
                <button
                  onClick={() => onOpenCalculatorForSignal(activeSignal)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all text-center flex items-center justify-center space-x-1"
                >
                  <Calculator className="h-3 w-3" />
                  <span>Position Size</span>
                </button>
              </div>
            </div>
          </div>

          {/* Technical Confluence Matrix Component */}
          <ConfluenceMatrix
            score={activeSignal.technicalSignals.confluenceScore}
            summary={activeSignal.technicalSignals.confluenceSummary}
            rsiReading={activeSignal.technicalSignals.rsiReading}
            macdReading={activeSignal.technicalSignals.macdReading}
            movingAverages={activeSignal.technicalSignals.movingAverages}
            volumeAnalysis={activeSignal.technicalSignals.volumeAnalysis}
          />

          {/* Smart Money Concepts (SMC) & Candlestick Structural Analysis */}
          {activeSignal.candlestickInsights && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                <Layers className="h-4 w-4" />
                <span>Smart Money Concepts (SMC) & Institutional Order Flow for {activeSignal.symbol}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                    Identified Candlestick & Structural Formations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSignal.candlestickInsights.patternsDetected.map((pat, idx) => (
                      <span key={idx} className="bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-lg font-mono font-bold">
                        {pat}
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-300 pt-2 leading-relaxed">
                    {activeSignal.candlestickInsights.implications}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                    Institutional Support / Resistance Clusters
                  </span>
                  <ul className="space-y-1.5 text-slate-300 font-mono">
                    {activeSignal.candlestickInsights.supportResistanceZones.map((zone, idx) => (
                      <li key={idx} className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                        <span className="font-semibold">{zone}</span>
                      </li>
                    ))}
                  </ul>
                  {activeSignal.candlestickInsights.liquidityNotes && (
                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60 mt-2 text-slate-400 text-[11px]">
                      <strong className="text-slate-300">Order Flow & Liquidity: </strong> {activeSignal.candlestickInsights.liquidityNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Multi-Timeframe Scenario Breakdown */}
          {activeSignal.possibleScenarios && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                <Compass className="h-4 w-4" />
                <span>Multi-Timeframe Scenario Outlooks</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">Intraday (15m–1h)</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">Fast</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {activeSignal.possibleScenarios.shortTermIntraday}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">Swing (Daily / Weekly)</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">Medium</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {activeSignal.possibleScenarios.mediumTermWeekly}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">Macro Outlook</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">Strategic</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {activeSignal.possibleScenarios.longTermOutlook}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Assessment & Position Sizing Parameters */}
          {activeSignal.riskAssessment && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Institutional Risk Parameters & Sizing Model</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  activeSignal.riskAssessment.level === 'Low'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : activeSignal.riskAssessment.level === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {activeSignal.riskAssessment.level} Risk Rating
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <p className="text-slate-300 text-xs leading-relaxed">
                  {activeSignal.riskAssessment.reasoning}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Suggested Stop Loss Buffer</span>
                    <span className="text-rose-400 font-bold text-sm">
                      {activeSignal.riskAssessment.suggestedStopLossPercent}%
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Max Suggested Allocation</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {activeSignal.riskAssessment.recommendedPositionSizePercent}% of Capital
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="text-white font-bold text-base">No AI Signal Generated Yet for {activeSymbol}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            This stock doesn't have a generated confluence signal yet. Head to Stock Studio to run an analysis for {activeSymbol}, or pick a different stock above.
          </p>
          <button
            onClick={() => onSelectPage('stock-studio')}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-all inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Analyze {activeSymbol} in Stock Studio</span>
          </button>
        </div>
      )}
    </div>
  );
};
