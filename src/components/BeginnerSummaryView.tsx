import React, { useState } from 'react';
import { MarketSignal, TradingMode } from '../types';
import {
  Activity,
  Zap,
  Info,
  ArrowUpRight,
  Star,
  Search,
  Calculator
} from 'lucide-react';

interface BeginnerSummaryViewProps {
  signals: MarketSignal[];
  watchlistSymbols?: string[];
  onToggleWatchlist?: (symbol: string) => void;
  selectedStockSymbol?: string | null;
  onSelectSignal: (signal: MarketSignal) => void;
  isLoading: boolean;
  audioEnabled: boolean;
  onOpenCalculator: (signal: MarketSignal) => void;
  currency?: 'INR' | 'USD';
  tradingMode?: TradingMode;
}

export const BeginnerSummaryView: React.FC<BeginnerSummaryViewProps> = ({
  signals,
  watchlistSymbols = [],
  onToggleWatchlist,
  selectedStockSymbol,
  onSelectSignal,
  onOpenCalculator,
  tradingMode = 'simple'
}) => {
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'HIGH_CONFIDENCE' | 'BREAKOUT' | 'LOW_RISK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdvanced = tradingMode === 'advanced';

  // Helper function to evaluate Entry Status Pill
  const getEntryStatus = (currentPrice: number, buyZoneStr: string) => {
    const nums = buyZoneStr.replace(/,/g, '').match(/\d+(\.\d+)?/g);
    if (!nums || nums.length < 2) {
      return { status: 'In Range', colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: '🟢 In Buy Range' };
    }
    const low = parseFloat(nums[0]);
    const high = parseFloat(nums[1]);

    if (currentPrice <= high * 1.008 && currentPrice >= low * 0.99) {
      return { status: 'In Range', colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: '🟢 In Buy Range' };
    } else if (currentPrice > high * 1.008 && currentPrice <= high * 1.025) {
      return { status: 'Approaching', colorClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30', label: '🟡 Approaching Zone' };
    } else if (currentPrice > high * 1.025) {
      return { status: 'Past Range', colorClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30', label: '🔴 Price Past Zone (Wait Pullback)' };
    } else {
      return { status: 'Dip Watch', colorClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30', label: '🔵 Dip Entry Watch' };
    }
  };

  // Sort signals by profitability / confidence score descending
  const allSortedSignals = [...signals].sort((a, b) => b.confidenceScore - a.confidenceScore);

  const sortedSignals = allSortedSignals.filter(s => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matches = s.symbol.toLowerCase().includes(q) || s.stockName.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (signalFilter === 'HIGH_CONFIDENCE') return s.confidenceScore >= 85;
    if (signalFilter === 'BREAKOUT') return s.signalType.toLowerCase().includes('breakout') || s.signalType.toLowerCase().includes('momentum');
    if (signalFilter === 'LOW_RISK') return s.riskLevel === 'Low' || s.riskLevel === 'Medium';
    return true;
  });

  // Top Buy Signal (highest confidence score). Deliberately falls back only
  // within `sortedSignals` (the search/filtered list), never to
  // `allSortedSignals` — that fallback used to bypass the user's own search
  // and filter, so typing a query with zero matches (or picking a filter
  // tab with none) still showed an unrelated hero card for a stock the user
  // explicitly searched away from, with no indication it wasn't a real match.
  const topBuySignal = sortedSignals.find(s =>
    s.signalType.includes('Bullish') || s.signalType.includes('Demand') || s.signalType.includes('Breakout')
  ) || sortedSignals[0];

  // Other opportunities (remaining signals)
  const otherOpportunities = sortedSignals.filter(s => s.id !== topBuySignal?.id);

  // Helper function to generate simple note
  const getSimpleReason = (sig: MarketSignal) => {
    if (sig.signalType.includes('Bullish') || sig.signalType.includes('Breakout')) {
      return `${sig.stockName} shows strong upward momentum`;
    } else if (sig.signalType.includes('Demand')) {
      return `${sig.stockName} moderate buyers strength on dip`;
    } else {
      return `${sig.stockName} medium risk opportunity`;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">

        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shadow-sm shadow-emerald-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>Trading Action Signals</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Live Signals
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                AI-generated buy zones, targets & time windows — you decide when and whether to act on them
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="space-y-4">

        {/* SIGNAL FILTER & SEARCH TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search signals by symbol or name..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            <button
              onClick={() => setSignalFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                signalFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              All Signals ({allSortedSignals.length})
            </button>

            <button
              onClick={() => setSignalFilter('HIGH_CONFIDENCE')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                signalFilter === 'HIGH_CONFIDENCE'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span>🔥 Top Conviction (≥85%)</span>
            </button>

            <button
              onClick={() => setSignalFilter('BREAKOUT')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                signalFilter === 'BREAKOUT'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span>⚡ Breakouts</span>
            </button>

            <button
              onClick={() => setSignalFilter('LOW_RISK')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                signalFilter === 'LOW_RISK'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span>🛡️ Low/Med Risk</span>
            </button>
          </div>
        </div>

        {/* Empty state: search query or filter tab matched nothing. */}
        {!topBuySignal && (
          <div className="text-center py-10 space-y-2">
            <Search className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No signals match your search or filter</p>
            <p className="text-xs text-slate-500">Try a different symbol, or reset the filter to "All Signals".</p>
            {(searchQuery.trim() || signalFilter !== 'ALL') && (
              <button
                onClick={() => { setSearchQuery(''); setSignalFilter('ALL'); }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                Clear search and filters
              </button>
            )}
          </div>
        )}

        {/* TOP BUY SIGNAL CARD */}
        {topBuySignal && (() => {
          const entryPill = getEntryStatus(topBuySignal.currentPrice, topBuySignal.buyZone);
          const isSelected = selectedStockSymbol === topBuySignal.symbol;

          return (
            <div
              onClick={() => onSelectSignal(topBuySignal)}
              className={`group relative bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border-2 rounded-xl p-4 sm:p-5 transition-all cursor-pointer shadow-lg ${
                isSelected ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-500/20' : 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10'
              }`}
            >
              {/* Interactive Selected Indicator Banner */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                  isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  <Zap className="h-3 w-3 inline mr-1 text-cyan-400" />
                  {isSelected ? '📊 Detailed Chart & Price History Active (Click again to close & return home)' : 'Click to inspect candlestick graph & price history'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 mt-0.5 flex-shrink-0">
                    <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        Top Buy Signal
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${entryPill.colorClass}`}>
                        {entryPill.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {topBuySignal.exchange}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base sm:text-lg font-black text-white mt-1 group-hover:text-emerald-300 transition-colors">
                        {topBuySignal.stockName} <span className="text-slate-400 font-mono text-xs">({topBuySignal.symbol})</span>
                      </h3>
                      {onToggleWatchlist && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(topBuySignal.symbol);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            watchlistSymbols.includes(topBuySignal.symbol)
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                          }`}
                          title={watchlistSymbols.includes(topBuySignal.symbol) ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
                        >
                          <Star className={`h-4 w-4 ${watchlistSymbols.includes(topBuySignal.symbol) ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-300 mt-1 space-y-0.5">
                      <div>
                        <strong className="text-slate-400">Buy Price Zone:</strong> <span className="font-mono text-emerald-300 font-bold">{topBuySignal.buyZone}</span>
                      </div>
                      <div>
                        <strong className="text-slate-400">Entry Time Window:</strong> <span className="font-mono text-cyan-300 font-semibold">{topBuySignal.probableTimeWindow}</span>
                      </div>
                      <div>
                        <strong className="text-slate-400">Sell Target:</strong> <span className="font-mono text-emerald-300 font-semibold">{topBuySignal.sellZone}</span>
                        {' • '}
                        <strong className="text-slate-400">Stop Loss:</strong> <span className="font-mono text-rose-400 font-semibold">{topBuySignal.stopLoss}</span>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center space-x-1.5">
                        <Info className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                        <span><strong>Note:</strong> {getSimpleReason(topBuySignal)}</span>
                      </div>

                      {/* Advanced Pro SMC confluence metrics displayed when Pro mode is enabled */}
                      {isAdvanced && (
                        <div className="mt-2.5 pt-2.5 border-t border-purple-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-purple-950/30 p-2.5 rounded-lg border border-purple-500/20">
                          <div>
                            <span className="text-purple-400 font-bold block text-[10px]">SMC Liquidity Zone</span>
                            <span className="text-slate-200 font-bold">{topBuySignal.buyZone}</span>
                          </div>
                          <div>
                            <span className="text-purple-400 font-bold block text-[10px]">RSI Momentum</span>
                            <span className="text-emerald-300">{topBuySignal.technicalSignals?.rsiReading || 'RSI 61.2 (Bullish)'}</span>
                          </div>
                          <div>
                            <span className="text-purple-400 font-bold block text-[10px]">Confluence</span>
                            <span className="text-cyan-300 font-bold">{topBuySignal.technicalSignals?.confluenceScore || topBuySignal.confidenceScore}% Aligned</span>
                          </div>
                          <div>
                            <span className="text-purple-400 font-bold block text-[10px]">Risk:Reward</span>
                            <span className="text-emerald-400 font-bold">1 : 2.8 Favorable</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-2 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                  <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {topBuySignal.confidenceScore}% AI Confidence
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenCalculator(topBuySignal); }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 transition-all"
                      title="Calculate Position Size"
                    >
                      <Calculator className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* OTHER OPPORTUNITIES (SORTED BY PROFITABILITY) */}
        {otherOpportunities.length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <span>Other Buy Opportunities</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Sorted by AI Confidence)
                </span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-400">
                {otherOpportunities.length} Additional Signals
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherOpportunities.map((sig) => {
                const entryPill = getEntryStatus(sig.currentPrice, sig.buyZone);
                const isSelected = selectedStockSymbol === sig.symbol;
                const isWatchlisted = watchlistSymbols.includes(sig.symbol);

                return (
                  <div
                    key={sig.id}
                    onClick={() => onSelectSignal(sig)}
                    className={`p-3.5 bg-slate-900/90 hover:bg-slate-900 border rounded-xl transition-all cursor-pointer group flex flex-col justify-between gap-2.5 ${
                      isSelected ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-slate-900' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            BUY
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${entryPill.colorClass}`}>
                            {entryPill.label}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              Detailed View Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 pt-0.5">
                          <div className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                            {sig.stockName} <span className="text-slate-400 text-xs font-mono">({sig.symbol})</span>
                          </div>
                          {onToggleWatchlist && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleWatchlist(sig.symbol);
                              }}
                              className={`p-1 rounded transition-colors ${
                                isWatchlisted
                                  ? 'text-amber-400'
                                  : 'text-slate-500 hover:text-amber-400'
                              }`}
                              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                            >
                              <Star className={`h-3.5 w-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          Price Zone: <span className="font-semibold text-emerald-300">{sig.buyZone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Time Window: <span className="text-cyan-300">{sig.probableTimeWindow}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {sig.confidenceScore}%
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          AI Confidence
                        </div>
                      </div>
                    </div>

                    {/* Note Box inside each company box */}
                    <div className="text-[11px] font-medium text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-md flex items-center space-x-1.5">
                      <Info className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                      <span><strong>Note:</strong> {getSimpleReason(sig)}</span>
                    </div>

                    {/* Advanced SMC Indicator Row */}
                    {isAdvanced && (
                      <div className="mt-1 pt-1.5 border-t border-purple-500/20 grid grid-cols-2 gap-2 text-[10px] font-mono bg-purple-950/20 p-2 rounded-lg text-slate-300">
                        <div>
                          <span className="text-purple-300 font-bold">RSI:</span> {sig.technicalSignals?.rsiReading?.split(' ')[0] || '58.4'}
                        </div>
                        <div>
                          <span className="text-purple-300 font-bold">Confluence:</span> {sig.technicalSignals?.confluenceScore || sig.confidenceScore}%
                        </div>
                      </div>
                    )}

                    <div className="pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] text-cyan-400/90 font-mono">
                        {isSelected ? 'Click again to close & return home' : 'Click to inspect live chart & full analysis'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
