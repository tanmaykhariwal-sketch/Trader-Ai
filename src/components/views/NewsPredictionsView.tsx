import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Globe, 
  ShieldCheck, 
  ArrowUpRight, 
  Flame, 
  RefreshCw, 
  Search, 
  Filter, 
  BarChart2, 
  Zap, 
  Target, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sliders,
  DollarSign,
  Briefcase,
  Layers,
  X,
  Compass,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { 
  StockPrediction, 
  MarketTicker, 
  PurchasedHolding, 
  AppPage, 
  GlobalFinancialHeadline,
  HeadlineCategory 
} from '../../types';
import { 
  NewsPredictionsProvider, 
  useNewsPredictionsContext, 
  NewsPredictionsContext,
  BseImpactFilterOption 
} from '../../context/NewsPredictionsContext';

export interface NewsPredictionsViewProps {
  tickers: MarketTicker[];
  onSelectTicker: (ticker: MarketTicker) => void;
  onSelectSignalBySymbol: (symbol: string) => void;
  onOpenCalculatorForPrediction: (pred: StockPrediction) => void;
  onMarkAsBoughtForPrediction?: (pred: StockPrediction) => void;
  purchasedHoldings: PurchasedHolding[];
  capital: number;
  currency: 'INR' | 'USD';
  onNavigatePage: (page: AppPage) => void;
}

// Inner view that consumes the NewsPredictionsContext
const NewsPredictionsContent: React.FC<NewsPredictionsViewProps> = ({
  tickers,
  onSelectTicker,
  onSelectSignalBySymbol,
  onOpenCalculatorForPrediction,
  onMarkAsBoughtForPrediction,
  purchasedHoldings,
  capital,
  currency,
  onNavigatePage
}) => {
  const {
    allHeadlines,
    bseHeadlines,
    filteredHeadlines,
    sentimentMetrics,
    predictions,
    isLoadingHeadlines,
    isLoadingPredictions,
    isLoading,
    lastRefreshedTime,
    activeCategory,
    setActiveCategory,
    bseImpactFilter,
    setBseImpactFilter,
    minBseImpactScore,
    setMinBseImpactScore,
    searchQuery,
    setSearchQuery,
    selectedBseSymbol,
    setSelectedBseSymbol,
    refreshAll,
    refreshHeadlines,
    resetFilters
  } = useNewsPredictionsContext();

  const [selectedPredFilter, setSelectedPredFilter] = useState<'ALL' | 'STRONG_UPGRADE' | 'HIGH_CONFIDENCE' | 'MAX_RETURN'>('ALL');
  const [showMacroExplainer, setShowMacroExplainer] = useState<boolean>(false);

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Filter Predictions
  const filteredPredictions = predictions.filter(pred => {
    const matchesSearch = 
      pred.stockName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      pred.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedPredFilter === 'STRONG_UPGRADE') return pred.predictedAction.includes('STRONG UPGRADE');
    if (selectedPredFilter === 'HIGH_CONFIDENCE') return pred.confidenceScore >= 90;
    if (selectedPredFilter === 'MAX_RETURN') return pred.expectedReturnPct >= 5.5;
    return true;
  });

  const categories: Array<{ id: HeadlineCategory | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All Global News' },
    { id: 'BSE Equities', label: 'BSE Equities' },
    { id: 'Global Macro', label: 'Global Macro' },
    { id: 'Energy & Commodities', label: 'Crude & Energy' },
    { id: 'Banking & Rates', label: 'Banking & RBI' },
    { id: 'Tech & AI', label: 'Tech & AI' },
    { id: 'Forex & Trade', label: 'Rupee & Forex' }
  ];

  const bseFilterTabs: Array<{ id: BseImpactFilterOption; label: string; count?: number }> = [
    { id: 'ALL', label: 'All Daily Headlines', count: allHeadlines.length },
    { id: 'DIRECT_BSE', label: 'Direct BSE Stocks', count: allHeadlines.filter(h => h.bseRelevance === 'Direct BSE Stock').length },
    { id: 'HIGH_IMPACT', label: 'High BSE Impact (≥70)', count: allHeadlines.filter(h => h.bseImpactScore >= 70).length },
    { id: 'BULLISH', label: 'Bullish BSE Sentiment', count: allHeadlines.filter(h => h.bseSentimentImpact.includes('Bullish')).length },
    { id: 'BEARISH', label: 'Bearish BSE Sentiment', count: allHeadlines.filter(h => h.bseSentimentImpact.includes('Bearish')).length },
    { id: 'MACRO_SPILLOVER', label: 'Macro Spillover', count: allHeadlines.filter(h => h.bseRelevance === 'Global Spillover' || h.bseRelevance === 'Macro India Impact').length }
  ];

  const hasActiveFilters = 
    activeCategory !== 'ALL' || 
    bseImpactFilter !== 'ALL' || 
    minBseImpactScore > 0 || 
    Boolean(searchQuery) || 
    Boolean(selectedBseSymbol);

  return (
    <div className="space-y-7 pb-12">
      {/* Top Banner: Global Financial News Intelligence & BSE Sentiment Aggregator */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" />
              <span>Global News Aggregator & BSE Sentiment Intelligence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Daily Global Headlines & BSE Sentiment Engine
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Real-time financial news wire aggregation parsed for BSE-relevant sentiment impact, 
              macroeconomic transmission (Fed, Crude, RBI, USD/INR), and institutional price target upgrades.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastRefreshedTime && (
              <div className="text-xs text-slate-400 font-mono bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Aggregator Synced: {lastRefreshedTime} IST</span>
              </div>
            )}
            <button
              onClick={() => refreshAll()}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Parsing Feeds...' : 'Fetch & Parse Daily Feeds'}</span>
            </button>
          </div>
        </div>

        {/* Global Market Sentiment Meter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>BSE Market Sentiment</span>
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-emerald-400">{sentimentMetrics.bullishPercentage}% Bullish</span>
              <span className="text-xs text-emerald-300 font-medium font-mono">
                ({sentimentMetrics.score > 0 ? `+${sentimentMetrics.score}` : sentimentMetrics.score} Net Score)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${sentimentMetrics.bullishPercentage}%` }} 
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Institutional Flow Bias</span>
              <Flame className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-2 truncate">
              {sentimentMetrics.institutionalFlowBias}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              FII/DII liquidity sustaining Dalal Street order books
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>BSE Impact Relevance</span>
              <Compass className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-2">
              {sentimentMetrics.bseRelevantCount} of {sentimentMetrics.totalParsed}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Headlines with direct or macro transmission to BSE
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Dominant Theme</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-base font-bold text-purple-300 mt-2 truncate">
              {sentimentMetrics.dominantTheme}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Primary catalyst moving Indian equities today
            </div>
          </div>
        </div>
      </div>

      {/* Global Macro to BSE Transmission Explainer Toggle */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>How Global Macro Headlines Transmit to BSE Equities</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Methodology
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Our parser filters daily world news for interest rates, crude benchmarks, currency, and supply chain impacts on Indian equities.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMacroExplainer(!showMacroExplainer)}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-all cursor-pointer"
          >
            {showMacroExplainer ? 'Hide Transmission Channels' : 'View Transmission Channels'}
          </button>
        </div>

        {showMacroExplainer && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/70 space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>US Fed & Global Yields ➔ FII Liquidity</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                When US 10-year yields decline, global risk appetite rises and Foreign Institutional Investors allocate capital into emerging markets, driving SENSEX large caps (RELIANCE, HDFCBANK, ICICIBANK).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/70 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Brent Crude Oil ➔ Inflation & Margins</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                India imports over 80% of its crude requirements. Sub-$75 Brent prices relieve pressure on current account deficit, bolster the Rupee, and directly boost margins for Indian paint, tire, and auto manufacturers.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/70 space-y-1">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Global Tech Spending ➔ Indian IT Majors</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                NASDAQ enterprise cloud and AI capex budgets establish multi-year deal pipelines for BSE heavyweight IT exporters including Infosys (INFY) and Tata Consultancy Services (TCS).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Grid: Stock Upgrade Predictions (60%) & BSE-Filtered News Feed (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* LEFT COLUMN: Predictive Stock Upgrades & Downgrades (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                AI Stock Upgrade & Price Target Forecasts
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedPredFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedPredFilter === 'ALL'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All ({predictions.length})
              </button>
              <button
                onClick={() => setSelectedPredFilter('STRONG_UPGRADE')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedPredFilter === 'STRONG_UPGRADE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Strong Upgrades
              </button>
              <button
                onClick={() => setSelectedPredFilter('HIGH_CONFIDENCE')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedPredFilter === 'HIGH_CONFIDENCE'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                90%+ Confidence
              </button>
              <button
                onClick={() => setSelectedPredFilter('MAX_RETURN')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedPredFilter === 'MAX_RETURN'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Max Upside
              </button>
            </div>
          </div>

          {/* Predictions Cards List */}
          <div className="space-y-4">
            {isLoadingPredictions && predictions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-300">Computing real-time multi-factor forecasts...</p>
              </div>
            ) : filteredPredictions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-sm text-slate-400">No predictions matched your current search filters.</p>
                <button
                  onClick={() => {
                    setSelectedPredFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Clear search and reset filters
                </button>
              </div>
            ) : (
              filteredPredictions.map(pred => {
                const isHolding = purchasedHoldings.some(h => h.symbol === pred.symbol);
                const holdingData = purchasedHoldings.find(h => h.symbol === pred.symbol);

                return (
                  <div 
                    key={pred.id}
                    className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg group relative overflow-hidden"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center font-black text-emerald-400 border border-slate-700 font-mono shadow-inner">
                          {pred.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-white tracking-wide text-base">{pred.symbol}</span>
                            <span className="text-xs text-slate-400 font-normal">({pred.stockName})</span>
                            {isHolding && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                <span>In Portfolio ({holdingData?.quantity} shares)</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span>Horizon: <strong className="text-slate-300">{pred.timeHorizon}</strong></span>
                            <span>•</span>
                            <span>Risk Score: <strong className={pred.riskScore <= 3 ? 'text-emerald-400' : pred.riskScore <= 6 ? 'text-amber-400' : 'text-rose-400'}>{pred.riskScore}/10</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Rating Badge */}
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase border flex items-center gap-1.5 ${
                          pred.predictedAction.includes('STRONG UPGRADE') 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                            : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        }`}>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{pred.predictedAction}</span>
                        </div>
                      </div>
                    </div>

                    {/* Target Revisions & Confluence Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400">Current Quote</div>
                        <div className="text-sm font-bold text-white font-mono mt-0.5">
                          {currSymbol}{pred.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400">Price Target 1</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <span>{currSymbol}{pred.priceTargetT1.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          <span className="text-[11px] font-bold text-emerald-400">
                            (+{pred.expectedReturnPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400">Conservative T2</div>
                        <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
                          {currSymbol}{pred.priceTargetT2.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400">Stop Loss Anchor</div>
                        <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
                          {currSymbol}{pred.stopLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* News Sentiment & Candlestick Confluence Notes */}
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-start gap-2 text-slate-300">
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-cyan-300">Catalyst & Sentiment Confluence: </strong>
                          <span>{pred.newsSentimentConfluence}</span>
                        </div>
                      </div>
                      
                      <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-start gap-2 text-slate-300">
                        <BarChart2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-purple-300">Technical Confluence: </strong>
                          <span>{pred.candlestickPatternConfluence}</span>
                        </div>
                      </div>
                    </div>

                    {/* Key Catalysts Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">Catalysts:</span>
                      {pred.keyCatalysts.map((cat, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 text-[10px] border border-slate-700/60">
                          {cat}
                        </span>
                      ))}
                    </div>

                    {/* Footer Actions: Sizer & Charting Navigation */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Confidence:</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${pred.confidenceScore}%` }} />
                          </div>
                          <span className="text-xs font-bold text-emerald-400 font-mono">{pred.confidenceScore}%</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBseSymbol(pred.symbol);
                            const headlineElement = document.getElementById('bse-news-feed-section');
                            if (headlineElement) headlineElement.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                          title="Filter global news for this ticker"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Related News</span>
                        </button>

                        <button
                          onClick={() => onOpenCalculatorForPrediction(pred)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Position Sizer</span>
                        </button>

                        <button
                          onClick={() => {
                            const tk = tickers.find(t => t.symbol === pred.symbol);
                            if (tk) {
                              onSelectTicker(tk);
                              onNavigatePage('stock-studio');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <span>Chart Studio</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BSE-Relevant Sentiment News Aggregator Stream (5 Cols) */}
        <div id="bse-news-feed-section" className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            
            {/* News Header & Active Filter Overview */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Global Financial News Wire
                </h2>
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {filteredHeadlines.length} Filtered / {allHeadlines.length} Total
              </div>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search headlines, BSE tickers (e.g. RELIANCE), Fed, Crude..."
                className="w-full bg-slate-950 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Ticker Filter Chip */}
            {selectedBseSymbol && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Filtered for BSE Ticker: <strong>{selectedBseSymbol}</strong></span>
                </span>
                <button
                  onClick={() => setSelectedBseSymbol(null)}
                  className="text-emerald-400 hover:text-white font-bold text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 cursor-pointer"
                >
                  Clear Ticker
                </button>
              </div>
            )}

            {/* BSE Impact Quick-Filter Tabs */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>BSE-Relevant Sentiment Filter</span>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-cyan-400 hover:text-cyan-300 font-normal normal-case cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                {bseFilterTabs.map(tab => {
                  const isActive = bseImpactFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setBseImpactFilter(tab.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition-all truncate flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white font-bold border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-950'
                      }`}
                    >
                      <span className="truncate text-[11px]">{tab.label}</span>
                      {typeof tab.count === 'number' && (
                        <span className={`text-[10px] font-mono ml-1 ${isActive ? 'text-emerald-300' : 'text-slate-500'}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Category
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
                {categories.map(cat => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum BSE Impact Score Slider */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Min BSE Impact Score:</span>
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {minBseImpactScore > 0 ? `≥ ${minBseImpactScore} / 100` : 'All (0+)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minBseImpactScore}
                onChange={(e) => setMinBseImpactScore(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 (All News)</span>
                <span>50 (Macro Spillover)</span>
                <span>80 (Direct BSE Stock)</span>
              </div>
            </div>
          </div>

          {/* Parsed Headlines List */}
          <div className="space-y-3">
            {isLoadingHeadlines && allHeadlines.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Parsing daily global financial news aggregator...</p>
              </div>
            ) : filteredHeadlines.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-400">No headlines match the selected BSE relevance or search criteria.</p>
                <button
                  onClick={resetFilters}
                  className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  Reset filters to view all daily headlines
                </button>
              </div>
            ) : (
              filteredHeadlines.map(item => {
                const isDirectStock = item.bseRelevance === 'Direct BSE Stock';
                const isMacroIndia = item.bseRelevance === 'Macro India Impact';
                const isHighBullish = item.bseSentimentImpact === 'High Bullish';
                const isHighBearish = item.bseSentimentImpact === 'High Bearish';

                return (
                  <div 
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3 shadow-md"
                  >
                    {/* Top Row: Source, Time, Category & BSE Relevance Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-300">{item.source}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 font-mono">{item.publishedTimeAgo}</span>
                      </div>

                      {/* BSE Relevance Classification Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isDirectStock
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : isMacroIndia
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.bseRelevance}
                      </span>
                    </div>

                    {/* Headline Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-start justify-between gap-1.5"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-1 hover:text-white" />
                      </a>
                    </h3>

                    {/* Snippet / Description */}
                    {item.snippet && item.snippet !== item.title && (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {item.snippet}
                      </p>
                    )}

                    {/* BSE Transmission Reasoning Callout */}
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>BSE Transmission Impact:</span>
                        </span>
                        <span className="font-mono font-bold text-cyan-400">
                          {item.bseImpactScore}/100 Impact
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        {item.impactReasoning}
                      </p>
                    </div>

                    {/* Impact Meter & Sentiment Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                      {/* Sentiment Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isHighBullish || item.sentiment === 'Bullish'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isHighBearish || item.sentiment === 'Bearish'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {item.bseSentimentImpact} ({item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore})
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700/60">
                          {item.catalystType}
                        </span>
                      </div>

                      {/* Affected BSE Stock Tags */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Affects:</span>
                        {item.affectedBseSymbols.slice(0, 3).map(sym => (
                          <button
                            key={sym}
                            onClick={() => {
                              setSelectedBseSymbol(selectedBseSymbol === sym ? null : sym);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              selectedBseSymbol === sym
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                            }`}
                            title={`Filter news for ${sym}`}
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Export: Wraps the content in NewsPredictionsProvider so the context is always available.
 */
export const NewsPredictionsView: React.FC<NewsPredictionsViewProps> = (props) => {
  return (
    <NewsPredictionsProvider>
      <NewsPredictionsContent {...props} />
    </NewsPredictionsProvider>
  );
};
