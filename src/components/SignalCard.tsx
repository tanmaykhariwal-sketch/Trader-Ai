import React, { useState, useEffect } from 'react';
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
  Compass
} from 'lucide-react';

interface SignalCardProps {
  signal: MarketSignal;
  onOpenCalculatorForSignal: (signal: MarketSignal) => void;
  audioEnabled: boolean;
  onViewFullAnalysis?: () => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  onOpenCalculatorForSignal,
  audioEnabled,
  onViewFullAnalysis
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Was `.includes('Bullish') || .includes('Demand')` — missed
  // 'Consolidation Breakout' (a real seeded signalType, e.g. HDFCBANK, and
  // what every Aggressive-risk-profile-generated signal gets), and every
  // uppercase news-prediction signalType ('STRONG UPGRADE', 'BULLISH
  // OUTPERFORM') since the check was case-sensitive — confirmed live: a
  // "Consolidation Breakout" signal (which Market Hub lists as a green "Top
  // Buy Signal") rendered here with a red down-arrow and rose "sell-side"
  // styling. Elsewhere in the app (BeginnerSummaryView's filter, MiniAssistant's
  // topSell matcher) "Reversal"/"Short"/"Downgrade"/"Underperform" are the
  // signals actually treated as the sell side — mirrored here instead of
  // trying to enumerate every bullish variant, so a signal type this app
  // hasn't seen yet still defaults to the (correct, since this is a
  // buy-signal-oriented app) bullish styling rather than the reverse.
  const bearishKeywords = ['bearish', 'reversal', 'short', 'downgrade', 'underperform'];
  const isBullish = !bearishKeywords.some(k => signal.signalType.toLowerCase().includes(k));

  const handleSpeakBriefing = () => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;

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

  // Speech synthesis previously had no cleanup: muting audio mid-briefing
  // via the sidebar toggle (which disables the only button that can cancel
  // it) or navigating away from this card entirely both left the browser
  // reading the full briefing aloud with zero way to stop it. Cancelling on
  // unmount and whenever audioEnabled flips off closes both gaps.
  useEffect(() => {
    if (!audioEnabled && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [audioEnabled, isSpeaking]);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

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
            disabled={!audioEnabled}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={audioEnabled ? 'Listen to Voice Briefing' : 'Audio is muted — enable it in the sidebar'}
          >
            {!audioEnabled ? (
              <VolumeX className="h-4 w-4" />
            ) : isSpeaking ? (
              <Volume2 className="h-4 w-4 animate-pulse text-amber-400" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
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
            <Target className="h-5 w-5 text-emerald-400 animate-pulse" />
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

          {/* Sell Zone (Targets) */}
          <div className="p-3.5 rounded-xl border bg-cyan-950/40 border-cyan-500/40">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
              <Target className="h-3 w-3 mr-1 text-cyan-400" /> Target Sell Zone
            </div>
            <div className="text-xs font-bold font-mono text-cyan-300">
              {signal.sellZone}
            </div>
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

      {/* ADVANCED DATA SUMMARY + LINK TO FULL ANALYSIS */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Technical Confluence</span>
          <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            {signal.technicalSignals.confluenceScore}%
          </span>
        </div>
        <p className="text-xs text-slate-400 truncate">{signal.riskAssessment.reasoning}</p>
        {onViewFullAnalysis && (
          <button
            onClick={onViewFullAnalysis}
            className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center space-x-1 cursor-pointer"
          >
            <span>View full analysis</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        )}
      </div>

    </div>
  );
};
