import { useState, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import WinnerCard from '../components/WinnerCard/WinnerCard';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import DonutChart from '../components/DonutChart/DonutChart';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import type { GameRecord } from '../hooks/useGamesData';
import { calculateWinner } from '../utils/timeUtils';
import { usePlayerColors, TIE_COLOUR } from '../hooks/usePlayerColors';

const CSV_URL = getActiveCsvUrl();


// ── Date / time helpers ────────────────────────────────────────────────────
function getTodayLocalDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, error } = useGamesData(CSV_URL);
  const { colors } = usePlayerColors();

  // ── Compute days won + per-day calendar colours ──────────────────────────
  const { winRateData, dateColorMap } = useMemo(() => {
    const dateColorMap = new Map<string, string>();
    if (!data.length) return { winRateData: [], dateColorMap };

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
      } else if (fWins > eWins) {
        franciscoDays++;
        dateColorMap.set(fecha, colors.francisco);
        if (!fBreakdown[score]) fBreakdown[score] = [];
        fBreakdown[score].push(fecha);
      } else {
        tieDays++;
        dateColorMap.set(fecha, TIE_COLOUR);
        if (!tieBreakdown[score]) tieBreakdown[score] = [];
        tieBreakdown[score].push(fecha);
      }
    }

    const winRateData = [
      { name: 'Francisco', value: franciscoDays, color: colors.francisco, breakdown: fBreakdown },
      { name: 'Enrique',   value: enriqueDays,   color: colors.enrique,   breakdown: eBreakdown },
      { name: 'Empates',   value: tieDays,        color: TIE_COLOUR,       breakdown: tieBreakdown },
    ].filter((e) => e.value > 0);

    return { winRateData, dateColorMap };
  }, [data, colors]);

  // Derive the set of dates that have any records (for handleDayClick check)
  const datesWithData = useMemo(() => new Set(dateColorMap.keys()), [dateColorMap]);

  const todayResult = useMemo(() => {
    const today = getTodayLocalDate();
    const todayRecords = data.filter((row) => row.Fecha?.trim() === today);

    if (!todayRecords.length) return { hasGames: false as const };

    // Group records by game
    const gameMap = new Map<string, typeof todayRecords>();
    for (const row of todayRecords) {
      const game = row.Juego?.trim() ?? 'Unknown';
      if (!gameMap.has(game)) gameMap.set(game, []);
      gameMap.get(game)!.push(row);
    }

    let enriqueWins = 0;
    let franciscoWins = 0;

    for (const records of gameMap.values()) {
      const enrique   = records.find((r) => r.Jugador?.trim().toLowerCase() === 'enrique');
      const francisco = records.find((r) => r.Jugador?.trim().toLowerCase() === 'francisco');
      const result    = calculateWinner(enrique, francisco);
      if (result === 'a') enriqueWins++;
      else if (result === 'b') franciscoWins++;
    }

    if (enriqueWins > franciscoWins) {
      return { hasGames: true as const, winner: 'Enrique',   score: `${enriqueWins} - ${franciscoWins}` };
    }
    if (franciscoWins > enriqueWins) {
      return { hasGames: true as const, winner: 'Francisco', score: `${franciscoWins} - ${enriqueWins}` };
    }
    return { hasGames: true as const, winner: 'Tie', score: `${enriqueWins} - ${franciscoWins}` };
  }, [data]);

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
      <WinnerCard
        winner={todayResult.hasGames ? todayResult.winner : undefined}
        score={todayResult.hasGames  ? todayResult.score  : undefined}
      />
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
