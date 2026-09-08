import React, { useState } from 'react';
import { CandlestickData, StockPrediction } from '../types';
import {
  BarChart2, 
  Layers, 
  Eye, 
  TrendingUp, 
  Maximize2,
  Info,
  Target,
  ShieldAlert,
  Clock
} from 'lucide-react';

// Matches the multipliers used elsewhere in this app for a fallback
// target/stop-loss when a signal's own text can't be parsed for a number.
const FALLBACK_TARGET_MULTIPLIER = 1.035;
const FALLBACK_STOP_LOSS_MULTIPLIER = 0.98;

interface CandlestickChartProps {
  data: CandlestickData[];
  symbol: string;
  stockName: string;
  currency: 'INR' | 'USD';
  buyZone?: string;
  sellZone?: string;
  stopLoss?: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  prediction?: StockPrediction | null;
  marketStatus?: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | any;
  isMarketOpen?: boolean;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  symbol,
  stockName,
  currency,
  buyZone,
  sellZone,
  stopLoss,
  timeframe = '15m',
  onTimeframeChange,
  prediction,
  marketStatus = 'CLOSED',
  isMarketOpen
}) => {
  const [activeTab, setActiveTab] = useState<'PRICE' | 'RSI' | 'MACD'>('PRICE');
  const [showIndicators, setShowIndicators] = useState(true);
  const [showPrediction, setShowPrediction] = useState(true);

  const isOpenStatus = isMarketOpen !== undefined 
    ? Boolean(isMarketOpen) 
    : Boolean((marketStatus as any)?.isOpen ?? (marketStatus === 'OPEN'));

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        No chart data available for {symbol}.
      </div>
    );
  }

  const currSym = currency === 'INR' ? '₹' : '$';
  const lastCandle = data[data.length - 1];
  const lastClose = lastCandle?.close || 1000;

  // Extract or synthesize prediction targets
  let target1 = prediction?.priceTargetT1;
  let target2 = prediction?.priceTargetT2;
  let slPrice = prediction?.stopLoss;
  const confidence = prediction?.confidenceScore || 88;
  const predictedAction = prediction?.predictedAction || 'STRONG UPGRADE';

  if (!target1 && sellZone) {
    // sellZone is formatted as "T1: ₹1,320 | T2: ₹1,365" — a bare digit-run
    // match would also match the "1"/"2" inside the "T1"/"T2" labels
    // themselves, shifting both values off by one. Extract by label instead.
    const t1Match = sellZone.match(/T1:\s*₹?([\d,]+(\.\d+)?)/);
    const t2Match = sellZone.match(/T2:\s*₹?([\d,]+(\.\d+)?)/);
    if (t1Match) {
      target1 = parseFloat(t1Match[1].replace(/,/g, ''));
    }
    if (t2Match) {
      target2 = parseFloat(t2Match[1].replace(/,/g, ''));
    }
  }

  if (!slPrice && stopLoss) {
    const match = stopLoss.match(/\d+[\d,.]*/g);
    if (match && match.length > 0) {
      slPrice = parseFloat(match[0].replace(/,/g, ''));
    }
  }

  // Fallback defaults if not set. target1/slPrice now use the same
  // multipliers as computeHoldingMetrics (the app's shared fallback) instead
  // of this chart's own independently-guessed 1.038/0.975 — otherwise a
  // holding's target/stop-loss line here could disagree with the number
  // Portfolio/Stock Studio show for the exact same holding. target2 has no
  // canonical counterpart elsewhere (this is the only two-tier target
  // display), so it stays a chart-local extension beyond target1.
  if (!target1) target1 = +(lastClose * FALLBACK_TARGET_MULTIPLIER).toFixed(2);
  if (!target2) target2 = +(target1 * 1.025).toFixed(2);
  if (!slPrice) slPrice = +(lastClose * FALLBACK_STOP_LOSS_MULTIPLIER).toFixed(2);

  const targetGainPct = (((target1 - lastClose) / lastClose) * 100).toFixed(2);

  // Price domain boundaries (including forecast points)
  const allPrices = data.flatMap(d => [d.high, d.low]);
  if (showPrediction && target1 && target2 && slPrice) {
    allPrices.push(target1, target2, slPrice);
  }

  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;
  const priceRange = maxPrice - minPrice || 1;

  // Dimensions
  const chartHeight = 280;
  const chartWidth = 840; // ViewBox coordinates
  const paddingX = 35;

  // Split: Historical zone (left 68%) vs Prediction Forecast zone (right 32%)
  const xNow = showPrediction ? 570 : chartWidth - paddingX;
  const historicalWidth = xNow - paddingX;
  const barSpacing = historicalWidth / data.length;

  const getY = (val: number) => {
    return chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 60) - 30;
  };

  const yNow = getY(lastClose);
  const yTarget1 = getY(target1);
  const yTarget2 = getY(target2);
  const yStopLoss = getY(slPrice);

  // EMA & SMA paths mapped to historical width
  const emaPoints = data
    .map((d, i) => d.ema20 ? `${paddingX + i * barSpacing + barSpacing / 2},${getY(d.ema20)}` : null)
    .filter(Boolean)
    .join(' L ');

  const smaPoints = data
    .map((d, i) => d.sma50 ? `${paddingX + i * barSpacing + barSpacing / 2},${getY(d.sma50)}` : null)
    .filter(Boolean)
    .join(' L ');

  // Prediction Curve Coordinates to the right of NOW
  const xForecastEnd = chartWidth - paddingX;
  const xMid = xNow + (xForecastEnd - xNow) * 0.55;
  const yMid = yNow + (yTarget1 - yNow) * 0.65;

  // Smooth Bezier Curve Path for Prediction
  const predictionBezier = `M ${xNow},${yNow} C ${xNow + 50},${yNow + (yMid - yNow) * 0.2} ${xMid - 30},${yMid} ${xMid},${yMid} C ${xMid + 30},${yMid} ${xForecastEnd - 30},${yTarget2} ${xForecastEnd},${yTarget2}`;

  // Confidence Corridor bounds (Upper and Lower envelopes based on confidence score)
  const corridorSpread = (100 - confidence) * 0.8;
  const corridorUpperY1 = Math.max(20, yTarget1 - corridorSpread);
  const corridorLowerY1 = Math.min(chartHeight - 20, yTarget1 + corridorSpread * 1.2);
  const corridorUpperY2 = Math.max(20, yTarget2 - corridorSpread * 1.3);
  const corridorLowerY2 = Math.min(chartHeight - 20, yTarget2 + corridorSpread * 1.5);

  const confidenceCorridorPath = `M ${xNow},${yNow} L ${xMid},${corridorUpperY1} L ${xForecastEnd},${corridorUpperY2} L ${xForecastEnd},${corridorLowerY2} L ${xMid},${corridorLowerY1} Z`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              {symbol} Price Action & AI Forecast Chart
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
              {timeframe}
            </span>
            {!isOpenStatus ? (
              <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono font-bold">
                BSE Closed • Frozen Rate
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live BSE Feed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>{stockName}</span>
            <span>•</span>
            <span>Last Close: <strong className="text-white font-mono">{currSym}{lastClose.toLocaleString()}</strong></span>
            {prediction && (
              <>
                <span>•</span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  {predictedAction} ({confidence}% Confidence)
                </span>
              </>
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Prediction toggle button */}
          <button
            onClick={() => setShowPrediction(!showPrediction)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              showPrediction 
                ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border-cyan-500/40 shadow-sm' 
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>AI Prediction Curve: {showPrediction ? 'ON' : 'OFF'}</span>
          </button>

          {/* Timeframe switch */}
          {onTimeframeChange && (
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {['5m', '15m', '1h', '1D', '1W'].map(tf => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-2 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer ${
                    timeframe === tf ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {/* Subchart switches */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('PRICE')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                activeTab === 'PRICE' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setActiveTab('RSI')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                activeTab === 'RSI' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              RSI
            </button>
            <button
              onClick={() => setActiveTab('MACD')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                activeTab === 'MACD' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              MACD
            </button>
          </div>

          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              showIndicators ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="Toggle Indicators"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      {activeTab === 'PRICE' && (
        <div className="relative">
          {/* Key Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 mb-2 px-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 mr-1.5" /> Bullish Candle
              </span>
              <span className="flex items-center">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500 mr-1.5" /> Bearish Candle
              </span>
              {showIndicators && (
                <>
                  <span className="flex items-center">
                    <span className="h-0.5 w-3 bg-cyan-400 mr-1.5" /> 20 EMA
                  </span>
                  <span className="flex items-center">
                    <span className="h-0.5 w-3 bg-amber-400 mr-1.5" /> 50 SMA
                  </span>
                </>
              )}
            </div>

            {showPrediction && (
              <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
                <span className="flex items-center text-cyan-400">
                  <span className="h-2 w-0.5 border-r border-dashed border-cyan-400 mr-1.5" />
                  <strong>NOW Line</strong> (Historical Left / Forecast Right)
                </span>
                <span className="flex items-center text-emerald-400">
                  <span className="h-1 w-3 bg-emerald-400 mr-1.5 rounded-full" />
                  <strong>Target 1: {currSym}{target1.toFixed(1)} (+{targetGainPct}%)</strong>
                </span>
                <span className="flex items-center text-rose-400">
                  <span className="h-1 w-3 bg-rose-500 mr-1.5 rounded-full" />
                  <strong>SL: {currSym}{slPrice.toFixed(1)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* SVG Candlestick & Prediction Canvas */}
          <div className="w-full overflow-x-auto bg-slate-950/90 rounded-2xl border border-slate-800 p-2.5">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto max-h-[360px]">
              <defs>
                {/* Forecast Zone Shading */}
                <linearGradient id="forecastZoneGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
                </linearGradient>

                {/* Prediction Line Glow Gradient */}
                <linearGradient id="predLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="60%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>

              {/* Horizontal Price Grid Lines */}
              {[0.15, 0.35, 0.55, 0.75, 0.9].map((ratio, idx) => {
                const y = chartHeight * ratio;
                const gridPrice = maxPrice - (ratio * priceRange);
                return (
                  <g key={idx}>
                    <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                    <text x={chartWidth - paddingX + 6} y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace">
                      {gridPrice.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* FORECAST SHADED ZONE (Right side of the NOW line) */}
              {showPrediction && (
                <g>
                  <rect
                    x={xNow}
                    y={15}
                    width={xForecastEnd - xNow}
                    height={chartHeight - 35}
                    fill="url(#forecastZoneGrad)"
                    rx="4"
                  />

                  {/* Header Tag for Forecast Zone */}
                  <rect
                    x={xNow + 12}
                    y={22}
                    width="180"
                    height="18"
                    rx="4"
                    fill="#0f172a"
                    stroke="#10b981"
                    strokeWidth="0.75"
                  />
                  <text
                    x={xNow + 102}
                    y={34}
                    textAnchor="middle"
                    fill="#10b981"
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    AI FORECAST TRAJECTORY ({confidence}%)
                  </text>

                  {/* Shaded Confidence Corridor */}
                  <path
                    d={confidenceCorridorPath}
                    fill="#10b981"
                    fillOpacity="0.07"
                  />

                  {/* Protective Stop Loss Reference Line in Forecast Zone */}
                  <line
                    x1={xNow}
                    y1={yStopLoss}
                    x2={xForecastEnd}
                    y2={yStopLoss}
                    stroke="#f43f5e"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                    opacity="0.85"
                  />
                  <text
                    x={xForecastEnd - 5}
                    y={yStopLoss - 4}
                    textAnchor="end"
                    fill="#f43f5e"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    SL: {currSym}{slPrice.toFixed(1)}
                  </text>

                  {/* Target 1 Horizontal Reference Line */}
                  <line
                    x1={xNow}
                    y1={yTarget1}
                    x2={xMid}
                    y2={yTarget1}
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />

                  {/* Smooth Prediction Curve */}
                  <path
                    d={predictionBezier}
                    fill="none"
                    stroke="url(#predLineGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Target 1 Milestone Point */}
                  <g>
                    <circle cx={xMid} cy={yMid} r="5" fill="#10b981" stroke="#042f2e" strokeWidth="2" />
                    <circle cx={xMid} cy={yMid} r="9" fill="#10b981" opacity="0.25" />
                    <rect
                      x={xMid - 45}
                      y={yMid - 22}
                      width="90"
                      height="16"
                      rx="4"
                      fill="#042f2e"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    <text
                      x={xMid}
                      y={yMid - 11}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      T1: {currSym}{target1.toFixed(0)} (+{targetGainPct}%)
                    </text>
                  </g>

                  {/* Target 2 Milestone Point */}
                  {target2 && (
                    <g>
                      <circle cx={xForecastEnd} cy={yTarget2} r="4.5" fill="#22d3ee" stroke="#083344" strokeWidth="1.5" />
                      <rect
                        x={xForecastEnd - 55}
                        y={yTarget2 - 20}
                        width="55"
                        height="15"
                        rx="3"
                        fill="#083344"
                        stroke="#22d3ee"
                        strokeWidth="0.8"
                      />
                      <text
                        x={xForecastEnd - 28}
                        y={yTarget2 - 10}
                        textAnchor="middle"
                        fill="#a5f3fc"
                        fontSize="7.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        T2: {currSym}{target2.toFixed(0)}
                      </text>
                    </g>
                  )}

                  {/* Future timeline labels at bottom */}
                  <text x={xNow + (xMid - xNow) * 0.5} y={chartHeight - 8} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
                    +15m
                  </text>
                  <text x={xMid} y={chartHeight - 8} textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    Target 1 Window
                  </text>
                  <text x={xForecastEnd - 20} y={chartHeight - 8} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
                    Target 2 Window
                  </text>
                </g>
              )}

              {/* HISTORICAL MOVING AVERAGES (Left of NOW) */}
              {showIndicators && emaPoints && (
                <path d={`M ${emaPoints}`} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
              )}
              {showIndicators && smaPoints && (
                <path d={`M ${smaPoints}`} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
              )}

              {/* HISTORICAL CANDLESTICKS (Strictly Left of NOW) */}
              {data.map((d, i) => {
                const x = paddingX + i * barSpacing + barSpacing / 2;
                const yHigh = getY(d.high);
                const yLow = getY(d.low);
                const yOpen = getY(d.open);
                const yClose = getY(d.close);

                const isBull = d.close >= d.open;
                const candleColor = isBull ? '#10b981' : '#f43f5e';
                const bodyTop = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(Math.abs(yOpen - yClose), 2);
                const candleWidth = Math.max(barSpacing * 0.65, 3);

                return (
                  <g key={i} className="hover:opacity-80 transition-opacity cursor-pointer">
                    {/* Wick Line */}
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1.2" />

                    {/* Candle Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="1"
                    />

                    {/* Pattern Annotation Tag */}
                    {d.patternLabel && (
                      <g>
                        <rect
                          x={x - 42}
                          y={isBull ? yHigh - 20 : yLow + 8}
                          width="84"
                          height="15"
                          rx="3"
                          fill="#0f172a"
                          stroke={isBull ? '#10b981' : '#f43f5e'}
                          strokeWidth="0.8"
                        />
                        <text
                          x={x}
                          y={isBull ? yHigh - 10 : yLow + 19}
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="7.5"
                          fontWeight="bold"
                        >
                          {d.patternLabel}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* VERTICAL DOTTED "NOW" LINE & LIVE GLOWING PIN */}
              {showPrediction && (
                <g>
                  {/* Vertical Dotted NOW Line */}
                  <line
                    x1={xNow}
                    y1={12}
                    x2={xNow}
                    y2={chartHeight - 16}
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.95"
                  />

                  {/* Top "NOW" Badge Header */}
                  <rect
                    x={xNow - 24}
                    y={4}
                    width="48"
                    height="18"
                    rx="4"
                    fill="#0891b2"
                    stroke="#22d3ee"
                    strokeWidth="1.2"
                  />
                  <text
                    x={xNow}
                    y={16}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="900"
                    fontFamily="monospace"
                    letterSpacing="0.5"
                  >
                    NOW
                  </text>

                  {/* Status sub-badge directly below "NOW" */}
                  <rect
                    x={xNow - 32}
                    y={24}
                    width="64"
                    height="13"
                    rx="3"
                    fill="#0f172a"
                    stroke={isOpenStatus ? "#10b981" : "#f59e0b"}
                    strokeWidth="0.8"
                  />
                  <text
                    x={xNow}
                    y={33}
                    textAnchor="middle"
                    fill={isOpenStatus ? "#34d399" : "#fbbf24"}
                    fontSize="7"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isOpenStatus ? "LIVE SESSION" : "RATES FROZEN"}
                  </text>

                  {/* Mid-Line Anchor Indicator */}
                  <circle cx={xNow} cy={yNow} r="12" fill="#06b6d4" opacity="0.15" className={isOpenStatus ? "animate-ping" : ""} />
                  <circle cx={xNow} cy={yNow} r="5.5" fill={isOpenStatus ? "#06b6d4" : "#f59e0b"} stroke="#ffffff" strokeWidth="1.5" />

                  {/* Bottom "NOW" Anchor Tag */}
                  <rect
                    x={xNow - 20}
                    y={chartHeight - 24}
                    width="40"
                    height="14"
                    rx="3"
                    fill="#0891b2"
                    stroke="#22d3ee"
                    strokeWidth="1"
                  />
                  <text
                    x={xNow}
                    y={chartHeight - 14}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="black"
                    fontFamily="monospace"
                  >
                    NOW
                  </text>
                </g>
              )}

            </svg>
          </div>

          {/* Time Labels Footer */}
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5 px-2">
            <span>{data[0]?.time}</span>
            <span>Historical Data (Left)</span>
            <span className="text-cyan-400 font-bold">◄ NOW Line ►</span>
            {showPrediction && <span className="text-emerald-400 font-bold">Predictive Horizon (Right)</span>}
            <span>{lastCandle?.time} (Latest)</span>
          </div>
        </div>
      )}

      {/* RSI Subchart */}
      {activeTab === 'RSI' && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold text-cyan-400">Relative Strength Index (RSI - 14)</span>
            <span className="font-mono text-slate-300">Latest: {lastCandle?.rsi ?? 58.2}</span>
          </div>
          <svg viewBox="0 0 700 120" className="w-full h-28">
            <line x1="20" y1="36" x2="680" y2="36" stroke="#f43f5e" strokeDasharray="3 3" strokeWidth="1" />
            <text x="682" y="39" fill="#f43f5e" fontSize="9">70 OB</text>

            <line x1="20" y1="84" x2="680" y2="84" stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" />
            <text x="682" y="87" fill="#10b981" fontSize="9">30 OS</text>

            <path
              d={`M ${data.map((d, i) => `${40 + i * barSpacing},${120 - ((d.rsi ?? 50) / 100) * 120}`).join(' L ')}`}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
            />
          </svg>
        </div>
      )}

      {/* MACD Subchart */}
      {activeTab === 'MACD' && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold text-amber-400">MACD (12, 26, 9 Momentum Crossover)</span>
            <span className="font-mono text-slate-300">Histogram: +{(lastCandle?.histogram || 0.45).toFixed(2)}</span>
          </div>
          <svg viewBox="0 0 700 120" className="w-full h-28">
            <line x1="20" y1="60" x2="680" y2="60" stroke="#475569" strokeWidth="1" />

            {data.map((d, i) => {
              const x = 40 + i * barSpacing;
              const h = (d.histogram || 0) * 15;
              const isPositive = (d.histogram || 0) >= 0;
              return (
                <rect
                  key={i}
                  x={x - 2}
                  y={isPositive ? 60 - h : 60}
                  width="4"
                  height={Math.abs(h)}
                  fill={isPositive ? '#10b981' : '#f43f5e'}
                  opacity="0.8"
                />
              );
            })}
          </svg>
        </div>
      )}

    </div>
  );
};
