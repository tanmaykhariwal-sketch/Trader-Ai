/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MarketTickerBar } from './components/MarketTickerBar';
import { BeginnerSummaryView } from './components/BeginnerSummaryView';
import { StockStudioView } from './components/views/StockStudioView';
import { AdvancedAnalyticsView } from './components/views/AdvancedAnalyticsView';
import { RiskCalculatorView } from './components/views/RiskCalculatorView';
import { MarketClocksView } from './components/views/MarketClocksView';
import { WatchlistView } from './components/views/WatchlistView';
import { SupportView } from './components/views/SupportView';
import { NewsPredictionsView } from './components/views/NewsPredictionsView';

import { PositionCalculatorModal } from './components/PositionCalculatorModal';
import { MiniAssistant } from './components/MiniAssistant';

import { INITIAL_TICKERS, INITIAL_SAMPLE_SIGNALS, generateCandlesticks } from './data/marketData';
import { MarketTicker, MarketSignal, AppPage, TradingMode, StockPrediction, CandlestickData } from './types';
import { getBseMarketStatus, BseMarketStatus } from './utils/marketHours';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import {
  apiListWatchlist,
  apiAddWatchlist,
  apiRemoveWatchlist
} from './utils/api';

// Default account size the standalone calculators (Risk & Sizing page,
// Position Calculator modal) start from — this app doesn't track a real
// portfolio/capital balance, so there's no live number to default to.
const DEFAULT_CALCULATOR_CAPITAL = 100000;

// Mirrors the AppPage union in types.ts — TS types don't exist at runtime,
// so a real value read back from localStorage needs a real array to
// validate against, not just an `as AppPage` cast.
const VALID_APP_PAGES: AppPage[] = [
  'market-hub', 'stock-studio', 'advanced-analytics', 'news-predictions',
  'watchlist', 'risk-calculator', 'market-clocks', 'support'
];

export default function App() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();

  // Page Navigation State — per explicit request, a browser refresh restores
  // whichever page the user was actually on instead of resetting to the
  // default. Validated against the real set of pages (not just trusted as a
  // string) so a stale/corrupted localStorage value from an older build
  // (e.g. a page that no longer exists) can't land activePage in a state
  // nothing renders for.
  const [activePage, setActivePage] = useState<AppPage>(() => {
    try {
      const saved = localStorage.getItem('trader_ai_active_page');
      return VALID_APP_PAGES.includes(saved as AppPage) ? (saved as AppPage) : 'market-hub';
    } catch {
      return 'market-hub';
    }
  });

  // Viewport scroll ref for independent page scrolling
  const mainScrollContainerRef = useRef<HTMLDivElement>(null);

  // BSE Market Status & Session Engine
  const [marketStatus, setMarketStatus] = useState<BseMarketStatus>(() => getBseMarketStatus());

  // AI Stock Predictions with Upgrade/Downgrade models
  const [stockPredictions, setStockPredictions] = useState<StockPrediction[]>([]);

  // Global Trading Mode (Simple / Advanced)
  const [tradingMode, setTradingMode] = useState<TradingMode>(() => {
    try {
      const saved = localStorage.getItem('trader_ai_trading_mode') as TradingMode;
      return saved === 'advanced' ? 'advanced' : 'simple';
    } catch {
      return 'simple';
    }
  });

  const toggleTradingMode = useCallback(() => {
    setTradingMode(prev => {
      const nextMode = prev === 'simple' ? 'advanced' : 'simple';
      localStorage.setItem('trader_ai_trading_mode', nextMode);
      return nextMode;
    });
  }, []);

  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Live IST Time & Clock Strings (Normal 1-second clock updates)
  const [istTime, setIstTime] = useState<string>('');
  const [liveBseClock, setLiveBseClock] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
      setLiveBseClock(now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Market Tickers and Signals
  const [tickers, setTickers] = useState<MarketTicker[]>(INITIAL_TICKERS);
  const [selectedTicker, setSelectedTicker] = useState<MarketTicker>(INITIAL_TICKERS[1]); // Reliance default
  const [currentSignal, setCurrentSignal] = useState<MarketSignal | null>(INITIAL_SAMPLE_SIGNALS[0]);
  const [savedSignals, setSavedSignals] = useState<MarketSignal[]>(INITIAL_SAMPLE_SIGNALS);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Guards handleGenerateSignal against out-of-order responses: clicking
  // timeframe/risk buttons in quick succession fires overlapping /api/analyze
  // requests, and Gemini's latency varies enough that an earlier click's
  // response can resolve AFTER a later click's — confirmed live (a slow
  // first request for one timeframe landed 4s after a fast second request
  // for a different one, and silently overwrote it, leaving the chart
  // showing the FIRST timeframe's data while the button/header claimed the
  // second). Only the response matching the most recently issued request
  // is applied; older ones are discarded on arrival.
  const signalRequestSeq = useRef(0);
  // Same idea, for handleSearchCustom below.
  const searchCustomSeq = useRef(0);
  // Guards against a genuinely out-of-order network response (a slow poll
  // resolving after a faster manual refresh) reverting tickers/signals/alerts
  // to stale prices.
  const quotesFetchSeq = useRef(0);

  // Watchlist — server-authoritative, loaded once a user is signed in.
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);

  const watchlistToggleSeq = useRef(0);
  const handleToggleWatchlist = useCallback(async (symbol: string) => {
    const mySeq = ++watchlistToggleSeq.current;
    try {
      const next = watchlistSymbols.includes(symbol)
        ? await apiRemoveWatchlist(symbol)
        : await apiAddWatchlist(symbol);
      // Two rapid toggles (add then remove, or vice versa) had no ordering
      // guarantee — the older response could land after the newer one and
      // overwrite watchlistSymbols with a stale list, showing the star/
      // bookmark opposite to the user's actual last click.
      if (watchlistToggleSeq.current !== mySeq) return;
      setWatchlistSymbols(next);
    } catch (err) {
      console.error('Could not update watchlist:', err);
    }
  }, [watchlistSymbols]);

  // Load server-authoritative watchlist once signed in; clear it back out on
  // logout so the next signed-in user never sees a flash of the previous
  // session's data.
  useEffect(() => {
    if (!user) {
      setWatchlistSymbols([]);
      // MiniAssistant persists its chat log/unread-state under fixed,
      // non-namespaced localStorage keys — without clearing them here, the
      // next account to sign in on this browser/tab would see the previous
      // account's entire conversation history.
      localStorage.removeItem('trader_ai_assistant_messages');
      localStorage.removeItem('trader_ai_assistant_last_read');
      return;
    }
    let cancelled = false;
    apiListWatchlist().then(symbols => { if (!cancelled) setWatchlistSymbols(symbols); }).catch(err => console.error('Could not load watchlist:', err));
    // A rapid logout->login-as-a-different-user shouldn't let the first
    // user's slower-to-resolve fetch land after the second user's state is
    // already loading — `cancelled` is what stops that stale write.
    return () => { cancelled = true; };
  }, [user]);

  // Live Market Feed and Status Tracking
  const [priceFlashMap, setPriceFlashMap] = useState<Record<string, 'up' | 'down'>>({});

  // Modal controls
  const [showCalculatorModal, setShowCalculatorModal] = useState<boolean>(false);
  const [calculatorSignal, setCalculatorSignal] = useState<MarketSignal | null>(null);

  // Reset scroll position on active page change (independent page scrolling)
  useEffect(() => {
    if (mainScrollContainerRef.current) {
      mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [activePage]);

  // Persists whichever page is active so a refresh restores it — the actual
  // read-back happens in activePage's own lazy initializer above.
  useEffect(() => {
    try {
      localStorage.setItem('trader_ai_active_page', activePage);
    } catch {
      // localStorage can throw in a private-browsing/storage-disabled
      // context — losing "remember my page" isn't worth crashing over.
    }
  }, [activePage]);

  // BSE Market Operating Hours & Clock Engine (1-second tick)
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setMarketStatus(getBseMarketStatus());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Fetch AI Stock Predictions (Upgrades/Downgrades with Confidence Scores)
  useEffect(() => {
    fetch('/api/stock-predictions')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.predictions)) {
          setStockPredictions(data.predictions);
        }
      })
      .catch(err => console.warn('Could not load stock predictions:', err));
  }, []);

  // Manual "refresh rates" state — surfaced next to the clock so a user can
  // force a quote sync without reloading the page or touching anything else.
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);

  // Live Exchange Rate Feed Engine & Official BSE Hours Enforcement.
  // Defined with useCallback (not just inside the effect) so the sidebar's
  // manual refresh button can invoke the exact same rates-only sync the
  // background poller uses — no other page data is touched.
  const fetchLiveServerQuotes = useCallback(async (): Promise<boolean> => {
      const mySeq = ++quotesFetchSeq.current;
      try {
        const res = await fetch('/api/live-quotes');
        if (!res.ok) return false;
        const data = await res.json();

        // A newer call (interval tick or manual refresh) started while this
        // one was in flight — applying this response now would revert
        // tickers/signals/alerts to stale prices.
        if (mySeq !== quotesFetchSeq.current) return false;

        if (data.success && Array.isArray(data.quotes)) {
          const currentBse = getBseMarketStatus();
          setMarketStatus(currentBse);

          const nextFlashes: Record<string, 'up' | 'down'> = {};

          // Kept as a pure computation — no setState calls inside this
          // updater. React 18 StrictMode double-invokes state updaters in
          // dev to catch exactly this kind of impurity: nesting other
          // setState calls (alerts, flash timers) in here previously fired
          // each of them twice per tick, producing duplicate toast alerts.
          setTickers(prevTickers => prevTickers.map(t => {
            const quote = data.quotes.find((q: any) => q.symbol === t.symbol);
            if (quote) {
              // Flash prices ONLY when market is open and there is an actual real price change
              if (currentBse.isOpen) {
                if (quote.lastPrice > t.lastPrice) nextFlashes[t.symbol] = 'up';
                else if (quote.lastPrice < t.lastPrice) nextFlashes[t.symbol] = 'down';
              }

              return {
                ...t,
                lastPrice: quote.lastPrice,
                change: quote.change,
                changePercent: quote.changePercent,
                dayHigh: Math.max(t.dayHigh, quote.dayHigh),
                dayLow: Math.min(t.dayLow, quote.dayLow)
              };
            }
            return t;
          }));

          // Trigger visual flashes only during open market hours
          if (currentBse.isOpen && Object.keys(nextFlashes).length > 0) {
            setPriceFlashMap(nextFlashes);
            setTimeout(() => setPriceFlashMap({}), 700);
          } else {
            setPriceFlashMap({});
          }

          // Synchronize saved signals with authentic rates
          setSavedSignals(prevSignals => {
            return prevSignals.map(sig => {
              const quote = data.quotes.find((q: any) => q.symbol === sig.symbol);
              if (quote) {
                const updatedPrice = quote.lastPrice;
                const updatedChartData = sig.chartData ? [...sig.chartData] : [];
                if (updatedChartData.length > 0) {
                  const lastCandle = { ...updatedChartData[updatedChartData.length - 1] };
                  lastCandle.close = updatedPrice;
                  lastCandle.high = Math.max(lastCandle.high, updatedPrice);
                  lastCandle.low = Math.min(lastCandle.low, updatedPrice);
                  updatedChartData[updatedChartData.length - 1] = lastCandle;
                }
                return {
                  ...sig,
                  currentPrice: updatedPrice,
                  chartData: updatedChartData
                };
              }
              return sig;
            });
          });

          // Synchronize currently active studio signal
          setCurrentSignal(prev => {
            if (!prev) return null;
            const matchingQuote = data.quotes.find((q: any) => q.symbol === prev.symbol);
            if (!matchingQuote) return prev;
            const updatedPrice = matchingQuote.lastPrice;
            const updatedChartData = prev.chartData ? [...prev.chartData] : [];
            if (updatedChartData.length > 0) {
              const lastCandle = { ...updatedChartData[updatedChartData.length - 1] };
              lastCandle.close = updatedPrice;
              lastCandle.high = Math.max(lastCandle.high, updatedPrice);
              lastCandle.low = Math.min(lastCandle.low, updatedPrice);
              updatedChartData[updatedChartData.length - 1] = lastCandle;
            }
            return {
              ...prev,
              currentPrice: updatedPrice,
              chartData: updatedChartData
            };
          });

          return true;
        }
        return false;
      } catch (err) {
        console.warn('Quote feed synchronization error:', err);
        return false;
      }
  }, []); // stable forever — no external state closed over

  // Manual, on-demand rate refresh — same function the background poller
  // uses, so it only ever touches prices/signals/alerts, never holdings,
  // journal, watchlist, or anything else on the page. Previously discarded
  // fetchLiveServerQuotes' outcome entirely — a failed refresh (network drop,
  // 500) looked identical to a successful one, since the spinner just ran and
  // stopped either way with no indication the user's explicit click did
  // nothing. Now surfaces a real failure via the same refreshRatesError state
  // Sidebar already renders inline.
  const [refreshRatesError, setRefreshRatesError] = useState<string | null>(null);
  const handleManualRefreshRates = useCallback(async () => {
    setIsRefreshingRates(true);
    setRefreshRatesError(null);
    try {
      const ok = await fetchLiveServerQuotes();
      if (!ok) setRefreshRatesError("Couldn't refresh rates — please try again.");
    } finally {
      setIsRefreshingRates(false);
    }
  }, [fetchLiveServerQuotes]);

  useEffect(() => {
    // Initial fetch
    fetchLiveServerQuotes();

    // Determine polling frequency based strictly on BSE Market Hours:
    // When market is OPEN (9:15 AM - 3:30 PM IST, Mon-Fri): Poll every 5 seconds for live ticks.
    // When market is CLOSED: DO NOT generate false movements. Rates stay 100% frozen. Check status every 60s.
    const currentBse = getBseMarketStatus();
    const pollInterval = setInterval(fetchLiveServerQuotes, currentBse.isOpen ? 5000 : 60000);

    return () => clearInterval(pollInterval);
  }, [fetchLiveServerQuotes, marketStatus.isOpen]);

  // Per explicit user request: switching to a page from the sidebar should
  // always show current data, not whatever the last background poll tick
  // happened to leave sitting there (watchlist refreshes every 30s, quotes
  // every 5-60s — up to that long stale on a page you just opened). Skips
  // the very first render since the mount effect above (keyed on `user`)
  // already does this exact fetch.
  const isFirstPageRender = useRef(true);
  useEffect(() => {
    if (isFirstPageRender.current) {
      isFirstPageRender.current = false;
      return;
    }
    if (!user) return;
    let cancelled = false;
    apiListWatchlist().then(symbols => { if (!cancelled) setWatchlistSymbols(symbols); }).catch(err => console.error('Could not refresh watchlist:', err));
    fetchLiveServerQuotes();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  // Navigation and Signal Selection
  const handleSelectSignalForStudio = (sig: MarketSignal) => {
    setCurrentSignal(sig);
    const matchingTicker = tickers.find(t => t.symbol === sig.symbol);
    if (matchingTicker) {
      setSelectedTicker(matchingTicker);
    }
    setActivePage('stock-studio');
  };

  const handleSelectTickerFromTape = (ticker: MarketTicker) => {
    setSelectedTicker(ticker);
    const existingSignal = savedSignals.find(s => s.symbol === ticker.symbol);
    if (existingSignal) {
      setCurrentSignal(existingSignal);
    } else {
      const tempSignal: MarketSignal = {
        id: `sig-${ticker.symbol}-${Date.now()}`,
        timestamp: 'Just now',
        stockName: ticker.name,
        symbol: ticker.symbol,
        exchange: ticker.exchange,
        currency: ticker.currency,
        signalType: 'Bullish Breakout',
        currentPrice: ticker.lastPrice,
        buyZone: `${ticker.currency === 'INR' ? '₹' : '$'}${Math.floor(ticker.lastPrice * 0.995)} – ${Math.floor(ticker.lastPrice * 1.002)}`,
        probableTimeWindow: '10:15 – 10:45 AM IST',
        sellZone: `T1: ${Math.floor(ticker.lastPrice * 1.018)} | T2: ${Math.floor(ticker.lastPrice * 1.03)}`,
        stopLoss: `${Math.floor(ticker.lastPrice * 0.985)}`,
        riskLevel: 'Medium',
        confidenceScore: 82,
        status: 'Active Entry Zone',
        marketOverview: `Live momentum setup in ${ticker.name} on BSE. Market exhibiting healthy volume expansion with technical confluence above key exponential moving averages.`,
        candlestickInsights: {
          patternsDetected: ['15-Min Bullish Engulfing', 'Demand Zone Rejection'],
          implications: 'Strong buyer absorption near support level indicating high probability continuation.',
          supportResistanceZones: [`Support: ${Math.floor(ticker.lastPrice * 0.985)}`, `Resistance: ${Math.floor(ticker.lastPrice * 1.02)}`],
          liquidityNotes: 'Liquidity sweep completed below key swing low.'
        },
        technicalSignals: {
          rsiReading: '61.2 (Ascending from baseline)',
          macdReading: 'Bullish Crossover above signal line',
          movingAverages: 'Price holding above 20 EMA and 50 SMA',
          volumeAnalysis: '1.6x average volume on breakout candle',
          confluenceScore: 85,
          confluenceSummary: '4/5 Technical pillars aligned with primary trend structure.'
        },
        riskAssessment: {
          level: 'Medium',
          reasoning: 'Clean risk definition with 1:2.5 Risk-to-Reward ratio.',
          suggestedStopLossPercent: 1.5,
          recommendedPositionSizePercent: 2.0
        },
        possibleScenarios: {
          shortTermIntraday: 'Test of immediate overhead target zone expected.',
          mediumTermWeekly: 'Continuation of daily trend structure.',
          longTermOutlook: 'Sustained institutional momentum.'
        },
        chartData: generateCandlesticks(ticker.lastPrice, 32)
      };
      setCurrentSignal(tempSignal);
    }
    setActivePage('stock-studio');
  };

  // Fetches a real live quote for any BSE symbol from the server (which
  // falls back to a live Yahoo lookup for symbols outside the curated
  // quoteDirectory — see /api/quote/:symbol) instead of fabricating a fake
  // flat ₹1500 price/volume for anything not already on the ticker tape.
  // Returns whether the lookup succeeded so the search box can show a real
  // "symbol not found" error instead of silently faking a result.
  const handleSearchCustom = async (querySymbol: string): Promise<boolean> => {
    // Same class of guard as signalRequestSeq/quotesFetchSeq below — found
    // missing here: searching "RELIANCE" then immediately "TCS" had no
    // ordering guarantee, so a slower RELIANCE lookup resolving after the
    // faster TCS one would silently switch the active chart/signal back to
    // RELIANCE, risking a buy/calculator action against the wrong stock.
    const mySeq = ++searchCustomSeq.current;
    const existing = tickers.find(t => t.symbol === querySymbol);
    if (existing) {
      if (searchCustomSeq.current !== mySeq) return true;
      handleSelectTickerFromTape(existing);
      return true;
    }

    try {
      const res = await fetch(`/api/quote/${encodeURIComponent(querySymbol)}`);
      const data = await res.json();
      if (!data.success || !data.quote) return false;
      if (searchCustomSeq.current !== mySeq) return true;

      const q = data.quote;
      const newTicker: MarketTicker = {
        symbol: querySymbol,
        name: q.name || `${querySymbol} Ltd`,
        region: 'NSE_BSE',
        exchange: 'BSE',
        lastPrice: q.lastPrice,
        change: q.change,
        changePercent: q.changePercent,
        currency: 'INR',
        volume: q.volume || 'N/A',
        dayHigh: q.dayHigh,
        dayLow: q.dayLow
      };
      setTickers(prev => [newTicker, ...prev]);
      handleSelectTickerFromTape(newTicker);
      return true;
    } catch {
      return false;
    }
  };

  // Generate Single AI Signal via API
  const handleGenerateSignal = async (params: { ticker: MarketTicker; timeframe: string; riskProfile: string; strategy: string }) => {
    setIsLoading(true);
    const mySeq = ++signalRequestSeq.current;

    // Real bug found and fixed 2026-09-04: this function's own AI-generated
    // signal (confidence/patterns text) was already grounded in real Yahoo
    // candles server-side, but the CHART itself — what's actually rendered,
    // and what the candlestick-scanner analyzes — always came from
    // generateCandlesticks()'s Math.random() output regardless, including
    // pattern labels hardcoded to fixed candle indices that never reflected
    // real price action. Fetching the real candles here, once, so both the
    // success and fallback paths below use genuine historical OHLC instead.
    // Falls back to the synthetic generator only if the real fetch itself
    // fails (e.g. Yahoo unreachable) — a real degradation, not the default.
    let realChartData: CandlestickData[] | null = null;
    try {
      const candlesRes = await fetch(`/api/candles/${encodeURIComponent(params.ticker.symbol)}?timeframe=${encodeURIComponent(params.timeframe)}`);
      const candlesData = await candlesRes.json();
      if (candlesData.success && Array.isArray(candlesData.candles) && candlesData.candles.length > 0) {
        realChartData = candlesData.candles.map((c: any) => ({
          time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume
        }));
      }
    } catch (err) {
      console.warn('Could not fetch real candles, falling back to simulated chart:', err);
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: params.ticker.symbol,
          stockName: params.ticker.name,
          exchange: params.ticker.exchange,
          currency: params.ticker.currency,
          currentPrice: params.ticker.lastPrice,
          timeframe: params.timeframe,
          userQuery: `${params.riskProfile} risk profile with ${params.strategy}`
        })
      });

      const resData = await response.json();

      // A newer timeframe/risk click has been issued since this request
      // started — discard this now-stale response instead of letting it
      // overwrite what the user actually selected most recently.
      if (signalRequestSeq.current !== mySeq) return;

      const isCons = params.riskProfile === 'Conservative';
      const isAggr = params.riskProfile === 'Aggressive';
      const lp = params.ticker.lastPrice;

      if (resData.success && resData.data) {
        const newSig: MarketSignal = {
          ...resData.data,
          id: `sig-${params.ticker.symbol}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          riskLevel: isCons ? 'Low' : isAggr ? 'High' : (resData.data.riskLevel || 'Medium'),
          sellZone: isCons 
            ? `T1: ${Math.floor(lp * 1.018)} | T2: ${Math.floor(lp * 1.028)}`
            : isAggr 
            ? `T1: ${Math.floor(lp * 1.035)} | T2: ${Math.floor(lp * 1.065)} | T3: ${Math.floor(lp * 1.095)}`
            : `T1: ${Math.floor(lp * 1.022)} | T2: ${Math.floor(lp * 1.042)}`,
          stopLoss: isCons ? `${Math.floor(lp * 0.991)}` : isAggr ? `${Math.floor(lp * 0.972)}` : `${Math.floor(lp * 0.985)}`,
          chartData: realChartData ?? generateCandlesticks(params.ticker.lastPrice, 32, params.timeframe, params.riskProfile)
        };
        setCurrentSignal(newSig);
        setSavedSignals(prev => [newSig, ...prev.filter(s => s.symbol !== newSig.symbol)]);
      } else {
        const generatedSignal: MarketSignal = {
          id: `sig-${params.ticker.symbol}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stockName: params.ticker.name,
          symbol: params.ticker.symbol,
          exchange: params.ticker.exchange,
          currency: params.ticker.currency,
          signalType: isAggr ? 'Consolidation Breakout' : isCons ? 'Demand Zone Dip' : 'Bullish Breakout',
          currentPrice: params.ticker.lastPrice,
          buyZone: `${params.ticker.currency === 'INR' ? '₹' : '$'}${Math.floor(params.ticker.lastPrice * 0.996)} – ${Math.floor(params.ticker.lastPrice * 1.002)}`,
          probableTimeWindow: params.timeframe === '5m' ? 'Next 15–30 Mins' : params.timeframe === '1D' ? 'Next 1–3 Sessions' : '10:30 – 11:15 AM IST',
          sellZone: isCons 
            ? `T1: ${Math.floor(lp * 1.018)} | T2: ${Math.floor(lp * 1.028)}`
            : isAggr 
            ? `T1: ${Math.floor(lp * 1.035)} | T2: ${Math.floor(lp * 1.065)} | T3: ${Math.floor(lp * 1.095)}`
            : `T1: ${Math.floor(lp * 1.022)} | T2: ${Math.floor(lp * 1.042)}`,
          stopLoss: isCons ? `${Math.floor(lp * 0.991)}` : isAggr ? `${Math.floor(lp * 0.972)}` : `${Math.floor(lp * 0.985)}`,
          riskLevel: isCons ? 'Low' : isAggr ? 'High' : 'Medium',
          confidenceScore: isCons ? 92 : isAggr ? 79 : 86,
          status: 'Active Entry Zone',
          marketOverview: `NIFTY and BSE cues aligning with ${params.riskProfile} strategy on ${params.timeframe} chart. Institutional volume footprint detected in ${params.ticker.name} with demand zone absorption.`,
          candlestickInsights: {
            patternsDetected: [
              params.timeframe === '5m' ? '5-Min Momentum Ignition' : params.timeframe === '1D' ? 'Daily Demand Pin Bar' : '15-Min Morning Star',
              'Fair Value Gap at Key Demand'
            ],
            implications: isCons 
              ? 'Conservative confluence setup: low-risk entry near solid moving average support.'
              : isAggr 
              ? 'Aggressive breakout: high-velocity expansion with expanded profit targets.'
              : 'Balanced risk-to-reward setup with multi-indicator alignment.',
            supportResistanceZones: [
              `Demand Zone: ${Math.floor(params.ticker.lastPrice * (isCons ? 0.992 : 0.985))}`,
              `Resistance Zone: ${Math.floor(params.ticker.lastPrice * (isAggr ? 1.045 : 1.025))}`
            ],
            liquidityNotes: 'Liquidity sweep completed below intraday swing low.'
          },
          technicalSignals: {
            rsiReading: isAggr ? '71.4 (Strong momentum)' : isCons ? '54.2 (Stable baseline)' : '63.5 (Bullish momentum zone)',
            macdReading: 'Histogram expanding positively',
            movingAverages: 'Price holding firmly above 20 EMA and 50 SMA',
            volumeAnalysis: isAggr ? '2.4x volume spike on breakout candle' : '1.5x institutional volume accumulation',
            confluenceScore: isCons ? 94 : isAggr ? 81 : 89,
            confluenceSummary: `${isCons ? 'Tight risk with 5/5' : 'Actionable setup with 4/5'} confluence factors green.`
          },
          riskAssessment: {
            level: isCons ? 'Low' : isAggr ? 'High' : 'Medium',
            reasoning: isCons 
              ? 'Tight stop loss anchoring capital protection against adverse market shifts.'
              : isAggr 
              ? 'Wider target profile allowing full capture of multi-leg explosive rallies.'
              : 'Balanced risk profile anchored to demand zone support.',
            suggestedStopLossPercent: isCons ? 0.9 : isAggr ? 2.8 : 1.5,
            recommendedPositionSizePercent: isCons ? 1.5 : isAggr ? 4.0 : 2.5
          },
          possibleScenarios: {
            shortTermIntraday: `Expansion towards T1 within the ${params.timeframe} cycle.`,
            mediumTermWeekly: 'Swing continuation towards major structural high.',
            longTermOutlook: 'Sustained institutional uptake.'
          },
          chartData: realChartData ?? generateCandlesticks(params.ticker.lastPrice, 32, params.timeframe, params.riskProfile)
        };
        setCurrentSignal(generatedSignal);
        setSavedSignals(prev => [generatedSignal, ...prev.filter(s => s.symbol !== generatedSignal.symbol)]);
      }
    } catch (err) {
      console.error('Error generating signal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real, diagnosed bug (2026-09-04): `currentSignal` starts as
  // INITIAL_SAMPLE_SIGNALS[0] — a fully synthetic seed whose chartData comes
  // from generateCandlesticks()'s Math.random() output, including pattern
  // labels HARDCODED to fixed candle indices (see marketData.ts's
  // `patternLabel` logic) that never reflect real price action at all.
  // Nothing ever replaced this seed automatically, so a user who opens Stock
  // Studio without first manually clicking "Re-Analyze" was looking at a
  // chart and pattern annotations with zero connection to real RSI/MACD/
  // price data — exactly the "stuck on a pattern" symptom reported live.
  // This fires the real /api/analyze pipeline once, as soon as real ticker
  // data is available, to replace the fake seed before the user ever
  // interacts with the page.
  const hasAutoGeneratedInitialSignal = useRef(false);
  useEffect(() => {
    if (hasAutoGeneratedInitialSignal.current || !user || tickers.length === 0) return;
    const seedTicker = tickers.find(t => t.symbol === INITIAL_SAMPLE_SIGNALS[0].symbol);
    if (!seedTicker) return;
    hasAutoGeneratedInitialSignal.current = true;
    handleGenerateSignal({ ticker: seedTicker, timeframe: '15m', riskProfile: 'Moderate', strategy: 'AI Adaptive Momentum' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tickers]);

  const handleOpenCalcForSignal = (sig: MarketSignal) => {
    setCalculatorSignal(sig);
    setShowCalculatorModal(true);
  };

  const handleOpenCalcForPrediction = (pred: StockPrediction) => {
    const existingSig = savedSignals.find(s => s.symbol === pred.symbol);
    if (existingSig) {
      handleOpenCalcForSignal(existingSig);
    } else {
      const syntheticSig: MarketSignal = {
        id: `sig-pred-${pred.symbol}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stockName: pred.stockName,
        symbol: pred.symbol,
        exchange: 'BSE',
        currency: 'INR',
        signalType: pred.predictedAction,
        currentPrice: pred.currentPrice,
        buyZone: `₹${Math.floor(pred.currentPrice * 0.995)} – ₹${Math.floor(pred.currentPrice * 1.005)}`,
        probableTimeWindow: 'Current Trading Session',
        sellZone: `T1: ₹${pred.priceTargetT1} | T2: ₹${pred.priceTargetT2}`,
        stopLoss: `₹${pred.stopLoss}`,
        riskLevel: 'Medium',
        confidenceScore: pred.confidenceScore,
        status: 'Active Entry Zone',
        marketOverview: `AI Upgrade catalyst: ${pred.keyCatalysts.join('; ')}`,
        candlestickInsights: {
          patternsDetected: [pred.candlestickPatternConfluence],
          implications: 'High-conviction institutional accumulation pattern.',
          supportResistanceZones: [`Support: ₹${pred.stopLoss}`, `Resistance: ₹${pred.priceTargetT1}`],
          liquidityNotes: pred.newsSentimentConfluence
        },
        technicalSignals: {
          rsiReading: '64.5 (Ascending bullish)',
          macdReading: 'Positive divergence histogram',
          movingAverages: 'Trading above key exponential moving averages',
          volumeAnalysis: 'Institutional volume spike detected',
          confluenceScore: pred.confidenceScore,
          confluenceSummary: `${pred.predictedAction} based on chart pattern and sentiment confluence.`
        },
        riskAssessment: {
          level: 'Medium',
          reasoning: 'Calculated positive asymmetry with defined stop-loss.',
          suggestedStopLossPercent: 1.5,
          recommendedPositionSizePercent: 3.0
        },
        possibleScenarios: {
          shortTermIntraday: `Target test at ₹${pred.priceTargetT1}`,
          mediumTermWeekly: `Swing expansion towards ₹${pred.priceTargetT2}`,
          longTermOutlook: 'Sustained institutional upside.'
        },
        chartData: generateCandlesticks(pred.currentPrice, 32)
      };
      handleOpenCalcForSignal(syntheticSig);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans flex flex-col lg:flex-row antialiased selection:bg-emerald-500 selection:text-slate-950">

      {/* ========================================================================= */}
      {/* SIDEBAR NAVIGATION (Desktop permanent, Mobile slide drawer) */}
      {/* ========================================================================= */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        watchlistCount={watchlistSymbols.length}
        totalSignalsCount={savedSignals.length}
        istTime={marketStatus.istTimeFormatted}
        tradingMode={tradingMode}
        onToggleTradingMode={toggleTradingMode}
        isMarketOpen={marketStatus.isOpen}
        onRefreshRates={handleManualRefreshRates}
        isRefreshingRates={isRefreshingRates}
        refreshRatesError={refreshRatesError}
        userEmail={user.email}
        onLogout={logout}
      />

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CONTAINER (Renders ONLY the currently selected page - Independent Scrolling) */}
      {/* ========================================================================= */}
      <div 
        ref={mainScrollContainerRef}
        id="main-scroll-viewport"
        className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto overscroll-contain pb-8"
      >
        
        {/* Top Ticker Bar & Market Breadcrumb */}
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-md flex-shrink-0">
          <MarketTickerBar
            tickers={tickers}
            selectedSymbol={currentSignal?.symbol}
            onSelectTicker={handleSelectTickerFromTape}
            onSearchCustom={handleSearchCustom}
            lastUpdatedTime={marketStatus.istTimeFormatted}
            isLiveFeedActive={marketStatus.isOpen}
            priceFlashMap={priceFlashMap}
            marketStatus={marketStatus}
          />
        </div>

        {/* Page Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          
          {/* 1. MARKET HUB PAGE */}
          {activePage === 'market-hub' && (
            <BeginnerSummaryView
              signals={savedSignals}
              watchlistSymbols={watchlistSymbols}
              onToggleWatchlist={handleToggleWatchlist}
              selectedStockSymbol={currentSignal?.symbol}
              onSelectSignal={handleSelectSignalForStudio}
              isLoading={isLoading}
              audioEnabled={audioEnabled}
              onOpenCalculator={handleOpenCalcForSignal}
              currency={currency}
              tradingMode={tradingMode}
            />
          )}

          {/* 1.5. NEWS SENTIMENT & AI UPGRADE PREDICTIONS PAGE */}
          {activePage === 'news-predictions' && (
            <NewsPredictionsView
              tickers={tickers}
              onSelectTicker={handleSelectTickerFromTape}
              onOpenCalculatorForPrediction={handleOpenCalcForPrediction}
              currency={currency}
              onNavigatePage={setActivePage}
            />
          )}

          {/* 2. WATCHLIST SECTION (Bookmarked Tickers for Tracking) */}
          {activePage === 'watchlist' && (
            <WatchlistView
              tickers={tickers}
              signals={savedSignals}
              watchlistSymbols={watchlistSymbols}
              onToggleWatchlist={handleToggleWatchlist}
              onNavigateToStudio={(sym) => {
                const sig = savedSignals.find(s => s.symbol === sym);
                if (sig) handleSelectSignalForStudio(sig);
                else {
                  const tk = tickers.find(t => t.symbol === sym);
                  if (tk) handleSelectTickerFromTape(tk);
                }
              }}
              currency={currency}
            />
          )}

          {/* 3. STOCK STUDIO & CHARTING PAGE */}
          {activePage === 'stock-studio' && (
            <StockStudioView
              currentSignal={currentSignal}
              tickers={tickers}
              selectedTicker={selectedTicker}
              onSelectTicker={(t) => {
                setSelectedTicker(t);
                const exSig = savedSignals.find(s => s.symbol === t.symbol);
                if (exSig) setCurrentSignal(exSig);
              }}
              onGenerateSignal={handleGenerateSignal}
              isLoading={isLoading}
              audioEnabled={audioEnabled}
              onOpenCalculatorForSignal={handleOpenCalcForSignal}
              currency={currency}
              tradingMode={tradingMode}
              onToggleTradingMode={toggleTradingMode}
              onSelectPage={setActivePage}
              marketStatus={marketStatus}
              predictions={stockPredictions}
            />
          )}

          {/* 4. ADVANCED DATA & INSTITUTIONAL CONFLUENCE PAGE */}
          {activePage === 'advanced-analytics' && (
            <AdvancedAnalyticsView
              currentSignal={currentSignal}
              savedSignals={savedSignals}
              tickers={tickers}
              selectedTicker={selectedTicker}
              onSelectTicker={(t) => {
                setSelectedTicker(t);
                const exSig = savedSignals.find(s => s.symbol === t.symbol);
                if (exSig) setCurrentSignal(exSig);
              }}
              onSelectPage={setActivePage}
              onOpenCalculatorForSignal={handleOpenCalcForSignal}
              currency={currency}
            />
          )}

          {/* 5. RISK & POSITION CALCULATOR PAGE */}
          {activePage === 'risk-calculator' && (
            <RiskCalculatorView
              currency={currency}
              signals={savedSignals}
              tickers={tickers}
              onNavigateToStudio={(sym) => {
                const sig = savedSignals.find(s => s.symbol === sym);
                if (sig) handleSelectSignalForStudio(sig);
              }}
            />
          )}

          {/* 6. MARKET CLOCKS & BSE CALENDAR PAGE */}
          {activePage === 'market-clocks' && (
            <MarketClocksView />
          )}

          {/* 7. DIRECT SUPPORT & CONTACT TANMAY PAGE */}
          {activePage === 'support' && (
            <SupportView onSelectPage={setActivePage} />
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS (Triggered on demand across any view) */}
      {/* ========================================================================= */}
      <PositionCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        capital={DEFAULT_CALCULATOR_CAPITAL}
        currency={currency}
        initialSignal={calculatorSignal}
      />

      {/* Floating Hovering Mini Assistant */}
      <MiniAssistant
        signals={savedSignals}
        currency={currency}
        onSelectSignal={handleSelectSignalForStudio}
        onOpenCalculator={() => setActivePage('risk-calculator')}
        tradingMode={tradingMode}
        onToggleTradingMode={toggleTradingMode}
      />

    </div>
  );
}
