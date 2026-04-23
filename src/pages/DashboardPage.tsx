import { useState, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import WinnerCard from '../components/WinnerCard/WinnerCard';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import DonutChart from '../components/DonutChart/DonutChart';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import type { GameRecord } from '../hooks/useGamesData';
import { calculateWinner } from '../utils/timeUtils';

const CSV_URL = getActiveCsvUrl();

// Colour palette — keyed by lowercase player name
const PLAYER_COLOURS: Record<string, string> = {
  enrique: '#3b82f6',
  francisco: '#0f172a',
};


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

  // ── Set of all YYYY-MM-DD dates that have game records ──────────────────
  const datesWithData = useMemo(() => {
    const set = new Set<string>();
    for (const row of data) {
      const d = row.Fecha?.trim();
      if (d) set.add(d);
    }
    return set;
  }, [data]);

  // ── Compute days won via per-day head-to-head ────────────────────────────
  const winRateData = useMemo(() => {
    if (!data.length) return [];

    // Step 1: group records by date → game
    const dateMap = new Map<string, Map<string, { enrique?: GameRecord; francisco?: GameRecord }>>();
    for (const row of data) {
      const fecha  = row.Fecha?.trim() ?? '';
      const juego  = row.Juego?.trim() ?? '';
      if (!dateMap.has(fecha)) dateMap.set(fecha, new Map());
      const gameMap = dateMap.get(fecha)!;
      if (!gameMap.has(juego)) gameMap.set(juego, {});
      const entry  = gameMap.get(juego)!;
      const player = row.Jugador?.trim().toLowerCase();
      if (player === 'enrique')        entry.enrique   = row;
      else if (player === 'francisco') entry.francisco = row;
    }

    // Step 2: for each day tally mini-game wins, then crown a day winner
    let enriqueDays   = 0;
    let franciscoDays = 0;
    let tieDays       = 0;

    for (const gameMap of dateMap.values()) {
      // Only count days where both players played the same number of mini-games
      let eGames = 0, fGames = 0;
      for (const { enrique, francisco } of gameMap.values()) {
        if (enrique)   eGames++;
        if (francisco) fGames++;
      }
      if (eGames !== fGames) continue;

      let eWins = 0, fWins = 0;
      for (const { enrique, francisco } of gameMap.values()) {
        const result = calculateWinner(enrique, francisco);
        if (result === 'a') eWins++;
        else if (result === 'b') fWins++;
      }
      if (eWins > fWins)      enriqueDays++;
      else if (fWins > eWins) franciscoDays++;
      else                    tieDays++;
    }

    return [
      { name: 'Francisco', value: franciscoDays, color: PLAYER_COLOURS['francisco'] },
      { name: 'Enrique',   value: enriqueDays,   color: PLAYER_COLOURS['enrique']   },
      { name: 'Empates',   value: tieDays,        color: '#94a3b8'                   },
    ].filter((e) => e.value > 0);
  }, [data]);

  // ── Today's winner ───────────────────────────────────────────────────────
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
        <p className="text-sm font-semibold text-slate-700">Failed to load data</p>
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
        onDayClick={handleDayClick}
      />
      <DonutChart data={winRateData.length ? winRateData : undefined} />

      <DailyResultsDrawer
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        selectedDate={selectedDate}
        data={data}
      />
    </>
  );
}
