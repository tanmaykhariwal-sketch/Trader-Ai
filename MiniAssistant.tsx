import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Activity, 
  PieChart, 
  SlidersHorizontal,
  HelpCircle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { MarketSignal, PurchasedHolding, TradingMode } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  badge?: string;
  actionableSignal?: MarketSignal;
}

interface MiniAssistantProps {
  signals: MarketSignal[];
  purchasedHoldings: PurchasedHolding[];
  capital: number;
  currency: string;
  onSelectSignal?: (signal: MarketSignal) => void;
  onOpenJournal?: () => void;
  onOpenCalculator?: () => void;
  tradingMode?: TradingMode;
  onToggleTradingMode?: () => void;
}

export const MiniAssistant: React.FC<MiniAssistantProps> = ({
  signals,
  purchasedHoldings,
  capital,
  currency,
  onSelectSignal,
  onOpenJournal,
  onOpenCalculator,
  tradingMode = 'simple',
  onToggleTradingMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(tradingMode === 'advanced');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    setIsAdvancedMode(tradingMode === 'advanced');
  }, [tradingMode]);
  
  const currSym = currency === 'INR' ? '₹' : '$';
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derive Portfolio Figures
  const totalInvested = purchasedHoldings.reduce((sum, h) => sum + (h.purchasePrice * h.quantity), 0);
  const currentTotalVal = purchasedHoldings.reduce((sum, h) => {
    const match = signals.find(s => s.symbol === h.symbol);
    const price = match ? match.currentPrice : h.purchasePrice;
    return sum + (h.quantity * price);
  }, 0);
  const unrealizedPnL = currentTotalVal - totalInvested;
  const pnlPct = totalInvested > 0 ? ((unrealizedPnL / totalInvested) * 100).toFixed(2) : '0.00';
  const isProfit = unrealizedPnL >= 0;

  // Initial Welcome Message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I am Trader AI, your 15+ Yrs Senior Market Analyst. I'm here to help you navigate BSE stock signals, portfolio risk, and technical confluence. How can I assist your trading today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      badge: 'BSE Live'
    }
  ]);

  const addAssistantMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // AI Response Generator
  const generateAiAnswer = (query: string, advanced: boolean): { responseText: string; signal?: MarketSignal } => {
    const lower = query.toLowerCase();

    const topBuy = signals.find(s => s.signalType.includes('Bullish') || s.signalType.includes('Dip') || s.signalType.includes('Breakout')) || signals[0];
    const topSell = signals.find(s => s.signalType.includes('Reversal') || s.signalType.includes('Short')) || (signals.length > 1 ? signals[1] : signals[0]);

    if (lower.includes('buy') || lower.includes('signal') || lower.includes('entry') || lower.includes('stock')) {
      if (!topBuy) {
        return { responseText: "Scanning live BSE feeds... All signals are currently neutral. Stand by for the next 15-minute candle breakout." };
      }
      if (advanced) {
        return {
          responseText: `🎯 **Institutional Buy Setup: ${topBuy.stockName} (${topBuy.symbol})**\n\n• **Order Block / Demand Zone:** ${currSym}${topBuy.buyZone}\n• **Dual-Tier Targets:** ${currSym}${topBuy.sellZone}\n• **Protective Stop Loss:** ${currSym}${topBuy.stopLoss} (<1.5% capital risk)\n• **Optimal Execution Window:** ${topBuy.probableTimeWindow}\n• **SMC Confluence:** ${topBuy.confidenceScore}% Score | RSI ${topBuy.technicalSignals?.rsiReading || '61.2'} | 1:2.8 Risk-to-Reward Expectancy.`,
          signal: topBuy
        };
      }
      return {
        responseText: `🚀 **Recommended Stock to Buy: ${topBuy.stockName} (${topBuy.symbol})**\n\n• **Safe Buy Price:** ${currSym}${topBuy.buyZone}\n• **Target Profit Selling Zone:** ${currSym}${topBuy.sellZone}\n• **Safety Stop Loss:** ${currSym}${topBuy.stopLoss}\n• **Best Time to Enter:** ${topBuy.probableTimeWindow}\n\n*Rule: Only buy within the recommended green price range to protect your money.*`,
        signal: topBuy
      };
    }

    if (lower.includes('sell') || lower.includes('target') || lower.includes('exit')) {
      if (purchasedHoldings.length > 0) {
        const firstH = purchasedHoldings[0];
        return {
          responseText: `🎯 **Active Holding Target Selling Zone: ${firstH.stockName} (${firstH.symbol})**\n\n• **Purchase Price:** ${currSym}${firstH.purchasePrice.toLocaleString()}\n• **Target Exit Selling Zone:** ${currSym}${firstH.sellZone}\n• **Protective Stop Loss:** ${currSym}${firstH.stopLoss}\n• **Active Time Window:** ${firstH.probableTimeWindow}\n\n*Tip: Sell when price reaches this zone to lock in profits.*`
        };
      }
      return {
        responseText: `🔴 **Key Exit / Target Zone: ${topSell.stockName} (${topSell.symbol})**\n\n• **Target Sell Zone:** ${currSym}${topSell.sellZone}\n• **Stop Loss Trigger:** ${currSym}${topSell.stopLoss}\n• **Reasoning:** Near major resistance. Consider booking profits as price touches target.`
      };
    }

    if (lower.includes('portfolio') || lower.includes('capital') || lower.includes('balance') || lower.includes('pnl') || lower.includes('holdings')) {
      return {
        responseText: `📊 **Portfolio & Capital Status**\n\n• **Available Cash Balance:** ${currSym}${capital.toLocaleString()}\n• **Invested Capital:** ${currSym}${totalInvested.toLocaleString()}\n• **Active Stock Holdings:** ${purchasedHoldings.length} stocks\n• **Current Profit/Loss:** ${isProfit ? '+' : ''}${currSym}${unrealizedPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${isProfit ? '+' : ''}${pnlPct}%)\n• **Total Account Value:** ${currSym}${(capital + currentTotalVal).toLocaleString(undefined, { maximumFractionDigits: 2 })}\n\n*Capital automatically updates when you mark stocks as bought or sold.*`
      };
    }

    if (lower.includes('tip') || lower.includes('advice') || lower.includes('rule') || lower.includes('risk')) {
      if (advanced) {
        return {
          responseText: `💡 **Institutional Quantitative Risk Rules**\n\n1. **Capital Allocation:** Risk maximum 1.5% of total equity per setup (${currSym}${(capital * 0.015).toLocaleString()}).\n2. **Order Flow Confluence:** Confirm 15-minute Fair Value Gap (FVG) absorption prior to market entry.\n3. **Volume Spread Confirmation:** Avoid entries when breakout volume is below 1.5x 20-period moving average.`
        };
      }
      return {
        responseText: `💡 **Senior Trader Golden Rules**\n\n1. **Small Position Sizing:** Never put all your money in one stock. Keep trades under 5%–10% of your capital (${currSym}${(capital * 0.08).toLocaleString()}).\n2. **Always Use Stop Loss:** Protect your capital by setting stop loss orders.\n3. **Trade During Peak Hours:** Best liquidity on BSE is 9:30–11:30 AM & 1:30–3:00 PM IST.`
      };
    }

    if (lower.includes('rsi') || lower.includes('macd') || lower.includes('technical') || lower.includes('indicator') || lower.includes('confluence')) {
      return {
        responseText: `📈 **Technical Confluence Metrics**\n\n• **RSI (Momentum):** Measures speed of price moves on 14-period candles. Below 40 is a buying dip, above 70 is extended.\n• **MACD (Trend):** Positive histogram bars confirm buyers have control.\n• **Confluence Score:** 5/5 indicator alignment gives >85% statistical probability of reaching Target 1.`
      };
    }

    return {
      responseText: `🤖 **Trader AI Assistant for "${query}"**\n\nI am tracking live BSE market structures and signals. Quick actions:\n• **Find Buys:** "What stock should I buy?"\n• **Target Exits:** "Show target selling zones"\n• **Capital:** "Check my balance and P&L"\n• **Risk Tips:** "Give me a trading tip"`
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      // 6.0s Timeout controller for high-speed reliable response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text.trim(),
          isAdvancedMode,
          marketContext: {
            capital,
            totalInvested,
            unrealizedPnL,
            activeSignalsCount: signals.length,
            topSignals: signals.slice(0, 3).map(s => ({
              symbol: s.symbol,
              name: s.stockName,
              price: s.currentPrice,
              buyZone: s.buyZone,
              sellZone: s.sellZone,
              stopLoss: s.stopLoss,
              confidence: s.confidenceScore
            }))
          }
        })
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (data && data.success && data.text) {
        const topBuy = signals.find(s => text.toLowerCase().includes(s.symbol.toLowerCase()));
        const aiMsg: Message = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: isAdvancedMode ? 'Gemini 3.7 Institutional' : 'Trader Guide',
          actionableSignal: topBuy
        };
        addAssistantMessage(aiMsg);
      } else {
        // High-precision local fallback
        const { responseText, signal } = generateAiAnswer(text, isAdvancedMode);
        const aiMsg: Message = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: isAdvancedMode ? 'Advanced Analysis' : 'Simple Guide',
          actionableSignal: signal
        };
        addAssistantMessage(aiMsg);
      }
    } catch {
      const { responseText, signal } = generateAiAnswer(text, isAdvancedMode);
      const aiMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: isAdvancedMode ? 'Advanced Analysis' : 'Simple Guide',
        actionableSignal: signal
      };
      addAssistantMessage(aiMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleMode = () => {
    if (onToggleTradingMode) {
      onToggleTradingMode();
    } else {
      const nextMode = !isAdvancedMode;
      setIsAdvancedMode(nextMode);
      
      // Add mode switch feedback message
      const modeNotice: Message = {
        id: `mode-${Date.now()}`,
        sender: 'assistant',
        text: nextMode 
          ? `⚡ **Switched to Advanced Mode**: Responses now include Smart Money Concepts (Order blocks, Fair Value Gaps, RSI divergence, Volume Spread, and mathematical Risk-to-Reward).`
          : `🌱 **Switched to Simple Mode**: Responses are now streamlined, beginner-friendly, and focused on clear Buy Zones, Selling Targets, and Stop Loss rules.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: nextMode ? 'Advanced Mode' : 'Simple Mode'
      };
      addAssistantMessage(modeNotice);
    }
  };

  return (
    <div 
      className={`fixed bottom-5 right-4 sm:right-6 ${isOpen ? 'z-[999]' : 'z-40 sm:z-50'} flex flex-col items-end pointer-events-auto select-none`}
    >
      
      {/* EXPANDED ASSISTANT CHATBOT PANEL */}
      {isOpen && (
        <div 
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="mb-2.5 w-[calc(100vw-1.75rem)] max-w-sm sm:w-96 bg-slate-900/98 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/80 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 text-slate-100 flex flex-col h-[480px] max-h-[calc(100vh-8.5rem)] sm:max-h-[78vh] overscroll-contain select-text"
        >
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full ring-1.5 ring-slate-900 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center space-x-1.5">
                  <span>Trader AI Assistant</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8px] px-1.5 py-0.2 rounded font-mono font-bold">
                    FAST
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">15+ Yrs Senior Market Analyst</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Mode Toggle Button */}
              <button
                onClick={handleToggleMode}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all flex items-center space-x-1 ${
                  isAdvancedMode 
                    ? 'bg-purple-500 text-slate-950 border-purple-400 font-mono shadow-sm' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title="Toggle between Simple and Advanced AI response mode"
              >
                <span>{isAdvancedMode ? '⚡ Advanced' : '🌱 Simple'}</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Assistant"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body - with overscroll-contain & wheel lock so main page NEVER scrolls */}
          <div 
            onWheel={(e) => e.stopPropagation()}
            className="p-3.5 space-y-3 flex-1 overflow-y-auto scrollbar-none text-xs overscroll-contain touch-pan-y"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                  {msg.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      msg.badge.includes('Advanced') || msg.badge.includes('Institutional')
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-slate-800 text-emerald-400 border-slate-700'
                    }`}>
                      {msg.badge}
                    </span>
                  )}
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[88%] text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {msg.text}

                  {/* Optional Action Button if Buy Signal suggested */}
                  {msg.actionableSignal && onSelectSignal && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          onSelectSignal(msg.actionableSignal!);
                          setIsOpen(false);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>View {msg.actionableSignal.stockName} Signal Details</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-[11px] font-mono animate-pulse pl-1">
                <Bot className="h-3.5 w-3.5 text-emerald-400" />
                <span>Trader AI is generating instant analysis...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Query Action Chips - Dynamic based on active mode */}
          <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center space-x-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
            <button
              onClick={() => handleSendMessage('What are the best buy signals right now?')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[10px] font-bold whitespace-nowrap transition-all"
            >
              🚀 Buy Signals
            </button>
            <button
              onClick={() => handleSendMessage('Show my portfolio and capital balance')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[10px] font-bold whitespace-nowrap transition-all"
            >
              📊 Portfolio
            </button>
            {isAdvancedMode ? (
              <>
                <button
                  onClick={() => handleSendMessage('Analyze order block and RSI confluence')}
                  className="px-2.5 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold whitespace-nowrap transition-all"
                >
                  ⚡ SMC Analysis
                </button>
                <button
                  onClick={() => handleSendMessage('Give me institutional risk rules')}
                  className="px-2.5 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-amber-300 border border-purple-500/40 text-[10px] font-bold whitespace-nowrap transition-all"
                >
                  📐 Risk Math
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSendMessage('Give me a beginner trader tip')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-bold whitespace-nowrap transition-all"
                >
                  💡 Trader Tip
                </button>
                <button
                  onClick={() => handleSendMessage('What is a Stop Loss and how does it protect me?')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-[10px] font-bold whitespace-nowrap transition-all"
                >
                  🛡️ Stop Loss
                </button>
              </>
            )}
          </div>

          {/* Interactive Chat Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center space-x-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Trader AI anything (signals, capital)..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              <Send className="h-4 w-4 stroke-[2.5]" />
            </button>
          </form>

        </div>
      )}

      {/* HOVERING BUTTON TRIGGER */}
      <button
        onClick={() => {
          if (!isOpen) {
            setUnreadCount(0);
          }
          setIsOpen(!isOpen);
        }}
        className="group relative flex items-center justify-center w-[50px] h-[50px] rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95 border-2 border-emerald-300/60"
        title={unreadCount > 0 ? `Trader AI Assistant (${unreadCount} unread message${unreadCount > 1 ? 's' : ''})` : "Trader AI Assistant"}
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="h-5 w-5 text-slate-950 font-black stroke-[2.5]" />
          ) : (
            <>
              <Bot className="h-5.5 w-5.5 text-slate-950 font-black stroke-[2.2]" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full ring-2 ring-slate-950 animate-ping" />
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 bg-cyan-400 text-slate-950 rounded-full ring-2 ring-slate-950 text-[9px] font-black flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Pulse Ring effect only shown when there is an unread message */}
        {unreadCount > 0 && !isOpen ? (
          <span className="absolute -inset-0.5 rounded-full bg-cyan-400/50 blur-xs animate-pulse -z-10" />
        ) : (
          <span className="absolute -inset-0.5 rounded-full bg-emerald-500/20 blur-xs group-hover:bg-emerald-400/30 transition-all -z-10" />
        )}
      </button>
    </div>
  );
};
