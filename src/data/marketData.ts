import { MarketTicker, ExchangeStatus, MarketSignal, CandlestickData, JournalEntry } from '../types';

export const INITIAL_TICKERS: MarketTicker[] = [
  // Bombay Stock Exchange (BSE) Equities & Benchmark Index
  { symbol: 'SENSEX', name: 'BSE SENSEX Index', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 76552.55, change: -1103.55, changePercent: -1.42, currency: 'INR', volume: '1.9B', dayHigh: 77694.97, dayLow: 77088.74, isPopular: true },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 1289.25, change: -9.75, changePercent: -0.75, currency: 'INR', volume: '16.2M', dayHigh: 1308.55, dayLow: 1285.00, isPopular: true },
  { symbol: 'TCS', name: 'Tata Consultancy Services', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 2255.70, change: -15.30, changePercent: -0.67, currency: 'INR', volume: '4.2M', dayHigh: 2283.90, dayLow: 2243.75, isPopular: true },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 714.75, change: -12.35, changePercent: -1.70, currency: 'INR', volume: '22.4M', dayHigh: 728.95, dayLow: 710.00, isPopular: true },
  { symbol: 'INFY', name: 'Infosys Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 1111.00, change: -9.80, changePercent: -0.87, currency: 'INR', volume: '11.8M', dayHigh: 1130.65, dayLow: 1107.15, isPopular: true },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 1446.50, change: 15.80, changePercent: 1.10, currency: 'INR', volume: '14.1M', dayHigh: 1453.50, dayLow: 1430.80, isPopular: true },
  { symbol: 'SBIN', name: 'State Bank of India', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 1043.65, change: -10.15, changePercent: -0.96, currency: 'INR', volume: '15.6M', dayHigh: 1054.65, dayLow: 1041.00, isPopular: true },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 1886.95, change: -18.05, changePercent: -0.95, currency: 'INR', volume: '8.4M', dayHigh: 1914.75, dayLow: 1881.45, isPopular: true },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 4036.00, change: -7.80, changePercent: -0.19, currency: 'INR', volume: '3.8M', dayHigh: 4070.00, dayLow: 4022.00, isPopular: true },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 3156.40, change: 31.40, changePercent: 1.00, currency: 'INR', volume: '5.2M', dayHigh: 3168.00, dayLow: 3125.00, isPopular: true },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 13466.00, change: 85.00, changePercent: 0.64, currency: 'INR', volume: '1.2M', dayHigh: 13540.00, dayLow: 13380.00, isPopular: true },
  { symbol: 'ITC', name: 'ITC Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 268.40, change: -2.45, changePercent: -0.90, currency: 'INR', volume: '12.8M', dayHigh: 271.20, dayLow: 268.00, isPopular: true },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 1255.05, change: 8.50, changePercent: 0.68, currency: 'INR', volume: '9.4M', dayHigh: 1264.00, dayLow: 1245.00 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Passenger Vehicles', region: 'NSE_BSE', exchange: 'BSE', lastPrice: 986.50, change: 11.30, changePercent: 1.16, currency: 'INR', volume: '18.5M', dayHigh: 994.00, dayLow: 976.20 }
];

export const EXCHANGE_SCHEDULES: ExchangeStatus[] = [
  {
    name: 'Bombay Stock Exchange (BSE)',
    code: 'BSE',
    region: 'Mumbai, India',
    timeZone: 'Asia/Kolkata (IST)',
    openTimeIST: '09:15 AM',
    closeTimeIST: '03:30 PM',
    isOpen: true,
    statusText: 'Open (BSE Live Trading)',
    nextSessionIn: 'Closes at 03:30 PM IST'
  }
];

export function generateCandlesticks(
  basePrice: number, 
  count: number = 30, 
  timeframe: string = '15m',
  riskProfile: string = 'Moderate'
): CandlestickData[] {
  const data: CandlestickData[] = [];
  
  // Adjust volatility and span according to timeframe and risk
  let volatility = 0.012;
  if (riskProfile === 'Conservative') volatility = 0.007;
  else if (riskProfile === 'Aggressive') volatility = 0.022;

  // Time step in milliseconds
  let stepMs = 15 * 60 * 1000;
  let isDailyOrWeekly = false;

  if (timeframe === '5m') {
    stepMs = 5 * 60 * 1000;
    volatility *= 0.75; // Shorter candles on 5m
  } else if (timeframe === '15m') {
    stepMs = 15 * 60 * 1000;
  } else if (timeframe === '1h') {
    stepMs = 60 * 60 * 1000;
    volatility *= 1.4;
  } else if (timeframe === '1D') {
    stepMs = 24 * 60 * 60 * 1000;
    volatility *= 2.2;
    isDailyOrWeekly = true;
  } else if (timeframe === '1W') {
    stepMs = 7 * 24 * 60 * 60 * 1000;
    volatility *= 3.5;
    isDailyOrWeekly = true;
  }

  let currentPrice = basePrice * (1 - (volatility * 3));
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const timeDate = new Date(now.getTime() - i * stepMs);
    let timeStr: string;

    if (isDailyOrWeekly) {
      timeStr = timeDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else {
      timeStr = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const change = (Math.random() - 0.47) * volatility * currentPrice;
    const open = Number(currentPrice.toFixed(2));
    const close = Number((open + change).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * volatility * currentPrice * 0.6).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * volatility * currentPrice * 0.6).toFixed(2));
    const volume = Math.floor(10000 + Math.random() * 90000);

    const isBullish = close >= open;

    // Pattern label on specific candles
    let patternLabel: string | undefined;
    if (i === 4 && isBullish) {
      patternLabel = timeframe === '5m' ? '5m Momentum Wick' : timeframe === '1D' ? 'Daily Hammer' : 'Bullish Engulfing';
    }
    if (i === 10 && !isBullish) {
      patternLabel = timeframe === '5m' ? 'Micro Trap' : 'Liquidity Sweep';
    }
    if (i === 1) {
      patternLabel = timeframe === '1D' ? 'Breakout Close' : 'Demand Confirmation';
    }

    currentPrice = close;

    data.push({
      time: timeStr,
      open,
      high,
      low,
      close,
      volume,
      isBullish,
      patternLabel
    });
  }

  // Calculate Moving Averages and RSI
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    data[i].ema20 = Number((data[i].close * 0.15 + (i > 0 ? (data[i - 1].ema20 || data[i].close) * 0.85 : data[i].close)).toFixed(2));
    data[i].sma50 = Number((sum / (i + 1)).toFixed(2));
    data[i].rsi = Number((45 + Math.sin(i * 0.4) * 20 + (Math.random() * 5)).toFixed(1));
    data[i].macd = Number((Math.sin(i * 0.3) * 2.5).toFixed(2));
    data[i].signal = Number((Math.sin(i * 0.3 - 0.2) * 2.0).toFixed(2));
    data[i].histogram = Number(((data[i].macd || 0) - (data[i].signal || 0)).toFixed(2));
  }

  return data;
}

export const INITIAL_SAMPLE_SIGNALS: MarketSignal[] = [
  {
    id: 'sig-rel-01',
    timestamp: 'Just now',
    stockName: 'Reliance Industries',
    symbol: 'RELIANCE',
    exchange: 'BSE',
    currency: 'INR',
    signalType: 'Bullish Breakout',
    currentPrice: 1289.25,
    buyZone: '₹1,282 – ₹1,292',
    probableTimeWindow: '10:15 – 10:45 AM IST',
    sellZone: 'T1: ₹1,320 | T2: ₹1,345',
    stopLoss: '₹1,268',
    riskLevel: 'Medium',
    confidenceScore: 92,
    status: 'Active Entry Zone',
    marketOverview: 'BSE SENSEX finding strong dip buying support around 76,550 with aggressive institutional accumulation in Energy and Heavyweights.',
    candlestickInsights: {
      patternsDetected: ['15-Min Bullish Engulfing', 'Morning Star at Demand Base', 'Fair Value Gap (FVG) at ₹1,285'],
      implications: 'Buyers absorbed all overhead selling pressure near ₹1,280. High likelihood of expansion towards ₹1,320 resistance zone.',
      supportResistanceZones: ['Immediate Support: ₹1,280', 'Key Demand Cluster: ₹1,268 – ₹1,275', 'Primary Resistance: ₹1,320'],
      liquidityNotes: 'Liquidity sweep completed below ₹1,278 prior to current impulse wave.'
    },
    technicalSignals: {
      rsiReading: '62.5 (Ascending from 48 neutral zone, no bearish divergence)',
      macdReading: 'Bullish Crossover above signal line on 15m & 1h timeframes',
      movingAverages: 'Price holding firmly above 20 EMA (₹1,284) and 50 SMA (₹1,276)',
      volumeAnalysis: '1.9x average 15m volume on green breakout candle',
      confluenceScore: 92,
      confluenceSummary: '5/5 Technical pillars aligned: Trend + Candlestick + Volume + EMA Support + MACD Momentum.'
    },
    riskAssessment: {
      level: 'Medium',
      reasoning: 'Trade aligned with primary daily uptrend. Tight risk definition at ₹1,268 (1.6% stop loss distance). Excellent 1:2.9 Risk-to-Reward ratio.',
      suggestedStopLossPercent: 1.6,
      recommendedPositionSizePercent: 2.0
    },
    possibleScenarios: {
      shortTermIntraday: 'High probability test of ₹1,320 during active session if volume remains elevated.',
      mediumTermWeekly: 'Breakout above ₹1,320 targets swing highs at ₹1,360.',
      longTermOutlook: 'Sustained institutional accumulation with structural bullish trend intact.'
    },
    chartData: generateCandlesticks(1289.25, 32)
  },
  {
    id: 'sig-infy-02',
    timestamp: '5 mins ago',
    stockName: 'Infosys Ltd',
    symbol: 'INFY',
    exchange: 'BSE',
    currency: 'INR',
    signalType: 'Bullish Breakout',
    currentPrice: 1111.00,
    buyZone: '₹1,105 – ₹1,114',
    probableTimeWindow: '10:30 – 11:00 AM IST',
    sellZone: 'T1: ₹1,142 | T2: ₹1,170',
    stopLoss: '₹1,092',
    riskLevel: 'Low',
    confidenceScore: 89,
    status: 'Active Entry Zone',
    marketOverview: 'IT sector valuation discount driving institutional inflows into large-cap exporters with strong multi-year dollar revenue tailwinds.',
    candlestickInsights: {
      patternsDetected: ['Cup & Handle Formation on 30m', 'Bullish Piercing Candle', 'Order Block Defence at ₹1,102'],
      implications: 'High volume accumulation clearing overhead selling resistance.',
      supportResistanceZones: ['Demand Base: ₹1,100 – ₹1,106', 'Immediate Target: ₹1,142', 'Major Resistance: ₹1,180'],
      liquidityNotes: 'Clean order block bounce with high buy volume.'
    },
    technicalSignals: {
      rsiReading: '59.8 (Healthy bullish momentum without overbought stretch)',
      macdReading: 'Expanding positive histogram with upward sloping signal line',
      movingAverages: 'Trading above 20 EMA (₹1,106) and 50 SMA (₹1,098)',
      volumeAnalysis: '1.8x volume surge on 15m breakout bar',
      confluenceScore: 89,
      confluenceSummary: 'IT Momentum + Order Block Support + Moving Average Stack'
    },
    riskAssessment: {
      level: 'Low',
      reasoning: 'Well-defined risk at ₹1,092 stop loss giving a favorable 1:2.6 Risk-to-Reward profile.',
      suggestedStopLossPercent: 1.7,
      recommendedPositionSizePercent: 2.5
    },
    possibleScenarios: {
      shortTermIntraday: 'Expansion towards ₹1,142 target during morning session.',
      mediumTermWeekly: 'Testing swing high at ₹1,170.',
      longTermOutlook: 'Strong balance sheet with steady dividend yield and global enterprise demand.'
    },
    chartData: generateCandlesticks(1111.00, 32)
  },
  {
    id: 'sig-icici-03',
    timestamp: '12 mins ago',
    stockName: 'ICICI Bank',
    symbol: 'ICICIBANK',
    exchange: 'BSE',
    currency: 'INR',
    signalType: 'Bullish Breakout',
    currentPrice: 1446.50,
    buyZone: '₹1,438 – ₹1,450',
    probableTimeWindow: '10:45 – 11:15 AM IST',
    sellZone: 'T1: ₹1,485 | T2: ₹1,520',
    stopLoss: '₹1,422',
    riskLevel: 'Low',
    confidenceScore: 90,
    status: 'Active Entry Zone',
    marketOverview: 'Leading private banking outperformer driving BSE Bankex to fresh session highs with heavy foreign and domestic institutional buying.',
    candlestickInsights: {
      patternsDetected: ['15-Min Bullish Engulfing', 'Pin-bar Reversal near VWAP', 'Higher Low Structure on 1H'],
      implications: 'Strong buyer absorption near ₹1,435 support level with sellers exhausting inventory.',
      supportResistanceZones: ['Demand Zone: ₹1,430 – ₹1,438', 'Immediate Resistance: ₹1,485', 'Major Ceiling: ₹1,530'],
      liquidityNotes: 'Liquidity sweep below ₹1,428 completed before institutional surge.'
    },
    technicalSignals: {
      rsiReading: '64.2 (Strong bullish expansion)',
      macdReading: 'Histogram turning green above signal line with widening divergence',
      movingAverages: 'Holding 20 EMA at ₹1,436 and 50 EMA at ₹1,425',
      volumeAnalysis: '2.1x average 15m volume buildup on upward ticks',
      confluenceScore: 90,
      confluenceSummary: 'Confluence of Banking Sector Strength + VWAP Support + EMA alignment.'
    },
    riskAssessment: {
      level: 'Low',
      reasoning: 'Well-defined risk profile near key demand level with 1:2.8 Risk-Reward setup.',
      suggestedStopLossPercent: 1.7,
      recommendedPositionSizePercent: 2.5
    },
    possibleScenarios: {
      shortTermIntraday: 'Rally towards ₹1,485 intraday target.',
      mediumTermWeekly: 'Testing ₹1,520 resistance on sustained delivery volume.',
      longTermOutlook: 'Industry-leading ROE and credit growth trajectory.'
    },
    chartData: generateCandlesticks(1446.50, 32)
  },
  {
    id: 'sig-tcs-04',
    timestamp: '25 mins ago',
    stockName: 'TCS',
    symbol: 'TCS',
    exchange: 'BSE',
    currency: 'INR',
    signalType: 'Demand Zone Dip',
    currentPrice: 2255.70,
    buyZone: '₹2,242 – ₹2,260',
    probableTimeWindow: '11:00 – 11:30 AM IST',
    sellZone: 'T1: ₹2,310 | T2: ₹2,360',
    stopLoss: '₹2,218',
    riskLevel: 'Medium',
    confidenceScore: 86,
    status: 'Active Entry Zone',
    marketOverview: 'IT mega-cap finding firm support at institutional demand zone on BSE with rising deliverable quantity.',
    candlestickInsights: {
      patternsDetected: ['Piercing Pattern on 15m', 'Support Rebound at ₹2,245', 'Doji Consolidation at Base'],
      implications: 'Rebound off demand cluster with low selling volume indicating supply depletion.',
      supportResistanceZones: ['Support: ₹2,240', 'Resistance: ₹2,310', 'Secondary Resistance: ₹2,360'],
      liquidityNotes: 'Absorption completed at weekly pivot.'
    },
    technicalSignals: {
      rsiReading: '52.4 (Recovering smoothly from oversold 40 level)',
      macdReading: 'Flattening MACD histogram preparing for bullish cross',
      movingAverages: '50 SMA support holding firmly at ₹2,235',
      volumeAnalysis: 'Decreasing sell volume during pullback followed by accumulation ticks',
      confluenceScore: 86,
      confluenceSummary: 'Support bounce + RSI recovery + structural support holding.'
    },
    riskAssessment: {
      level: 'Medium',
      reasoning: 'Clear risk definition at ₹2,218 with 1:2.4 Risk-Reward potential.',
      suggestedStopLossPercent: 1.6,
      recommendedPositionSizePercent: 2.0
    },
    possibleScenarios: {
      shortTermIntraday: 'Targeting ₹2,310 as buyers re-enter the session.',
      mediumTermWeekly: 'Weekly target ₹2,360 if IT index confirms sector breakout.',
      longTermOutlook: 'Steady large-cap accumulation with resilient cash flows.'
    },
    chartData: generateCandlesticks(2255.70, 32)
  },
  {
    id: 'sig-hdfc-05',
    timestamp: '40 mins ago',
    stockName: 'HDFC Bank',
    symbol: 'HDFCBANK',
    exchange: 'BSE',
    currency: 'INR',
    signalType: 'Consolidation Breakout',
    currentPrice: 714.75,
    buyZone: '₹708 – ₹716',
    probableTimeWindow: '11:15 – 11:45 AM IST',
    sellZone: 'T1: ₹735 | T2: ₹755',
    stopLoss: '₹701',
    riskLevel: 'Low',
    confidenceScore: 91,
    status: 'Active Entry Zone',
    marketOverview: 'Heavyweight private banking benchmark finding aggressive institutional accumulation near key multi-week base.',
    candlestickInsights: {
      patternsDetected: ['Double Bottom Reversal', 'Bullish Harami on 30m', 'Ascending Triangle Compression'],
      implications: 'Strong institutional bids defending ₹708 floor. Breakout underway above ₹715 resistance.',
      supportResistanceZones: ['Key Floor: ₹702 – ₹708', 'Immediate Resistance: ₹735', 'Primary Target: ₹755'],
      liquidityNotes: 'Stop-run below ₹705 successfully defended by institutional blocks.'
    },
    technicalSignals: {
      rsiReading: '58.6 (Steady uptrend from 44 base)',
      macdReading: 'Fresh Bullish Crossover above signal line on 30m chart',
      movingAverages: 'Crossing above 20 EMA (₹711.50)',
      volumeAnalysis: '2.4x volume surge on 15m breakout bar',
      confluenceScore: 91,
      confluenceSummary: 'Banking index strength + Double Bottom Confirmation + Volume Surge.'
    },
    riskAssessment: {
      level: 'Low',
      reasoning: 'Minimal downside risk at ₹701 floor (1.9% SL). Favorable 1:2.9 Risk-Reward setup.',
      suggestedStopLossPercent: 1.9,
      recommendedPositionSizePercent: 2.5
    },
    possibleScenarios: {
      shortTermIntraday: 'Swift rally toward ₹735 on banking index short-covering.',
      mediumTermWeekly: 'Breakout continuation toward ₹755.',
      longTermOutlook: 'High-quality balance sheet delivering steady compound growth.'
    },
    chartData: generateCandlesticks(714.75, 32)
  },
  {
    id: 'sig-lt-06',
    timestamp: '55 mins ago',
    stockName: 'Larsen & Toubro',
    symbol: 'LT',
    exchange: 'BSE',
    currency: 'INR',
    signalType: 'Bullish Breakout',
    currentPrice: 4036.00,
    buyZone: '₹4,015 – ₹4,045',
    probableTimeWindow: '11:45 – 12:15 PM IST',
    sellZone: 'T1: ₹4,130 | T2: ₹4,220',
    stopLoss: '₹3,970',
    riskLevel: 'Medium',
    confidenceScore: 90,
    status: 'Active Entry Zone',
    marketOverview: 'Infrastructure mega-cap driving BSE Capital Goods index to fresh intraday highs with heavy order-book expansion.',
    candlestickInsights: {
      patternsDetected: ['Cup & Handle Breakout', 'Three White Soldiers on 15m', 'Volume Breakout Candle'],
      implications: 'Strong institutional momentum clearing previous multi-day swing high at ₹4,020.',
      supportResistanceZones: ['Breakout Support: ₹4,015', 'Demand Zone: ₹3,970', 'Target Zone: ₹4,130 – ₹4,220'],
      liquidityNotes: 'Clean breakout without liquidity trap signals.'
    },
    technicalSignals: {
      rsiReading: '65.4 (Strong bullish momentum, room before overbought 80)',
      macdReading: 'Strong positive divergence with expanding green histogram bars',
      movingAverages: 'Trading above 20 EMA, 50 SMA, and 200 SMA across all intraday frames',
      volumeAnalysis: '2.3x average volume expansion on breakout candle',
      confluenceScore: 90,
      confluenceSummary: 'Heavyweight momentum + Order Book tailwind + Multi-timeframe moving average alignment.'
    },
    riskAssessment: {
      level: 'Medium',
      reasoning: 'High-momentum setup. Stop loss at ₹3,970 gives 1:2.6 Risk-to-Reward ratio.',
      suggestedStopLossPercent: 1.6,
      recommendedPositionSizePercent: 2.0
    },
    possibleScenarios: {
      shortTermIntraday: 'Expansion towards ₹4,130 target during afternoon session.',
      mediumTermWeekly: 'Testing all-time high resistance above ₹4,220.',
      longTermOutlook: 'National infrastructure capex provides strong multi-quarter revenue pipeline.'
    },
    chartData: generateCandlesticks(4036.00, 32)
  },
  {
    id: 'sig-sbin-07',
    timestamp: '1 hour ago',
    stockName: 'State Bank of India',
    symbol: 'SBIN',
    exchange: 'BSE',
    currency: 'INR',
    signalType: 'Demand Zone Dip',
    currentPrice: 1043.65,
    buyZone: '₹1,035 – ₹1,048',
    probableTimeWindow: '12:15 – 12:45 PM IST',
    sellZone: 'T1: ₹1,080 | T2: ₹1,115',
    stopLoss: '₹1,022',
    riskLevel: 'Low',
    confidenceScore: 88,
    status: 'Active Entry Zone',
    marketOverview: 'PSU banking leader consolidating near 20-day moving average with robust credit growth figures.',
    candlestickInsights: {
      patternsDetected: ['Bullish Pin Bar on 1H', 'Support Rebound at ₹1,038', 'Inside Bar Consolidation'],
      implications: 'Sellers failed to break below ₹1,035 support; buying tails visible on 15m candlesticks.',
      supportResistanceZones: ['Support: ₹1,035 – ₹1,040', 'Immediate Resistance: ₹1,080', 'Target: ₹1,115'],
      liquidityNotes: 'Minor liquidity sweep below ₹1,035 quickly reversed.'
    },
    technicalSignals: {
      rsiReading: '56.2 (Neutral-bullish rebound from 45)',
      macdReading: 'MACD line curling upward to cross signal line',
      movingAverages: 'Firmly above 50-day EMA at ₹1,032',
      volumeAnalysis: 'Dry volume on pullbacks, expanding on green rebounds',
      confluenceScore: 88,
      confluenceSummary: 'PSU Bank Sector strength + Demand zone pin bar + Low risk entry.'
    },
    riskAssessment: {
      level: 'Low',
      reasoning: 'Conservative entry with tight 1.8% stop loss at ₹1,022. Risk-Reward 1:2.8.',
      suggestedStopLossPercent: 1.8,
      recommendedPositionSizePercent: 2.5
    },
    possibleScenarios: {
      shortTermIntraday: 'Rebound towards ₹1,080 resistance.',
      mediumTermWeekly: 'Test of recent high near ₹1,115.',
      longTermOutlook: 'Leading public banking franchise benefiting from credit expansion.'
    },
    chartData: generateCandlesticks(1043.65, 32)
  }
];

export const INITIAL_SAMPLE_JOURNAL_ENTRIES: JournalEntry[] = [];


