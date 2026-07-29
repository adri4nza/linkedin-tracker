import { useEffect, useState } from 'react';
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
  /** Called when the user clicks a day in the current month. */
  onDayClick?: (day: number, month: number, year: number) => void;
  /** Set of ISO date strings (YYYY-MM-DD) that have game records. Used to render indicator dots. */
  datesWithData?: Set<string>;
  /** Map of ISO date string → hex color for the indicator dot. Overrides default blue when provided. */
  dateColorMap?: Map<string, string>;
  /** Called on mount (with the initial month) and on every month navigation.
   *  month is 0-based. */
  onMonthChange?: (month: number, year: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MiniCalendar({
  highlightedDay,
  initialMonth,
  initialYear,
  onDayClick,
  datesWithData,
  dateColorMap,
  onMonthChange,
}: MiniCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth());
  const [selected, setSelected] = useState(highlightedDay ?? today.getDate());

  // Notify the parent of the visible month/year on mount and whenever it changes.
  // Runs in an effect (not during render) to avoid triggering a parent setState
  // while this component is rendering.
  useEffect(() => {
    onMonthChange?.(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

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
    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/50 transition-colors duration-300">
      {/* Month / Year header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 active:scale-95 transition-all duration-300"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} className="text-slate-500" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 active:scale-95 transition-all duration-300"
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
            <span className="text-xs text-slate-300 dark:text-slate-600">{d}</span>
          </div>
        ))}

        {/* Current month */}
        {currentDays.map((d) => {
          const isSelected = d === selected;
          const todayMark = isToday(d) && d !== selected;
          const isoKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const hasData = (dateColorMap?.has(isoKey) ?? datesWithData?.has(isoKey)) ?? false;
          const dotColor = dateColorMap?.get(isoKey) ?? '#60a5fa';
          return (
            <button
              key={d}
              onClick={() => { setSelected(d); onDayClick?.(d, month, year); }}
              className={`relative flex flex-col items-center justify-center h-8 w-8 mx-auto rounded-full text-xs font-medium transition-all duration-300 active:scale-90
                ${isSelected
                  ? 'bg-blue-500 text-white font-bold shadow-sm'
                  : todayMark
                  ? 'border border-blue-300 text-blue-600 hover:bg-blue-500/10'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`}
            >
              {d}
              {hasData && (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : dotColor,
                    boxShadow: isSelected ? 'none' : `0 0 3px ${dotColor}80`,
                  }}
                />
              )}
            </button>
          );
        })}

        {/* Next-month lead */}
        {nextDays.map((d) => (
          <div key={`next-${d}`} className="flex items-center justify-center h-8">
            <span className="text-xs text-slate-300 dark:text-slate-600">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
