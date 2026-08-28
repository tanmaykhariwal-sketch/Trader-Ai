import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Award, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { JournalEntry } from '../types';

interface CumulativePnLChartProps {
  journalEntries: JournalEntry[];
  currency: 'INR' | 'USD';
  onNavigateToJournal?: () => void;
}

type TimeframeOption = '7D' | '14D' | '30D' | 'ALL';

export const CumulativePnLChart: React.FC<CumulativePnLChartProps> = ({
  journalEntries = [],
  currency,
  onNavigateToJournal
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30D');
  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Helper to parse dates reliably from various formats
  const parseEntryDate = (entry: JournalEntry): Date => {
    if (entry.soldDate) {
      // Handles "03 Aug 2026", "2026-08-03", "08/03/2026", etc.
      const parsed = new Date(entry.soldDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    // Fallback: try parsing timestamp from ID
    const match = entry.id.match(/\d{10,13}/);
    if (match) {
      const ts = parseInt(match[0]);
      const dateFromTs = new Date(ts.toString().length === 10 ? ts * 1000 : ts);
      if (!isNaN(dateFromTs.getTime())) return dateFromTs;
    }
    return new Date();
  };

  // Process data for the Recharts line/area chart
  const { chartData, metrics } = useMemo(() => {
    const daysLimit = timeframe === '7D' ? 7 : timeframe === '14D' ? 14 : timeframe === '30D' ? 30 : 90;
    const now = new Date();
    const startDate = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    // Map and sort all entries chronologically
    const sortedEntries = [...journalEntries]
      .map(entry => ({
        ...entry,
        parsedDate: parseEntryDate(entry)
      }))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    // Filter by timeframe
    const filteredEntries = sortedEntries.filter(e => e.parsedDate >= startDate);

    // Calculate metrics
    const totalTrades = filteredEntries.length;
    const winningTrades = filteredEntries.filter(e => e.pnl > 0);
    const losingTrades = filteredEntries.filter(e => e.pnl < 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    const totalRealizedPnL = filteredEntries.reduce((sum, e) => sum + e.pnl, 0);
    const totalGains = winningTrades.reduce((sum, e) => sum + e.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, e) => sum + e.pnl, 0));
    const profitFactor = totalLosses > 0 ? (totalGains / totalLosses).toFixed(2) : totalGains > 0 ? 'Max' : '0.00';

    const bestTrade = filteredEntries.reduce((max, e) => (e.pnl > (max?.pnl ?? -Infinity) ? e : max), null as JournalEntry | null);

    // Build day-by-day continuous curve for smooth visualization
    const dailyPoints: Array<{
      date: string;
      rawDate: Date;
      dailyPnL: number;
      cumulativePnL: number;
      tradeCount: number;
      trades: Array<{ symbol: string; pnl: number; pnlPercent: number }>;
    }> = [];

    // Pre-calculate cumulative P&L before startDate if any
    let runningCumulativePnL = sortedEntries
      .filter(e => e.parsedDate < startDate)
      .reduce((sum, e) => sum + e.pnl, 0);

    // If starting from 0 baseline for the window, start at 0
    let windowCumulativePnL = 0;
    let peakPnL = 0;
    let maxDrawdown = 0;

    // Generate date array for the selected range
    const numDays = daysLimit;
    for (let i = numDays; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d.getTime() + 24 * 60 * 60 * 1000);

      // Find all trades executed on this day
      const dayTrades = filteredEntries.filter(e => {
        const t = e.parsedDate.getTime();
        return t >= d.getTime() && t < nextD.getTime();
      });

      const dayPnL = dayTrades.reduce((sum, e) => sum + e.pnl, 0);
      windowCumulativePnL += dayPnL;
      runningCumulativePnL += dayPnL;

      if (windowCumulativePnL > peakPnL) {
        peakPnL = windowCumulativePnL;
      }
      const drawdown = peakPnL - windowCumulativePnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      const dateLabel = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      dailyPoints.push({
        date: dateLabel,
        rawDate: d,
        dailyPnL: Math.round(dayPnL * 100) / 100,
        cumulativePnL: Math.round(windowCumulativePnL * 100) / 100,
        tradeCount: dayTrades.length,
        trades: dayTrades.map(t => ({
          symbol: t.symbol,
          pnl: t.pnl,
          pnlPercent: t.pnlPercent
        }))
      });
    }

    return {
      chartData: dailyPoints,
      metrics: {
        totalRealizedPnL: Math.round(totalRealizedPnL * 100) / 100,
        winRate: winRate.toFixed(1),
        winningCount: winningTrades.length,
        losingCount: losingTrades.length,
        totalTrades,
        profitFactor,
        bestTrade,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        peakPnL: Math.round(peakPnL * 100) / 100
      }
    };
  }, [journalEntries, timeframe]);

  const isNetPositive = metrics.totalRealizedPnL >= 0;

  // Custom sleek tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isDayProfit = data.dailyPnL > 0;
    const isCumulativeProfit = data.cumulativePnL >= 0;

    return (
      <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            <span>{label}</span>
          </div>
          {data.tradeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {data.tradeCount} {data.tradeCount === 1 ? 'Trade' : 'Trades'}
            </span>
          )}
        </div>

        <div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            Cumulative Growth (P&L)
          </div>
          <div className={`font-mono text-base font-black flex items-center space-x-1 ${
            isCumulativeProfit ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span>{isCumulativeProfit ? '+' : ''}{currSymbol}{data.cumulativePnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {data.tradeCount > 0 && (
          <div className="pt-1 border-t border-slate-800/80 space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">
              Day's Realized: <span className={isDayProfit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {isDayProfit ? '+' : ''}{currSymbol}{data.dailyPnL.toFixed(2)}
              </span>
            </div>
            <div className="space-y-0.5 pt-0.5">
              {data.trades.map((t: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="font-semibold">{t.symbol}</span>
                  <span className={t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {t.pnl >= 0 ? '+' : ''}{currSymbol}{t.pnl.toFixed(0)} ({t.pnl >= 0 ? '+' : ''}{t.pnlPercent.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Top Header Row with Timeframe Controls & Summary Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                30-Day Cumulative P&L Growth
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Closed Trades Equity Curve
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes the compound growth and net returns of closed journal positions over the last 30 days.
            </p>
          </div>
        </div>

        {/* Right side: Timeframe Tabs & Journal Link */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe pill toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
            {(['7D', '14D', '30D', 'ALL'] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {onNavigateToJournal && (
            <button
              onClick={onNavigateToJournal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center space-x-1.5"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>Full Journal Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* 30-Day Highlight Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 30D Cumulative Realized P&L */}
        <div className="bg-slate-950/70 border border-slate-800/90 p-3.5 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {timeframe === '30D' ? '30-Day Realized Net' : `${timeframe} Realized Net`}
          </div>
          <div className={`font-mono text-lg sm:text-xl font-black flex items-center space-x-1 ${
            isNetPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isNetPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{isNetPositive ? '+' : ''}{currSymbol}{metrics.totalRealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {metrics.totalTrades} closed executions
          </div>
        </div>

        {/* Profit Rate */}
        <div className="bg-slate-950/70 border border-slate-800/90 p-3.5 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Profit Rate ({timeframe})
          </div>
          <div className="font-mono text-lg sm:text-xl font-black text-white flex items-center space-x-1">
            <Award className="h-4 w-4 text-amber-400" />
            <span>{metrics.winRate}%</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            <span className="text-emerald-400 font-bold">{metrics.winningCount} Profits</span> / <span className="text-rose-400 font-bold">{metrics.losingCount} Losses</span>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-950/70 border border-slate-800/90 p-3.5 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Profit Factor
          </div>
          <div className="font-mono text-lg sm:text-xl font-black text-cyan-400">
            {metrics.profitFactor}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Gross gains vs losses
          </div>
        </div>

        {/* Peak Equity / Max Drawdown */}
        <div className="bg-slate-950/70 border border-slate-800/90 p-3.5 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Max Drawdown
          </div>
          <div className="font-mono text-lg sm:text-xl font-black text-amber-300">
            {currSymbol}{metrics.maxDrawdown.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Peak: {currSymbol}{metrics.peakPnL.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recharts Area/Line Chart Component */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.28} />
                <stop offset="95%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#334155' }}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => {
                if (Math.abs(val) >= 1000) {
                  return `${currSymbol}${(val / 1000).toFixed(1)}k`;
                }
                return `${currSymbol}${val}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="cumulativePnL"
              stroke={isNetPositive ? '#10b981' : '#f43f5e'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#pnlGrowthGradient)"
              activeDot={{ r: 5, fill: isNetPositive ? '#10b981' : '#f43f5e', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with Trade Insights */}
      {metrics.bestTrade && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong className="text-white">Best Trade in Window:</strong> {metrics.bestTrade.stockName} ({metrics.bestTrade.symbol})
            </span>
          </div>
          <div className="font-mono text-emerald-400 font-bold flex items-center space-x-1.5">
            <span>+{currSymbol}{metrics.bestTrade.pnl.toFixed(2)}</span>
            <span className="text-[11px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
              +{metrics.bestTrade.pnlPercent.toFixed(1)}% ROI
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
