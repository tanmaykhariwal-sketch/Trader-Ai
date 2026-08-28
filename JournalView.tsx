import React, { useState } from 'react';
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Trash2, 
  Plus, 
  Calendar, 
  Tag, 
  Search, 
  CheckCircle2, 
  FileSpreadsheet, 
  DollarSign,
  Percent,
  Award,
  AlertCircle
} from 'lucide-react';
import { JournalEntry, PurchasedHolding } from '../../types';

interface JournalViewProps {
  journalEntries: JournalEntry[];
  purchasedHoldings: PurchasedHolding[];
  capital: number;
  currency: 'INR' | 'USD';
  onAddManualEntry?: (entry: JournalEntry) => void;
  onClearJournal?: () => void;
  onSellHolding: (holding: PurchasedHolding) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  journalEntries,
  purchasedHoldings,
  capital,
  currency,
  onAddManualEntry,
  onClearJournal,
  onSellHolding
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PROFITS' | 'LOSSES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual entry form state
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualStockName, setManualStockName] = useState('');
  const [manualBuyPrice, setManualBuyPrice] = useState('');
  const [manualSellPrice, setManualSellPrice] = useState('');
  const [manualQty, setManualQty] = useState('');

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Statistics calculation
  const totalTrades = journalEntries.length;
  const profitableTrades = journalEntries.filter(e => e.pnl > 0);
  const lossTrades = journalEntries.filter(e => e.pnl < 0);
  const profitRate = totalTrades > 0 ? ((profitableTrades.length / totalTrades) * 100).toFixed(1) : '0.0';

  const totalRealizedPnL = journalEntries.reduce((sum, e) => sum + e.pnl, 0);
  const totalGains = profitableTrades.reduce((sum, e) => sum + e.pnl, 0);
  const totalLosses = Math.abs(lossTrades.reduce((sum, e) => sum + e.pnl, 0));
  const profitFactor = totalLosses > 0 ? (totalGains / totalLosses).toFixed(2) : totalGains > 0 ? 'Max' : '0.00';

  // Filtered entries
  const filteredEntries = journalEntries.filter(entry => {
    if (filter === 'PROFITS' && entry.pnl <= 0) return false;
    if (filter === 'LOSSES' && entry.pnl >= 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return entry.symbol.toLowerCase().includes(q) || entry.stockName.toLowerCase().includes(q);
    }
    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (journalEntries.length === 0) return;

    const headers = ['Symbol', 'Stock Name', 'Buy Price', 'Sell Price', 'Quantity', 'P&L (INR)', 'P&L (%)', 'Sold Date', 'Sold Time'];
    const rows = journalEntries.map(e => [
      e.symbol,
      `"${e.stockName}"`,
      e.buyPrice,
      e.sellPrice,
      e.quantity,
      e.pnl,
      e.pnlPercent,
      e.soldDate || new Date().toISOString().split('T')[0],
      e.soldAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TraderAI_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const buy = parseFloat(manualBuyPrice);
    const sell = parseFloat(manualSellPrice);
    const qty = parseInt(manualQty);

    if (manualSymbol && !isNaN(buy) && !isNaN(sell) && !isNaN(qty) && qty > 0 && onAddManualEntry) {
      const pnl = (sell - buy) * qty;
      const pnlPercent = ((sell - buy) / buy) * 100;

      const newEntry: JournalEntry = {
        id: 'manual-' + Date.now(),
        symbol: manualSymbol.toUpperCase(),
        stockName: manualStockName || manualSymbol.toUpperCase(),
        buyPrice: buy,
        sellPrice: sell,
        quantity: qty,
        pnl: +pnl.toFixed(2),
        pnlPercent: +pnlPercent.toFixed(2),
        soldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        soldDate: new Date().toLocaleDateString()
      };

      onAddManualEntry(newEntry);
      setShowAddModal(false);
      setManualSymbol('');
      setManualStockName('');
      setManualBuyPrice('');
      setManualSellPrice('');
      setManualQty('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
            <BookOpen className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Trader's Ledger & Performance Journal</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {totalTrades} Trades Logged
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Track win rates, historical profit factors, discipline consistency, and export trade audits.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {journalEntries.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          )}

          {onAddManualEntry && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Log Past Trade</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Performance Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Net Realized P&L */}
        <div className={`p-4 rounded-2xl border shadow-md ${
          totalRealizedPnL >= 0 
            ? 'bg-emerald-950/20 border-emerald-500/30' 
            : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Realized P&L
          </div>
          <div className={`font-mono text-xl sm:text-2xl font-black flex items-center space-x-1.5 ${
            totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {totalRealizedPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <span>{totalRealizedPnL >= 0 ? '+' : ''}{currSymbol}{totalRealizedPnL.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            Across {totalTrades} closed trading cycles
          </div>
        </div>

        {/* Profit Rate & Ratio */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Historical Profit Rate
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
            <span>{profitRate}%</span>
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            {profitableTrades.length} Profits / {lossTrades.length} Losses
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Profit Factor
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-cyan-400">
            {profitFactor}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            {currSymbol}{totalGains.toFixed(0)} Profits vs {currSymbol}{totalLosses.toFixed(0)} Losses
          </div>
        </div>

        {/* Open Positions Pending */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Active Open Positions
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-amber-400">
            {purchasedHoldings.length}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            Awaiting target sell execution
          </div>
        </div>
      </div>

      {/* Active Holdings Ready for Exit */}
      {purchasedHoldings.length > 0 && (
        <div className="bg-amber-950/15 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="h-4 w-4" />
              <span>Unclosed Portfolio Holdings (Ready to Log Sale)</span>
            </div>
            <span className="text-[11px] font-mono text-amber-300">
              {purchasedHoldings.length} active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {purchasedHoldings.map(h => (
              <div key={h.id} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-white">{h.stockName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {h.quantity} shares @ {currSymbol}{h.purchasePrice}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                    Target: {h.sellZone}
                  </div>
                </div>
                <button
                  onClick={() => onSellHolding(h)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Sell
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-1.5 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'ALL'
                ? 'bg-indigo-500 text-white font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Trades ({totalTrades})
          </button>
          <button
            onClick={() => setFilter('PROFITS')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'PROFITS'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Profits ({profitableTrades.length})
          </button>
          <button
            onClick={() => setFilter('LOSSES')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'LOSSES'
                ? 'bg-rose-500 text-white font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Losses ({lossTrades.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol or stock..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Trades Table / List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-slate-900/90 border border-dashed border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-white">No Closed Trades Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {journalEntries.length === 0 
              ? 'When you sell active positions or hit target zones, records automatically log here with detailed return metrics.'
              : 'No entries match your selected filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Stock / Symbol</th>
                  <th className="py-3 px-4">Buy Price</th>
                  <th className="py-3 px-4">Sell Price</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Realized P&L</th>
                  <th className="py-3 px-4">Return %</th>
                  <th className="py-3 px-4 text-right">Execution Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredEntries.map((entry) => {
                  const isProfit = entry.pnl >= 0;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white font-sans">{entry.stockName}</div>
                        <div className="text-[10px] text-slate-400">{entry.symbol}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {currSymbol}{entry.buyPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-bold">
                        {currSymbol}{entry.sellPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {entry.quantity}
                      </td>
                      <td className="py-3.5 px-4 font-black text-sm">
                        <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isProfit ? '+' : ''}{currSymbol}{entry.pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          isProfit 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {isProfit ? '+' : ''}{entry.pnlPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                        {entry.soldDate || 'Today'} • {entry.soldAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Log Past Historical Trade</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Stock Symbol (e.g. RELIANCE, TCS)</label>
                <input
                  type="text"
                  required
                  value={manualSymbol}
                  onChange={e => setManualSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase font-mono"
                  placeholder="RELIANCE"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Company Name</label>
                <input
                  type="text"
                  value={manualStockName}
                  onChange={e => setManualStockName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  placeholder="Reliance Industries"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Buy Price ({currSymbol})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={manualBuyPrice}
                    onChange={e => setManualBuyPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="1300.00"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Sell Price ({currSymbol})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={manualSellPrice}
                    onChange={e => setManualSellPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="1340.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Quantity of Shares</label>
                <input
                  type="number"
                  required
                  value={manualQty}
                  onChange={e => setManualQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="50"
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
