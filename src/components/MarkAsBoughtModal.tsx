import React, { useState, useEffect } from 'react';
import { MarketSignal, TradeType } from '../types';
import { DecimalInput } from './DecimalInput';
import { ShoppingBag, X, Check, DollarSign, Tag, Clock, Target, AlertCircle, Zap, CalendarClock } from 'lucide-react';

interface MarkAsBoughtModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: MarketSignal | null;
  capital: number;
  currency: 'INR' | 'USD';
  // Lets a caller (e.g. the Risk Calculator, after computing an exact share
  // count for a chosen risk %) pre-fill this modal with those real numbers
  // instead of always resetting to signal.currentPrice / a flat 10 shares —
  // previously "Log N Shares in Portfolio" from Risk Calculator silently
  // discarded the calculated price and quantity every time.
  initialPrice?: number;
  initialQuantity?: number;
  onConfirmPurchase: (symbol: string, stockName: string, purchasePrice: number, quantity: number, signal: MarketSignal, tradeType: TradeType) => Promise<string | null>;
}

export const MarkAsBoughtModal: React.FC<MarkAsBoughtModalProps> = ({
  isOpen,
  onClose,
  signal,
  capital,
  initialPrice,
  initialQuantity,
  onConfirmPurchase
}) => {
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  // Kept as a string, not a number: a controlled number-input using
  // `parseInt(e.target.value) || 1` snapped to "1" the instant the field was
  // cleared, and then prepended to anything typed next (clear + type "5"
  // produced "15", not "5") — confirmed live. A raw string buffer lets the
  // field go genuinely empty while editing, like DecimalInput already does
  // for the price fields.
  const [quantityInput, setQuantityInput] = useState<string>('10');
  const [tradeType, setTradeType] = useState<TradeType>('DELIVERY');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (signal) {
      setPurchasePrice(initialPrice ?? signal.currentPrice ?? 1000);
      setQuantityInput(String(initialQuantity ?? 10));
      setTradeType('DELIVERY');
      setSubmitError(null);
    }
  }, [signal, initialPrice, initialQuantity]);

  if (!isOpen || !signal) return null;

  const quantity = parseInt(quantityInput, 10) || 0;
  const currencySymbol = signal.currency === 'INR' ? '₹' : '$';
  const totalInvestment = purchasePrice * quantity;
  const exceedsCapital = totalInvestment > capital;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchasePrice <= 0 || quantity <= 0 || exceedsCapital) return;
    setIsSubmitting(true);
    setSubmitError(null);
    // Previously fired-and-forgot: onConfirmPurchase's own errors were only
    // console.error'd, and this modal closed unconditionally regardless of
    // whether the server actually recorded the purchase (e.g. a stale
    // session, or a race against another tab). Now it waits for the real
    // result and stays open with the actual reason on failure.
    const errorMessage = await onConfirmPurchase(signal.symbol, signal.stockName, purchasePrice, quantity, signal, tradeType);
    setIsSubmitting(false);
    if (errorMessage) {
      setSubmitError(errorMessage);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Log Stock Purchase
              </h3>
              <p className="text-xs text-slate-400">
                Reveals target sell zones for this stock
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Selected Stock Banner */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-white">
              {signal.stockName}
            </div>
            <div className="text-xs font-mono text-slate-400">
              {signal.symbol} • {signal.exchange}
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs text-slate-400">Current Market Price</div>
            <div className="text-sm font-bold text-emerald-400">
              {currencySymbol}{signal.currentPrice.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirm} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Your Purchase / Buy Price ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <DecimalInput
                required
                value={purchasePrice}
                onChange={setPurchasePrice}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Suggested Buy Zone: <span className="text-emerald-400 font-mono">{signal.buyZone}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Quantity / Number of Shares
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={quantityInput}
              onChange={(e) => { if (e.target.value === '' || /^\d+$/.test(e.target.value)) setQuantityInput(e.target.value); }}
              onBlur={() => { if (quantityInput === '' || parseInt(quantityInput, 10) <= 0) setQuantityInput('1'); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Trade Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTradeType('DELIVERY')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  tradeType === 'DELIVERY'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Delivery (Interday)</span>
              </button>
              <button
                type="button"
                onClick={() => setTradeType('INTRADAY')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  tradeType === 'INTRADAY'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Intraday</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {tradeType === 'DELIVERY'
                ? 'Held across sessions — you decide when to sell.'
                : 'Meant to be squared off the same session — you can still change this later from Portfolio.'}
            </p>
          </div>

          {/* Investment Summary */}
          <div className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
            exceedsCapital ? 'bg-rose-950/30 border-rose-500/30' : 'bg-emerald-950/30 border-emerald-500/20'
          }`}>
            <span className="text-slate-300">Total Purchase Value:</span>
            <span className={`font-mono font-black text-sm ${exceedsCapital ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currencySymbol}{totalInvestment.toLocaleString()}
            </span>
          </div>

          {exceedsCapital && (
            <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>
                This purchase ({currencySymbol}{totalInvestment.toLocaleString()}) exceeds your available capital ({currencySymbol}{capital.toLocaleString()}). Lower the price or quantity, or add more capital first.
              </span>
            </div>
          )}

          {submitError && (
            <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Informational callout */}
          <div className="text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-lg flex items-start space-x-2">
            <Target className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>
              Once saved, the <strong>Target Selling Zone ({signal.sellZone})</strong> and exit time window will be activated on your workspace!
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={exceedsCapital || purchasePrice <= 0 || quantity <= 0 || isSubmitting}
              className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving…' : 'Confirm & Show Sell Zone'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
