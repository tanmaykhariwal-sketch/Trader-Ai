import { Router } from 'express';
import { quoteDirectory } from '../services/yahooFinance.service';
import { curatedFinancialNews, scoreHeadlineSentiment, fetchGoogleNewsRss, type RawNewsItem } from '../services/googleNewsRss.service';
import { externalApiRateLimiter } from '../middleware/rateLimiter';

export const newsRouter = Router();

function matchSymbols(title: string, fallback: string): string[] {
  const matched: string[] = [];
  const upperTitle = title.toUpperCase();
  for (const sym of Object.keys(quoteDirectory)) {
    // Bare `.includes(sym)` false-matched any headline containing the
    // symbol as a mere substring of an unrelated word — e.g. "RESULTS"
    // contains "LT", "SWITCH" contains "ITC" — tagging headlines with a
    // completely unrelated stock and surfacing them under that symbol's
    // news filter. Anchored to word boundaries instead.
    const escaped = sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`);
    if (pattern.test(upperTitle)) {
      matched.push(sym);
    }
  }
  return matched.length > 0 ? matched : [fallback || 'SENSEX'];
}

// Was a 3-branch chain covering only 'Policy / RBI' -> Banking & Rates and
// 'Order Book' -> BSE Equities, with every other catalyst (including
// 'Earnings', 'Institutional Flow', 'Breakout', 'Corporate Action') falling
// into 'Global Macro' — meaning 3 of the 6 categories the UI actually
// offers as filter chips ('Energy & Commodities', 'Tech & AI', 'Forex &
// Trade') could never be produced no matter what headline came in. Those 3
// need keyword detection on the title itself since no catalyst type maps to
// them; the rest still derive from the catalyst as before.
function categorizeHeadline(title: string, catalyst: string): string {
  const lower = title.toLowerCase();
  if (/\b(crude|oil|opec|brent|gold|commodit|copper|natural gas)\b/.test(lower)) return 'Energy & Commodities';
  if (/\b(ai|artificial intelligence|semiconductor|chip|software|cloud|tech(nology)?|data center)\b/.test(lower)) return 'Tech & AI';
  if (/\b(rupee|dollar|forex|usd|tariff|trade deficit|trade war|export|import)\b/.test(lower)) return 'Forex & Trade';
  if (catalyst === 'Policy / RBI') return 'Banking & Rates';
  if (catalyst === 'Order Book' || catalyst === 'Earnings' || catalyst === 'Corporate Action') return 'BSE Equities';
  return 'Global Macro';
}

newsRouter.get('/news-sentiment', externalApiRateLimiter, async (req, res) => {
  try {
    // Capped the same way analyze.routes.ts's clampText caps its own
    // user-controlled fields — nothing previously bounded how long a query
    // string an anonymous caller (this route needs no auth) could force
    // into the outbound Google News request.
    const symbolFilter = ((req.query.symbol as string) || '').toUpperCase().trim().slice(0, 20);
    const queryTerm = symbolFilter ? `${symbolFilter} BSE India stock news` : 'BSE Sensex India stocks economy';

    const rssItems = await fetchGoogleNewsRss(queryTerm, 8);
    const liveItems: RawNewsItem[] = rssItems.map((item, i) => {
      const { sentiment, score, catalyst } = scoreHeadlineSentiment(item.title);
      return {
        id: `rss-${i}-${Date.now()}`,
        title: item.title,
        source: item.source,
        url: item.link,
        publishedTime: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
        snippet: item.title,
        sentiment,
        sentimentScore: score,
        impact: Math.abs(score) > 60 ? 'High' : 'Medium',
        impactHorizon: catalyst === 'Policy / RBI' || catalyst === 'Macro' ? 'Positional' : 'Swing',
        relatedSymbols: matchSymbols(item.title, symbolFilter),
        catalystType: catalyst
      };
    });

    const usingLive = liveItems.length >= 3;
    // `allNews` always includes 4 curated fallback items alongside the live
    // ones whenever `usingLive` is true — the payload is a genuine mix, not
    // purely live, so labeling it 'LIVE' below was never accurate for this
    // branch. Only the pure-curated branch (usingLive false) is truly
    // 'SIMULATED' with nothing live in it.
    const allNews = usingLive ? [...liveItems, ...curatedFinancialNews.slice(0, 4)] : curatedFinancialNews;

    const filtered = symbolFilter
      ? allNews.filter((n) => n.relatedSymbols.includes(symbolFilter) || n.title.toUpperCase().includes(symbolFilter))
      : allNews;

    const avgSentimentScore = Math.round(filtered.reduce((acc, item) => acc + item.sentimentScore, 0) / (filtered.length || 1));
    const bullishCount = filtered.filter((n) => n.sentiment === 'Bullish').length;
    const bearishCount = filtered.filter((n) => n.sentiment === 'Bearish').length;
    const neutralCount = filtered.filter((n) => n.sentiment === 'Neutral').length;
    const bullishPct = Math.round((bullishCount / (filtered.length || 1)) * 100);

    res.json({
      success: true,
      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      dataProvenance: usingLive ? 'MIXED' : 'SIMULATED',
      marketSentimentIndex: {
        overall: avgSentimentScore >= 20 ? 'Bullish' : avgSentimentScore <= -20 ? 'Bearish' : 'Neutral',
        score: avgSentimentScore,
        bullishPercentage: bullishPct,
        bullishCount,
        bearishCount,
        neutralCount,
        institutionalFlowBias: 'Net Inflow (+₹3,420 Cr DII / FII)',
        marketBreadth: '74% Advancing to Declining Ratio'
      },
      news: filtered
    });
  } catch (err: any) {
    console.error('Error in /api/news-sentiment:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch news sentiment' });
  }
});

newsRouter.get('/global-financial-news', externalApiRateLimiter, async (req, res) => {
  try {
    const categoryFilter = ((req.query.category as string) || 'ALL').toUpperCase().slice(0, 30);
    const symbolFilter = ((req.query.symbol as string) || '').toUpperCase().trim().slice(0, 20);
    // A non-numeric `limit` query param (e.g. "abc") parses to NaN, and
    // Math.max(5, NaN) is itself NaN — collapsing the whole clamp to NaN
    // and making `.slice(0, NaN)` return zero headlines while still
    // reporting `success: true`, silently masking a bad request as an
    // empty-but-fine response.
    const parsedLimit = parseInt((req.query.limit as string) || '', 10);
    const limit = Math.min(50, Math.max(5, Number.isFinite(parsedLimit) ? parsedLimit : 20));

    const queryTopic = symbolFilter ? `${symbolFilter} stock BSE India news` : 'Dalal Street BSE Sensex India global financial markets economy';
    const rssItems = await fetchGoogleNewsRss(queryTopic, 12, 4000);

    const aggregatedHeadlines = rssItems.map((item, i) => {
      const { sentiment, score, catalyst } = scoreHeadlineSentiment(item.title);
      return {
        id: `wire-${i}-${Date.now()}`,
        title: item.title,
        source: item.source,
        url: item.link,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        snippet: item.title,
        sentiment,
        sentimentScore: score,
        category: categorizeHeadline(item.title, catalyst),
        relatedSymbols: matchSymbols(item.title, symbolFilter),
        catalystType: catalyst
      };
    });

    const mergedList = [...aggregatedHeadlines, ...curatedFinancialNews];

    let filtered = mergedList;
    if (symbolFilter) {
      filtered = filtered.filter(
        (item) => (item.relatedSymbols && item.relatedSymbols.includes(symbolFilter)) || item.title.toUpperCase().includes(symbolFilter)
      );
    }
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter((item) => ((item as any).category || '').toUpperCase().includes(categoryFilter));
    }

    res.json({
      success: true,
      count: filtered.slice(0, limit).length,
      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      // `mergedList` always concatenates curatedFinancialNews in regardless
      // of how many live items came back, so a payload with any live items
      // at all is a genuine mix, not purely live — 'LIVE' was never an
      // accurate label for this endpoint's actual behavior.
      dataProvenance: aggregatedHeadlines.length === 0 ? 'SIMULATED' : 'MIXED',
      headlines: filtered.slice(0, limit)
    });
  } catch (err: any) {
    console.error('Error in /api/global-financial-news:', err);
    res.status(500).json({ success: false, error: 'Failed to aggregate global news' });
  }
});
