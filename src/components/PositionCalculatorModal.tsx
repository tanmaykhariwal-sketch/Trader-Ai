import React, { useState, useEffect } from 'react';
import { RiskCalculatorInput, RiskCalculatorResult, MarketSignal } from '../types';
import { Calculator, X, ShieldCheck, AlertTriangle, CheckCircle2, DollarSign, IndianRupee } from 'lucide-react';
import { calculatePositionSize } from '../utils/positionSizing';
import { DecimalInput } from './DecimalInput';

interface PositionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  capital: number;
  currency: 'INR' | 'USD';
  initialSignal?: MarketSignal | null;
}

export const PositionCalculatorModal: React.FC<PositionCalculatorModalProps> = ({
  isOpen,
  onClose,
  capital,
  currency,
  initialSignal
}) => {
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [entryPrice, setEntryPrice] = useState<number>(initialSignal?.currentPrice || 2985);
  const [stopLossPrice, setStopLossPrice] = useState<number>(2945);
  const [targetPrice, setTargetPrice] = useState<number>(3065);

  useEffect(() => {
    // Keyed on `isOpen` too, not just `initialSignal`: App.tsx hands this
    // modal the same signal object out of `savedSignals` every time (stable
    // identity), so re-opening the calculator for the SAME stock after
    // editing values didn't re-run this effect at all — confirmed live,
    // edited Entry/SL for RELIANCE, closed, reopened for RELIANCE again, and
    // saw the previous session's edited numbers presented as if they were
    // the signal's real values.
    if (!isOpen || !initialSignal) return;
    setEntryPrice(initialSignal.currentPrice);
    // parse numeric stop loss if possible
    const slMatch = initialSignal.stopLoss.match(/[\d,.]+/);
    if (slMatch) {
      setStopLossPrice(parseFloat(slMatch[0].replace(/,/g, '')));
    }
    // parse numeric target if possible — sellZone is formatted as
    // "T1: ₹1,830 | T2: ₹1,850"; a bare digit-run match would also match
    // the "1" inside the "T1" label itself, so extract by label instead.
    const targetMatch = initialSignal.sellZone.match(/T1:\s*₹?([\d,]+(\.\d+)?)/);
    if (targetMatch) {
      setTargetPrice(parseFloat(targetMatch[1].replace(/,/g, '')));
    }
  }, [initialSignal, isOpen]);

  if (!isOpen) return null;

  // Calculation Logic (shared with RiskCalculatorView via positionSizing.ts)
  const {
    maxRiskAmount,
    positionSizeQty,
    totalPositionValue,
    potentialProfitAmount,
    riskRewardRatio,
    isAcceptableRR,
    isInvertedSetup,
  } = calculatePositionSize({ capital, currency, riskPercentage: riskPercent, entryPrice, stopLossPrice, targetPrice });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Position Sizing & Risk-Reward Calculator
              </h3>
              <p className="text-xs text-slate-400">
                1% - 2% Capital Preservation Rule for Professional Trader Execution
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Account Capital ({currency}):
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-emerald-400 font-bold">
              {currency === 'INR' ? '₹' : '$'}{capital.toLocaleString()}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Risk Per Trade (% of Capital):
            </label>
            <div className="flex items-center space-x-2">
              <DecimalInput
                value={riskPercent}
                // `v || 1` used to treat a legitimately typed 0 as falsy and
                // silently swap in 1, desyncing the displayed "0" from the
                // real state calculatePositionSize used — calculatePositionSize
                // already handles 0% risk cleanly (0 max risk, 0 shares), so
                // there's no need to clamp it away from the user.
                onChange={setRiskPercent}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Entry Price ({currency}):
            </label>
            <DecimalInput
              value={entryPrice}
              onChange={setEntryPrice}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Stop Loss Price ({currency}):
            </label>
            <DecimalInput
              value={stopLossPrice}
              onChange={setStopLossPrice}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-rose-300 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Target Price / Take Profit ({currency}):
            </label>
            <DecimalInput
              value={targetPrice}
              onChange={setTargetPrice}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>

        {isInvertedSetup && (
          <div className="mb-4 bg-rose-950/30 border border-rose-500/40 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-rose-200">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Invalid Setup:</strong> for a long position, Stop Loss must be below Entry, and Entry must be below Target.
            </span>
          </div>
        )}

        {/* Calculated Results Panel */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Execution Output
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 ${
              isAcceptableRR ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isAcceptableRR ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
              R:R Ratio = 1 : {riskRewardRatio} ({isAcceptableRR ? 'Valid Setup' : 'Low R:R'})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Recommended Share Quantity:</span>
              <span className="font-mono text-base font-black text-emerald-400">{positionSizeQty.toLocaleString()} shares / lots</span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Max Risk Amount ({riskPercent}%):</span>
              <span className="font-mono text-base font-black text-rose-400">{currency === 'INR' ? '₹' : '$'}{maxRiskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Position Exposure:</span>
              <span className="font-mono text-xs font-bold text-slate-200">{currency === 'INR' ? '₹' : '$'}{totalPositionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Target Potential Profit:</span>
              <span className="font-mono text-xs font-bold text-cyan-300">+{currency === 'INR' ? '₹' : '$'}{potentialProfitAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Close Calculator
          </button>
        </div>

      </div>
    </div>
  );
};
