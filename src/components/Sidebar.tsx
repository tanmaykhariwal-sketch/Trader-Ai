import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Briefcase, 
  BookOpen, 
  Calculator, 
  Clock, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  IndianRupee, 
  Menu, 
  X, 
  ChevronRight,
  ShieldCheck,
  Flame,
  Cpu,
  Star,
  Globe,
  HelpCircle,
  Mail,
  User,
  Plus,
  PlusCircle,
  Wallet,
  Check,
  History
} from 'lucide-react';
import { AppPage, CapitalRecord, TradingMode } from '../types';

interface SidebarProps {
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  capital: number;
  onUpdateCapital: (cap: number) => void;
  onAddCapital?: (amount: number, note?: string) => void;
  capitalRecords?: CapitalRecord[];
  currency: 'INR' | 'USD';
  audioEnabled: boolean;
  onToggleAudio: () => void;
  holdingsCount: number;
  watchlistCount?: number;
  alertsCount: number;
  totalSignalsCount: number;
  istTime: string;
  tradingMode?: TradingMode;
  onToggleTradingMode?: () => void;
  isMarketOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  capital,
  onUpdateCapital,
  onAddCapital,
  capitalRecords = [],
  currency,
  audioEnabled,
  onToggleAudio,
  holdingsCount,
  watchlistCount = 0,
  alertsCount,
  totalSignalsCount,
  istTime,
  tradingMode = 'simple',
  onToggleTradingMode,
  isMarketOpen = false
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAddCapitalModal, setShowAddCapitalModal] = useState(false);
  const [addAmount, setAddAmount] = useState<string>('');
  const [depositNote, setDepositNote] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      description: 'Charts & Trade Levels'
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
      id: 'portfolio',
      label: 'Portfolio & Holdings',
      icon: Briefcase,
      badge: holdingsCount > 0 ? `${holdingsCount} Open` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Live P&L & Target Tracking'
    },
    {
      id: 'journal',
      label: "Trader's Journal",
      icon: BookOpen,
      description: 'Trade History & Performance Log'
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

  const handleAddCapitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(addAmount);
    if (!isNaN(val) && val > 0) {
      if (onAddCapital) {
        onAddCapital(val, depositNote || 'Capital Deposit');
      } else {
        onUpdateCapital(capital + val);
      }
      setSuccessMessage(`Successfully recorded deposit of ${currency === 'INR' ? '₹' : '$'}${val.toLocaleString()}`);
      setTimeout(() => {
        setSuccessMessage(null);
        setShowAddCapitalModal(false);
        setAddAmount('');
        setDepositNote('');
      }, 1000);
    }
  };

  const handleSelectPreset = (amount: number) => {
    setAddAmount(amount.toString());
  };

  const handleIncrementPreset = (amount: number) => {
    const current = parseFloat(addAmount) || 0;
    setAddAmount((current + amount).toString());
  };

  const currSymbol = currency === 'INR' ? '₹' : '$';
  const parsedAddAmount = parseFloat(addAmount) || 0;
  const resultingTotal = capital + parsedAddAmount;

  // Frequent common amounts requested by user
  const commonAmounts = [
    { label: '₹10,000', value: 10000 },
    { label: '₹25,000', value: 25000 },
    { label: '₹50,000', value: 50000 },
    { label: '₹1,00,000', value: 100000, sub: '1 Lakh' },
    { label: '₹2,50,000', value: 250000, sub: '2.5 Lakh' },
    { label: '₹5,00,000', value: 500000, sub: '5 Lakh' },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE TOP BAR (Single streamlined mobile header with menu, mode & capital) */}
      {/* ========================================================================= */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">
                TRADER<span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono">BSE Pro</span>
            </div>
          </div>
        </div>

        {/* Mobile Quick Status Info & Add Capital Button */}
        <div className="flex items-center space-x-2">
          {onToggleTradingMode && (
            <button
              onClick={onToggleTradingMode}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                tradingMode === 'advanced'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
              title="Toggle Simple / Advanced Mode"
            >
              {tradingMode === 'advanced' ? '⚡ Pro' : '🌱 Simple'}
            </button>
          )}

          <button
            onClick={() => {
              setAddAmount('');
              setShowAddCapitalModal(true);
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-300 transition-colors cursor-pointer"
            title="Add Capital / Record Deposit"
          >
            <span>{currSymbol}{capital.toLocaleString()}</span>
            <span className="p-0.5 rounded bg-emerald-500 text-slate-950 flex items-center justify-center">
              <Plus className="h-3 w-3 stroke-[3]" />
            </span>
          </button>
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
                  <Sparkles className="h-5 w-5 text-emerald-400" />
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
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20'
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

        {/* Sidebar Footer: Capital & Controls */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/60">
          {/* Capital Setup Pill */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Account Capital</span>
              </span>
              <button
                onClick={() => {
                  setAddAmount('');
                  setShowAddCapitalModal(true);
                }}
                className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs transition-all flex items-center space-x-1 border border-emerald-500/30 cursor-pointer shadow-sm"
                title="Add Capital / Record Deposit"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Add</span>
              </button>
            </div>
            <div className="font-mono text-base font-extrabold text-white">
              {currSymbol}{capital.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Holdings: {holdingsCount} active</span>
              <span className="text-emerald-400 font-semibold">100% BSE</span>
            </div>
          </div>

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
              <span>v2.5 Pro</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OVER DRAWER (Visible when menu is toggled) */}
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
                    <Sparkles className="h-4 w-4 text-emerald-400" />
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
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Capital:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-emerald-400 font-bold">{currSymbol}{capital.toLocaleString()}</span>
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      setAddAmount('');
                      setShowAddCapitalModal(true);
                    }}
                    className="p-1 rounded-md bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                    title="Add Capital"
                  >
                    <Plus className="h-3 w-3 stroke-[3]" />
                  </button>
                </div>
              </div>
              <button
                onClick={onToggleAudio}
                className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer"
              >
                {audioEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                <span>{audioEnabled ? 'Audio Alerts Active' : 'Audio Muted'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CAPITAL / RECORD DEPOSIT MODAL */}
      {/* ========================================================================= */}
      {showAddCapitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-1.5">
                    <span>Add Trading Capital</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Record a funds deposit into your trading ledger.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddCapitalModal(false);
                  setSuccessMessage(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Success notification */}
            {successMessage && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl flex items-center space-x-2 text-xs text-emerald-300 font-semibold animate-in fade-in">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Current Account Capital Status */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Account Capital</span>
                <span className="text-lg font-black font-mono text-white">{currSymbol}{capital.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Holdings</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{holdingsCount} BSE stocks</span>
              </div>
            </div>

            <form onSubmit={handleAddCapitalSubmit} className="space-y-4">
              {/* Deposit Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-200 block font-bold">
                  How much would you like to add to capital?
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm font-bold">{currSymbol}</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter amount to add (e.g. 50000)"
                    autoFocus
                  />
                </div>
              </div>

              {/* Frequent Common Amounts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">Frequent Common Amounts:</span>
                  <span className="text-slate-500 text-[10px]">Click to set or add</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {commonAmounts.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleSelectPreset(item.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        parsedAddAmount === item.value
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black ring-1 ring-emerald-500'
                          : 'bg-slate-950/70 hover:bg-slate-800 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold text-white flex items-center space-x-1">
                        <Plus className="h-2.5 w-2.5 text-emerald-400" />
                        <span>{item.label}</span>
                      </div>
                      {item.sub && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sub}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Preview Banner */}
              {parsedAddAmount > 0 && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Current Capital:</span>
                    <span className="text-slate-300 font-semibold">{currSymbol}{capital.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-semibold">+ Added Amount:</span>
                    <span className="text-emerald-400 font-bold">+{currSymbol}{parsedAddAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between font-mono">
                    <span className="text-xs font-bold text-white">New Total Account Capital:</span>
                    <span className="text-sm font-black text-emerald-300">
                      {currSymbol}{resultingTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCapitalModal(false);
                    setSuccessMessage(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parsedAddAmount <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>
                    {parsedAddAmount > 0 ? `Add ${currSymbol}${parsedAddAmount.toLocaleString()}` : 'Add to Capital'}
                  </span>
                </button>
              </div>

              {/* Reset to 0 Option */}
              {capital > 0 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset capital back to ₹0?')) {
                        onUpdateCapital(0);
                        setShowAddCapitalModal(false);
                      }
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors font-mono cursor-pointer"
                  >
                    Reset capital balance to ₹0
                  </button>
                </div>
              )}
            </form>

            {/* Deposit History Log Preview */}
            {capitalRecords.length > 0 && (
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{showHistory ? 'Hide' : 'View'} Capital Deposit History ({capitalRecords.length})</span>
                </button>

                {showHistory && (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {capitalRecords.slice(0, 10).map((rec) => (
                      <div key={rec.id} className="bg-slate-950/80 border border-slate-800/80 p-2 rounded-xl flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-emerald-400">+{currSymbol}{rec.amount.toLocaleString()}</span>
                          <span className="text-slate-500 block text-[10px]">{rec.date} • {rec.timestamp}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-slate-400 text-[10px]">Resulting:</span>
                          <span className="text-white font-bold block">{currSymbol}{rec.resultingCapital.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

