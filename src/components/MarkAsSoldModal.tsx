import React, { useState, useEffect } from 'react';
import { PurchasedHolding, JournalEntry } from '../types';
import { DollarSign, X, Check, TrendingUp, TrendingDown, BookOpen, AlertCircle } from 'lucide-react';

interface MarkAsSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: PurchasedHolding | null;
  onConfirmSale: (entry: JournalEntry) => void;
}

export const MarkAsSoldModal: React.FC<MarkAsSoldModalProps> = ({
  isOpen,
  onClose,
  holding,
  onConfirmSale
}) => {
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (holding) {
      setSellPrice(holding.purchasePrice * 1.02); // default 2% profit target guess or price
      setQuantity(holding.quantity);
    }
  }, [holding]);

  if (!isOpen || !holding) return null;

  const currencySymbol = holding.currency === 'INR' ? '₹' : '$';
  const totalCost = holding.purchasePrice * quantity;
  const totalRevenue = sellPrice * quantity;
  const pnl = totalRevenue - totalCost;
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const isProfit = pnl >= 0;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellPrice <= 0) return;

    const newJournalEntry: JournalEntry = {
      id: `journal-${holding.symbol}-${Date.now()}`,
      symbol: holding.symbol,
      stockName: holding.stockName,
      buyPrice: holding.purchasePrice,
      sellPrice,
      quantity,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      boughtAt: holding.purchaseTime,
      boughtDate: holding.purchaseDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      soldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      soldDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    onConfirmSale(newJournalEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 border rounded-xl ${isProfit ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
              {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Log Trade Exit & Sale
              </h3>
              <p className="text-xs text-slate-400">
                Saves trade results directly into your Trader's Journal
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

        {/* Selected Holding Details */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-white">
              {holding.stockName}
            </div>
            <div className="text-xs font-mono text-slate-400">
              Bought @ {currencySymbol}{holding.purchasePrice.toLocaleString()} • Qty: {holding.quantity}
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-[11px] text-slate-400">Target Sell Zone</div>
            <div className="text-xs font-bold text-cyan-300">
              {holding.sellZone}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirm} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Actual Selling / Exit Price ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                required
                value={sellPrice}
                onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Quantity Sold
            </label>
            <input
              type="number"
              min="1"
              max={holding.quantity}
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Trade P&L Summary */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
            isProfit
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Realized P&L</div>
              <div className="text-sm font-black">
                {isProfit ? '+' : ''}{currencySymbol}{pnl.toLocaleString()} ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Revenue</div>
              <div className="text-xs font-bold text-white">
                {currencySymbol}{totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Informational callout */}
          <div className="text-[11px] text-slate-300 bg-slate-950 border border-slate-800 p-2.5 rounded-lg flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>
              This sale will be recorded in your <strong>Trader's Journal</strong> to track your compounding progress over time.
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
              className="w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Log Exit to Journal</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
