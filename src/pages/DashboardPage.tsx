import { useState, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import WinnerCard from '../components/WinnerCard/WinnerCard';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import DonutChart from '../components/DonutChart/DonutChart';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { useGamesData } from '../hooks/useGamesData';

const CSV_URL = import.meta.env.VITE_CSV_URL as string | undefined;

if (!CSV_URL) {
  console.error(
    '[DashboardPage] VITE_CSV_URL is not defined. ' +
    'Add it to your .env file and restart the dev server.',
  );
}

// Colour palette — keyed by lowercase player name
const PLAYER_COLOURS: Record<string, string> = {
  enrique: '#3b82f6',
  francisco: '#0f172a',
};
const FALLBACK_COLOURS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(day: number, month: number, year: number): string {
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

export default function DashboardPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState('');

  const { data, isLoading, error } = useGamesData(CSV_URL ?? '');

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

  function handleDayClick(day: number, month: number, year: number) {
    setDrawerDate(formatDate(day, month, year));
    setDrawerOpen(true);
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout title="Corporate Dashboard">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin text-blue-400" />
          <p className="text-sm font-medium">Loading game data…</p>
        </div>
      </Layout>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <Layout title="Corporate Dashboard">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm font-semibold text-slate-700">Failed to load data</p>
          <p className="text-xs text-slate-400 max-w-xs">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Corporate Dashboard">
      <WinnerCard winner="Enrique" score="3 - 2" streakDays={5} />
      <MiniCalendar
        initialYear={2023}
        initialMonth={9}
        highlightedDay={6}
        onDayClick={handleDayClick}
      />
      <DonutChart data={winRateData.length ? winRateData : undefined} />

      <DailyResultsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        date={drawerDate}
      />
    </Layout>
  );
}
