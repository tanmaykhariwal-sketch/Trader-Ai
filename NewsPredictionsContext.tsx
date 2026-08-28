/**
 * NewsPredictionsContext: Dedicated React Context for storing fetched daily global financial headlines,
 * managing BSE-relevant sentiment impact filtering, and orchestrating AI stock upgrade predictions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GlobalFinancialHeadline, 
  BseSentimentMetrics, 
  StockPrediction, 
  HeadlineCategory 
} from '../types';
import { 
  fetchAndParseDailyHeadlines, 
  filterBseRelevantHeadlines, 
  calculateBseMarketSentiment, 
  FetchHeadlinesOptions 
} from '../utils/newsAggregator';

export type BseImpactFilterOption = 'ALL' | 'DIRECT_BSE' | 'HIGH_IMPACT' | 'BULLISH' | 'BEARISH' | 'MACRO_SPILLOVER';

export interface NewsPredictionsContextType {
  // Data
  allHeadlines: GlobalFinancialHeadline[];
  bseHeadlines: GlobalFinancialHeadline[];
  filteredHeadlines: GlobalFinancialHeadline[];
  sentimentMetrics: BseSentimentMetrics;
  predictions: StockPrediction[];
  
  // Status
  isLoading: boolean;
  isLoadingHeadlines: boolean;
  isLoadingPredictions: boolean;
  error: string | null;
  lastRefreshedTime: string;

  // Filter States
  activeCategory: HeadlineCategory | 'ALL';
  setActiveCategory: (cat: HeadlineCategory | 'ALL') => void;
  bseImpactFilter: BseImpactFilterOption;
  setBseImpactFilter: (filter: BseImpactFilterOption) => void;
  sentimentFilter: 'ALL' | 'Bullish' | 'Bearish' | 'Neutral';
  setSentimentFilter: (sentiment: 'ALL' | 'Bullish' | 'Bearish' | 'Neutral') => void;
  minBseImpactScore: number;
  setMinBseImpactScore: (score: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBseSymbol: string | null;
  setSelectedBseSymbol: (symbol: string | null) => void;

  // Actions
  refreshHeadlines: (options?: FetchHeadlinesOptions) => Promise<void>;
  refreshPredictions: () => Promise<void>;
  refreshAll: () => Promise<void>;
  resetFilters: () => void;
}

const defaultSentimentMetrics: BseSentimentMetrics = {
  overall: 'Bullish',
  score: 72,
  bullishPercentage: 80,
  bullishCount: 8,
  bearishCount: 0,
  neutralCount: 2,
  totalParsed: 10,
  bseRelevantCount: 9,
  institutionalFlowBias: 'Net Inflow (+₹3,420 Cr DII / FII)',
  marketBreadth: '78% Advancing to Declining Ratio',
  dominantTheme: 'Domestic Institutional Liquidity'
};

export const NewsPredictionsContext = createContext<NewsPredictionsContextType | undefined>(undefined);

export interface NewsPredictionsProviderProps {
  children: React.ReactNode;
  initialPredictions?: StockPrediction[];
  pollIntervalMs?: number;
}

export const NewsPredictionsProvider: React.FC<NewsPredictionsProviderProps> = ({
  children,
  initialPredictions,
  pollIntervalMs = 30000
}) => {
  // Headlines and Sentiment
  const [allHeadlines, setAllHeadlines] = useState<GlobalFinancialHeadline[]>([]);
  const [sentimentMetrics, setSentimentMetrics] = useState<BseSentimentMetrics>(defaultSentimentMetrics);
  const [predictions, setPredictions] = useState<StockPrediction[]>(initialPredictions || []);

  // Loading & Diagnostics
  const [isLoadingHeadlines, setIsLoadingHeadlines] = useState<boolean>(true);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('');

  // Interactive Filter States
  const [activeCategory, setActiveCategory] = useState<HeadlineCategory | 'ALL'>('ALL');
  const [bseImpactFilter, setBseImpactFilter] = useState<BseImpactFilterOption>('ALL');
  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | 'Bullish' | 'Bearish' | 'Neutral'>('ALL');
  const [minBseImpactScore, setMinBseImpactScore] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBseSymbol, setSelectedBseSymbol] = useState<string | null>(null);

  // Fetch and parse headlines utility wrapper
  const refreshHeadlines = useCallback(async (options: FetchHeadlinesOptions = {}) => {
    setIsLoadingHeadlines(true);
    setError(null);
    try {
      const parsed = await fetchAndParseDailyHeadlines({
        category: options.category || (activeCategory !== 'ALL' ? activeCategory : undefined),
        symbol: options.symbol || (selectedBseSymbol || undefined),
        limit: options.limit || 30,
        forceRefresh: options.forceRefresh
      });

      setAllHeadlines(parsed);

      // Recalculate BSE aggregate market metrics
      const metrics = calculateBseMarketSentiment(parsed);
      setSentimentMetrics(metrics);

      setLastRefreshedTime(new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    } catch (err: any) {
      console.error('Failed to load global financial headlines:', err);
      setError(err?.message || 'Failed to fetch global financial headlines');
    } finally {
      setIsLoadingHeadlines(false);
    }
  }, [activeCategory, selectedBseSymbol]);

  // Fetch AI Stock Predictions from API
  const refreshPredictions = useCallback(async () => {
    setIsLoadingPredictions(true);
    try {
      const res = await fetch('/api/stock-predictions');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
        }
      }
    } catch (err: any) {
      console.warn('Could not load stock predictions in context:', err);
    } finally {
      setIsLoadingPredictions(false);
    }
  }, []);

  // Combined refresh
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshHeadlines({ forceRefresh: true }), refreshPredictions()]);
  }, [refreshHeadlines, refreshPredictions]);

  // Reset all filters to default
  const resetFilters = useCallback(() => {
    setActiveCategory('ALL');
    setBseImpactFilter('ALL');
    setSentimentFilter('ALL');
    setMinBseImpactScore(0);
    setSearchQuery('');
    setSelectedBseSymbol(null);
  }, []);

  // Initial load
  useEffect(() => {
    refreshHeadlines();
    refreshPredictions();

    if (pollIntervalMs > 0) {
      const timer = setInterval(() => {
        refreshHeadlines();
      }, pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [refreshHeadlines, refreshPredictions, pollIntervalMs]);

  // Memoized BSE-relevant headlines
  const bseHeadlines = useMemo(() => {
    return allHeadlines.filter(h => h.isBseRelevant);
  }, [allHeadlines]);

  // Memoized headlines filtered by user settings with BSE-relevant sentiment impact
  const filteredHeadlines = useMemo(() => {
    let result = allHeadlines;

    // Apply BSE Impact filter mode
    if (bseImpactFilter === 'DIRECT_BSE') {
      result = result.filter(h => h.bseRelevance === 'Direct BSE Stock');
    } else if (bseImpactFilter === 'HIGH_IMPACT') {
      result = result.filter(h => h.bseImpactScore >= 70);
    } else if (bseImpactFilter === 'BULLISH') {
      result = result.filter(h => h.bseSentimentImpact.includes('Bullish'));
    } else if (bseImpactFilter === 'BEARISH') {
      result = result.filter(h => h.bseSentimentImpact.includes('Bearish'));
    } else if (bseImpactFilter === 'MACRO_SPILLOVER') {
      result = result.filter(h => h.bseRelevance === 'Global Spillover' || h.bseRelevance === 'Macro India Impact');
    }

    // Apply utility filter
    return filterBseRelevantHeadlines(result, {
      minBseImpact: minBseImpactScore,
      category: activeCategory !== 'ALL' ? activeCategory : undefined,
      sentiment: sentimentFilter,
      symbol: selectedBseSymbol || undefined,
      searchQuery: searchQuery
    });
  }, [
    allHeadlines, 
    bseImpactFilter, 
    minBseImpactScore, 
    activeCategory, 
    sentimentFilter, 
    selectedBseSymbol, 
    searchQuery
  ]);

  const value: NewsPredictionsContextType = {
    allHeadlines,
    bseHeadlines,
    filteredHeadlines,
    sentimentMetrics,
    predictions,
    isLoading: isLoadingHeadlines || isLoadingPredictions,
    isLoadingHeadlines,
    isLoadingPredictions,
    error,
    lastRefreshedTime,
    activeCategory,
    setActiveCategory,
    bseImpactFilter,
    setBseImpactFilter,
    sentimentFilter,
    setSentimentFilter,
    minBseImpactScore,
    setMinBseImpactScore,
    searchQuery,
    setSearchQuery,
    selectedBseSymbol,
    setSelectedBseSymbol,
    refreshHeadlines,
    refreshPredictions,
    refreshAll,
    resetFilters
  };

  return (
    <NewsPredictionsContext.Provider value={value}>
      {children}
    </NewsPredictionsContext.Provider>
  );
};

/**
 * Hook to consume NewsPredictionsContext within NewsPredictionsView or any connected component
 */
export const useNewsPredictionsContext = (): NewsPredictionsContextType => {
  const context = useContext(NewsPredictionsContext);
  if (!context) {
    throw new Error('useNewsPredictionsContext must be used within a NewsPredictionsProvider');
  }
  return context;
};
