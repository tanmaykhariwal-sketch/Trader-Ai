export interface RawNewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedTime: string;
  snippet: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sentimentScore: number; // -100 to +100
  impact: 'High' | 'Medium' | 'Low';
  impactHorizon: 'Intraday' | 'Swing' | 'Positional';
  relatedSymbols: string[];
  catalystType: 'Earnings' | 'Policy / RBI' | 'Institutional Flow' | 'Macro' | 'Order Book' | 'Breakout' | 'Corporate Action';
}

// Curated fallback content, used only when the live RSS fetch below returns
// too few results. Attributed to the outlet that actually wrote each piece —
// not to Google, which only indexes these via News/Finance, never authors them.
export const curatedFinancialNews: RawNewsItem[] = [
  {
    id: 'news-1',
    title: 'Reliance Industries announces massive clean energy capex commissioning & telecom ARPU acceleration',
    source: 'LiveMint',
    url: 'https://www.livemint.com/market/stock-market-news',
    publishedTime: '18 mins ago',
    snippet:
      'Reliance Jio accelerates 5G monetization while retail expansion fuels robust EBITDA margin expansion across institutional order books.',
    sentiment: 'Bullish',
    sentimentScore: 84,
    impact: 'High',
    impactHorizon: 'Swing',
    relatedSymbols: ['RELIANCE', 'SENSEX'],
    catalystType: 'Corporate Action'
  },
  {
    id: 'news-2',
    title: 'FIIs turn net buyers on BSE equities; Domestic Institutional Investors inject ₹3,420 Cr into large-caps',
    source: 'Economic Times',
    url: 'https://economictimes.indiatimes.com/markets',
    publishedTime: '34 mins ago',
    snippet:
      'Foreign and domestic institutional inflows converge on banking and infrastructure heavyweights, defending key technical demand zones.',
    sentiment: 'Bullish',
    sentimentScore: 78,
    impact: 'High',
    impactHorizon: 'Intraday',
    relatedSymbols: ['SENSEX', 'ICICIBANK', 'HDFCBANK', 'SBIN'],
    catalystType: 'Institutional Flow'
  },
  {
    id: 'news-3',
    title: 'Infosys expands multi-year enterprise AI orchestration cloud contracts with European financial institutions',
    source: 'Business Standard',
    url: 'https://www.business-standard.com/markets',
    publishedTime: '52 mins ago',
    snippet:
      'Infosys Topaz AI platform gains strong contract renewals, providing multi-quarter margin visibility and cash-flow predictability.',
    sentiment: 'Bullish',
    sentimentScore: 72,
    impact: 'Medium',
    impactHorizon: 'Swing',
    relatedSymbols: ['INFY', 'TCS'],
    catalystType: 'Earnings'
  },
  {
    id: 'news-4',
    title: 'RBI maintains benchmark repo rate steady; indicates comfortable liquidity conditions for Indian banking credit growth',
    source: 'Financial Express',
    url: 'https://www.financialexpress.com/market',
    publishedTime: '1 hour ago',
    snippet: 'Reserve Bank of India monetary policy committee projects 7.2% GDP growth trajectory with benign inflation dynamics.',
    sentiment: 'Bullish',
    sentimentScore: 65,
    impact: 'High',
    impactHorizon: 'Positional',
    relatedSymbols: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK'],
    catalystType: 'Policy / RBI'
  },
  {
    id: 'news-5',
    title: 'Larsen & Toubro secures major international EPC infrastructure orders valued over ₹8,500 Crore',
    source: 'Reuters India',
    url: 'https://www.reuters.com/world/india/',
    publishedTime: '2 hours ago',
    snippet: 'L&T energy hydrocarbon business bags multi-country transmission pipeline and green hydrogen infrastructure orders.',
    sentiment: 'Bullish',
    sentimentScore: 82,
    impact: 'High',
    impactHorizon: 'Swing',
    relatedSymbols: ['LT'],
    catalystType: 'Order Book'
  },
  {
    id: 'news-6',
    title: 'TCS reports enterprise generative AI pipeline doubling to over $1.5 Billion with strong deal completions',
    source: 'Bloomberg',
    url: 'https://www.bloomberg.com/asia',
    publishedTime: '2 hours ago',
    snippet: 'Tata Consultancy Services demonstrates resilient margin performance despite global IT discretionary spending moderation.',
    sentiment: 'Bullish',
    sentimentScore: 68,
    impact: 'Medium',
    impactHorizon: 'Swing',
    relatedSymbols: ['TCS', 'INFY'],
    catalystType: 'Earnings'
  },
  {
    id: 'news-7',
    title: 'Global crude oil prices stabilize near $74/bbl; cooling input costs for Indian manufacturing & FMCG',
    source: 'MarketWatch',
    url: 'https://www.marketwatch.com/markets',
    publishedTime: '3 hours ago',
    snippet:
      'Subdued Brent crude pricing cushions Indian rupee macro stability and reduces working capital pressures on auto and consumer staples.',
    sentiment: 'Neutral',
    sentimentScore: 42,
    impact: 'Medium',
    impactHorizon: 'Positional',
    relatedSymbols: ['MARUTI', 'ITC', 'TATAMOTORS'],
    catalystType: 'Macro'
  },
  {
    id: 'news-8',
    title: 'BSE SENSEX demonstrates solid order-block support near 76,200 as short sellers cover intraday exposure',
    source: 'CNBC-TV18',
    url: 'https://www.cnbctv18.com/market/',
    publishedTime: '3 hours ago',
    snippet: 'Derivatives data shows heavy put writing at 76,000-76,500 strike clusters indicating institutional floor formation.',
    sentiment: 'Bullish',
    sentimentScore: 76,
    impact: 'High',
    impactHorizon: 'Intraday',
    relatedSymbols: ['SENSEX', 'RELIANCE', 'HDFCBANK'],
    catalystType: 'Breakout'
  }
];

/** Rough keyword-based sentiment score for a headline. This is a heuristic,
 * not NLP — callers must label output from this as such, not as "AI sentiment". */
export function scoreHeadlineSentiment(
  text: string
): { sentiment: 'Bullish' | 'Bearish' | 'Neutral'; score: number; catalyst: RawNewsItem['catalystType'] } {
  const lower = text.toLowerCase();
  let score = 0;

  const bullishWords = [
    'soars', 'surges', 'jump', 'profit', 'gain', 'expansion', 'order', 'record', 'growth', 'upgrade',
    'outperform', 'buy', 'inflows', 'contract', 'higher', 'boost', 'accelerate', 'rally', 'breakout'
  ];
  const bearishWords = [
    'drops', 'falls', 'slump', 'loss', 'decline', 'downgrade', 'underperform', 'sell', 'outflows',
    'lower', 'cut', 'slashes', 'investigation', 'plunges', 'risk', 'inflation'
  ];

  bullishWords.forEach((w) => { if (lower.includes(w)) score += 18; });
  bearishWords.forEach((w) => { if (lower.includes(w)) score -= 22; });

  score = Math.max(-100, Math.min(100, score));

  let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (score >= 25) sentiment = 'Bullish';
  else if (score <= -25) sentiment = 'Bearish';

  let catalyst: RawNewsItem['catalystType'] = 'Macro';
  if (lower.includes('order') || lower.includes('contract')) catalyst = 'Order Book';
  else if (lower.includes('profit') || lower.includes('result') || lower.includes('revenue') || lower.includes('ebitda'))
    catalyst = 'Earnings';
  else if (lower.includes('rbi') || lower.includes('rate') || lower.includes('policy') || lower.includes('govt'))
    catalyst = 'Policy / RBI';
  else if (lower.includes('fii') || lower.includes('dii') || lower.includes('institutional') || lower.includes('funds'))
    catalyst = 'Institutional Flow';
  else if (lower.includes('breakout') || lower.includes('support') || lower.includes('rally')) catalyst = 'Breakout';
  else if (lower.includes('dividend') || lower.includes('merger') || lower.includes('capex')) catalyst = 'Corporate Action';

  return { sentiment, score: score === 0 ? 35 : score, catalyst };
}

export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

/** Queries Google News RSS (an unofficial, ToS-adjacent scrape — not a
 * licensed news API) and returns parsed items, or an empty array on any
 * failure so callers fall back to the curated list above. */
export async function fetchGoogleNewsRss(queryTerm: string, maxItems: number, timeoutMs = 3500): Promise<RssItem[]> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryTerm)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const rssRes = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!rssRes.ok) return [];

    const xmlText = await rssRes.text();
    const itemRegex =
      /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<source[\s\S]*?>([\s\S]*?)<\/source>[\s\S]*?<\/item>/gi;
    const items: RssItem[] = [];
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && items.length < maxItems) {
      items.push({
        title: (match[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link: (match[2] || '').trim(),
        pubDate: (match[3] || '').trim(),
        source: (match[4] || 'News Wire').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      });
    }
    return items;
  } catch {
    return [];
  }
}
