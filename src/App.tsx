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
import { PortfolioView } from './components/views/PortfolioView';
import { JournalView } from './components/views/JournalView';
import { RiskCalculatorView } from './components/views/RiskCalculatorView';
import { MarketClocksView } from './components/views/MarketClocksView';
import { WatchlistView } from './components/views/WatchlistView';
import { SupportView } from './components/views/SupportView';
import { NewsPredictionsView } from './components/views/NewsPredictionsView';

import { MarkAsBoughtModal } from './components/MarkAsBoughtModal';
import { MarkAsSoldModal } from './components/MarkAsSoldModal';
import { PositionCalculatorModal } from './components/PositionCalculatorModal';
import { MiniAssistant } from './components/MiniAssistant';
import { PriceAlertToast } from './components/PriceAlertToast';

import { INITIAL_TICKERS, INITIAL_SAMPLE_SIGNALS, INITIAL_SAMPLE_JOURNAL_ENTRIES, generateCandlesticks } from './data/marketData';
import { MarketTicker, MarketSignal, PurchasedHolding, JournalEntry, PriceAlert, AppPage, TradingMode, CapitalRecord, StockPrediction } from './types';
import { getBseMarketStatus, BseMarketStatus } from './utils/marketHours';

export default function App() {
  // Page Navigation State
  const [activePage, setActivePage] = useState<AppPage>('market-hub');

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

  // Account Capital state (defaults strictly to 0 for new user)
  const [capital, setCapital] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('trader_ai_capital');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0 && parsed !== 500000) return parsed;
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Capital Deposit History Records state
  const [capitalRecords, setCapitalRecords] = useState<CapitalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('trader_ai_capital_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleAddCapital = useCallback((amountToAdd: number, note?: string) => {
    setCapital(prev => {
      const nextCap = Math.max(0, prev + amountToAdd);
      localStorage.setItem('trader_ai_capital', nextCap.toString());

      const newRecord: CapitalRecord = {
        id: 'cap-' + Date.now(),
        amount: amountToAdd,
        type: 'DEPOSIT',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        resultingCapital: nextCap,
        note: note || 'Capital Deposit'
      };

      setCapitalRecords(prevRecs => {
        const updated = [newRecord, ...prevRecs];
        localStorage.setItem('trader_ai_capital_records', JSON.stringify(updated));
        return updated;
      });

      return nextCap;
    });
  }, []);

  const updateCapital = useCallback((newCap: number) => {
    const validCap = Math.max(0, newCap);
    setCapital(validCap);
    localStorage.setItem('trader_ai_capital', validCap.toString());

    if (validCap > 0) {
      const newRecord: CapitalRecord = {
        id: 'cap-' + Date.now(),
        amount: validCap,
        type: 'SET',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        resultingCapital: validCap,
        note: 'Capital Balance Set'
      };
      setCapitalRecords(prevRecs => {
        const updated = [newRecord, ...prevRecs];
        localStorage.setItem('trader_ai_capital_records', JSON.stringify(updated));
        return updated;
      });
    }
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

  // Purchased Holdings state (clean initial default: [])
  const [purchasedHoldings, setPurchasedHoldings] = useState<PurchasedHolding[]>(() => {
    try {
      const saved = localStorage.getItem('alpha_trader_purchased_holdings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Watchlist Bookmarks state (clean initial default: [] wishlist zero)
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('alpha_trader_watchlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If it matches legacy default sample watchlist, reset to clean 0
          const isLegacyDefault = parsed.length === 4 && 
            ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'].every(s => parsed.includes(s));
          if (!isLegacyDefault) return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const handleToggleWatchlist = useCallback((symbol: string) => {
    setWatchlistSymbols(prev => {
      const next = prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem('alpha_trader_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  // Journal Trade Entries state (clean initial default: [])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('alpha_trader_journal_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any mock sample data from previous sessions
          return parsed.filter((item: JournalEntry) => !item.id?.startsWith('j-hist-'));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Price Alert System State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [triggeredAlertKeys, setTriggeredAlertKeys] = useState<Set<string>>(new Set());

  // Live Market Feed and Status Tracking
  const [priceFlashMap, setPriceFlashMap] = useState<Record<string, 'up' | 'down'>>({});

  // Modal controls
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [buyModalSignal, setBuyModalSignal] = useState<MarketSignal | null>(null);

  const [showSellModal, setShowSellModal] = useState<boolean>(false);
  const [sellModalHolding, setSellModalHolding] = useState<PurchasedHolding | null>(null);

  const [showCalculatorModal, setShowCalculatorModal] = useState<boolean>(false);
  const [calculatorSignal, setCalculatorSignal] = useState<MarketSignal | null>(null);

  // Helper function to parse numeric price
  const parseNumericPrice = (raw: string | number | undefined, defaultVal: number): number => {
    if (typeof raw === 'number' && !isNaN(raw) && raw > 0) return raw;
    if (!raw) return defaultVal;
    const numbers = String(raw).match(/[\d,]+(\.\d+)?/g);
    if (numbers && numbers.length > 0) {
      const parsed = parseFloat(numbers[0].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return defaultVal;
  };

  // Price Alert Handlers
  const handleDismissAlert = useCallback((id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleDismissAllAlerts = () => {
    setPriceAlerts([]);
  };

  const handleSellHoldingByAlert = (alert: PriceAlert) => {
    const targetHolding = purchasedHoldings.find(h => h.id === alert.holdingId || h.symbol === alert.symbol);
    if (targetHolding) {
      handleOpenSellModal(targetHolding);
    }
    handleDismissAlert(alert.id);
  };

  // Reset scroll position on active page change (independent page scrolling)
  useEffect(() => {
    if (mainScrollContainerRef.current) {
      mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
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

  // Live Exchange Rate Feed Engine & Official BSE Hours Enforcement
  useEffect(() => {
    let pollInterval: any = null;

    const fetchLiveServerQuotes = async () => {
      try {
        const res = await fetch('/api/live-quotes');
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && Array.isArray(data.quotes)) {
          const currentBse = getBseMarketStatus();
          setMarketStatus(currentBse);

          const nextFlashes: Record<string, 'up' | 'down'> = {};

          setTickers(prevTickers => {
            const updatedTickers = prevTickers.map(t => {
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
            });

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

            // Evaluate target profit and stop-loss levels for all active holdings
            if (purchasedHoldings.length > 0) {
              purchasedHoldings.forEach(holding => {
                const quote = data.quotes.find((q: any) => q.symbol === holding.symbol);
                const currentPrice = quote ? quote.lastPrice : holding.purchasePrice;

                const targetPrice = holding.targetPriceNum || parseNumericPrice(holding.sellZone, holding.purchasePrice * 1.05);
                const stopLossPrice = holding.stopLossPriceNum || parseNumericPrice(holding.stopLoss, holding.purchasePrice * 0.985);

                // Target Met Alert
                if (currentPrice >= targetPrice) {
                  const alertKey = `target-${holding.id}-${Math.floor(targetPrice)}`;
                  setTriggeredAlertKeys(prevKeys => {
                    if (prevKeys.has(alertKey)) return prevKeys;
                    const newKeys = new Set(prevKeys);
                    newKeys.add(alertKey);

                    const alertObj: PriceAlert = {
                      id: `alert-target-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      holdingId: holding.id,
                      symbol: holding.symbol,
                      stockName: holding.stockName,
                      alertType: 'TARGET_MET',
                      triggerPrice: currentPrice,
                      targetOrSlPrice: targetPrice,
                      purchasePrice: holding.purchasePrice,
                      quantity: holding.quantity,
                      currency: holding.currency,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      message: `${holding.stockName} (${holding.symbol}) reached target exit price!`
                    };

                    setPriceAlerts(curr => [alertObj, ...curr.filter(a => a.symbol !== holding.symbol || a.alertType !== 'TARGET_MET')]);
                    return newKeys;
                  });
                }

                // Stop Loss Hit Alert
                if (currentPrice <= stopLossPrice) {
                  const alertKey = `sl-${holding.id}-${Math.floor(stopLossPrice)}`;
                  setTriggeredAlertKeys(prevKeys => {
                    if (prevKeys.has(alertKey)) return prevKeys;
                    const newKeys = new Set(prevKeys);
                    newKeys.add(alertKey);

                    const alertObj: PriceAlert = {
                      id: `alert-sl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      holdingId: holding.id,
                      symbol: holding.symbol,
                      stockName: holding.stockName,
                      alertType: 'STOP_LOSS_HIT',
                      triggerPrice: currentPrice,
                      targetOrSlPrice: stopLossPrice,
                      purchasePrice: holding.purchasePrice,
                      quantity: holding.quantity,
                      currency: holding.currency,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      message: `${holding.stockName} (${holding.symbol}) crossed stop-loss limit!`
                    };

                    setPriceAlerts(curr => [alertObj, ...curr.filter(a => a.symbol !== holding.symbol || a.alertType !== 'STOP_LOSS_HIT')]);
                    return newKeys;
                  });
                }
              });
            }

            return updatedTickers;
          });
        }
      } catch (err) {
        console.warn('Quote feed synchronization error:', err);
      }
    };

    // Initial fetch
    fetchLiveServerQuotes();

    // Determine polling frequency based strictly on BSE Market Hours:
    // When market is OPEN (9:15 AM - 3:30 PM IST, Mon-Fri): Poll every 5 seconds for live ticks.
    // When market is CLOSED: DO NOT generate false movements. Rates stay 100% frozen. Check status every 60s.
    const currentBse = getBseMarketStatus();
    if (currentBse.isOpen) {
      pollInterval = setInterval(fetchLiveServerQuotes, 5000);
    } else {
      pollInterval = setInterval(fetchLiveServerQuotes, 60000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [purchasedHoldings, marketStatus.isOpen]);

  // Modal Handlers
  const handleOpenBuyModal = (sig: MarketSignal) => {
    setBuyModalSignal(sig);
    setShowBuyModal(true);
  };

  const handleOpenSellModal = (holding: PurchasedHolding) => {
    setSellModalHolding(holding);
    setShowSellModal(true);
  };

  const handleConfirmSale = (entry: JournalEntry) => {
    const saleRevenue = entry.sellPrice * entry.quantity;

    // Refund capital with sale proceeds
    setCapital(prev => {
      const nextCap = prev + saleRevenue;
      localStorage.setItem('trader_ai_capital', nextCap.toString());
      return nextCap;
    });

    setJournalEntries(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('alpha_trader_journal_entries', JSON.stringify(updated));
      return updated;
    });

    setPurchasedHoldings(prev => {
      const updated = prev.filter(h => h.symbol !== entry.symbol);
      localStorage.setItem('alpha_trader_purchased_holdings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleConfirmPurchase = (symbol: string, stockName: string, purchasePrice: number, quantity: number, signal: MarketSignal) => {
    const totalCost = purchasePrice * quantity;

    // Deduct purchase cost from capital
    setCapital(prev => {
      const nextCap = Math.max(0, prev - totalCost);
      localStorage.setItem('trader_ai_capital', nextCap.toString());
      return nextCap;
    });

    const now = new Date();
    const newHolding: PurchasedHolding = {
      id: `holding-${symbol}-${Date.now()}`,
      symbol,
      stockName,
      purchasePrice,
      quantity,
      purchaseTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      purchaseDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      currency: signal.currency,
      sellZone: signal.sellZone,
      stopLoss: signal.stopLoss,
      probableTimeWindow: signal.probableTimeWindow
    };

    setPurchasedHoldings(prev => {
      const filtered = prev.filter(h => h.symbol !== symbol);
      const updated = [newHolding, ...filtered];
      localStorage.setItem('alpha_trader_purchased_holdings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveHolding = (symbol: string) => {
    const targetHolding = purchasedHoldings.find(h => h.symbol === symbol);
    if (targetHolding) {
      const refund = targetHolding.purchasePrice * targetHolding.quantity;
      setCapital(prev => {
        const nextCap = prev + refund;
        localStorage.setItem('trader_ai_capital', nextCap.toString());
        return nextCap;
      });
    }

    setPurchasedHoldings(prev => {
      const updated = prev.filter(h => h.symbol !== symbol);
      localStorage.setItem('alpha_trader_purchased_holdings', JSON.stringify(updated));
      return updated;
    });
  };

  // Add Manual Journal Entry
  const handleAddManualJournalEntry = (entry: JournalEntry) => {
    setJournalEntries(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('alpha_trader_journal_entries', JSON.stringify(updated));
      return updated;
    });
  };

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

  const handleSearchCustom = (querySymbol: string) => {
    const existing = tickers.find(t => t.symbol === querySymbol);
    if (existing) {
      handleSelectTickerFromTape(existing);
    } else {
      const newTicker: MarketTicker = {
        symbol: querySymbol,
        name: `${querySymbol} Asset`,
        region: querySymbol.endsWith('.NS') || querySymbol.endsWith('.BO') ? 'NSE_BSE' : 'US_MARKETS',
        exchange: 'BSE',
        lastPrice: 1500.00,
        change: 15.00,
        changePercent: 1.01,
        currency: 'INR',
        volume: '1.5M',
        dayHigh: 1520.00,
        dayLow: 1480.00
      };
      setTickers(prev => [newTicker, ...prev]);
      handleSelectTickerFromTape(newTicker);
    }
  };

  // Generate Single AI Signal via API
  const handleGenerateSignal = async (params: { ticker: MarketTicker; timeframe: string; riskProfile: string; strategy: string }) => {
    setIsLoading(true);

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
          chartData: generateCandlesticks(params.ticker.lastPrice, 32, params.timeframe, params.riskProfile)
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
          chartData: generateCandlesticks(params.ticker.lastPrice, 32, params.timeframe, params.riskProfile)
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

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans flex flex-col lg:flex-row antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* REAL-TIME PRICE ALERT TOAST NOTIFICATIONS */}
      <PriceAlertToast
        alerts={priceAlerts}
        onDismissAlert={handleDismissAlert}
        onDismissAll={handleDismissAllAlerts}
        onSellHoldingByAlert={handleSellHoldingByAlert}
        audioEnabled={audioEnabled}
      />

      {/* ========================================================================= */}
      {/* SIDEBAR NAVIGATION (Desktop permanent, Mobile slide drawer) */}
      {/* ========================================================================= */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        capital={capital}
        onUpdateCapital={updateCapital}
        onAddCapital={handleAddCapital}
        capitalRecords={capitalRecords}
        currency={currency}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        holdingsCount={purchasedHoldings.length}
        watchlistCount={watchlistSymbols.length}
        alertsCount={priceAlerts.length}
        totalSignalsCount={savedSignals.length}
        istTime={marketStatus.istTimeFormatted}
        tradingMode={tradingMode}
        onToggleTradingMode={toggleTradingMode}
        isMarketOpen={marketStatus.isOpen}
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
              purchasedHoldings={purchasedHoldings}
              watchlistSymbols={watchlistSymbols}
              onToggleWatchlist={handleToggleWatchlist}
              selectedStockSymbol={currentSignal?.symbol}
              onSelectSignal={handleSelectSignalForStudio}
              isLoading={isLoading}
              audioEnabled={audioEnabled}
              onOpenCalculator={handleOpenCalcForSignal}
              onMarkAsBought={handleOpenBuyModal}
              onRemoveHolding={handleRemoveHolding}
              onSellHolding={handleOpenSellModal}
              capital={capital}
              currency={currency}
              tradingMode={tradingMode}
              onToggleTradingMode={toggleTradingMode}
            />
          )}

          {/* 1.5. NEWS SENTIMENT & AI UPGRADE PREDICTIONS PAGE */}
          {activePage === 'news-predictions' && (
            <NewsPredictionsView
              tickers={tickers}
              onSelectTicker={handleSelectTickerFromTape}
              onSelectSignalBySymbol={(sym) => {
                const tk = tickers.find(t => t.symbol === sym);
                if (tk) handleSelectTickerFromTape(tk);
              }}
              onOpenCalculatorForPrediction={handleOpenCalcForPrediction}
              purchasedHoldings={purchasedHoldings}
              capital={capital}
              currency={currency}
              onNavigatePage={setActivePage}
            />
          )}

          {/* 2. WATCHLIST SECTION (Bookmarked Tickers for Non-Holdings & Tracking) */}
          {activePage === 'watchlist' && (
            <WatchlistView
              tickers={tickers}
              signals={savedSignals}
              purchasedHoldings={purchasedHoldings}
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
              onOpenBuyModal={handleOpenBuyModal}
              onOpenCalculator={handleOpenCalcForSignal}
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
              purchasedHoldings={purchasedHoldings}
              onMarkAsBought={handleOpenBuyModal}
              onOpenSellModal={handleOpenSellModal}
              onOpenCalculatorForSignal={handleOpenCalcForSignal}
              capital={capital}
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

          {/* 5. PORTFOLIO & HOLDINGS PAGE */}
          {activePage === 'portfolio' && (
            <PortfolioView
              purchasedHoldings={purchasedHoldings}
              capital={capital}
              currency={currency}
              journalEntries={journalEntries}
              onSellHolding={handleOpenSellModal}
              onRemoveHolding={handleRemoveHolding}
              onNavigateToStudio={(sym) => {
                const sig = savedSignals.find(s => s.symbol === sym);
                if (sig) handleSelectSignalForStudio(sig);
                else {
                  const tk = tickers.find(t => t.symbol === sym);
                  if (tk) handleSelectTickerFromTape(tk);
                }
              }}
              onNavigateToMarketHub={() => setActivePage('market-hub')}
              onNavigateToJournal={() => setActivePage('journal')}
              liveSignals={savedSignals}
            />
          )}

          {/* 6. TRADER'S JOURNAL PAGE */}
          {activePage === 'journal' && (
            <JournalView
              journalEntries={journalEntries}
              purchasedHoldings={purchasedHoldings}
              capital={capital}
              currency={currency}
              onAddManualEntry={handleAddManualJournalEntry}
              onSellHolding={handleOpenSellModal}
            />
          )}

          {/* 7. RISK & POSITION CALCULATOR PAGE */}
          {activePage === 'risk-calculator' && (
            <RiskCalculatorView
              capital={capital}
              currency={currency}
              signals={savedSignals}
              tickers={tickers}
              onNavigateToStudio={(sym) => {
                const sig = savedSignals.find(s => s.symbol === sym);
                if (sig) handleSelectSignalForStudio(sig);
              }}
              onOpenBuyModal={handleOpenBuyModal}
            />
          )}

          {/* 8. MARKET CLOCKS & BSE CALENDAR PAGE */}
          {activePage === 'market-clocks' && (
            <MarketClocksView />
          )}

          {/* 9. DIRECT SUPPORT & CONTACT TANMAY PAGE */}
          {activePage === 'support' && (
            <SupportView onSelectPage={setActivePage} />
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS (Triggered on demand across any view) */}
      {/* ========================================================================= */}
      <MarkAsBoughtModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        signal={buyModalSignal}
        onConfirmPurchase={handleConfirmPurchase}
      />

      <MarkAsSoldModal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        holding={sellModalHolding}
        onConfirmSale={handleConfirmSale}
      />

      <PositionCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        capital={capital}
        currency={currency}
        initialSignal={calculatorSignal}
      />

      {/* Floating Hovering Mini Assistant */}
      <MiniAssistant
        signals={savedSignals}
        purchasedHoldings={purchasedHoldings}
        capital={capital}
        currency={currency}
        onSelectSignal={handleSelectSignalForStudio}
        onOpenJournal={() => setActivePage('journal')}
        onOpenCalculator={() => setActivePage('risk-calculator')}
        tradingMode={tradingMode}
        onToggleTradingMode={toggleTradingMode}
      />

    </div>
  );
}
