import React, { useState } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  User, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Target, 
  BarChart2, 
  Send, 
  ExternalLink, 
  MessageSquare, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ClipboardCheck 
} from 'lucide-react';
import { AppPage } from '../../types';

interface SupportViewProps {
  onSelectPage?: (page: AppPage) => void;
}

interface FAQItem {
  id: number;
  question: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  answer: React.ReactNode;
}

export const SupportView: React.FC<SupportViewProps> = ({ onSelectPage }) => {
  const [copied, setCopied] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  
  // All FAQ questions closed by default
  const [openFaqIds, setOpenFaqIds] = useState<number[]>([]);

  // Email form state
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailCategory, setEmailCategory] = useState('BSE Signals & Strategies');
  const [emailDescription, setEmailDescription] = useState('');
  
  // Validation and feedback states
  const [errors, setErrors] = useState<{ email?: string; subject?: string; description?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; subject?: boolean; description?: boolean }>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const supportEmail = 'tanmaykhariwal@gmail.com';
  const supportName = 'Tanmay';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFaq = (id: number) => {
    setOpenFaqIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Standard email validation regex
  const isValidEmail = (emailStr: string): boolean => {
    const trimmed = emailStr.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; subject?: string; description?: string } = {};

    // 1. Email format validation
    if (!senderEmail.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!isValidEmail(senderEmail)) {
      newErrors.email = 'Invalid email address format (e.g. name@domain.com).';
    }

    // 2. Subject validation
    if (!emailSubject.trim()) {
      newErrors.subject = 'Please enter a subject.';
    } else if (emailSubject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters long.';
    }

    // 3. Message validation
    if (!emailDescription.trim()) {
      newErrors.description = 'Please enter your message or query.';
    } else if (emailDescription.trim().length < 10) {
      newErrors.description = 'Please write at least 10 characters so we can understand your request.';
    }

    setErrors(newErrors);
    setTouched({ email: true, subject: true, description: true });

    return Object.keys(newErrors).length === 0;
  };

  // Formatted email content
  const getFormattedEmailBody = () => {
    return [
      `Hi Tanmay,`,
      ``,
      emailDescription.trim(),
      ``,
      `--------------------------------------------------`,
      `Inquiry Category: ${emailCategory}`,
      `Sender Name: ${senderName.trim() || 'Not specified'}`,
      `Sender Email: ${senderEmail.trim()}`,
      `Application: Trader AI (BSE Trading Intelligence)`,
      `Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`
    ].join('\n');
  };

  const getEffectiveSubject = () => {
    const cleanSubj = emailSubject.trim() || 'Trading Query';
    return `[Trader AI: ${emailCategory}] ${cleanSubj}`;
  };

  // Method 1: Send via Default Mail App (mailto:)
  const handleSendViaMailApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Please correct the highlighted fields before sending.' 
      });
      return;
    }

    const subject = encodeURIComponent(getEffectiveSubject());
    const body = encodeURIComponent(getFormattedEmailBody());
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

    try {
      window.location.href = mailtoUrl;
      setStatusMessage({ 
        type: 'success', 
        text: 'Opening your default email app with your message pre-filled.' 
      });
    } catch {
      setStatusMessage({
        type: 'info',
        text: 'If your mail client did not open, you can use Gmail Web or Copy Draft below.'
      });
    }
  };

  // Method 2: Open in Gmail Web composer
  const handleOpenInGmail = () => {
    if (!validateForm()) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Please provide a valid email and message before opening Gmail.' 
      });
      return;
    }

    const subject = encodeURIComponent(getEffectiveSubject());
    const body = encodeURIComponent(getFormattedEmailBody());
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${subject}&body=${body}`;

    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setStatusMessage({ 
      type: 'success', 
      text: 'Opened Gmail Web composer in a new tab!' 
    });
  };

  // Method 3: Copy full formatted draft
  const handleCopyFormattedDraft = () => {
    if (!validateForm()) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Please fill in the required fields first.' 
      });
      return;
    }

    const fullDraft = `To: ${supportEmail}\nSubject: ${getEffectiveSubject()}\n\n${getFormattedEmailBody()}`;
    navigator.clipboard.writeText(fullDraft);
    setCopiedTemplate(true);
    setStatusMessage({ 
      type: 'success', 
      text: 'Email draft copied to clipboard!' 
    });
    setTimeout(() => setCopiedTemplate(false), 3000);
  };

  const categories = [
    'BSE Signals & Strategies',
    'Trade Execution & Targets',
    'Indicator Technicals',
    'Feature Request',
    'Bug Report / Feedback'
  ];

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'How do I interpret and execute the BSE Buy Signals?',
      category: 'Signal Execution',
      icon: TrendingUp,
      answer: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            Each signal is generated from institutional confluence algorithms tracking order flow, fair value gaps, and key exponential moving averages (20 EMA & 50 SMA).
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li><strong className="text-slate-200">Buy Zone:</strong> The optimal price window to enter without overpaying for intraday momentum.</li>
            <li><strong className="text-slate-200">Probable Window:</strong> The expected time interval for liquidity expansion and trade ignition.</li>
            <li><strong className="text-slate-200">Stop Loss:</strong> Always define strict downside risk anchoring to protect account capital.</li>
          </ul>
        </div>
      )
    },
    {
      id: 2,
      question: 'Why are Target Selling Zones (T1 & T2) unlocked only after marking a stock as bought?',
      category: 'Trade Discipline',
      icon: Target,
      answer: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            To prevent premature exits, front-running, and undisciplined execution, Target 1 (T1) and Target 2 (T2) profit exit zones are unlocked once you click <strong className="text-emerald-400">"I Bought This Stock"</strong>.
          </p>
          <p className="text-slate-400">
            Once marked as bought, the system continuously monitors live BSE ticks, calculates unrealized P&L in real-time, and fires automatic alerts the exact moment price touches your target profit zone or stop loss.
          </p>
        </div>
      )
    },
    {
      id: 3,
      question: 'How does switching Candlestick Timeframes (5m, 15m, 1h, 1D, 1W) impact the chart and strategy?',
      category: 'Chart Analysis',
      icon: BarChart2,
      answer: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            Changing the timeframe dynamically alters the chart bar intervals, volatility parameters, and execution horizons:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li><strong className="text-cyan-400">5m:</strong> Scalping & fast micro-momentum ignition setups (15–30 min holding time).</li>
            <li><strong className="text-cyan-400">15m:</strong> Core intraday breakout & liquidity sweep confluence (standard intraday swing).</li>
            <li><strong className="text-cyan-400">1h & 1D:</strong> Positional swing setups with wider structural targets and macro trend strength.</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      question: 'What is the difference between Conservative, Moderate, and Aggressive risk modes?',
      category: 'Risk Management',
      icon: ShieldCheck,
      answer: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            The risk profile controls position sizing recommendations, stop-loss tightness, and target multipliers:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold block">Conservative</span>
              <span className="text-slate-400 text-[10px]">Tight SL (0.9%), ~1.5% size, T1: +1.8%</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-bold block">Moderate</span>
              <span className="text-slate-400 text-[10px]">Standard SL (1.5%), ~2.5% size, T1: +2.2%</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold block">Aggressive</span>
              <span className="text-slate-400 text-[10px]">Wider SL (2.8%), ~4.0% size, T1-T3 Multi-leg</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      question: 'What are the official BSE (Bombay Stock Exchange) market operating hours?',
      category: 'Market Hours',
      icon: Clock,
      answer: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            BSE standard equity trading operates Monday through Friday on the following schedule (Indian Standard Time - IST):
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li><strong className="text-slate-200">09:00 AM – 09:15 AM:</strong> Pre-Open Order Matching Session</li>
            <li><strong className="text-emerald-400">09:15 AM – 03:30 PM:</strong> Normal Continuous Live Trading Session</li>
            <li><strong className="text-slate-200">03:40 PM – 04:00 PM:</strong> Post-Market Closing Session</li>
          </ul>
          <p className="text-[11px] text-slate-400">
            You can verify active market status at any time in the <strong className="text-cyan-400">Market Hours</strong> tab in the sidebar.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-150 pb-12">
      
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-cyan-400 to-emerald-400 p-0.5 shadow-xl shadow-indigo-500/20 flex-shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <User className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Support & Direct Help
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Direct Contact</span>
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Have questions about BSE trading signals, strategies, or custom features? Reach out directly to <strong className="text-white font-bold">{supportName}</strong>.
              </p>
            </div>
          </div>

          {/* Quick Copy Contact Pill */}
          <div className="flex-shrink-0 bg-slate-950/90 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3.5 shadow-xl">
            <div className="flex items-center space-x-2 text-xs">
              <Mail className="h-4 w-4 text-indigo-400" />
              <span className="font-mono text-slate-200 font-bold select-all text-xs">{supportEmail}</span>
            </div>
            <button
              onClick={handleCopyEmail}
              className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-black transition-all flex items-center space-x-2 shadow-lg shadow-indigo-500/25 cursor-pointer w-full sm:w-auto justify-center"
            >
              {copied ? <Check className="h-4 w-4 text-slate-950 stroke-[3]" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy Email'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (Accordion - ALL CLOSED BY DEFAULT) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-400">
                Click on any question below to expand the detailed explanation.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Dropdowns List */}
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = openFaqIds.includes(faq.id);
            const Icon = faq.icon;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'bg-slate-950/90 border-indigo-500/40 shadow-lg' 
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Accordion Question Header */}
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                    <div className={`p-2 rounded-xl border flex-shrink-0 transition-colors ${
                      isOpen 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {faq.category}
                      </div>
                      <h3 className={`text-xs sm:text-sm font-extrabold tracking-tight ${
                        isOpen ? 'text-white' : 'text-slate-200'
                      }`}>
                        {faq.question}
                      </h3>
                    </div>
                  </div>

                  <div className={`p-1.5 rounded-lg border flex-shrink-0 transition-transform ${
                    isOpen ? 'bg-indigo-500 text-slate-950 border-indigo-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* Dropdown Menu Answer Content */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-800/60 bg-slate-950/70 animate-in fade-in duration-150">
                    <div className="pl-11 pr-2 pt-2">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIRECT EMAIL SENDER */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>Send Direct Email to Tanmay</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill in the form below to dispatch your message directly to <strong className="text-slate-200 font-mono">{supportEmail}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 self-start md:self-auto">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">To:</span>
            <span className="text-xs font-mono font-bold text-indigo-300 select-all">{supportEmail}</span>
          </div>
        </div>

        {/* Status / Feedback Banner */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl border flex items-center space-x-3 text-xs font-medium animate-in fade-in ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-[11px] font-mono underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSendViaMailApp} className="space-y-5">
          
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Category</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEmailCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    emailCategory === cat
                      ? 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sender Email & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sender Email - REQUIRED WITH VALIDATION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                  <span>Your Email Address</span>
                  <span className="text-rose-400 font-black">*</span>
                </label>
                {touched.email && !errors.email && senderEmail.trim() && (
                  <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                    <Check className="h-3 w-3" />
                    <span>Valid format</span>
                  </span>
                )}
              </div>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => {
                  const val = e.target.value;
                  setSenderEmail(val);
                  if (touched.email) {
                    if (!val.trim()) {
                      setErrors(prev => ({ ...prev, email: 'Please enter your email address.' }));
                    } else if (!isValidEmail(val)) {
                      setErrors(prev => ({ ...prev, email: 'Invalid email address format (e.g. name@domain.com).' }));
                    } else {
                      setErrors(prev => {
                        const { email, ...rest } = prev;
                        return rest;
                      });
                    }
                  }
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, email: true }));
                  if (!senderEmail.trim()) {
                    setErrors(prev => ({ ...prev, email: 'Please enter your email address.' }));
                  } else if (!isValidEmail(senderEmail)) {
                    setErrors(prev => ({ ...prev, email: 'Invalid email address format (e.g. name@domain.com).' }));
                  } else {
                    setErrors(prev => {
                      const { email, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                placeholder="name@example.com"
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.email && errors.email
                    ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-[11px] text-rose-400 flex items-center space-x-1 font-medium mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Sender Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Your Name <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g., Rohit Sharma"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Subject</span>
              <span className="text-rose-400 font-black">*</span>
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => {
                const val = e.target.value;
                setEmailSubject(val);
                if (touched.subject) {
                  if (!val.trim()) {
                    setErrors(prev => ({ ...prev, subject: 'Please enter a subject.' }));
                  } else {
                    setErrors(prev => {
                      const { subject, ...rest } = prev;
                      return rest;
                    });
                  }
                }
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, subject: true }));
                if (!emailSubject.trim()) {
                  setErrors(prev => ({ ...prev, subject: 'Please enter a subject.' }));
                }
              }}
              placeholder="e.g., Query regarding BSE intraday momentum setups"
              className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                touched.subject && errors.subject
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {touched.subject && errors.subject && (
              <p className="text-[11px] text-rose-400 flex items-center space-x-1 font-medium mt-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>{errors.subject}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                <span>Message Description</span>
                <span className="text-rose-400 font-black">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {emailDescription.length} chars
              </span>
            </div>
            <textarea
              rows={5}
              value={emailDescription}
              onChange={(e) => {
                const val = e.target.value;
                setEmailDescription(val);
                if (touched.description) {
                  if (!val.trim()) {
                    setErrors(prev => ({ ...prev, description: 'Please enter your message or query.' }));
                  } else {
                    setErrors(prev => {
                      const { description, ...rest } = prev;
                      return rest;
                    });
                  }
                }
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, description: true }));
                if (!emailDescription.trim()) {
                  setErrors(prev => ({ ...prev, description: 'Please enter your message or query.' }));
                }
              }}
              placeholder="Type your message, trade questions, or feedback in detail..."
              className={`w-full bg-slate-950 border rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors leading-relaxed resize-y min-h-[120px] ${
                touched.description && errors.description
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {touched.description && errors.description && (
              <p className="text-[11px] text-rose-400 flex items-center space-x-1 font-medium mt-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Option 1: Default Mail App */}
              <button
                type="submit"
                className="py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                <Send className="h-4 w-4 stroke-[2.5]" />
                <span>Send via Mail App</span>
              </button>

              {/* Option 2: Gmail Web Composer */}
              <button
                type="button"
                onClick={handleOpenInGmail}
                className="py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40 font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 text-rose-400" />
                <span>Open in Gmail (Web)</span>
              </button>

              {/* Option 3: Copy Draft */}
              <button
                type="button"
                onClick={handleCopyFormattedDraft}
                className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                {copiedTemplate ? (
                  <>
                    <ClipboardCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied Full Draft!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-400" />
                    <span>Copy Full Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer Note */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>All options compose your inquiry addressed directly to <strong>{supportEmail}</strong>.</span>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="text-indigo-400 hover:text-indigo-300 font-mono hover:underline inline-flex items-center space-x-1 cursor-pointer"
          >
            <span>Copy Tanmay's email address</span>
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>

    </div>
  );
};
