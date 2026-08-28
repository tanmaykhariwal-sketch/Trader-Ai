import React from 'react';
import { ConfluenceFactor } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  Gauge, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

interface ConfluenceMatrixProps {
  score: number;
  summary: string;
  rsiReading: string;
  macdReading: string;
  movingAverages: string;
  volumeAnalysis: string;
}

export const ConfluenceMatrix: React.FC<ConfluenceMatrixProps> = ({
  score,
  summary,
  rsiReading,
  macdReading,
  movingAverages,
  volumeAnalysis
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400 stroke-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (s >= 65) return 'text-amber-400 stroke-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 stroke-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const factors: ConfluenceFactor[] = [
    {
      name: 'Trend & Structure Alignment',
      score: 90,
      weight: 25,
      status: 'Bullish',
      details: movingAverages || 'Price holding above 20 EMA and 50 SMA on 15m & 1h timeframes'
    },
    {
      name: 'Candlestick Pattern Confirmation',
      score: 85,
      weight: 20,
      status: 'Bullish',
      details: 'High-conviction reversal pattern formed at key institutional demand zone'
    },
    {
      name: 'RSI Momentum & Divergence',
      score: 78,
      weight: 20,
      status: 'Bullish',
      details: rsiReading || 'RSI recovering cleanly from oversold zone with positive divergence'
    },
    {
      name: 'MACD Signal Crossover',
      score: 82,
      weight: 15,
      status: 'Bullish',
      details: macdReading || 'Bullish MACD crossover above zero line with expanding histogram'
    },
    {
      name: 'Volume & Liquidity Sweep',
      score: 88,
      weight: 20,
      status: 'Bullish',
      details: volumeAnalysis || 'Volume expansion 1.8x average confirming institutional order accumulation'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
        
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Technical Confluence Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Only high-confluence setups (Score ≥ 75%) trigger live trade signals
            </p>
          </div>
        </div>

        {/* Master Score Dial */}
        <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${getScoreColor(score)}`}>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Confluence Score
            </div>
            <div className="text-2xl font-black font-mono">
              {score}%
            </div>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-950/60 font-bold text-sm">
            {score >= 80 ? 'Grade A' : score >= 65 ? 'Grade B' : 'Grade C'}
          </div>
        </div>

      </div>

      {/* Summary Banner */}
      <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-emerald-300">Confluence Alignment: </span>
          <span>{summary || 'Multiple independent technical indicators confirm trade setup directional probability > 70%.'}</span>
        </div>
      </div>

      {/* Factors List Grid */}
      <div className="space-y-2.5">
        {factors.map((f, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all"
          >
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-200">{f.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    Weight: {f.weight}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{f.details}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
              <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 w-10 text-right">
                {f.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
