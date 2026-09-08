import { Router } from 'express';
import { liveQuotesCache } from '../services/yahooFinance.service';

export const predictionsRouter = Router();

// NOTE: this endpoint is still a static, hand-curated watchlist (only
// `currentPrice` is live) — it is scheduled to become genuinely
// Gemini-grounded in the AI-integrity pass. Preserved as-is here since this
// restructure is behavior-preserving.
//
// priceTargetT1/T2/stopLoss below were independently hand-authored and had
// drifted from src/data/marketData.ts's sellZone/stopLoss for the same
// symbols (CandlestickChart.tsx prefers this prediction's T1/T2 over the
// value parsed from a signal's sellZone whenever both exist, so the two
// disagreeing was a real "two sources of truth" bug, not just cosmetic).
// Now kept numerically identical to marketData.ts's sellZone/stopLoss for
// every symbol they share (TCS already matched) — if you change one, change
// the other to match.
predictionsRouter.get('/stock-predictions', async (_req, res) => {
  try {
    const istTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

    const predictions = [
      {
        id: 'pred-reliance',
        symbol: 'RELIANCE',
        stockName: 'Reliance Industries Ltd',
        currentPrice: liveQuotesCache.get('RELIANCE')?.lastPrice || 1289.25,
        currency: 'INR',
        predictedAction: 'STRONG UPGRADE',
        previousRating: 'Outperform (Hold)',
        confidenceScore: 94,
        priceTargetT1: 1320.0,
        priceTargetT2: 1345.0,
        stopLoss: 1268.0,
        expectedReturnPct: 4.32,
        timeHorizon: '1–2 Weeks',
        keyCatalysts: ['5G Telecom ARPU Expansion', 'Clean Energy Capex Commissioning', 'FII Accumulation at ₹1,280 Order Block'],
        candlestickPatternConfluence: 'Bullish Morning Star + Demand Zone Liquidity Absorption above 20 EMA',
        newsSentimentConfluence: 'High Positive (+84 Sentiment Score with positive capex coverage)',
        riskScore: 3,
        suggestedAllocationPct: 3.5,
        updatedAt: istTime
      },
      {
        id: 'pred-icicibank',
        symbol: 'ICICIBANK',
        stockName: 'ICICI Bank Ltd',
        currentPrice: liveQuotesCache.get('ICICIBANK')?.lastPrice || 1446.5,
        currency: 'INR',
        predictedAction: 'STRONG UPGRADE',
        previousRating: 'Accumulate',
        confidenceScore: 92,
        priceTargetT1: 1485.0,
        priceTargetT2: 1520.0,
        stopLoss: 1422.0,
        expectedReturnPct: 5.08,
        timeHorizon: '1–3 Weeks',
        keyCatalysts: ['Highest Net Interest Margin in Private Banking', 'Credit Growth Outpacing Industry Average (16.8%)'],
        candlestickPatternConfluence: 'Bullish Engulfing Breakout of 15m Consolidation & 50 SMA Reclaim',
        newsSentimentConfluence: 'Strong (+78 Sentiment with steady RBI policy backdrop)',
        riskScore: 2,
        suggestedAllocationPct: 4.0,
        updatedAt: istTime
      },
      {
        id: 'pred-lt',
        symbol: 'LT',
        stockName: 'Larsen & Toubro Ltd',
        currentPrice: liveQuotesCache.get('LT')?.lastPrice || 4036.0,
        currency: 'INR',
        predictedAction: 'BULLISH OUTPERFORM',
        previousRating: 'Hold',
        confidenceScore: 89,
        priceTargetT1: 4130.0,
        priceTargetT2: 4220.0,
        stopLoss: 3970.0,
        expectedReturnPct: 4.56,
        timeHorizon: '2–4 Weeks',
        keyCatalysts: ['₹8,500 Cr Mega EPC Order Win', 'Domestic Manufacturing Infrastructure Push'],
        candlestickPatternConfluence: 'Fair Value Gap (FVG) Fill followed by High-Volume Continuation Bar',
        newsSentimentConfluence: 'Very High (+82 Sentiment Score on order-book expansion)',
        riskScore: 3,
        suggestedAllocationPct: 3.0,
        updatedAt: istTime
      },
      {
        id: 'pred-infy',
        symbol: 'INFY',
        stockName: 'Infosys Ltd',
        currentPrice: liveQuotesCache.get('INFY')?.lastPrice || 1111.0,
        currency: 'INR',
        predictedAction: 'BULLISH OUTPERFORM',
        previousRating: 'Neutral Watch',
        confidenceScore: 88,
        priceTargetT1: 1142.0,
        priceTargetT2: 1170.0,
        stopLoss: 1092.0,
        expectedReturnPct: 5.31,
        timeHorizon: '1–2 Weeks',
        keyCatalysts: ['Enterprise Topaz AI Contract Wins', 'USD/INR Currency Tailwinds for IT Exporters'],
        candlestickPatternConfluence: 'Double Bottom on 1-Hour Chart with Bullish RSI Divergence (RSI 48 -> 62)',
        newsSentimentConfluence: 'Positive (+72 Sentiment Score)',
        riskScore: 4,
        suggestedAllocationPct: 2.5,
        updatedAt: istTime
      },
      {
        id: 'pred-sbin',
        symbol: 'SBIN',
        stockName: 'State Bank of India',
        currentPrice: liveQuotesCache.get('SBIN')?.lastPrice || 1043.65,
        currency: 'INR',
        predictedAction: 'BULLISH OUTPERFORM',
        previousRating: 'Hold',
        confidenceScore: 87,
        priceTargetT1: 1080.0,
        priceTargetT2: 1115.0,
        stopLoss: 1022.0,
        expectedReturnPct: 6.84,
        timeHorizon: '2–3 Weeks',
        keyCatalysts: ['PSU Bank Credit Expansion', 'Lowest Gross NPA Ratios in Multi-Year History'],
        candlestickPatternConfluence: 'Hammer Wick Absorption at ₹1,035 Key Structural Support',
        newsSentimentConfluence: 'Moderate Positive (+65 Sentiment Score)',
        riskScore: 3,
        suggestedAllocationPct: 3.0,
        updatedAt: istTime
      },
      {
        id: 'pred-tcs',
        symbol: 'TCS',
        stockName: 'Tata Consultancy Services',
        currentPrice: liveQuotesCache.get('TCS')?.lastPrice || 2255.7,
        currency: 'INR',
        predictedAction: 'HOLD / CONSOLIDATE',
        previousRating: 'Hold',
        confidenceScore: 82,
        priceTargetT1: 2310.0,
        priceTargetT2: 2360.0,
        stopLoss: 2218.0,
        expectedReturnPct: 4.62,
        timeHorizon: '2–4 Weeks',
        keyCatalysts: ['$1.5B AI Pipeline Growth', 'Consistent 3%+ Free Cash Flow Yield'],
        candlestickPatternConfluence: 'Symmetrical Triangle Compression near 50-Day Moving Average',
        newsSentimentConfluence: 'Moderate Positive (+68 Sentiment Score)',
        riskScore: 2,
        suggestedAllocationPct: 2.0,
        updatedAt: istTime
      },
      {
        id: 'pred-hdfcbank',
        symbol: 'HDFCBANK',
        stockName: 'HDFC Bank Ltd',
        currentPrice: liveQuotesCache.get('HDFCBANK')?.lastPrice || 714.75,
        currency: 'INR',
        predictedAction: 'BULLISH OUTPERFORM',
        previousRating: 'Neutral (Post-Merger)',
        confidenceScore: 85,
        priceTargetT1: 735.0,
        priceTargetT2: 755.0,
        stopLoss: 701.0,
        expectedReturnPct: 5.63,
        timeHorizon: '2–4 Weeks',
        keyCatalysts: ['Deposit Mobilization Growth Exceeding Credit Rate', 'Institutional Block Buying at ₹708'],
        candlestickPatternConfluence: 'Break of Structure (BOS) on 15m Chart & Liquidity Sweep Test',
        newsSentimentConfluence: 'Positive (+65 Sentiment Score)',
        riskScore: 3,
        suggestedAllocationPct: 3.0,
        updatedAt: istTime
      }
    ];

    res.json({
      success: true,
      timestamp: istTime,
      dataProvenance: 'SIMULATED',
      feedSource: 'CURATED_STATIC_WATCHLIST',
      predictions
    });
  } catch (err: any) {
    console.error('Error in /api/stock-predictions:', err);
    res.status(500).json({ success: false, error: 'Failed to generate stock predictions' });
  }
});
