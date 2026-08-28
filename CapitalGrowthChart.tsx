import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { CapitalRecord } from '../types';
import { Wallet, TrendingUp, ArrowUpRight, PlusCircle, ShieldCheck } from 'lucide-react';

interface CapitalGrowthChartProps {
  capitalRecords: CapitalRecord[];
  currentCapital: number;
  currency: 'INR' | 'USD';
  onAddCapitalClick?: () => void;
}

export const CapitalGrowthChart: React.FC<CapitalGrowthChartProps> = ({
  capitalRecords,
  currentCapital,
  currency,
  onAddCapitalClick
}) => {
  const currSym = currency === 'INR' ? '₹' : '$';

  // Build chart dataset from capitalRecords sorted chronologically
  const sortedRecords = [...capitalRecords].sort((a, b) => {
    return (a.id > b.id ? 1 : -1);
  });

  let chartData: { label: string; capital: number; delta: number; note: string }[] = [];

  if (sortedRecords.length === 0) {
    // Default baseline points if no prior history
    chartData = [
      { label: 'Initial', capital: currentCapital, delta: 0, note: 'Current Account Balance' }
    ];
  } else {
    chartData = sortedRecords.map(r => ({
      label: `${r.date.split(' ')[0]} ${r.date.split(' ')[1] || ''} ${r.timestamp}`,
      capital: r.resultingCapital,
      delta: r.amount,
      note: r.note || (r.type === 'DEPOSIT' ? 'Deposit' : 'Balance Update')
    }));

    // Ensure the latest point matches current capital
    if (chartData[chartData.length - 1].capital !== currentCapital) {
      chartData.push({
        label: 'Current',
        capital: currentCapital,
        delta: 0,
        note: 'Live Capital'
      });
    }
  }

  // Calculate stats
  const initialCap = chartData[0]?.capital || currentCapital;
  const totalGrowth = currentCapital - initialCap;
  const totalGrowthPct = initialCap > 0 ? ((totalGrowth / initialCap) * 100).toFixed(1) : '0.0';

  const minCap = Math.min(...chartData.map(d => d.capital)) * 0.95;
  const maxCap = Math.max(...chartData.map(d => d.capital)) * 1.05;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Capital Growth & Balance Trajectory
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Live Recharts Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tracks deposits, settlements, and cumulative trading ledger balance over time.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Current Capital</span>
            <span className="text-white font-bold font-mono text-sm">{currSym}{currentCapital.toLocaleString()}</span>
          </div>

          {onAddCapitalClick && (
            <button
              onClick={onAddCapitalClick}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-sm flex items-center space-x-1 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Capital</span>
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={[Math.floor(minCap), Math.ceil(maxCap)]}
              tickFormatter={(v) => `${currSym}${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl space-y-1 font-mono text-xs">
                      <div className="text-slate-400 text-[10px]">{dataPoint.label}</div>
                      <div className="text-white font-bold text-sm">
                        Capital: <span className="text-emerald-400">{currSym}{dataPoint.capital.toLocaleString()}</span>
                      </div>
                      {dataPoint.delta > 0 && (
                        <div className="text-cyan-400 text-[11px]">
                          +{currSym}{dataPoint.delta.toLocaleString()} ({dataPoint.note})
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="capital" 
              stroke="#10b981" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#capitalGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-1 text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>Ledger Records: <strong className="text-slate-200">{capitalRecords.length} transactions</strong></span>
        </div>
        <div className="flex items-center space-x-3">
          <span>Net Added: <strong className="text-emerald-400">+{currSym}{totalGrowth >= 0 ? totalGrowth.toLocaleString() : 0}</strong></span>
          <span className="text-slate-600">•</span>
          <span>Risk Capacity: <strong className="text-cyan-300">{currSym}{(currentCapital * 0.1).toLocaleString()} (10% Max)</strong></span>
        </div>
      </div>
    </div>
  );
};
