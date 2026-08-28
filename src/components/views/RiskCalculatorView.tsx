import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { MarketSignal, MarketTicker } from '../../types';

interface RiskCalculatorViewProps {
  capital: number;
  currency: 'INR' | 'USD';
  signals: MarketSignal[];
  tickers: MarketTicker[];
  onNavigateToStudio: (symbol: string) => void;
  onOpenBuyModal?: (signal: MarketSignal) => void;
}

export const RiskCalculatorView: React.FC<RiskCalculatorViewProps> = ({
  capital,
  currency,
  signals,
  tickers,
  onNavigateToStudio,
  onOpenBuyModal
}) => {
  const [selectedStock, setSelectedStock] = useState<string>(signals[0]?.symbol || 'RELIANCE');
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(1315.60);
  const [stopLossPrice, setStopLossPrice] = useState<number>(1295.00);
  const [targetPrice, setTargetPrice] = useState<number>(1350.00);

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Update inputs when selecting a different stock
  const handleSelectSignal = (sym: string) => {
    setSelectedStock(sym);
    const sig = signals.find(s => s.symbol === sym);
    if (sig) {
      setEntryPrice(sig.currentPrice);
      
      // Parse stop loss
      const slMatch = sig.stopLoss.match(/[\d,]+(\.\d+)?/);
      if (slMatch) {
        setStopLossPrice(parseFloat(slMatch[0].replace(/,/g, '')));
      } else {
        setStopLossPrice(+(sig.currentPrice * 0.985).toFixed(2));
      }

      // Parse target 1
      const t1Match = sig.sellZone.match(/T1:\s*₹?([\d,]+(\.\d+)?)/);
      if (t1Match) {
        setTargetPrice(parseFloat(t1Match[1].replace(/,/g, '')));
      } else {
        setTargetPrice(+(sig.currentPrice * 1.035).toFixed(2));
      }
    }
  };

  // Perform Calculations
  const maxRiskAmount = (capital * (riskPercent / 100));
  const perShareRisk = Math.max(0.1, entryPrice - stopLossPrice);
  const perShareGain = Math.max(0, targetPrice - entryPrice);

  // Position quantity based strictly on max allowable loss
  const calculatedShares = perShareRisk > 0 ? Math.floor(maxRiskAmount / perShareRisk) : 0;
  const totalPositionCost = calculatedShares * entryPrice;
  const totalPotentialProfit = calculatedShares * perShareGain;
  const riskRewardRatio = perShareRisk > 0 ? (perShareGain / perShareRisk).toFixed(2) : '0.00';
  const capitalExposurePercent = capital > 0 ? ((totalPositionCost / capital) * 100).toFixed(1) : '0.0';

  const isHighExposure = totalPositionCost > capital;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <Calculator className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Position Sizing & Risk Workbench</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Institutional Formula
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Calculate exact share quantities so you never risk more than your predefined loss tolerance per trade.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">Total Capital:</span>
          <span className="text-white font-extrabold text-sm">{currSymbol}{capital.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Grid: Inputs vs Real-Time Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Trade Parameters Setup
            </h3>
          </div>

          {/* Quick Select Stock from Active Signals */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Select BSE Asset / Signal Setup
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {signals.slice(0, 6).map(s => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => handleSelectSignal(s.symbol)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all text-center ${
                    selectedStock === s.symbol
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {s.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Percentage per Trade */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Max Portfolio Risk %</label>
              <span className="font-mono text-cyan-400 font-bold">{riskPercent}% of Capital</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1.0, 1.5, 2.0, 3.0].slice(0, 4).map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRiskPercent(pct)}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    riskPercent === pct
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Entry Price */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Planned Entry Price ({currSymbol})
            </label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Stop Loss Price */}
          <div>
            <label className="text-xs font-semibold text-rose-400 block mb-1">
              Protective Stop Loss Price ({currSymbol})
            </label>
            <input
              type="number"
              step="any"
              value={stopLossPrice}
              onChange={e => setStopLossPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-rose-900/60 rounded-xl px-3.5 py-2 text-sm text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-500"
            />
            <span className="text-[10px] text-slate-500 font-mono block mt-1">
              Stop distance: {currSymbol}{perShareRisk.toFixed(2)} ({((perShareRisk / (entryPrice || 1)) * 100).toFixed(1)}%)
            </span>
          </div>

          {/* Target Price */}
          <div>
            <label className="text-xs font-semibold text-emerald-400 block mb-1">
              Advisable Target Sell Price ({currSymbol})
            </label>
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={e => setTargetPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl px-3.5 py-2 text-sm text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 font-mono block mt-1">
              Target gain: {currSymbol}{perShareGain.toFixed(2)} ({((perShareGain / (entryPrice || 1)) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Right Output Results Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Recommendation Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Recommended Position Size
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Risk Controlled
              </span>
            </div>

            {/* Huge Shares Callout */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase block">Buy Exactly</span>
                <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-baseline space-x-2">
                  <span className="text-emerald-400">{calculatedShares.toLocaleString()}</span>
                  <span className="text-base text-slate-400 font-normal">Shares</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  for <strong className="text-white font-mono">{selectedStock}</strong> @ {currSymbol}{entryPrice}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono uppercase block">Total Capital Outlay</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {currSymbol}{totalPositionCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {capitalExposurePercent}% of your account
                </div>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Max Risk */}
              <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl">
                <div className="text-[11px] font-bold text-rose-300 uppercase font-mono">Max Risk at SL</div>
                <div className="font-mono text-lg font-black text-rose-400 mt-0.5">
                  -{currSymbol}{maxRiskAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Exact {riskPercent}% portfolio risk
                </div>
              </div>

              {/* Potential Profit */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-300 uppercase font-mono">Potential Profit</div>
                <div className="font-mono text-lg font-black text-emerald-400 mt-0.5">
                  +{currSymbol}{totalPotentialProfit.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  At target {currSymbol}{targetPrice}
                </div>
              </div>

              {/* Risk Reward Ratio */}
              <div className="bg-cyan-950/20 border border-cyan-500/30 p-3.5 rounded-xl">
                <div className="text-[11px] font-bold text-cyan-300 uppercase font-mono">Risk : Reward</div>
                <div className="font-mono text-lg font-black text-cyan-400 mt-0.5">
                  1 : {riskRewardRatio}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {parseFloat(riskRewardRatio) >= 2.0 ? '🔥 High Quality Ratio' : 'Acceptable Ratio'}
                </div>
              </div>
            </div>

            {/* High Exposure Warning if applicable */}
            {isHighExposure && (
              <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>High Capital Allocation:</strong> This position requires {currSymbol}{totalPositionCost.toLocaleString()}, which exceeds your total capital of {currSymbol}{capital.toLocaleString()}. Consider lowering risk percentage or trading with delivery margin.
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => onNavigateToStudio(selectedStock)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 font-bold text-xs transition-all text-center"
              >
                Inspect {selectedStock} Candlestick Chart
              </button>

              {onOpenBuyModal && (() => {
                const activeSig = signals.find(s => s.symbol === selectedStock) || signals[0];
                return (
                  <button
                    onClick={() => onOpenBuyModal(activeSig)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Log {calculatedShares} Shares in Portfolio</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
