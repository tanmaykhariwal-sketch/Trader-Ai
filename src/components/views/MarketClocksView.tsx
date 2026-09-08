import React, { useState, useEffect } from 'react';
import {
  Clock,
  Globe,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { getBseMarketStatus, BSE_HOLIDAYS } from '../../utils/marketHours';

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

  // Canonical, holiday-aware BSE session status — the single source of truth
  // used everywhere else in the app (Sidebar, ticker bar, Market Hub), so
  // this page can never disagree with the rest of the app on a holiday.
  const marketStatus = getBseMarketStatus(time);
  const bseStatus = {
    status: marketStatus.statusLabel,
    color: marketStatus.isHoliday
      ? 'text-amber-400'
      : marketStatus.isOpen
      ? 'text-emerald-400'
      : marketStatus.isPreMarket
      ? 'text-amber-400'
      : 'text-slate-400',
    bg: marketStatus.badgeClass,
    note: marketStatus.nextSessionLabel
  };

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

  // Derived from the same BSE_HOLIDAYS map getBseMarketStatus uses for the
  // live status badge above — this panel used to be a separate hand-typed
  // list that silently drifted from it (two conflicting dates for Holi and
  // Diwali, and nine 2026 holidays present in the canonical list but
  // missing here entirely, including the very next one: Janmashtami on
  // 4 Sep 2026, which the badge would call a holiday while this panel
  // said nothing was happening that day).
  const holidays2026 = Object.entries(BSE_HOLIDAYS)
    .filter(([dateKey]) => dateKey.startsWith('2026-'))
    .map(([dateKey, occasion]) => {
      const d = new Date(`${dateKey}T12:00:00+05:30`);
      return {
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        day: d.toLocaleDateString('en-US', { weekday: 'long' }),
        occasion,
        sortKey: dateKey
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

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
            {/* Dot was hardcoded emerald + always pulsing regardless of the
                actual status text right next to it — a market holiday or a
                closed-for-the-day session showed a pinging "live" green dot
                beside grey/amber text. Only pulse (and go green) when the
                market is genuinely open. */}
            {marketStatus.isOpen && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              marketStatus.isOpen ? 'bg-emerald-500' : marketStatus.isHoliday || marketStatus.isPreMarket ? 'bg-amber-500' : 'bg-slate-500'
            }`}></span>
          </span>
          <div>
            <div className={`text-xs font-black uppercase ${bseStatus.color}`}>{bseStatus.status}</div>
            <div className="text-[10px] text-slate-400 font-mono">{bseStatus.note}</div>
          </div>
        </div>
      </div>

      {/* Primary Exchange: BSE */}
      <div className="grid grid-cols-1 gap-4">
        {exchanges.filter((ex) => ex.isPrimary).map((ex) => {
          const localTime = getTimeInZone(ex.timeZone);
          const localDate = getDateInZone(ex.timeZone);

          return (
            <div
              key={ex.code}
              className="p-5 rounded-2xl border shadow-xl transition-all bg-gradient-to-br from-slate-900 to-emerald-950/20 border-emerald-500/40"
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

      {/* Other Global Markets: compact secondary strip */}
      <div>
        <div className="text-[10px] uppercase text-slate-500 font-mono mb-2 tracking-wider">
          Other Global Markets
        </div>
        <div className="flex flex-wrap gap-2">
          {exchanges.filter((ex) => !ex.isPrimary).map((ex) => {
            const localTime = getTimeInZone(ex.timeZone);
            const tzAbbrev = ex.localHours.split(' ').pop();

            return (
              <div
                key={ex.code}
                className="px-3 py-1.5 rounded-lg border bg-slate-900/50 border-slate-800/60 text-slate-400 flex items-center space-x-1.5"
              >
                <span className="text-sm">{ex.flag}</span>
                <span className="text-[11px] font-mono font-bold text-slate-300">{ex.code}</span>
                <span className="text-[11px] font-mono">·</span>
                <span className="text-[11px] font-mono">{localTime} {tzAbbrev}</span>
              </div>
            );
          })}
        </div>
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
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  Holiday
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
