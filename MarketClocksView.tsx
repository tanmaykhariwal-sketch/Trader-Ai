import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Globe, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export const MarketClocksView: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format times in various timezones
  const getTimeInZone = (timeZone: string) => {
    return time.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getDateInZone = (timeZone: string) => {
    return time.toLocaleDateString('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Indian Market Session Status Calculations
  const getBseStatus = () => {
    const istHours = parseInt(time.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }));
    const istMinutes = parseInt(time.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', minute: '2-digit' }));
    const currentMins = istHours * 60 + istMinutes;

    const day = time.getDay();
    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
      return { status: 'Closed (Weekend)', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', note: 'Opens Monday 09:15 AM IST' };
    }

    if (currentMins >= 540 && currentMins < 555) {
      return { status: 'Pre-Market Discovery (09:00 - 09:15 AM)', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', note: 'Order Matching & Equilibrium' };
    }

    if (currentMins >= 555 && currentMins < 930) {
      return { status: 'Live Market Trading (09:15 AM - 03:30 PM)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', note: 'Normal Session Active' };
    }

    if (currentMins >= 930 && currentMins < 940) {
      return { status: 'Closing Price Session (03:30 - 03:40 PM)', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', note: 'Weighted Average Calculation' };
    }

    return { status: 'Market Closed', color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700', note: 'Opens next trading day at 09:15 AM IST' };
  };

  const bseStatus = getBseStatus();

  const exchanges = [
    {
      name: 'Bombay Stock Exchange (BSE / NSE)',
      code: 'BSE',
      city: 'Mumbai, India',
      timeZone: 'Asia/Kolkata',
      tradingHoursIST: '09:15 AM – 03:30 PM IST',
      localHours: '09:15 AM – 03:30 PM',
      flag: '🇮🇳',
      isPrimary: true
    },
    {
      name: 'New York Stock Exchange (NYSE)',
      code: 'NYSE',
      city: 'New York, USA',
      timeZone: 'America/New_York',
      tradingHoursIST: '07:00 PM – 01:30 AM IST',
      localHours: '09:30 AM – 04:00 PM EST',
      flag: '🇺🇸'
    },
    {
      name: 'NASDAQ Stock Market',
      code: 'NASDAQ',
      city: 'New York, USA',
      timeZone: 'America/New_York',
      tradingHoursIST: '07:00 PM – 01:30 AM IST',
      localHours: '09:30 AM – 04:00 PM EST',
      flag: '🇺🇸'
    },
    {
      name: 'London Stock Exchange (LSE)',
      code: 'LSE',
      city: 'London, UK',
      timeZone: 'Europe/London',
      tradingHoursIST: '01:30 PM – 10:00 PM IST',
      localHours: '08:00 AM – 04:30 PM GMT',
      flag: '🇬🇧'
    },
    {
      name: 'Tokyo Stock Exchange (TSE)',
      code: 'TSE',
      city: 'Tokyo, Japan',
      timeZone: 'Asia/Tokyo',
      tradingHoursIST: '05:30 AM – 11:30 AM IST',
      localHours: '09:00 AM – 03:00 PM JST',
      flag: '🇯🇵'
    },
    {
      name: 'Hong Kong Exchanges (HKEX)',
      code: 'HKEX',
      city: 'Hong Kong',
      timeZone: 'Asia/Hong_Kong',
      tradingHoursIST: '07:00 AM – 01:30 PM IST',
      localHours: '09:30 AM – 04:00 PM HKT',
      flag: '🇭🇰'
    }
  ];

  const holidays2026 = [
    { date: '26 Jan 2026', day: 'Monday', occasion: 'Republic Day', status: 'Holiday' },
    { date: '03 Mar 2026', day: 'Tuesday', occasion: 'Holi', status: 'Holiday' },
    { date: '20 Mar 2026', day: 'Friday', occasion: 'Eid-ul-Fitr', status: 'Holiday' },
    { date: '03 Apr 2026', day: 'Friday', occasion: 'Good Friday', status: 'Holiday' },
    { date: '14 Apr 2026', day: 'Tuesday', occasion: 'Dr. Ambedkar Jayanti', status: 'Holiday' },
    { date: '01 May 2026', day: 'Friday', occasion: 'Maharashtra Day', status: 'Holiday' },
    { date: '15 Aug 2026', day: 'Saturday', occasion: 'Independence Day', status: 'Weekend' },
    { date: '02 Oct 2026', day: 'Friday', occasion: 'Mahatma Gandhi Jayanti', status: 'Holiday' },
    { date: '08 Nov 2026', day: 'Sunday', occasion: 'Diwali Laxmi Pujan (Muhurat Trading)', status: 'Special 1-hr Session' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <Clock className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>BSE Market Hours & Global Exchanges</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Live Timers
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Synchronized global market sessions, Indian trading timeline, and 2026 BSE market holiday schedule.
            </p>
          </div>
        </div>

        {/* Live BSE Status */}
        <div className={`px-4 py-2.5 rounded-xl border ${bseStatus.bg} flex items-center space-x-2.5`}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div>
            <div className={`text-xs font-black uppercase ${bseStatus.color}`}>{bseStatus.status}</div>
            <div className="text-[10px] text-slate-400 font-mono">{bseStatus.note}</div>
          </div>
        </div>
      </div>

      {/* Global Exchanges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exchanges.map((ex) => {
          const localTime = getTimeInZone(ex.timeZone);
          const localDate = getDateInZone(ex.timeZone);

          return (
            <div
              key={ex.code}
              className={`p-5 rounded-2xl border shadow-xl transition-all ${
                ex.isPrimary 
                  ? 'bg-gradient-to-br from-slate-900 to-emerald-950/20 border-emerald-500/40' 
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl">{ex.flag}</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{ex.name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono">{ex.city}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {ex.code}
                </span>
              </div>

              <div className="space-y-3">
                {/* Live Clock Display */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Local Time</div>
                    <div className="font-mono text-lg font-black text-white">{localTime}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Date</div>
                    <div className="font-mono text-xs text-slate-300">{localDate}</div>
                  </div>
                </div>

                {/* Session Hours */}
                <div className="text-xs space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Local Session:</span>
                    <span className="text-slate-200">{ex.localHours}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>IST Equivalent:</span>
                    <span className="text-emerald-400 font-bold">{ex.tradingHoursIST}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indian Trading Timeline & Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Indian Market Detailed Session Timetable (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>BSE Daily Session Schedule (IST)</span>
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-amber-400">09:00 AM – 09:08 AM</div>
                <div className="text-slate-400 text-[11px]">Pre-Open Order Entry & Cancellation</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Pre-Market
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-amber-400">09:08 AM – 09:15 AM</div>
                <div className="text-slate-400 text-[11px]">Order Matching & Equilibrium Price Discovery</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Discovery
              </span>
            </div>

            <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="font-black text-emerald-300">09:15 AM – 03:30 PM</div>
                <div className="text-slate-300 text-[11px]">Continuous Live Trading (Equities & Derivatives)</div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Normal Session
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-300">03:30 PM – 03:40 PM</div>
                <div className="text-slate-400 text-[11px]">Closing Price Determination (VWAP Calculation)</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Closing
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-300">03:40 PM – 04:00 PM</div>
                <div className="text-slate-400 text-[11px]">Post-Market Closing Price Trading</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Post-Market
              </span>
            </div>
          </div>
        </div>

        {/* Right: 2026 BSE Trading Holidays Calendar (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span>2026 BSE Trading Holidays</span>
            </h3>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[330px] custom-scrollbar pr-1">
            {holidays2026.map((h, i) => (
              <div key={i} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{h.occasion}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{h.date} ({h.day})</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  h.status === 'Special 1-hr Session'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
