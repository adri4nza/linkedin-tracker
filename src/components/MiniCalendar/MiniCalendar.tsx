import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns the day-of-week index (0=Mon … 6=Sun) for the 1st of a month */
function firstDayOffset(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun, 6=Sat
  return (jsDay + 6) % 7; // convert to Mon=0
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MiniCalendarProps {
  /** Initially highlighted day (1-based). Defaults to today. */
  highlightedDay?: number;
  /** Initial month (0-based). Defaults to current month. */
  initialMonth?: number;
  /** Initial year. Defaults to current year. */
  initialYear?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MiniCalendar({
  highlightedDay,
  initialMonth,
  initialYear,
}: MiniCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth());
  const [selected, setSelected] = useState(highlightedDay ?? today.getDate());

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const offset = firstDayOffset(year, month);
  const totalDays = daysInMonth(year, month);
  // Prev-month tail days (greyed out)
  const prevTotal = daysInMonth(year, month === 0 ? 11 : month - 1);
  const prevDays = Array.from({ length: offset }, (_, i) => prevTotal - offset + 1 + i);
  // Current-month days
  const currentDays = Array.from({ length: totalDays }, (_, i) => i + 1);
  // Next-month lead days
  const totalCells = Math.ceil((offset + totalDays) / 7) * 7;
  const nextDays = Array.from({ length: totalCells - offset - totalDays }, (_, i) => i + 1);

  const isToday = (day: number) =>
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      {/* Month / Year header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-800">
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} className="text-slate-500" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {/* Prev-month tail */}
        {prevDays.map((d) => (
          <div key={`prev-${d}`} className="flex items-center justify-center h-8">
            <span className="text-xs text-slate-300">{d}</span>
          </div>
        ))}

        {/* Current month */}
        {currentDays.map((d) => {
          const isSelected = d === selected;
          const todayMark = isToday(d) && d !== selected;
          return (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className={`flex items-center justify-center h-8 w-8 mx-auto rounded-full text-xs font-medium transition-colors
                ${isSelected
                  ? 'bg-blue-500 text-white font-bold'
                  : todayMark
                  ? 'border border-blue-300 text-blue-600'
                  : 'text-slate-700 hover:bg-slate-100'
                }`}
            >
              {d}
            </button>
          );
        })}

        {/* Next-month lead */}
        {nextDays.map((d) => (
          <div key={`next-${d}`} className="flex items-center justify-center h-8">
            <span className="text-xs text-slate-300">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
