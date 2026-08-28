/**
 * Bombay Stock Exchange (BSE) Official Trading Hours & Session Engine
 * 
 * Rules:
 * - Regular Trading Session: Monday to Friday, 09:15 AM to 03:30 PM IST.
 * - Pre-Market Session: Monday to Friday, 09:00 AM to 09:15 AM IST.
 * - Post-Market / Closed: After 03:30 PM IST, Weekends (Saturday & Sunday), & Exchange Holidays.
 * - ZERO false price fluctuations or live jitter when market is closed or on holiday.
 * - Official closing prices remain frozen until the next market open.
 */

export interface BseMarketStatus {
  isOpen: boolean;
  isPreMarket: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  status: 'OPEN' | 'CLOSED' | 'PRE_MARKET';
  statusLabel: string;
  badgeClass: string;
  istTimeFormatted: string; // e.g. "02:26:45 PM"
  istDateFormatted: string; // e.g. "Fri, 28 Aug 2026"
  istHours: number;
  istMinutes: number;
  istSeconds: number;
  closingTimeLabel: string;
  nextSessionLabel: string;
  frozenNotice: string;
}

// Official Indian Exchange (BSE / NSE) Trading Holidays Calendar (2025 - 2027)
export const BSE_HOLIDAYS: Record<string, string> = {
  // 2025 Holidays
  '2025-01-26': 'Republic Day',
  '2025-02-26': 'Mahashivratri',
  '2025-03-14': 'Holi',
  '2025-03-31': 'Id-Ul-Fitr (Ramzan Id)',
  '2025-04-10': 'Mahavir Jayanti',
  '2025-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2025-04-18': 'Good Friday',
  '2025-05-01': 'Maharashtra Day',
  '2025-06-07': 'Bakri Id / Eid-ul-Adha',
  '2025-07-06': 'Muharram',
  '2025-08-15': 'Independence Day',
  '2025-08-27': 'Ganesh Chaturthi',
  '2025-10-02': 'Mahatma Gandhi Jayanti',
  '2025-10-21': 'Diwali Laxmi Pujan (Muhurat)',
  '2025-10-22': 'Diwali Balipratipada',
  '2025-11-05': 'Guru Nanak Jayanti',
  '2025-12-25': 'Christmas',

  // 2026 Holidays
  '2026-01-26': 'Republic Day',
  '2026-02-16': 'Mahashivratri',
  '2026-03-04': 'Holi',
  '2026-03-20': 'Id-Ul-Fitr (Ramzan Id)',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2026-05-01': 'Maharashtra Day',
  '2026-05-27': 'Bakri Id / Eid-ul-Adha',
  '2026-06-26': 'Muharram',
  '2026-08-15': 'Independence Day',
  '2026-09-04': 'Janmashtami',
  '2026-09-15': 'Milad-un-Nabi',
  '2026-10-02': 'Mahatma Gandhi Jayanti',
  '2026-10-20': 'Dussehra',
  '2026-11-09': 'Diwali Laxmi Pujan',
  '2026-11-10': 'Diwali Balipratipada',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-25': 'Christmas',

  // 2027 Holidays
  '2027-01-26': 'Republic Day',
  '2027-03-08': 'Mahashivratri',
  '2027-03-23': 'Holi',
  '2027-03-26': 'Good Friday',
  '2027-04-14': 'Dr. Ambedkar Jayanti',
  '2027-05-01': 'Maharashtra Day',
  '2027-08-15': 'Independence Day',
  '2027-10-02': 'Mahatma Gandhi Jayanti',
  '2027-10-29': 'Diwali Laxmi Pujan',
  '2027-12-25': 'Christmas'
};

export function getBseMarketStatus(targetDate: Date = new Date()): BseMarketStatus {
  // Convert target time accurately to Asia/Kolkata (Indian Standard Time, UTC + 5:30)
  const istString = targetDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istString);

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const dateNum = String(istDate.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${dateNum}`;

  const dayOfWeek = istDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const seconds = istDate.getSeconds();
  const totalMinutes = hours * 60 + minutes;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const holidayName = BSE_HOLIDAYS[dateKey];
  const isHoliday = Boolean(holidayName);

  // Trading window in minutes (9:15 AM to 3:30 PM IST):
  // 09:00 AM = 540
  // 09:15 AM = 555
  // 03:30 PM (15:30) = 930
  const isPreMarket = !isWeekend && !isHoliday && totalMinutes >= 540 && totalMinutes < 555;
  const isOpen = !isWeekend && !isHoliday && totalMinutes >= 555 && totalMinutes < 930;

  let status: 'OPEN' | 'CLOSED' | 'PRE_MARKET' = 'CLOSED';
  let statusLabel = 'Market Closed';
  let badgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  let nextSessionLabel = 'Opens next trading day at 9:15 AM IST';
  let frozenNotice = 'BSE session closed at 3:30 PM IST. Rates are strictly frozen at official closing prices.';

  if (isHoliday) {
    status = 'CLOSED';
    statusLabel = `Market Holiday • ${holidayName}`;
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    nextSessionLabel = 'BSE closed for official exchange holiday. Reopens next trading session at 9:15 AM IST.';
    frozenNotice = `BSE is closed today in observance of ${holidayName}. Rates are strictly frozen at previous official session close.`;
  } else if (isOpen) {
    status = 'OPEN';
    statusLabel = 'Market Open (BSE Live)';
    badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    nextSessionLabel = 'Continuous session closes today at 3:30 PM IST';
    frozenNotice = 'Live trading active. Real-time rates synchronized with Google Finance.';
  } else if (isPreMarket) {
    status = 'PRE_MARKET';
    statusLabel = 'BSE Pre-Market Order Matching';
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    nextSessionLabel = 'Continuous regular trading begins at 9:15 AM IST';
    frozenNotice = 'Pre-market order collection session (9:00 AM – 9:15 AM IST). Regular trading opens at 9:15 AM.';
  } else if (isWeekend) {
    status = 'CLOSED';
    statusLabel = 'Market Closed (Weekend)';
    badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
    nextSessionLabel = 'Opens Monday at 9:15 AM IST';
    frozenNotice = 'BSE is closed for the weekend. Showing official Friday closing rates.';
  } else if (totalMinutes < 540) {
    status = 'CLOSED';
    statusLabel = 'Market Closed (Opens 9:15 AM)';
    badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    nextSessionLabel = 'Opens today at 9:15 AM IST (Pre-market 9:00 AM)';
    frozenNotice = 'Market has not opened yet. Rates are strictly frozen at previous session close.';
  } else {
    // totalMinutes >= 930 (after 3:30 PM)
    status = 'CLOSED';
    statusLabel = 'Market Closed (Closed at 3:30 PM IST)';
    badgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    nextSessionLabel = dayOfWeek === 5 ? 'Opens Monday at 9:15 AM IST' : 'Opens tomorrow at 9:15 AM IST';
    frozenNotice = 'BSE trading ended at 3:30 PM IST. Rates are strictly frozen at verified official closing prices.';
  }

  // Format 12-hour IST time string with seconds
  const istTimeFormatted = istDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const istDateFormatted = istDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return {
    isOpen,
    isPreMarket,
    isWeekend,
    isHoliday,
    holidayName,
    status,
    statusLabel,
    badgeClass,
    istTimeFormatted,
    istDateFormatted,
    istHours: hours,
    istMinutes: minutes,
    istSeconds: seconds,
    closingTimeLabel: '03:30 PM IST',
    nextSessionLabel,
    frozenNotice
  };
}
