import { useState, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import WinnerCard from '../components/WinnerCard/WinnerCard';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import DonutChart from '../components/DonutChart/DonutChart';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import { timeToSeconds } from '../utils/timeUtils';

const CSV_URL = getActiveCsvUrl();

// Colour palette — keyed by lowercase player name
const PLAYER_COLOURS: Record<string, string> = {
  enrique: '#3b82f6',
  francisco: '#0f172a',
};
const FALLBACK_COLOURS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

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

  // ── Compute win-rate percentages from total records per player ──────────
  const winRateData = useMemo(() => {
    if (!data.length) return [];

    // Count records per player
    const counts: Record<string, number> = {};
    for (const row of data) {
      const player = row.Jugador?.trim();
      if (!player) continue;
      counts[player] = (counts[player] ?? 0) + 1;
    }

    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    if (total === 0) return [];

    let fallbackIndex = 0;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: PLAYER_COLOURS[name.toLowerCase()] ?? FALLBACK_COLOURS[fallbackIndex++ % FALLBACK_COLOURS.length],
    }));
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
      const enrique  = records.find((r) => r.Jugador?.trim().toLowerCase() === 'enrique');
      const francisco = records.find((r) => r.Jugador?.trim().toLowerCase() === 'francisco');
      if (!enrique || !francisco) continue;

      const eTime = timeToSeconds(enrique.Tiempo);
      const fTime = timeToSeconds(francisco.Tiempo);
      if (eTime < fTime) enriqueWins++;
      else if (fTime < eTime) franciscoWins++;
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
