import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Search,
  Cpu,
  Zap,
  Globe,
  Layers,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { MarketTicker, MarketSignal, PurchasedHolding, TradingMode, AppPage, CandlestickPatternDetection, StockPrediction } from '../../types';
import { CandlestickChart } from '../CandlestickChart';
import { SignalCard } from '../SignalCard';

interface StockStudioViewProps {
  currentSignal: MarketSignal | null;
  tickers: MarketTicker[];
  selectedTicker: MarketTicker;
  onSelectTicker: (ticker: MarketTicker) => void;
  onGenerateSignal: (params: { ticker: MarketTicker; timeframe: string; riskProfile: string; strategy: string }) => void;
  isLoading: boolean;
  audioEnabled: boolean;
  purchasedHoldings: PurchasedHolding[];
  onMarkAsBought: (signal: MarketSignal) => void;
  onOpenSellModal: (holding: PurchasedHolding) => void;
  onOpenCalculatorForSignal: (signal: MarketSignal) => void;
  capital: number;
  currency: 'INR' | 'USD';
  tradingMode?: TradingMode;
  onToggleTradingMode?: () => void;
  onSelectPage?: (page: AppPage) => void;
  predictions?: StockPrediction[];
  marketStatus?: any;
}

export const StockStudioView: React.FC<StockStudioViewProps> = ({
  currentSignal,
  tickers,
  selectedTicker,
  onSelectTicker,
  onGenerateSignal,
  isLoading,
  audioEnabled,
  purchasedHoldings,
  onMarkAsBought,
  onOpenSellModal,
  onOpenCalculatorForSignal,
  capital,
  currency,
  tradingMode = 'simple',
  onToggleTradingMode,
  onSelectPage,
  predictions = [],
  marketStatus = 'CLOSED'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [selectedRiskProfile, setSelectedRiskProfile] = useState('Moderate');
  const [selectedStrategy, setSelectedStrategy] = useState('AI Adaptive Momentum');
  const [detectedPatterns, setDetectedPatterns] = useState<CandlestickPatternDetection[]>([]);
  const [isScanningPatterns, setIsScanningPatterns] = useState<boolean>(false);

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Run Candlestick Pattern Detection Scanner when chart data or timeframe changes
  useEffect(() => {
    if (currentSignal?.chartData && currentSignal.chartData.length > 0) {
      setIsScanningPatterns(true);
      fetch('/api/candlestick-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedTicker.symbol,
          candles: currentSignal.chartData
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.patternsDetected)) {
            setDetectedPatterns(data.patternsDetected);
          }
        })
        .catch(err => console.warn('Pattern scanner error:', err))
        .finally(() => setIsScanningPatterns(false));
    }
  }, [currentSignal?.chartData, selectedTicker.symbol, selectedTimeframe]);

  // Filter tickers for quick selector
  const filteredTickers = tickers.filter(t => 
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isHolding = currentSignal ? purchasedHoldings.some(h => h.symbol === currentSignal.symbol) : false;
  const currentHolding = currentSignal ? purchasedHoldings.find(h => h.symbol === currentSignal.symbol) : undefined;

  const handleTimeframeChange = (tf: string) => {
    setSelectedTimeframe(tf);
    onGenerateSignal({
      ticker: selectedTicker,
      timeframe: tf,
      riskProfile: selectedRiskProfile,
      strategy: selectedStrategy
    });
  };

  const handleRiskChange = (r: string) => {
    setSelectedRiskProfile(r);
    onGenerateSignal({
      ticker: selectedTicker,
      timeframe: selectedTimeframe,
      riskProfile: r,
      strategy: selectedStrategy
    });
  };

  const handleGenerate = () => {
    onGenerateSignal({
      ticker: selectedTicker,
      timeframe: selectedTimeframe,
      riskProfile: selectedRiskProfile,
      strategy: selectedStrategy
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Stock Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <TrendingUp className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Stock Studio & Charting Workbench
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedTicker.symbol}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Finance Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional candlestick pattern recognition, multi-timeframe moving averages, and news sentiment confluence.
              </p>
            </div>
          </div>

          {/* Quick Stock Search & Switcher */}
          <div className="relative w-full lg:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search BSE stock..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Quick Ticker Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
          {filteredTickers.map(t => {
            const isSelected = selectedTicker.symbol === t.symbol;
            const isPositive = t.changePercent >= 0;

            return (
              <button
                key={t.symbol}
                onClick={() => {
                  onSelectTicker(t);
                  onGenerateSignal({
                    ticker: t,
                    timeframe: selectedTimeframe,
                    riskProfile: selectedRiskProfile,
                    strategy: selectedStrategy
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20'
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

        {/* Studio Controls: Timeframe, Strategy & AI Analysis Trigger */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Timeframe selector */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['5m', '15m', '1h', '1D', '1W'].map(tf => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                    selectedTimeframe === tf 
                      ? 'bg-cyan-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Risk Mode */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['Conservative', 'Moderate', 'Aggressive'].map(r => (
                <button
                  key={r}
                  onClick={() => handleRiskChange(r)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedRiskProfile === r 
                      ? 'bg-emerald-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Scanning Confluences...' : `Re-Analyze ${selectedTicker.symbol}`}</span>
          </button>
        </div>
      </div>

      {/* Portfolio Impact if Owned */}
      {isHolding && currentHolding && currentSignal && (() => {
        const currentTotalVal = currentHolding.quantity * currentSignal.currentPrice;
        const investedVal = currentHolding.purchasePrice * currentHolding.quantity;
        const pnl = currentTotalVal - investedVal;
        const pnlPercent = investedVal > 0 ? ((pnl / investedVal) * 100).toFixed(2) : '0.00';
        const isProfit = pnl >= 0;

        return (
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Active Position in Your Portfolio</span>
              </div>
              <div className="text-sm text-slate-200">
                You hold <strong className="text-white font-mono">{currentHolding.quantity} shares</strong> bought at <strong className="text-white font-mono">{currSymbol}{currentHolding.purchasePrice}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Current Valuation</span>
                <span className="text-white font-bold text-sm">{currSymbol}{currentTotalVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Unrealized P&L</span>
                <span className={`font-extrabold text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfit ? '+' : ''}{currSymbol}{pnl.toFixed(2)} ({isProfit ? '+' : ''}{pnlPercent}%)
                </span>
              </div>
              <button
                onClick={() => onOpenSellModal(currentHolding)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
              >
                Record Sale
              </button>
            </div>
          </div>
        );
      })()}

      {/* Candlestick Chart */}
      {currentSignal && (() => {
        const matchingPrediction = predictions.find(p => p.symbol === currentSignal.symbol) || null;
        return (
          <div className="space-y-6">
            <CandlestickChart
              data={currentSignal.chartData || []}
              symbol={currentSignal.symbol}
              stockName={currentSignal.stockName}
              currency={currentSignal.currency}
              buyZone={currentSignal.buyZone}
              sellZone={isHolding ? currentSignal.sellZone : undefined}
              stopLoss={currentSignal.stopLoss}
              timeframe={selectedTimeframe}
              onTimeframeChange={handleTimeframeChange}
              prediction={matchingPrediction}
              marketStatus={marketStatus}
            />

            {/* Real-Time Candlestick Pattern Recognition Engine Panel */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Automated Candlestick Pattern Recognition Engine
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Multi-Timeframe Scanner Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {detectedPatterns.map((pat, pIdx) => (
                <div key={pIdx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{pat.patternName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {pat.confirmationLevel}% Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {pat.description}
                  </p>
                  <div className="text-[11px] text-emerald-400 font-medium pt-1 border-t border-slate-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 shrink-0" />
                    <span>{pat.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Signal Card */}
          <SignalCard
            signal={currentSignal}
            onOpenCalculatorForSignal={onOpenCalculatorForSignal}
            audioEnabled={audioEnabled}
            isBought={isHolding}
            onMarkAsBought={onMarkAsBought}
            tradingMode={tradingMode}
          />

          {/* Quick Transition to News & Upgrades Page */}
          {onSelectPage && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 flex-shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>Live Google News Sentiment & Upgrades Hub</span>
                    <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Live Feed
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    View real-time headlines across global financial media, institutional catalyst breakdowns, and price target revisions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectPage('news-predictions')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Open News & Predictions</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      );
      })()}
    </div>
  );
};

