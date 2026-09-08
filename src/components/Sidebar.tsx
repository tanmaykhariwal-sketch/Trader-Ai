import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calculator,
  Clock,
  CandlestickChart,
  Volume2,
  VolumeX,
  Menu,
  X,
  ChevronRight,
  Cpu,
  Star,
  Globe,
  HelpCircle,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { AppPage, TradingMode } from '../types';

interface SidebarProps {
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  watchlistCount?: number;
  totalSignalsCount: number;
  istTime: string;
  tradingMode?: TradingMode;
  onToggleTradingMode?: () => void;
  isMarketOpen?: boolean;
  onRefreshRates?: () => void;
  isRefreshingRates?: boolean;
  refreshRatesError?: string | null;
  userEmail?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  audioEnabled,
  onToggleAudio,
  watchlistCount = 0,
  totalSignalsCount,
  istTime,
  tradingMode = 'simple',
  onToggleTradingMode,
  isMarketOpen = false,
  onRefreshRates,
  isRefreshingRates = false,
  refreshRatesError,
  userEmail,
  onLogout
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: { id: AppPage; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number; badgeColor?: string; description: string }[] = [
    {
      id: 'market-hub',
      label: 'Market Hub',
      icon: BarChart3,
      badge: totalSignalsCount > 0 ? `${totalSignalsCount} Hot` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Live BSE Signals & Opportunities'
    },
    {
      id: 'news-predictions',
      label: 'News & AI Upgrades',
      icon: Globe,
      badge: 'Live Sentiment',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      description: 'Global News Feed & Stock Forecasts'
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: Star,
      badge: watchlistCount > 0 ? `${watchlistCount} Saved` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Bookmarked & Tracked Tickers'
    },
    {
      id: 'stock-studio',
      label: 'Stock Studio',
      icon: TrendingUp,
      badge: 'AI Active',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      description: 'Charts & AI Trade Levels'
    },
    {
      id: 'advanced-analytics',
      label: 'Advanced Data',
      icon: Cpu,
      badge: 'Pro Matrix',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Institutional Confluence & SMC'
    },
    {
      id: 'risk-calculator',
      label: 'Risk & Sizing',
      icon: Calculator,
      description: 'Position Sizer & Risk:Reward'
    },
    {
      id: 'market-clocks',
      label: 'Market Hours',
      icon: Clock,
      description: 'BSE Session & World Exchanges'
    },
    {
      id: 'support',
      label: 'Support & Help',
      icon: HelpCircle,
      description: 'Direct Contact & Trading FAQs'
    }
  ];

  const handleNavClick = (pageId: AppPage) => {
    onSelectPage(pageId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE TOP BAR */}
      {/* ========================================================================= */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-3 py-3 flex items-center justify-between gap-1.5">
        <div className="flex items-center space-x-1.5 min-w-0">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer flex-shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-500/20 flex-shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <CandlestickChart className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          </div>

          {/* IST clock + manual rate-only refresh, next to the logo */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg pl-2 pr-1 py-1 flex-shrink-0">
            <span className="font-mono text-xs text-emerald-300 font-bold tracking-wide tabular-nums" title="Current IST time">
              {istTime || '--:--'}
            </span>
            {onRefreshRates && (
              <button
                type="button"
                onClick={onRefreshRates}
                disabled={isRefreshingRates}
                className={`p-1 rounded-md hover:bg-slate-800 disabled:opacity-60 cursor-pointer transition-colors ${refreshRatesError ? 'text-rose-400' : 'text-slate-300 hover:text-emerald-400'}`}
                title={refreshRatesError || 'Refresh live rates only'}
                aria-label={refreshRatesError ? `Refresh live rates — ${refreshRatesError}` : 'Refresh live rates'}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingRates ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Quick Status: Simple/Pro toggle */}
        <div className="flex items-center space-x-1.5 min-w-0 flex-shrink-0">
          {onToggleTradingMode && (
            <button
              onClick={onToggleTradingMode}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex-shrink-0 ${
                tradingMode === 'advanced'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
              title="Toggle Simple / Advanced Mode"
            >
              {tradingMode === 'advanced' ? '⚡ Pro' : '🌱 Simple'}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP PERMANENT SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-slate-950/90 border-r border-slate-800/80 backdrop-blur-xl h-full flex-shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-400 to-emerald-300 p-0.5 shadow-lg shadow-emerald-500/25">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <CandlestickChart className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-lg text-white tracking-tight">
                    TRADER<span className="text-emerald-400">AI</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {tradingMode === 'advanced' ? 'PRO' : 'BASIC'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">BSE India Intelligent Terminal</p>
              </div>
            </div>

            {/* IST clock + manual rate-only refresh, next to the logo */}
            <div className="flex items-center space-x-1.5 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-lg pl-2.5 pr-1 py-1">
              <span className="font-mono text-sm text-emerald-300 font-bold tracking-wide tabular-nums" title="Current IST time">
                {istTime || '--:--'}
              </span>
              {onRefreshRates && (
                <button
                  type="button"
                  onClick={onRefreshRates}
                  disabled={isRefreshingRates}
                  className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-60 cursor-pointer ${refreshRatesError ? 'text-rose-400' : 'text-slate-300 hover:text-emerald-400'}`}
                  title={refreshRatesError || 'Refresh live rates only — leaves everything else on the page untouched'}
                  aria-label={refreshRatesError ? `Refresh live rates — ${refreshRatesError}` : 'Refresh live rates'}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingRates ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Live Session Pill */}
          <div
            onClick={() => onSelectPage('market-clocks')}
            className="mt-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between text-xs group"
          >
            <div className="flex items-center space-x-2">
              {isMarketOpen ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
              )}
              <span className="text-slate-300 font-semibold text-[11px]">
                {isMarketOpen ? 'BSE Live (IST)' : 'BSE Closed (Rates Frozen)'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={`font-mono font-bold text-xs ${isMarketOpen ? 'text-emerald-300' : 'text-slate-400'}`}>
                {istTime || '09:15 AM'}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>

          {/* Simple vs Advanced Trading Mode Switcher */}
          <div className="mt-2.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => tradingMode !== 'simple' && onToggleTradingMode?.()}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                tradingMode === 'simple'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌱 Simple</span>
            </button>
            <button
              type="button"
              onClick={() => tradingMode !== 'advanced' && onToggleTradingMode?.()}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                tradingMode === 'advanced'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚡ Pro SMC</span>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-white border border-emerald-500/30 shadow-md shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <div className={`truncate ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate -mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Controls */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/60">
          {/* Quick Controls Bar */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={onToggleAudio}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                audioEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
              title={audioEnabled ? 'Voice & Audio Chime Enabled' : 'Audio Muted'}
            >
              {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="text-[11px]">{audioEnabled ? 'Audio On' : 'Muted'}</span>
            </button>

            <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>v3.0 Advisory</span>
            </div>
          </div>

          {onLogout && (
            <div className="flex items-center justify-between px-1 pt-1 border-t border-slate-900">
              <span className="text-[10px] text-slate-500 truncate max-w-[140px]" title={userEmail}>{userEmail}</span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 text-[11px] font-semibold text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OVER DRAWER */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-slate-950 border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5">
                  <div className="h-full w-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                    <CandlestickChart className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <span className="font-extrabold text-sm text-white">TRADER<span className="text-emerald-400">AI</span></span>
                  <span className="text-[10px] text-slate-400 block font-mono">BSE Pro Navigation</span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-white border border-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className={isActive ? 'text-white font-bold' : 'text-slate-300'}>{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.description}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 space-y-2.5">
              <button
                onClick={onToggleAudio}
                className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer"
              >
                {audioEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                <span>{audioEnabled ? 'Audio Alerts Active' : 'Audio Muted'}</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-300 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
