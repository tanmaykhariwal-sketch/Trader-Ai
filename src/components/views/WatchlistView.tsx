import React, { useState, useMemo } from 'react';
import { 
  Star, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Briefcase, 
  Eye, 
  Activity, 
  Check, 
  ShoppingBag,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { MarketTicker, MarketSignal, PurchasedHolding, AppPage } from '../../types';

interface WatchlistViewProps {
  watchlistSymbols: string[];
  onToggleWatchlist: (symbol: string) => void;
  tickers: MarketTicker[];
  signals: MarketSignal[];
  purchasedHoldings: PurchasedHolding[];
  currency: 'INR' | 'USD';
  onNavigateToStudio: (symbol: string) => void;
  onMarkAsBought: (signal: MarketSignal) => void;
  onSelectPage?: (page: AppPage) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlistSymbols = [],
  onToggleWatchlist,
  tickers = [],
  signals = [],
  purchasedHoldings = [],
  currency,
  onNavigateToStudio,
  onMarkAsBought,
  onSelectPage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'NOT_HOLDING' | 'GAINERS' | 'LOSERS'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [tickerAddQuery, setTickerAddQuery] = useState('');

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Set of symbols currently in portfolio holdings
  const holdingSymbolsSet = useMemo(() => {
    return new Set(purchasedHoldings.map(h => h.symbol));
  }, [purchasedHoldings]);

  // Combine ticker data for watchlisted items
  const watchlistedItems = useMemo(() => {
    return watchlistSymbols.map(symbol => {
      const ticker = tickers.find(t => t.symbol === symbol) || {
        symbol,
        name: symbol,
        region: 'NSE_BSE' as const,
        exchange: 'BSE' as const,
        lastPrice: 0,
        change: 0,
        changePercent: 0,
        currency: 'INR' as const,
        volume: '0',
        dayHigh: 0,
        dayLow: 0
      };

      const signal = signals.find(s => s.symbol === symbol);
      const isHolding = holdingSymbolsSet.has(symbol);
      const holding = purchasedHoldings.find(h => h.symbol === symbol);

      return {
        ...ticker,
        signal,
        isHolding,
        holding
      };
    });
  }, [watchlistSymbols, tickers, signals, holdingSymbolsSet, purchasedHoldings]);

  // Filter items
  const filteredItems = useMemo(() => {
    return watchlistedItems.filter(item => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSym = item.symbol.toLowerCase().includes(q);
        if (!matchName && !matchSym) return false;
      }

      // Filter tabs
      if (filterMode === 'NOT_HOLDING') return !item.isHolding;
      if (filterMode === 'GAINERS') return item.change >= 0;
      if (filterMode === 'LOSERS') return item.change < 0;

      return true;
    });
  }, [watchlistedItems, searchQuery, filterMode]);

  // Available tickers not yet in watchlist
  const availableToAdd = useMemo(() => {
    const watchSet = new Set(watchlistSymbols);
    return tickers.filter(t => {
      if (watchSet.has(t.symbol)) return false;
      if (tickerAddQuery.trim()) {
        const q = tickerAddQuery.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tickers, watchlistSymbols, tickerAddQuery]);

  const notHoldingCount = watchlistedItems.filter(i => !i.isHolding).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shadow-md shadow-amber-500/10">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Personal Stock Watchlist
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {watchlistSymbols.length} Bookmarked
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Track live real-time price action and opportunities for stocks you are monitoring before entering positions.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Stock to Watchlist</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Monitored</span>
            <span className="text-base font-bold font-mono text-white mt-0.5 block">{watchlistSymbols.length} Tickers</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Not Currently Held</span>
            <span className="text-base font-bold font-mono text-amber-300 mt-0.5 block">{notHoldingCount} Potential Trades</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">In Portfolio</span>
            <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
              {watchlistedItems.length - notHoldingCount} Active Positions
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Exchange</span>
            <span className="text-base font-bold font-mono text-cyan-400 mt-0.5 block">BSE India</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarked stocks..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'ALL', label: `All (${watchlistedItems.length})` },
            { id: 'NOT_HOLDING', label: `Watching / Not Held (${notHoldingCount})` },
            { id: 'GAINERS', label: 'Gainers 🟢' },
            { id: 'LOSERS', label: 'Losers 🔴' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Watchlist Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/90 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Star className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">
              {watchlistSymbols.length === 0 ? 'Your Watchlist is Empty' : 'No Stocks Match This Filter'}
            </h3>
            <p className="text-xs text-slate-400">
              {watchlistSymbols.length === 0
                ? 'Bookmark tickers from the Market Hub, Stock Studio, or click below to start tracking price action for stocks you want to buy.'
                : 'Try adjusting your search query or reset the filter to view all bookmarked stocks.'}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Browse BSE Tickers to Add</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const isPositive = item.change >= 0;
            const priceSpread = item.dayHigh > item.dayLow ? item.dayHigh - item.dayLow : 1;
            const currentPositionInDay = Math.min(
              100,
              Math.max(0, ((item.lastPrice - item.dayLow) / priceSpread) * 100)
            );

            return (
              <div
                key={item.symbol}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4.5 shadow-xl transition-all space-y-3.5 group relative"
              >
                {/* Card Top: Symbol, Status Badge & Un-star button */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-white text-base group-hover:text-amber-300 transition-colors">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.exchange}
                      </span>
                      {item.isHolding ? (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                          <Briefcase className="h-2.5 w-2.5" />
                          <span>In Portfolio</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Watching
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                      {item.name}
                    </div>
                  </div>

                  {/* Bookmark Star Toggle */}
                  <button
                    onClick={() => onToggleWatchlist(item.symbol)}
                    className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors border border-amber-500/30"
                    title="Remove from Watchlist"
                  >
                    <Star className="h-4 w-4 fill-amber-400" />
                  </button>
                </div>

                {/* Price & Change Block */}
                <div className="flex items-baseline justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Last Traded Price</div>
                    <div className="font-mono text-lg font-black text-white">
                      {currSymbol}{item.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-mono text-xs font-black flex items-center justify-end space-x-0.5 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      <span>{isPositive ? '+' : ''}{item.change.toFixed(2)} ({isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Vol: {item.volume}
                    </div>
                  </div>
                </div>

                {/* Day Range Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>L: {currSymbol}{item.dayLow.toLocaleString()}</span>
                    <span className="text-slate-500">Day Range</span>
                    <span>H: {currSymbol}{item.dayHigh.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${currentPositionInDay}%` }}
                    />
                  </div>
                </div>

                {/* Signal Insight if available */}
                {item.signal && (
                  <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-400">
                        {item.signal.signalType}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        {item.signal.confidenceScore}% Score
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      Buy Range: <strong className="text-emerald-300">{item.signal.buyZone}</strong>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => onNavigateToStudio(item.symbol)}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    <span>View Chart</span>
                  </button>

                  {item.isHolding ? (
                    <button
                      onClick={() => onSelectPage && onSelectPage('portfolio')}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>In Portfolio</span>
                    </button>
                  ) : item.signal ? (
                    <button
                      onClick={() => onMarkAsBought(item.signal!)}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Buy Stock</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigateToStudio(item.symbol)}
                      className="py-1.5 px-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Stock to Watchlist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                <h3 className="text-sm font-bold text-white">Add Ticker to Watchlist</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Search within available */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={tickerAddQuery}
                onChange={(e) => setTickerAddQuery(e.target.value)}
                placeholder="Search by BSE symbol or company name (e.g. INFY, TCS)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>

            {/* Available tickers list */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {availableToAdd.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No additional tickers available to add.
                </div>
              ) : (
                availableToAdd.map(t => (
                  <div
                    key={t.symbol}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-white text-xs">{t.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({t.exchange})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{t.name}</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right font-mono text-xs">
                        <div className="text-white font-bold">{currSymbol}{t.lastPrice.toLocaleString()}</div>
                        <div className={t.change >= 0 ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
                          {t.change >= 0 ? '+' : ''}{t.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onToggleWatchlist(t.symbol);
                        }}
                        className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold transition-all border border-amber-500/40 cursor-pointer"
                        title="Add to Watchlist"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
