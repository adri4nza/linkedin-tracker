import { useState, useMemo } from 'react';
import { Trophy, Clock, CheckCircle, Calendar, Loader2, AlertCircle } from 'lucide-react';
import MetricCard from '../components/MetricCard/MetricCard';
import TrendChart from '../components/TrendChart/TrendChart';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import type { GameRecord } from '../hooks/useGamesData';
import { timeToSeconds, secondsToTime, calculateWinner } from '../utils/timeUtils';
import { usePlayerColors } from '../hooks/usePlayerColors';

const CSV_URL = getActiveCsvUrl();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const GAMES = ['Zip', 'Tango', 'Queens', 'Mini Sudoku', 'Patches'] as const;
type Game = (typeof GAMES)[number];

const TIME_RANGES = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isoToChartDate(iso: string): string {
  const [, month, day] = iso.split('-').map(Number);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[month - 1]} ${day}`;
}

function getRangeStart(range: TimeRange): string | null {
  if (range === 'All Time') return null;
  const days = range === 'Last 7 Days' ? 7 : range === 'Last 30 Days' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('Last 30 Days');
  const [selectedGame, setSelectedGame] = useState<Game>('Queens');

  const { data, isLoading, error } = useGamesData(CSV_URL);
  const { colors } = usePlayerColors();

  // ── Filter by game + time range ──────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    const rangeStart = getRangeStart(timeRange);
    return data.filter((row) => {
      if (row.Juego?.trim() !== selectedGame) return false;
      if (rangeStart && (row.Fecha?.trim() ?? '') < rangeStart) return false;
      return true;
    });
  }, [data, selectedGame, timeRange]);

  // ── Compute all stats ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!filteredRecords.length) return null;

    // World record: entry with the lowest time
    let wrRecord: GameRecord = filteredRecords[0];
    for (const row of filteredRecords) {
      if (timeToSeconds(row.Tiempo) < timeToSeconds(wrRecord.Tiempo)) wrRecord = row;
    }

    // Per-player average helpers
    const byPlayer = (name: string) =>
      filteredRecords.filter((r) => r.Jugador?.trim().toLowerCase() === name);

    const avgSecs = (records: GameRecord[]): number => {
      const times = records.map((r) => timeToSeconds(r.Tiempo)).filter((t) => isFinite(t));
      return times.length ? times.reduce((a, b) => a + b, 0) / times.length : Infinity;
    };

    const enriqueRecords   = byPlayer('enrique');
    const franciscoRecords = byPlayer('francisco');

    // Overall average across all records
    const allTimes = filteredRecords.map((r) => timeToSeconds(r.Tiempo)).filter((t) => isFinite(t));
    const avgOverall = allTimes.length ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : Infinity;

    // Group by date to compare players head-to-head
    const dateMap = new Map<string, { enrique?: GameRecord; francisco?: GameRecord }>();
    for (const row of filteredRecords) {
      const date   = row.Fecha?.trim() ?? '';
      const player = row.Jugador?.trim().toLowerCase();
      if (!dateMap.has(date)) dateMap.set(date, {});
      const entry = dateMap.get(date)!;
      if (player === 'enrique')        entry.enrique   = row;
      else if (player === 'francisco') entry.francisco = row;
    }

    let enriqueWins = 0, franciscoWins = 0;
    for (const { enrique, francisco } of dateMap.values()) {
      const result = calculateWinner(enrique, francisco);
      if (result === 'a') enriqueWins++;
      else if (result === 'b') franciscoWins++;
    }

    // Chart data sorted chronologically
    const chartData = [...dateMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { enrique, francisco }]) => ({
        date:      isoToChartDate(date),
        francisco: francisco ? timeToSeconds(francisco.Tiempo) : undefined,
        enrique:   enrique   ? timeToSeconds(enrique.Tiempo)   : undefined,
      }));

    return {
      worldRecord: {
        time:   secondsToTime(timeToSeconds(wrRecord.Tiempo)),
        player: wrRecord.Jugador?.trim() ?? '—',
      },
      avgOverall:   secondsToTime(avgOverall),
      avgFrancisco: secondsToTime(avgSecs(franciscoRecords)),
      avgEnrique:   secondsToTime(avgSecs(enriqueRecords)),
      enriqueWins,
      franciscoWins,
      chartData,
    };
  }, [filteredRecords]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-400" />
        <p className="text-sm font-medium">Loading game data…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
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
      {/* Page intro */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Performance Overview</h1>
        <p className="text-sm text-blue-500 font-medium">
          Real-time metrics and comparative analysis.
        </p>
      </div>

      {/* Selectors row */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value as Game)}
          className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {GAMES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <Calendar size={15} className="text-slate-400 shrink-0" />

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {TIME_RANGES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* ── Metric Cards ── */}
      {!stats ? (
        <p className="text-sm text-slate-400 text-center py-8">
          No data for this selection.
        </p>
      ) : (
        <>
          {/* World Record */}
          <MetricCard
            label="World Record"
            value={stats.worldRecord.time}
            icon={<Trophy size={14} />}
            heldBy={stats.worldRecord.player}
          />

          {/* Average Time */}
          <MetricCard
            label="Average Time"
            value={stats.avgOverall}
            icon={<Clock size={14} />}
            subItems={[
              { name: 'Francisco', value: stats.avgFrancisco, variant: 'dark' },
              { name: 'Enrique',   value: stats.avgEnrique,   variant: 'blue' },
            ]}
          />

          {/* Total Wins */}
          <MetricCard
            label="Total Wins"
            value={`${stats.enriqueWins + stats.franciscoWins}`}
            icon={<CheckCircle size={14} />}
            subItems={[
              { name: 'Francisco', value: `${stats.franciscoWins} W`, variant: 'dark' },
              { name: 'Enrique',   value: `${stats.enriqueWins} W`,   variant: 'blue' },
            ]}
          />

          {/* Line chart */}
          <TrendChart data={stats.chartData} colors={colors} />
        </>
      )}
    </>
  );
}

