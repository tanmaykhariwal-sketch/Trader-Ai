import React, { useState } from 'react';
import { MarketTicker, MarketRegion } from '../types';
import { TrendingUp, TrendingDown, Flame, Search, Radio, Sparkles, Lock, Clock } from 'lucide-react';
import { BseMarketStatus } from '../utils/marketHours';

interface MarketTickerBarProps {
  tickers: MarketTicker[];
  selectedSymbol?: string | null;
  onSelectTicker: (ticker: MarketTicker) => void;
  onSearchCustom: (symbol: string) => void;
  lastUpdatedTime?: string;
  isLiveFeedActive?: boolean;
  priceFlashMap?: Record<string, 'up' | 'down'>;
  bseStatus?: BseMarketStatus;
  marketStatus?: BseMarketStatus;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({
  tickers,
  selectedSymbol,
  onSelectTicker,
  onSearchCustom,
  lastUpdatedTime,
  isLiveFeedActive = true,
  priceFlashMap = {},
  bseStatus,
  marketStatus
}) => {
  const [activeRegionFilter, setActiveRegionFilter] = useState<MarketRegion | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');

  const currentBse = bseStatus || marketStatus;
  const isMarketOpen = currentBse?.isOpen ?? false;

  const filteredTickers = tickers.filter(t => {
    if (activeRegionFilter !== 'ALL' && t.region !== activeRegionFilter) return false;
    return true;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchCustom(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 py-2.5 px-3 sm:px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        
        {/* BSE Market Watch Label & Trading Status */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-2.5 sm:px-3 py-1 rounded-lg">
            <span className="text-base">🇮🇳</span>
            <span className="text-xs font-black text-white uppercase tracking-wider">
              BSE Session Watch
            </span>

            {/* Dynamic Market Hours Indicator */}
            {currentBse?.isHoliday ? (
              <div className="flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                <Lock className="h-2.5 w-2.5 text-amber-400" />
                <span>MARKET HOLIDAY • {currentBse.holidayName || 'EXCHANGE HOLIDAY'}</span>
                <span className="text-amber-400/80 text-[9px]">• Rates Frozen</span>
              </div>
            ) : isMarketOpen ? (
              <div className="flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>MARKET OPEN • LIVE FEED</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                <Lock className="h-2.5 w-2.5 text-rose-400" />
                <span>MARKET CLOSED (3:30 PM IST)</span>
                <span className="text-slate-400 text-[9px]">• Rates Frozen</span>
              </div>
            )}
          </div>

          {/* Real-time IST Clock Timestamp */}
          {currentBse && (
            <div className="text-[11px] font-mono bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-lg flex items-center space-x-1.5">
              <Clock className="h-3 w-3 text-slate-400" />
              <span className="text-slate-400">IST:</span>
              <span className="text-white font-bold">{currentBse.istTimeFormatted}</span>
              <span className="text-slate-500 text-[10px]">({currentBse.nextSessionLabel})</span>
            </div>
          )}
        </div>

        {/* Quick Ticker Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-shrink-0 w-full sm:w-auto">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search BSE stock (e.g. RELIANCE, TCS)..."
            className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-16 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 w-full sm:w-72 transition-all"
          />
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

      </div>

      {/* Ticker Tape Cards */}
      <div className="max-w-7xl mx-auto mt-2 flex items-center space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent py-1">
        {filteredTickers.map((t) => {
          const isSelected = selectedSymbol === t.symbol;
          const isUp = t.change >= 0;
          const flashState = isMarketOpen ? priceFlashMap[t.symbol] : undefined;

          let flashBg = '';
          if (flashState === 'up') flashBg = 'bg-emerald-950/60 border-emerald-400 shadow-md shadow-emerald-500/20';
          else if (flashState === 'down') flashBg = 'bg-rose-950/60 border-rose-400 shadow-md shadow-rose-500/20';

          return (
            <button
              key={t.symbol}
              onClick={() => onSelectTicker(t)}
              title={isSelected ? `${t.name} selected. Click to inspect chart in Studio` : `Click to inspect ${t.name} (${!isMarketOpen ? 'Frozen Close' : 'Live'}: ₹${t.lastPrice.toLocaleString()})`}
              className={`flex-shrink-0 flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border text-xs transition-all duration-300 cursor-pointer ${
                flashBg || (
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/40 text-cyan-200 shadow-lg shadow-cyan-500/10 font-bold'
                    : 'bg-slate-900/80 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                )
              }`}
            >
              <div className="text-left">
                <div className="flex items-center space-x-1 font-bold">
                  <span>{t.symbol}</span>
                  {t.isPopular && <Flame className="h-3 w-3 text-amber-400 fill-amber-400" />}
                  {isSelected && <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded border border-cyan-500/30">ACTIVE</span>}
                </div>
                <div className={`text-[11px] font-mono font-bold transition-colors ${
                  flashState === 'up' ? 'text-emerald-300' : flashState === 'down' ? 'text-rose-300' : 'text-slate-300'
                }`}>
                  ₹{t.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className={`text-[10px] font-mono font-bold flex items-center space-x-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{isUp ? '+' : ''}{t.changePercent.toFixed(2)}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
