export type TradingMode = 'simple' | 'advanced';

export type AppPage =
  | 'market-hub'
  | 'stock-studio'
  | 'advanced-analytics'
  | 'news-predictions'
  | 'watchlist'
  | 'risk-calculator'
  | 'market-clocks'
  | 'support';

export type MarketRegion = 'NSE_BSE' | 'US_MARKETS' | 'GLOBAL_COMMODITIES' | 'GLOBAL_INDICES';

export type SignalType = 
  | 'Bullish Breakout' 
  | 'Bearish Reversal' 
  | 'Demand Zone Dip' 
  | 'Supply Zone Short' 
  | 'Consolidation Breakout'
  | 'Liquidity Grab Reversal'
  | 'STRONG UPGRADE'
  | 'BULLISH OUTPERFORM'
  | 'HOLD / CONSOLIDATE'
  | 'DOWNGRADE WATCH'
  | 'UNDERPERFORM'
  | string;

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type SignalStatus = 'Pending Window' | 'Active Entry Zone' | 'Target 1 Met' | 'Target 2 Met' | 'Stop Loss Hit' | 'Expired';

export interface MarketTicker {
  symbol: string;
  name: string;
  region: MarketRegion;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE' | 'COMEX' | 'MCX';
  lastPrice: number;
  change: number;
  changePercent: number;
  currency: 'INR' | 'USD';
  volume: string;
  dayHigh: number;
  dayLow: number;
  isPopular?: boolean;
}

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  sma50?: number;
  sma200?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  patternLabel?: string;
  isBullish?: boolean;
}

export interface CandlestickPatternDetection {
  patternName: string;
  type: 'Bullish' | 'Bearish' | 'Neutral';
  strength: 'High' | 'Moderate' | 'Low';
  description: string;
  confirmationLevel: number; // 0 to 100
  candleIndex?: number;
  recommendation: string;
  actionableTarget?: string;
}

export type BseRelevanceType = 'Direct BSE Stock' | 'Macro India Impact' | 'Global Spillover' | 'General Global';
export type BseSentimentImpactType = 'High Bullish' | 'Moderate Bullish' | 'Neutral' | 'Moderate Bearish' | 'High Bearish';
export type HeadlineCategory = 'Global Macro' | 'BSE Equities' | 'Energy & Commodities' | 'Banking & Rates' | 'Tech & AI' | 'Forex & Trade';

export interface GlobalFinancialHeadline {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  publishedTimeAgo: string;
  snippet: string;
  category: HeadlineCategory;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sentimentScore: number; // -100 to +100
  bseImpactScore: number; // 0 to 100 (BSE relevance weight)
  bseRelevance: BseRelevanceType;
  bseSentimentImpact: BseSentimentImpactType;
  impactReasoning: string;
  affectedBseSymbols: string[];
  catalystType: 'Earnings' | 'Policy / RBI' | 'Institutional Flow' | 'Macro' | 'Order Book' | 'Breakout' | 'Corporate Action';
  isBseRelevant: boolean;
}

export interface BseSentimentMetrics {
  overall: 'Bullish' | 'Bearish' | 'Neutral';
  score: number; // -100 to +100
  bullishPercentage: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  totalParsed: number;
  bseRelevantCount: number;
  institutionalFlowBias: string;
  marketBreadth: string;
  dominantTheme: string;
}

export interface NewsSentimentItem {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedTime: string;
  timestamp: string;
  snippet: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sentimentScore: number; // -100 to +100
  impact: 'High' | 'Medium' | 'Low';
  impactHorizon: 'Intraday' | 'Swing' | 'Positional';
  relatedSymbols: string[];
  catalystType: 'Earnings' | 'Policy / RBI' | 'Institutional Flow' | 'Macro' | 'Order Book' | 'Breakout' | 'Corporate Action';
  bseImpactScore?: number;
  bseSentimentImpact?: BseSentimentImpactType;
  impactReasoning?: string;
}

export interface StockPrediction {
  id: string;
  symbol: string;
  stockName: string;
  currentPrice: number;
  currency: 'INR' | 'USD';
  predictedAction: 'STRONG UPGRADE' | 'BULLISH OUTPERFORM' | 'HOLD / CONSOLIDATE' | 'DOWNGRADE WATCH' | 'UNDERPERFORM';
  previousRating: string;
  confidenceScore: number; // 0 to 100
  priceTargetT1: number;
  priceTargetT2: number;
  stopLoss: number;
  expectedReturnPct: number;
  timeHorizon: string; // e.g. "1–3 Weeks"
  keyCatalysts: string[];
  candlestickPatternConfluence: string;
  newsSentimentConfluence: string;
  riskScore: number; // 1 to 10
  suggestedAllocationPct: number; // e.g. 2.5%
  updatedAt: string;
}

export interface ConfluenceFactor {
  name: string;
  score: number; // 0 to 100
  weight: number;
  status: 'Bullish' | 'Bearish' | 'Neutral';
  details: string;
}

export interface MarketSignal {
  id: string;
  timestamp: string;
  stockName: string;
  symbol: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE' | 'COMEX' | 'MCX';
  currency: 'INR' | 'USD';
  signalType: SignalType;
  currentPrice: number;
  buyZone: string; // e.g. "2,450 – 2,460"
  probableTimeWindow: string; // e.g. "10:00 – 10:30 AM IST"
  sellZone: string; // Target 1 & 2
  stopLoss: string;
  riskLevel: RiskLevel;
  confidenceScore: number; // e.g. 78%
  status: SignalStatus;
  
  // Output Schema Sections strictly requested
  marketOverview: string;
  candlestickInsights: {
    patternsDetected: string[];
    implications: string;
    supportResistanceZones: string[];
    liquidityNotes: string;
  };
  technicalSignals: {
    rsiReading: string;
    macdReading: string;
    movingAverages: string;
    volumeAnalysis: string;
    confluenceScore: number;
    confluenceSummary: string;
  };
  riskAssessment: {
    level: RiskLevel;
    reasoning: string;
    suggestedStopLossPercent: number;
    recommendedPositionSizePercent: number;
  };
  possibleScenarios: {
    shortTermIntraday: string;
    mediumTermWeekly: string;
    longTermOutlook: string;
  };

  chartData?: CandlestickData[];
}

export interface ExchangeStatus {
  name: string;
  code: string;
  region: string;
  timeZone: string;
  openTimeIST: string;
  closeTimeIST: string;
  isOpen: boolean;
  statusText: string; // "Open", "Closed", "Pre-Market", "After-Hours"
  nextSessionIn: string;
}

export interface RiskCalculatorInput {
  capital: number;
  currency: 'INR' | 'USD';
  riskPercentage: number; // e.g. 1.0 or 2.0
  entryPrice: number;
  stopLossPrice: number;
  targetPrice: number;
}

export interface RiskCalculatorResult {
  maxRiskAmount: number;
  perShareRisk: number;
  positionSizeQty: number;
  totalPositionValue: number;
  potentialProfitAmount: number;
  riskRewardRatio: number; // e.g. 2.8
  isAcceptableRR: boolean;
  // True when stop loss / target aren't on the correct sides of entry for a
  // long (stopLoss < entry < target) — e.g. stop loss set ABOVE entry. The
  // math still runs (Math.abs makes it produce a number either way) but the
  // "risk"/"reward" labels would be describing a structurally backwards
  // trade, not a real one.
  isInvertedSetup: boolean;
}


