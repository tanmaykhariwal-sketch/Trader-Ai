import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Zap,
  Globe,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { MarketTicker, MarketSignal, TradingMode, AppPage, CandlestickPatternDetection, StockPrediction } from '../../types';
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
  onOpenCalculatorForSignal: (signal: MarketSignal) => void;
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
  onOpenCalculatorForSignal,
  currency,
  tradingMode = 'simple',
  onSelectPage,
  predictions = [],
  marketStatus = 'CLOSED'
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [selectedRiskProfile, setSelectedRiskProfile] = useState('Moderate');
  const [selectedStrategy, setSelectedStrategy] = useState('AI Adaptive Momentum');
  const [detectedPatterns, setDetectedPatterns] = useState<CandlestickPatternDetection[]>([]);
  const [isScanningPatterns, setIsScanningPatterns] = useState<boolean>(false);

  const isAdvanced = tradingMode === 'advanced';

  // Run Candlestick Pattern Detection Scanner when chart data or timeframe changes
  useEffect(() => {
    // Same class of bug as the timeframe-selection race in App.tsx's
    // handleGenerateSignal: clicking timeframes quickly fires overlapping
    // scanner requests here too, and with no guard the response that happens
    // to land last wins regardless of which chartData it was actually for —
    // showing patterns detected on a chart the user has already switched
    // away from. `cancelled` makes a stale response's result a no-op instead.
    let cancelled = false;

    // Institutional pattern-recognition is a Pro-mode feature (per the
    // Sidebar's Simple/Pro toggle) — skip the fetch entirely in Simple mode
    // instead of running it and just hiding the panel.
    if (isAdvanced && currentSignal?.chartData && currentSignal.chartData.length > 0) {
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
          if (cancelled) return;
          if (data.success && Array.isArray(data.patternsDetected)) {
            setDetectedPatterns(data.patternsDetected);
          }
        })
        .catch(err => { if (!cancelled) console.warn('Pattern scanner error:', err); })
        .finally(() => { if (!cancelled) setIsScanningPatterns(false); });
    }

    return () => { cancelled = true; };
  }, [isAdvanced, currentSignal?.chartData, selectedTicker.symbol, selectedTimeframe]);

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
                  Yahoo Finance (Unofficial)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAdvanced
                  ? 'Institutional candlestick pattern recognition, multi-timeframe moving averages, and news sentiment confluence.'
                  : 'Live charts and AI-generated buy zones for this stock.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Ticker Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
          {tickers.map(t => {
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
              sellZone={currentSignal.sellZone}
              stopLoss={currentSignal.stopLoss}
              timeframe={selectedTimeframe}
              onTimeframeChange={handleTimeframeChange}
              prediction={matchingPrediction}
              marketStatus={marketStatus}
            />

            {/* Real-Time Candlestick Pattern Recognition Engine Panel — Pro-mode only */}
          {isAdvanced && (
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
          )}

          {/* Actionable Signal Card */}
          <SignalCard
            signal={currentSignal}
            onOpenCalculatorForSignal={onOpenCalculatorForSignal}
            audioEnabled={audioEnabled}
            onViewFullAnalysis={() => onSelectPage?.('advanced-analytics')}
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

