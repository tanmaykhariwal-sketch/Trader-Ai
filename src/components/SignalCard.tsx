import React, { useState } from 'react';
import { MarketSignal } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldAlert, 
  Target, 
  Volume2, 
  VolumeX, 
  Calculator, 
  Sparkles, 
  BarChart2, 
  AlertOctagon, 
  Compass, 
  ShoppingBag, 
  Lock 
} from 'lucide-react';

interface SignalCardProps {
  signal: MarketSignal;
  onOpenCalculatorForSignal: (signal: MarketSignal) => void;
  audioEnabled: boolean;
  isBought?: boolean;
  onMarkAsBought?: (signal: MarketSignal) => void;
  tradingMode?: 'simple' | 'advanced';
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  onOpenCalculatorForSignal,
  audioEnabled,
  isBought = false,
  onMarkAsBought,
  tradingMode = 'simple'
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAdvancedData, setShowAdvancedData] = useState(tradingMode === 'advanced');

  React.useEffect(() => {
    if (tradingMode === 'advanced') {
      setShowAdvancedData(true);
    }
  }, [tradingMode]);

  const isBullish = signal.signalType.includes('Bullish') || signal.signalType.includes('Demand');

  const handleSpeakBriefing = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = `Market Signal for ${signal.stockName}. Signal type: ${signal.signalType}. Buy zone: ${signal.buyZone}. Probable time window: ${signal.probableTimeWindow}. Target sell zone: ${signal.sellZone}. Stop loss: ${signal.stopLoss}. Risk level: ${signal.riskLevel} with confidence score ${signal.confidenceScore} percent.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
      
      {/* Top Banner & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl border ${
            isBullish 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {isBullish ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                {signal.stockName}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {signal.symbol} • {signal.exchange}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Price: <span className="font-mono font-bold text-slate-200">{signal.currency === 'INR' ? '₹' : '$'}{signal.currentPrice.toLocaleString()}</span> • Signal Timestamp: {signal.timestamp}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          
          <button
            onClick={handleSpeakBriefing}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Listen to Voice Briefing"
          >
            {isSpeaking ? <Volume2 className="h-4 w-4 animate-bounce text-amber-400" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Speaking...' : 'Audio Brief'}</span>
          </button>

          <button
            onClick={() => onOpenCalculatorForSignal(signal)}
            className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Calculator className="h-4 w-4" />
            <span>Calc Position</span>
          </button>

        </div>

      </div>

      {/* SECTION 1: MARKET OVERVIEW */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
          <Compass className="h-4 w-4" />
          <span>Market Overview</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {signal.marketOverview}
        </p>
      </div>

      {/* SECTION 2: ADVANCE BUY / SELL SIGNAL BOX */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-emerald-500/30 relative shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Advance Signal Parameters
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
              isBullish 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {signal.signalType}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Confidence: {signal.confidenceScore}%
            </span>
          </div>
        </div>

        {/* 4 Core Parameter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Buy Zone */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Buy Price Zone
            </div>
            <div className="text-sm font-black font-mono text-emerald-400">
              {signal.buyZone}
            </div>
          </div>

          {/* Probable Time Window */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
              <Clock className="h-3 w-3 mr-1 text-amber-400" /> Probable Time Window
            </div>
            <div className="text-xs font-bold font-mono text-amber-300">
              {signal.probableTimeWindow}
            </div>
          </div>

          {/* Sell Zone (Targets) - Revealed ONLY when bought */}
          <div className={`p-3.5 rounded-xl border ${isBought ? 'bg-cyan-950/40 border-cyan-500/40' : 'bg-slate-900/90 border-slate-800'}`}>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center">
                <Target className="h-3 w-3 mr-1 text-cyan-400" /> Target Sell Zone
              </span>
              {isBought ? (
                <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  ✓ Bought
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 flex items-center font-mono">
                  <Lock className="h-2.5 w-2.5 mr-0.5" /> Hidden
                </span>
              )}
            </div>
            {isBought ? (
              <div className="text-xs font-bold font-mono text-cyan-300">
                {signal.sellZone}
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-500 italic">
                  Mark as bought to view
                </span>
                {onMarkAsBought && (
                  <button
                    onClick={() => onMarkAsBought(signal)}
                    className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded flex items-center space-x-1 transition-all"
                  >
                    <ShoppingBag className="h-3 w-3" />
                    <span>I Bought This</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stop Loss & Risk */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
              <ShieldAlert className="h-3 w-3 mr-1 text-rose-400" /> Stop Loss / Risk Level
            </div>
            <div className="text-xs font-bold font-mono text-rose-300 flex items-center justify-between">
              <span>{signal.stopLoss}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                signal.riskLevel === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                signal.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {signal.riskLevel} Risk
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ADVANCED DATA TOGGLE BUTTON DIRECTLY BELOW THIS COMPANY'S SECTION */}
      <div className="pt-1">
        <button
          onClick={() => setShowAdvancedData(!showAdvancedData)}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 border shadow-md ${
            showAdvancedData
              ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-purple-500/20'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>{showAdvancedData ? 'Hide Data' : 'Show Data'}</span>
          <span className="text-[10px] font-normal opacity-80">
            ({showAdvancedData ? 'Collapse technicals' : `RSI, MACD, Candlesticks & Risk Scenarios for ${signal.symbol}`})
          </span>
        </button>
      </div>

      {/* CONDITIONALLY RENDERED ADVANCED DATA SECTIONS */}
      {showAdvancedData && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* SECTION 3 & 4: CANDLESTICK INSIGHTS & TECHNICAL SIGNALS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Candlestick Insights */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <BarChart2 className="h-4 w-4" />
                <span>Candlestick & Price Action Insights</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-semibold">Detected Patterns:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {signal.candlestickInsights.patternsDetected.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800 text-[11px] font-mono font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-200">Implications: </span>
                {signal.candlestickInsights.implications}
              </p>

              <div className="text-xs text-slate-400 pt-1 border-t border-slate-900">
                <span className="font-bold text-slate-300">Support / Resistance Zones: </span>
                <span className="font-mono text-slate-300">{signal.candlestickInsights.supportResistanceZones.join(' | ')}</span>
              </div>
            </div>

            {/* Technical Indicators & Confluence */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>Technical Indicators & Confluence</span>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Confluence: {signal.technicalSignals.confluenceScore}%
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                <div><span className="text-slate-400">RSI (14):</span> {signal.technicalSignals.rsiReading}</div>
                <div><span className="text-slate-400">MACD:</span> {signal.technicalSignals.macdReading}</div>
                <div><span className="text-slate-400">EMAs & SMAs:</span> {signal.technicalSignals.movingAverages}</div>
                <div><span className="text-slate-400">Volume Confirmation:</span> {signal.technicalSignals.volumeAnalysis}</div>
              </div>
            </div>

          </div>

          {/* SECTION 5: RISK ASSESSMENT */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <ShieldAlert className="h-4 w-4" />
              <span>Risk Assessment & Capital Preservation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {signal.riskAssessment.reasoning}
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400">Max Stop Loss Distance:</span>{' '}
                <span className="font-bold text-rose-400">{signal.riskAssessment.suggestedStopLossPercent}%</span>
              </div>
              <div>
                <span className="text-slate-400">Recommended Capital Size:</span>{' '}
                <span className="font-bold text-emerald-400">{signal.riskAssessment.recommendedPositionSizePercent}% of Capital</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: POSSIBLE SCENARIOS */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
              <Compass className="h-4 w-4" />
              <span>Possible Scenarios (Multi-Timeframe Outlook)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="font-bold text-emerald-400 text-[11px] mb-1">Intraday (Short-Term)</div>
                <p className="text-slate-300">{signal.possibleScenarios.shortTermIntraday}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="font-bold text-cyan-400 text-[11px] mb-1">Weekly (Medium-Term)</div>
                <p className="text-slate-300">{signal.possibleScenarios.mediumTermWeekly}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="font-bold text-amber-400 text-[11px] mb-1">Long-Term Outlook</div>
                <p className="text-slate-300">{signal.possibleScenarios.longTermOutlook}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
