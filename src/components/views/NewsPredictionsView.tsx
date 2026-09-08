import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  Search,
  Filter,
  BarChart2,
  Zap,
  Target,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sliders,
  X,
  Compass,
  HelpCircle
} from 'lucide-react';
import {
  StockPrediction,
  MarketTicker,
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
  onOpenCalculatorForPrediction: (pred: StockPrediction) => void;
  currency: 'INR' | 'USD';
  onNavigatePage: (page: AppPage) => void;
}

// Inner view that consumes the NewsPredictionsContext
const NewsPredictionsContent: React.FC<NewsPredictionsViewProps> = ({
  tickers,
  onSelectTicker,
  onOpenCalculatorForPrediction,
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
    error,
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
  const [showNewsFilters, setShowNewsFilters] = useState<boolean>(false);
  const [chartStudioError, setChartStudioError] = useState<string | null>(null);

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Filter Predictions — deliberately NOT filtered by `searchQuery`. That is
  // the context's news-wire search state, bound to the right column's
  // "Search headlines..." input; this column used to filter against it too,
  // so typing an unrelated word (e.g. "crude") into the NEWS search box
  // silently emptied the entire AI-predictions column with a "no predictions
  // matched your search" message the user never triggered from here. The
  // predictions column's own filter tabs below are its real filter UI.
  const filteredPredictions = predictions.filter(pred => {
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
      {/* Page Header: title, sync status, refresh — kept slim so it reads as a status bar, not a hero */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span>Daily Global Headlines & BSE Sentiment Engine</span>
          </h1>
          <p className="text-slate-400 text-xs max-w-2xl">
            Real-time news wire parsed for BSE-relevant sentiment, macro transmission, and institutional price target upgrades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {lastRefreshedTime && (
            <div className="text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Synced {lastRefreshedTime} IST</span>
            </div>
          )}
          <button
            onClick={() => refreshAll()}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Parsing Feeds...' : 'Fetch & Parse Daily Feeds'}</span>
          </button>
        </div>
      </div>

      {/* Sentiment Status Strip — a compact instrument row, not a hero section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center min-h-[76px]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">BSE Sentiment</div>
          {/* `sentimentMetrics.overall` (Bullish/Bearish/Neutral, from
              calculateBseMarketSentiment) was computed and threaded all the
              way into this component but never actually read — this tile
              hardcoded the "Bullish"/emerald treatment regardless, so a
              bearish news day (overall: 'Bearish', bullishPercentage: 18)
              still read "18% Bullish" in green with a "+score"-styled
              suffix, presenting a bearish signal as positive. */}
          <div className={`flex items-baseline gap-1.5 mt-1 flex-wrap ${
            sentimentMetrics.overall === 'Bearish' ? 'text-rose-400' : sentimentMetrics.overall === 'Neutral' ? 'text-slate-300' : 'text-emerald-400'
          }`}>
            <span className="text-lg font-bold">{sentimentMetrics.bullishPercentage}% {sentimentMetrics.overall}</span>
            <span className="text-[11px] font-mono opacity-80">
              ({sentimentMetrics.score > 0 ? `+${sentimentMetrics.score}` : sentimentMetrics.score})
            </span>
          </div>
        </div>

        <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center min-h-[76px]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Institutional Flow</div>
          <div className="text-sm font-bold text-cyan-300 mt-1 leading-snug">
            {sentimentMetrics.institutionalFlowBias}
          </div>
        </div>

        <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center min-h-[76px]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">BSE Impact Relevance</div>
          <div className="text-lg font-bold text-amber-300 mt-1">
            {sentimentMetrics.bseRelevantCount} of {sentimentMetrics.totalParsed}
          </div>
        </div>

        <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center min-h-[76px]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Dominant Theme</div>
          <div className="text-sm font-bold text-purple-300 mt-1 leading-snug">
            {sentimentMetrics.dominantTheme}
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Stock Upgrade Predictions (60%) & BSE-Filtered News Feed (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* LEFT COLUMN: Predictive Stock Upgrades & Downgrades (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                AI Stock Upgrade & Price Target Forecasts
              </h2>
              <button
                onClick={() => setShowMacroExplainer(!showMacroExplainer)}
                title="How global macro headlines transmit to BSE equities"
                className={`p-1 rounded-md transition-all cursor-pointer ${showMacroExplainer ? 'text-cyan-300 bg-cyan-500/15' : 'text-slate-500 hover:text-cyan-300 hover:bg-slate-800'}`}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
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

          {showMacroExplainer && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>US Fed & Global Yields → FII Liquidity</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Falling US 10-year yields push FIIs into emerging markets, driving SENSEX large caps (RELIANCE, HDFCBANK, ICICIBANK).
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Brent Crude → Inflation & Margins</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  India imports 80%+ of its crude. Sub-$75 Brent eases the current account deficit and boosts margins for paint, tire, and auto makers.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Global Tech Spend → Indian IT</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  NASDAQ cloud and AI capex sets multi-year deal pipelines for IT exporters like Infosys and TCS.
                </p>
              </div>
            </div>
          )}

          {/* Predictions Cards List */}
          <div className="space-y-4">
            {isLoadingPredictions && predictions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-300">Computing real-time multi-factor forecasts...</p>
              </div>
            ) : filteredPredictions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-sm text-slate-400">
                  {error ? error : 'No predictions matched the selected filter tab.'}
                </p>
                <button
                  onClick={() => setSelectedPredFilter('ALL')}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Reset to All
                </button>
              </div>
            ) : (
              filteredPredictions.map(pred => {
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
                          </div>
                          <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span>Horizon: <strong className="text-slate-300">{pred.timeHorizon}</strong></span>
                            <span>•</span>
                            <span>Forecast Risk Score: <strong className={pred.riskScore <= 3 ? 'text-emerald-400' : pred.riskScore <= 6 ? 'text-amber-400' : 'text-rose-400'}>{pred.riskScore}/10</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Rating Badge. Was a 2-branch chain (STRONG
                          UPGRADE emerald vs. everything else cyan), so a
                          genuinely bearish action ('DOWNGRADE WATCH',
                          'UNDERPERFORM') fell into the same cyan "neutral/
                          positive" styling as a real bullish call. */}
                      {(() => {
                        const isBearishAction = /DOWNGRADE|UNDERPERFORM/i.test(pred.predictedAction);
                        return (
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase border flex items-center gap-1.5 ${
                              pred.predictedAction.includes('STRONG UPGRADE')
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                                : isBearishAction
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                            }`}>
                              <span>{pred.predictedAction}</span>
                            </div>
                          </div>
                        );
                      })()}
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
                        <div className={`text-sm font-bold font-mono mt-0.5 flex items-center gap-1 ${pred.expectedReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span>{currSymbol}{pred.priceTargetT1.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          <span className="text-[11px] font-bold">
                            {/* Was a hardcoded "+" prefix concatenated onto
                                whatever the number was, so a real negative
                                return rendered literally as "(+-6.3%)" in
                                green. */}
                            ({pred.expectedReturnPct >= 0 ? '+' : ''}{pred.expectedReturnPct.toFixed(1)}%)
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
                        <span className="text-xs text-slate-400">Forecast Confidence:</span>
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
                              setChartStudioError(null);
                            } else {
                              // Predictions and the curated ticker tape are
                              // independent lists — a predicted symbol not on
                              // the tape used to make this button a complete
                              // no-op with zero feedback, so a user would
                              // click it repeatedly assuming the app was slow.
                              setChartStudioError(`${pred.symbol} isn't on the live ticker tape yet — search for it directly in the top bar.`);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <span>Chart Studio</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {chartStudioError && chartStudioError.startsWith(pred.symbol) && (
                      <p className="text-[11px] text-amber-300 -mt-2">{chartStudioError}</p>
                    )}
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

            {/* Filters disclosure — keeps the feed close to the top when nothing is filtered */}
            <button
              onClick={() => setShowNewsFilters(!showNewsFilters)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer text-xs"
            >
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Filters</span>
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </span>
              <span className="text-slate-500">{showNewsFilters ? 'Hide' : 'Show'}</span>
            </button>

            {showNewsFilters && (
              <div className="space-y-4 pt-1">
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
                          title={tab.label}
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
                    aria-label="Minimum BSE Impact Score filter"
                    aria-valuetext={minBseImpactScore > 0 ? `${minBseImpactScore} out of 100` : 'All news, no minimum'}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 (All News)</span>
                    <span>50 (Macro Spillover)</span>
                    <span>80 (Direct BSE Stock)</span>
                  </div>
                </div>
              </div>
            )}
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
                <p className="text-xs text-slate-400">
                  {error
                    ? error
                    : 'No headlines match the selected BSE relevance or search criteria.'}
                </p>
                {error ? (
                  <button
                    onClick={() => refreshHeadlines({ forceRefresh: true })}
                    className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Reset filters to view all daily headlines
                  </button>
                )}
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
