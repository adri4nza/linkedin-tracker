import { useState, useMemo, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, Trophy } from 'lucide-react';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import MonthlyTally from '../components/MonthlyTally/MonthlyTally';
import DonutChart from '../components/DonutChart/DonutChart';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import { computeDailyOutcomes, computeMonthlyTally } from '../utils/dayWins';
import { usePlayerColors, TIE_COLOUR } from '../hooks/usePlayerColors';

const CSV_URL = getActiveCsvUrl();


// ── Date / time helpers ────────────────────────────────────────────────────
const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTH_NAMES_SHORT[month - 1]} ${day}, ${year}`;
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Month/year currently visible in the MiniCalendar, kept in sync via its
  // onMonthChange callback. Initialised to the current system month/year so the
  // first render's tally already matches the calendar's default month.
  const now = new Date();
  const [visibleMonth, setVisibleMonth] = useState(now.getMonth());
  const [visibleYear, setVisibleYear] = useState(now.getFullYear());

  const { data, isLoading, error } = useGamesData(CSV_URL);
  const { colors } = usePlayerColors();

  // ── Single source of truth: per-day outcomes (días ganados) ──────────────
  // All day-win aggregation lives in utils/dayWins.ts. The page only reshapes
  // the result for presentation (calendar colours, donut, carousel, tally).
  const outcomes = useMemo(
    () => computeDailyOutcomes(data, colors),
    [data, colors],
  );

  // ── Derive calendar colours + donut data + carousel cards from outcomes ───
  const { winRateData, dateColorMap, dailyCards } = useMemo(() => {
    const dateColorMap = new Map<string, string>();
    const fBreakdown: Record<string, string[]> = {};
    const eBreakdown: Record<string, string[]> = {};
    const tieBreakdown: Record<string, string[]> = {};
    let franciscoDays = 0, enriqueDays = 0, tieDays = 0;
    const dailyCardsRaw: Array<{ fecha: string; winner: string; score: string; color: string }> = [];

    for (const o of outcomes) {
      // Every dated outcome (including 'excluded', painted as tie) colours the day.
      dateColorMap.set(o.fecha, o.color);
      if (o.outcome === 'excluded') continue; // painted tie, never counted

      const scoreKey = `${Math.max(o.franciscoWins, o.enriqueWins)}-${Math.min(o.franciscoWins, o.enriqueWins)}`;
      if (o.outcome === 'francisco') {
        franciscoDays++;
        (fBreakdown[scoreKey] ??= []).push(o.fecha);
        dailyCardsRaw.push({ fecha: o.fecha, winner: 'Francisco', score: `${o.franciscoWins} - ${o.enriqueWins}`, color: colors.francisco });
      } else if (o.outcome === 'enrique') {
        enriqueDays++;
        (eBreakdown[scoreKey] ??= []).push(o.fecha);
        dailyCardsRaw.push({ fecha: o.fecha, winner: 'Enrique', score: `${o.enriqueWins} - ${o.franciscoWins}`, color: colors.enrique });
      } else {
        tieDays++;
        (tieBreakdown[scoreKey] ??= []).push(o.fecha);
        dailyCardsRaw.push({ fecha: o.fecha, winner: 'Tie', score: `${o.franciscoWins} - ${o.enriqueWins}`, color: TIE_COLOUR });
      }
    }

    const winRateData = [
      { name: 'Francisco', value: franciscoDays, color: colors.francisco, breakdown: fBreakdown },
      { name: 'Enrique',   value: enriqueDays,   color: colors.enrique,   breakdown: eBreakdown },
      { name: 'Empates',   value: tieDays,        color: TIE_COLOUR,       breakdown: tieBreakdown },
    ].filter((e) => e.value > 0);

    const dailyCards = dailyCardsRaw.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return { winRateData, dateColorMap, dailyCards };
  }, [outcomes, colors]);

  // ── Monthly tally for the month currently visible in the calendar ─────────
  const tally = useMemo(
    () => computeMonthlyTally(outcomes, visibleMonth, visibleYear),
    [outcomes, visibleMonth, visibleYear],
  );

  // Auto-scroll carousel to the rightmost (most recent) card
  useEffect(() => {
    if (carouselRef.current && dailyCards.length > 0) {
      carouselRef.current.scrollLeft = carouselRef.current.scrollWidth;
    }
  }, [dailyCards]);

  // Derive the set of dates that have any records (for handleDayClick check)
  const datesWithData = useMemo(() => new Set(dateColorMap.keys()), [dateColorMap]);

  function handleDayClick(day: number, month: number, year: number) {
    const mm  = String(month + 1).padStart(2, '0');
    const dd  = String(day).padStart(2, '0');
    const iso = `${year}-${mm}-${dd}`;
    if (datesWithData.has(iso)) setSelectedDate(iso);
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-400" />
        <p className="text-sm font-medium">Loading game data…</p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Failed to load data</p>
        <p className="text-xs text-slate-400 max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Daily Results Carousel – newest first */}
      <div ref={carouselRef} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 hide-scrollbar">
        {dailyCards.length === 0 ? (
          <div className="snap-center min-w-full bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/50 shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100/60 dark:bg-slate-800/60">
                <Trophy size={26} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">No games played yet</p>
            </div>
          </div>
        ) : (
          dailyCards.map((card) => (
            <div
              key={card.fecha}
              className="snap-center min-w-full bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/50 shrink-0 transition-colors duration-300"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: card.color + '26' }}
                >
                  <Trophy size={26} style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {formatDisplayDate(card.fecha)}
                  </p>
                  {card.winner === 'Tie' ? (
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Tied today{' '}
                      <span style={{ color: card.color }}>{card.score}</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      <span className="winner-glow" style={{ color: card.color, ['--glow' as string]: card.color }}>{card.winner}</span>{' '}
                      won{' '}
                      <span style={{ color: card.color }}>{card.score}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="space-y-2">
        <MonthlyTally tally={tally} colors={colors} />
        <MiniCalendar
          datesWithData={datesWithData}
          dateColorMap={dateColorMap}
          onDayClick={handleDayClick}
          onMonthChange={(m, y) => { setVisibleMonth(m); setVisibleYear(y); }}
        />
      </div>
      <DonutChart data={winRateData.length ? winRateData : undefined} onDateSelect={setSelectedDate} />

      <DailyResultsDrawer
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        selectedDate={selectedDate}
        data={data}
      />
    </>
  );
}
