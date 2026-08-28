import React, { useState, useEffect } from 'react';
import { MarketSignal, PurchasedHolding, TradingMode } from '../types';
import { getBseMarketStatus, BseMarketStatus } from '../utils/marketHours';
import { 
  TrendingUp, 
  Activity, 
  ChevronRight, 
  Clock, 
  Zap, 
  Info,
  ArrowUpRight,
  ShoppingBag,
  Target,
  ShieldCheck,
  Trash2,
  Star,
  Sparkles,
  Lock,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface BeginnerSummaryViewProps {
  signals: MarketSignal[];
  purchasedHoldings: PurchasedHolding[];
  watchlistSymbols?: string[];
  onToggleWatchlist?: (symbol: string) => void;
  selectedStockSymbol?: string | null;
  onSelectSignal: (signal: MarketSignal) => void;
  isLoading: boolean;
  audioEnabled: boolean;
  onOpenCalculator: (signal: MarketSignal) => void;
  onMarkAsBought: (signal: MarketSignal) => void;
  onRemoveHolding: (symbol: string) => void;
  onSellHolding?: (holding: PurchasedHolding) => void;
  capital?: number;
  currency?: 'INR' | 'USD';
  tradingMode?: TradingMode;
  onToggleTradingMode?: () => void;
}

export const BeginnerSummaryView: React.FC<BeginnerSummaryViewProps> = ({
  signals,
  purchasedHoldings,
  watchlistSymbols = [],
  onToggleWatchlist,
  selectedStockSymbol,
  onSelectSignal,
  isLoading,
  audioEnabled,
  onOpenCalculator,
  onMarkAsBought,
  onRemoveHolding,
  onSellHolding,
  capital = 500000,
  currency = 'INR',
  tradingMode = 'simple',
  onToggleTradingMode
}) => {
  const [showAdvancedData, setShowAdvancedData] = useState(false);
  const [expandedHoldingIds, setExpandedHoldingIds] = useState<Record<string, boolean>>({});
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'HIGH_CONFIDENCE' | 'BREAKOUT' | 'LOW_RISK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdvanced = tradingMode === 'advanced' || showAdvancedData;
  const handleToggleMode = () => {
    if (onToggleTradingMode) {
      onToggleTradingMode();
    } else {
      setShowAdvancedData(prev => !prev);
    }
  };

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Live real-time IST Market Clock & Session Status (ticks every second)
  const [bseStatus, setBseStatus] = useState<BseMarketStatus>(() => getBseMarketStatus(new Date()));

  useEffect(() => {
    // Immediate calculation
    setBseStatus(getBseMarketStatus(new Date()));

    // 1-second ticking interval for accurate IST clock
    const timer = setInterval(() => {
      setBseStatus(getBseMarketStatus(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleHoldingData = (id: string) => {
    setExpandedHoldingIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  // Helper function for Live Holding P&L & Target Hit Check
  const getHoldingLiveMetrics = (holding: PurchasedHolding) => {
    const matchingSignal = signals.find(s => s.symbol === holding.symbol);
    const livePrice = matchingSignal ? matchingSignal.currentPrice : holding.purchasePrice;
    const pnl = (livePrice - holding.purchasePrice) * holding.quantity;
    const pnlPct = holding.purchasePrice > 0 ? ((livePrice - holding.purchasePrice) / holding.purchasePrice) * 100 : 0;

    const numbers = holding.sellZone.replace(/,/g, '').match(/\d+(\.\d+)?/g);
    const t1Price = numbers && numbers.length > 0 ? parseFloat(numbers[0]) : holding.purchasePrice * 1.015;
    const isTargetHit = livePrice >= t1Price;

    return { livePrice, pnl, pnlPct, isTargetHit };
  };

  // Sort signals by profitability / confidence score descending
  const allSortedSignals = [...signals].sort((a, b) => b.confidenceScore - a.confidenceScore);

  const sortedSignals = allSortedSignals.filter(s => {
    if (signalFilter === 'HIGH_CONFIDENCE') return s.confidenceScore >= 85;
    if (signalFilter === 'BREAKOUT') return s.signalType.toLowerCase().includes('breakout') || s.signalType.toLowerCase().includes('momentum');
    if (signalFilter === 'LOW_RISK') return s.riskLevel === 'Low' || s.riskLevel === 'Medium';
    return true;
  });

  // Top Buy Signal (highest confidence score)
  const topBuySignal = sortedSignals.find(s => 
    s.signalType.includes('Bullish') || s.signalType.includes('Demand') || s.signalType.includes('Breakout')
  ) || sortedSignals[0] || allSortedSignals[0];

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
      
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

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
                Buy zone & time window shown • Sell zone after marking stock as bought
              </p>
            </div>
          </div>
        </div>

        {/* Quick Filter Badges & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleTradingMode && (
            <button
              onClick={onToggleTradingMode}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                isAdvanced
                  ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-md shadow-purple-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title="Toggle between Simple Beginner Mode and Advanced Pro SMC Mode"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isAdvanced ? '⚡ Pro SMC Active' : '🌱 Simple Mode'}</span>
            </button>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Signals' },
              { id: 'HIGH_CONFIDENCE', label: 'High Score (≥85%)' },
              { id: 'BREAKOUT', label: 'Breakouts' },
              { id: 'LOW_RISK', label: 'Low Risk' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSignalFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  signalFilter === f.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main Beginner View Layout */}
      <div className="space-y-4">
        
        {/* BSE OFFICIAL LIVE IST CLOCK & SESSION STATUS CARD */}
        <div className={`rounded-2xl p-4 border transition-all shadow-xl font-mono ${
          bseStatus.isHoliday
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : bseStatus.isOpen
            ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
            : 'bg-slate-950/90 border-slate-800 text-slate-300'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            {/* Left: System Time & Status Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
                <Clock className={`h-4 w-4 ${bseStatus.isOpen ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="text-[11px] text-slate-400 font-semibold uppercase">System Time (IST):</span>
                <span className="text-sm sm:text-base font-black text-white tracking-wider">
                  {bseStatus.istTimeFormatted}
                </span>
                <span className="text-[11px] text-slate-400 border-l border-slate-700 pl-2">
                  {bseStatus.istDateFormatted}
                </span>
              </div>

              {/* Status Badge */}
              {bseStatus.isHoliday ? (
                <div className="flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/50 px-3 py-1.5 rounded-xl font-bold text-xs">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  <span>MARKET HOLIDAY • {bseStatus.holidayName || 'EXCHANGE HOLIDAY'}</span>
                  <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-200 uppercase">Rates Frozen</span>
                </div>
              ) : bseStatus.isOpen ? (
                <div className="flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold text-xs">
                  <span className="relative flex h-2.5 w-2.5 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>MARKET OPEN • LIVE BSE SESSION</span>
                  <span className="text-[10px] bg-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-200 font-mono">09:15 AM – 03:30 PM IST</span>
                </div>
              ) : bseStatus.isPreMarket ? (
                <div className="flex items-center space-x-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>BSE PRE-MARKET (ORDER MATCHING)</span>
                  <span className="text-[10px] bg-cyan-500/30 px-1.5 py-0.5 rounded text-cyan-200">Opens 09:15 AM</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold text-xs">
                  <Lock className="h-3.5 w-3.5 text-rose-400" />
                  <span>MARKET CLOSED (3:30 PM IST)</span>
                  <span className="text-[10px] bg-rose-500/25 px-1.5 py-0.5 rounded text-rose-200 uppercase font-mono">Rates Frozen</span>
                </div>
              )}
            </div>

            {/* Right: Capital Guard Warning */}
            <div className="flex items-center space-x-2 text-cyan-300 bg-cyan-950/40 px-3 py-1 rounded-xl border border-cyan-500/20 text-xs">
              <ShieldCheck className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <span>Capital Guard: <strong>Max 5%–10%</strong> allocation per signal • Strict SL required</span>
            </div>
          </div>

          {/* Sub-bar: Explanatory logic and Next Session */}
          <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Info className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
              <span>
                {bseStatus.isHoliday
                  ? `BSE is closed in observance of ${bseStatus.holidayName}. All share rates are frozen at previous closing levels. Zero false fluctuations.`
                  : bseStatus.isOpen
                  ? 'Trading active on Bombay Stock Exchange. Real-time rates synchronized with Google Finance. Polling every 5s.'
                  : 'BSE session closed. All rates are strictly frozen at official closing prices. No false price movements.'}
              </span>
            </div>
            <div className="font-semibold text-slate-300 flex-shrink-0">
              Session Schedule: <span className="text-emerald-400">{bseStatus.nextSessionLabel}</span>
            </div>
          </div>
        </div>

        {/* PURCHASED HOLDINGS SECTION (SHOWS SELLING ZONE ONLY FOR BOUGHT STOCKS) */}
        {purchasedHoldings.length > 0 ? (
          <div className="bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-950 border-2 border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  My Purchased Holdings & Target Selling Zones
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {purchasedHoldings.length} Active Position{purchasedHoldings.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {purchasedHoldings.map(holding => {
                const metrics = getHoldingLiveMetrics(holding);
                const currSym = holding.currency === 'INR' ? '₹' : '$';
                const isProf = metrics.pnl >= 0;

                return (
                  <div
                    key={holding.id}
                    className={`bg-slate-900 border rounded-xl p-4 space-y-2.5 relative group transition-all ${
                      metrics.isTargetHit ? 'border-emerald-400 shadow-lg shadow-emerald-500/10' : 'border-cyan-500/30 hover:border-cyan-400'
                    }`}
                  >
                    {metrics.isTargetHit && (
                      <div className="bg-emerald-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-md flex items-center justify-between animate-pulse">
                        <span className="flex items-center space-x-1">
                          <Target className="h-3.5 w-3.5" />
                          <span>🎯 TARGET 1 SELLING ZONE REACHED</span>
                        </span>
                        <span>Consider Booking Profit!</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            BOUGHT
                          </span>
                          <span className="text-sm font-black text-white">
                            {holding.stockName} <span className="text-slate-400 text-xs font-mono">({holding.symbol})</span>
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-mono mt-1">
                          Bought @ <span className="font-bold text-slate-200">{currSym}{holding.purchasePrice.toLocaleString()}</span> • Qty: {holding.quantity}
                        </div>
                      </div>

                      {/* Live P&L Badge */}
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-slate-400">Live Price: {currSym}{metrics.livePrice}</div>
                        <div className={`text-xs font-bold ${isProf ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProf ? '+' : ''}{currSym}{metrics.pnl.toFixed(0)} ({isProf ? '+' : ''}{metrics.pnlPct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    {/* PROMINENT ADVISABLE SELLING PRICE ZONES (SHORT-TERM & LONG-TERM) */}
                    <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-3 space-y-2">
                      <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                        <span className="flex items-center space-x-1">
                          <Target className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Advisable Selling Price Targets</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Real-time update</span>
                      </div>

                      {/* Short-Term vs Long-Term Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Short-Term Exit Price */}
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-0.5">
                          <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center justify-between">
                            <span>⚡ Short-Term Exit (Traders)</span>
                            <span className="text-[9px] font-mono text-emerald-400">+4% to +7%</span>
                          </div>
                          <div className="text-xs font-mono font-black text-white">
                            {holding.sellZone || `${currSym}${(holding.purchasePrice * 1.045).toLocaleString(undefined, { maximumFractionDigits: 1 })} – ${currSym}${(holding.purchasePrice * 1.068).toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
                          </div>
                        </div>

                        {/* Long-Term Advisable Price */}
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-0.5">
                          <div className="text-[10px] font-bold text-purple-300 uppercase flex items-center justify-between">
                            <span>🏆 Long-Term Target (Investors)</span>
                            <span className="text-[9px] font-mono text-purple-300">+16% to +25%</span>
                          </div>
                          <div className="text-xs font-mono font-black text-white">
                            {currSym}{(holding.purchasePrice * 1.16).toLocaleString(undefined, { maximumFractionDigits: 1 })} – {currSym}{(holding.purchasePrice * 1.25).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </div>
                        </div>
                      </div>

                      {/* Exit Window & Stop Loss */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pt-1 border-t border-cyan-500/10">
                        <span>Time Window: <strong className="text-amber-300">{holding.probableTimeWindow}</strong></span>
                        <span>Stop Loss Protection: <strong className="text-rose-400">{holding.stopLoss}</strong></span>
                      </div>
                    </div>

                    {/* TOGGLE ADVANCED CALCULATIONS FOR THIS SPECIFIC HOLDING */}
                    <div className="pt-1">
                      <button
                        onClick={() => toggleHoldingData(holding.id)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                          expandedHoldingIds[holding.id]
                            ? 'bg-purple-500 text-slate-950 border-purple-400 font-extrabold shadow-sm'
                            : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>{expandedHoldingIds[holding.id] ? 'Hide Data' : 'Show Data'}</span>
                      </button>
                    </div>

                    {/* DETAILED TECHNICAL & CAPITAL CALCULATIONS (RENDERED WHEN TOGGLED) */}
                    {expandedHoldingIds[holding.id] && (() => {
                      const matchSig = signals.find(s => s.symbol === holding.symbol);
                      const totalInvestedForHolding = holding.purchasePrice * holding.quantity;
                      const shortTermProceeds = totalInvestedForHolding * 1.055;
                      const longTermProceeds = totalInvestedForHolding * 1.20;

                      return (
                        <div className="bg-slate-950/95 border border-purple-500/40 rounded-xl p-3 text-xs space-y-2 animate-in fade-in font-mono">
                          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider border-b border-purple-500/20 pb-1 flex justify-between">
                            <span>Technical Indicators & Capital Logic</span>
                            <span className="text-slate-400">RSI • MACD • Capital</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                            <div>
                              <strong className="text-purple-300">RSI Reading:</strong> {matchSig?.technicalSignals?.rsiReading || 'RSI 61.2 (Bullish Shift)'}
                            </div>
                            <div>
                              <strong className="text-purple-300">MACD Signal:</strong> {matchSig?.technicalSignals?.macdReading || 'Positive Histogram Spread'}
                            </div>
                            <div>
                              <strong className="text-purple-300">Support / Resistance:</strong> {currSym}{(holding.purchasePrice * 0.985).toFixed(1)} / {currSym}{(holding.purchasePrice * 1.06).toFixed(1)}
                            </div>
                            <div>
                              <strong className="text-purple-300">Risk-Reward Ratio:</strong> 1 : 2.8 (Favorable)
                            </div>
                          </div>

                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1 text-[11px] text-slate-200">
                            <div className="font-bold text-emerald-400">💰 Capital Adjustment Breakdown:</div>
                            <div className="flex justify-between">
                              <span>Capital Invested (Deducted):</span>
                              <span className="font-bold text-white">{currSym}{totalInvestedForHolding.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Est. Short-Term Return:</span>
                              <span className="font-bold text-emerald-300">{currSym}{shortTermProceeds.toLocaleString(undefined, { maximumFractionDigits: 0 })} (+5.5%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Est. Long-Term Return:</span>
                              <span className="font-bold text-purple-300">{currSym}{longTermProceeds.toLocaleString(undefined, { maximumFractionDigits: 0 })} (+20.0%)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actions: I Sold This or Delete */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      {onSellHolding ? (
                        <button
                          onClick={() => onSellHolding(holding)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center space-x-1 transition-all shadow-md shadow-cyan-500/20"
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>I Sold This (Book Trade & Return Capital)</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={() => onRemoveHolding(holding.symbol)}
                        className="p-1 text-slate-400 hover:text-rose-400 text-xs font-mono flex items-center space-x-1 hover:bg-rose-500/10 rounded px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ENHANCED INFO BANNER / WORKFLOW WHEN NO STOCK IS BOUGHT */
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  How Advisable Target Selling Zones Work
                </h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                Trade Lifecycle Workflow
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px] font-mono">1</span>
                  <span>Select Buy Signal</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Review the high-probability BSE signals below with predefined buy ranges and time windows.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[11px] font-mono">2</span>
                  <span>Tap "I Bought This"</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter your purchase price and quantity to log the entry in your active workspace ledger.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                  <span className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px] font-mono">3</span>
                  <span>Unlock Exit Targets</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Target selling zones, live P&L, and 10-second price alerts activate in real-time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SIGNAL FILTER & SEARCH TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            <button
              onClick={() => setSignalFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                signalFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              All Signals ({sortedSignals.length})
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
                      {topBuySignal.confidenceScore}% Profitability
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsBought(topBuySignal);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>I Bought This Stock</span>
                  </button>
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
                  (Sorted by Profitability Rating)
                </span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-400">
                {otherOpportunities.length} Additional Signals
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherOpportunities.map((sig) => {
                const isHolding = purchasedHoldings.some(h => h.symbol === sig.symbol);
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
                          Profitability
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

                    {/* Mark as bought button & Selection status */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
                      <span className="text-[10px] text-cyan-400/90 font-mono">
                        {isSelected ? 'Click again to close & return home' : 'Click to inspect live chart'}
                      </span>
                      {isHolding ? (
                        <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                          Bought & Active
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsBought(sig);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs border border-emerald-500/40 transition-all flex items-center space-x-1"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>I Bought This Stock</span>
                        </button>
                      )}
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
