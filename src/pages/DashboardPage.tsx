import { useState, useMemo, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, Trophy } from 'lucide-react';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import DonutChart from '../components/DonutChart/DonutChart';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import type { GameRecord } from '../hooks/useGamesData';
import { calculateWinner } from '../utils/timeUtils';
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

  const { data, isLoading, error } = useGamesData(CSV_URL);
  const { colors } = usePlayerColors();

  // ── Compute days won + per-day calendar colours ──────────────────────────
  const { winRateData, dateColorMap, dailyCards } = useMemo(() => {
    const dateColorMap = new Map<string, string>();
    if (!data.length) return { winRateData: [], dateColorMap, dailyCards: [] };

    // Group records by date → game
    const dateMap = new Map<string, Map<string, { enrique?: GameRecord; francisco?: GameRecord }>>();
    for (const row of data) {
      const fecha  = row.Fecha?.trim() ?? '';
      const juego  = row.Juego?.trim() ?? '';
      if (!fecha) continue;
      if (!dateMap.has(fecha)) dateMap.set(fecha, new Map());
      const gameMap = dateMap.get(fecha)!;
      if (!gameMap.has(juego)) gameMap.set(juego, {});
      const entry  = gameMap.get(juego)!;
      const player = row.Jugador?.trim().toLowerCase();
      if (player === 'enrique')        entry.enrique   = row;
      else if (player === 'francisco') entry.francisco = row;
    }

    let enriqueDays = 0, franciscoDays = 0, tieDays = 0;
    const eBreakdown: Record<string, string[]> = {};
    const fBreakdown: Record<string, string[]> = {};
    const tieBreakdown: Record<string, string[]> = {};
    const dailyCardsRaw: Array<{ fecha: string; winner: string; score: string; color: string }> = [];

    for (const [fecha, gameMap] of dateMap.entries()) {
      let eGames = 0, fGames = 0;
      for (const { enrique, francisco } of gameMap.values()) {
        if (enrique)   eGames++;
        if (francisco) fGames++;
      }
      if (eGames !== fGames) {
        dateColorMap.set(fecha, TIE_COLOUR);
        continue;
      }

      let eWins = 0, fWins = 0;
      for (const { enrique, francisco } of gameMap.values()) {
        const result = calculateWinner(enrique, francisco);
        if (result === 'a') eWins++;
        else if (result === 'b') fWins++;
      }
      const score = `${Math.max(eWins, fWins)}-${Math.min(eWins, fWins)}`;
      if (eWins > fWins) {
        enriqueDays++;
        dateColorMap.set(fecha, colors.enrique);
        if (!eBreakdown[score]) eBreakdown[score] = [];
        eBreakdown[score].push(fecha);
        dailyCardsRaw.push({ fecha, winner: 'Enrique', score: `${eWins} - ${fWins}`, color: colors.enrique });
      } else if (fWins > eWins) {
        franciscoDays++;
        dateColorMap.set(fecha, colors.francisco);
        if (!fBreakdown[score]) fBreakdown[score] = [];
        fBreakdown[score].push(fecha);
        dailyCardsRaw.push({ fecha, winner: 'Francisco', score: `${fWins} - ${eWins}`, color: colors.francisco });
      } else {
        tieDays++;
        dateColorMap.set(fecha, TIE_COLOUR);
        if (!tieBreakdown[score]) tieBreakdown[score] = [];
        tieBreakdown[score].push(fecha);
        dailyCardsRaw.push({ fecha, winner: 'Tie', score: `${eWins} - ${fWins}`, color: TIE_COLOUR });
      }
    }

    const winRateData = [
      { name: 'Francisco', value: franciscoDays, color: colors.francisco, breakdown: fBreakdown },
      { name: 'Enrique',   value: enriqueDays,   color: colors.enrique,   breakdown: eBreakdown },
      { name: 'Empates',   value: tieDays,        color: TIE_COLOUR,       breakdown: tieBreakdown },
    ].filter((e) => e.value > 0);

    const dailyCards = dailyCardsRaw.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return { winRateData, dateColorMap, dailyCards };
  }, [data, colors]);

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
          <div className="snap-center min-w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 shrink-0 transition-colors duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-50 dark:bg-slate-700">
                <Trophy size={26} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">No games played yet</p>
            </div>
          </div>
        ) : (
          dailyCards.map((card) => (
            <div
              key={card.fecha}
              className="snap-center min-w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 shrink-0 transition-colors duration-200"
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
                      <span style={{ color: card.color }}>{card.winner}</span>{' '}
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
      <MiniCalendar
        datesWithData={datesWithData}
        dateColorMap={dateColorMap}
        onDayClick={handleDayClick}
      />
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
