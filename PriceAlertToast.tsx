import React, { useEffect, useRef } from 'react';
import { Target, ShieldAlert, X, TrendingUp, TrendingDown, ArrowRight, BellRing, CheckCheck, Clock } from 'lucide-react';
import { PriceAlert } from '../types';

interface PriceAlertToastProps {
  alerts: PriceAlert[];
  onDismissAlert: (id: string) => void;
  onDismissAll: () => void;
  onSellHoldingByAlert: (alert: PriceAlert) => void;
  audioEnabled?: boolean;
}

interface SingleAlertProps {
  alert: PriceAlert;
  onDismissAlert: (id: string) => void;
  onSellHoldingByAlert: (alert: PriceAlert) => void;
}

const SingleAlertCard: React.FC<SingleAlertProps> = ({ alert, onDismissAlert, onSellHoldingByAlert }) => {
  const onDismissRef = useRef(onDismissAlert);
  useEffect(() => {
    onDismissRef.current = onDismissAlert;
  });

  // Auto-dismiss alert strictly after 10 seconds (10,000 ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismissRef.current(alert.id);
    }, 10000);
    return () => clearTimeout(timer);
  }, [alert.id]);

  const isTarget = alert.alertType === 'TARGET_MET';
  const currSym = alert.currency === 'INR' ? '₹' : '$';
  const pnl = (alert.triggerPrice - alert.purchasePrice) * alert.quantity;
  const pnlPercent = ((alert.triggerPrice - alert.purchasePrice) / alert.purchasePrice) * 100;

  return (
    <div
      className={`p-4 rounded-2xl shadow-2xl backdrop-blur-2xl border-2 transition-all relative overflow-hidden ${
        isTarget
          ? 'bg-slate-900/95 border-emerald-500/80 shadow-emerald-500/20 text-slate-100'
          : 'bg-slate-900/95 border-rose-500/80 shadow-rose-500/20 text-slate-100'
      }`}
    >
      {/* Top ambient accent glow bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isTarget ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'
        }`}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 ${
              isTarget ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {isTarget ? <Target className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black text-white">{alert.stockName}</span>
              <span className="text-xs font-mono font-bold text-slate-400">({alert.symbol})</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span
                className={`inline-block text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono ${
                  isTarget
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {isTarget ? '🎯 Target Price Reached!' : '⚠️ Stop-Loss Triggered'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>Auto-dismissing (10s)</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onDismissAlert(alert.id)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Dismiss Alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Alert Details Body */}
      <div className="mt-3 bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-300">
          <span>Current Market Price:</span>
          <strong className="text-white text-sm">{currSym}{alert.triggerPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </div>

        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>{isTarget ? 'Target Threshold:' : 'Stop-Loss Limit:'}</span>
          <span className={isTarget ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {currSym}{alert.targetOrSlPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-xs">
          <span className="text-slate-400">Position Return P&L:</span>
          <span
            className={`font-black flex items-center space-x-1 ${
              pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {pnl >= 0 ? <TrendingUp className="h-3.5 w-3.5 inline" /> : <TrendingDown className="h-3.5 w-3.5 inline" />}
            <span>
              {pnl >= 0 ? '+' : ''}{currSym}{pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
            </span>
          </span>
        </div>
      </div>

      {/* Actions: Book Sale / Sell Position */}
      <div className="mt-3 flex items-center space-x-2">
        <button
          onClick={() => onSellHoldingByAlert(alert)}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md ${
            isTarget
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/20'
          }`}
        >
          <span>Book Trade Now (Return Capital)</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => onDismissAlert(alert.id)}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
        >
          Dismiss
        </button>
      </div>

      {/* 10-second countdown progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
        <div className="h-full bg-amber-400/80 animate-[shrink_10s_linear_forwards] origin-left" style={{ animation: 'shrink 10s linear forwards' }} />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export const PriceAlertToast: React.FC<PriceAlertToastProps> = ({
  alerts,
  onDismissAlert,
  onDismissAll,
  onSellHoldingByAlert,
  audioEnabled = true
}) => {
  // Play Web Audio API sound chime on new alert
  useEffect(() => {
    if (alerts.length > 0 && audioEnabled) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          const isTarget = alerts[0].alertType === 'TARGET_MET';
          osc.type = isTarget ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(isTarget ? 587.33 : 329.63, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(isTarget ? 880 : 220, ctx.currentTime + 0.3);

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch (e) {
        // Audio context fallback ignore
      }
    }
  }, [alerts.length, audioEnabled]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[110] max-w-sm sm:max-w-md w-full space-y-3 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2 text-xs font-black text-amber-400 uppercase tracking-wider font-mono">
          <BellRing className="h-4 w-4 text-amber-400 animate-bounce" />
          <span>Real-Time Price Alerts ({alerts.length})</span>
        </div>
        {alerts.length > 1 && (
          <button
            onClick={onDismissAll}
            className="text-[10px] text-slate-400 hover:text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 transition-colors flex items-center space-x-1"
          >
            <CheckCheck className="h-3 w-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {alerts.map((alert) => (
        <SingleAlertCard
          key={alert.id}
          alert={alert}
          onDismissAlert={onDismissAlert}
          onSellHoldingByAlert={onSellHoldingByAlert}
        />
      ))}
    </div>
  );
};

