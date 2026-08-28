import React, { useState, useEffect } from 'react';
import { MarketSignal } from '../types';
import { ShoppingBag, X, Check, DollarSign, Tag, Clock, Target, AlertCircle } from 'lucide-react';

interface MarkAsBoughtModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: MarketSignal | null;
  onConfirmPurchase: (symbol: string, stockName: string, purchasePrice: number, quantity: number, signal: MarketSignal) => void;
}

export const MarkAsBoughtModal: React.FC<MarkAsBoughtModalProps> = ({
  isOpen,
  onClose,
  signal,
  onConfirmPurchase
}) => {
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(10);

  useEffect(() => {
    if (signal) {
      setPurchasePrice(signal.currentPrice || 1000);
      setQuantity(10);
    }
  }, [signal]);

  if (!isOpen || !signal) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchasePrice <= 0) return;
    onConfirmPurchase(signal.symbol, signal.stockName, purchasePrice, quantity, signal);
    onClose();
  };

  const currencySymbol = signal.currency === 'INR' ? '₹' : '$';
  const totalInvestment = purchasePrice * quantity;

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
              <input
                type="number"
                step="any"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
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
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Investment Summary */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300">Total Purchase Value:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              {currencySymbol}{totalInvestment.toLocaleString()}
            </span>
          </div>

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
              className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Confirm & Show Sell Zone</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
