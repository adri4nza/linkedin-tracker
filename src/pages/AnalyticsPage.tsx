import { useState, useMemo } from 'react';
import { Trophy, Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import MetricCard from '../components/MetricCard/MetricCard';
import TrendChart from '../components/TrendChart/TrendChart';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import MonthlyTally from '../components/MonthlyTally/MonthlyTally';
import GameTabs from '../components/GameTabs/GameTabs';
import type { AnalyticsTab } from '../components/GameTabs/GameTabs';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import { buildGameColorMap, computeGameMonthlyTally } from '../utils/gameHeatmap';
import { computeGameStats } from '../utils/analyticsStats';
import { usePlayerColors } from '../hooks/usePlayerColors';

const CSV_URL = getActiveCsvUrl();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** The five analytics tabs, in display order — one per minigame. */
const TABS: AnalyticsTab[] = ['Zip', 'Tango', 'Queens', 'Mini Sudoku', 'Patches'];

/** Time-range tabs, in display order. */
const TIME_RANGE_TABS = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time', 'Custom'] as const;
type TimeRange = (typeof TIME_RANGE_TABS)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('Queens');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Month/year currently visible in the heatmap calendar, kept in sync via its
  // onMonthChange callback. Drives the MonthlyTally. Initialised to the current
  // system month/year so the first render already matches the calendar.
  const now = new Date();
  const [visibleMonth, setVisibleMonth] = useState(now.getMonth());
  const [visibleYear,  setVisibleYear]  = useState(now.getFullYear());

  const { data, isLoading, error } = useGamesData(CSV_URL);
  const { colors } = usePlayerColors();

  // ── Metrics (thin orchestration over src/utils) ──────────────────────────
  // Apply the temporal range filter plus the per-game filter, then delegate
  // the metric computation to computeGameStats.
  const stats = useMemo(() => {
    const rangeStart = getRangeStart(timeRange);
    const inRange = (fecha: string) => {
      if (timeRange === 'Custom') {
        if (customStart && fecha < customStart) return false;
        if (customEnd   && fecha > customEnd)   return false;
        return true;
      }
      return !rangeStart || fecha >= rangeStart;
    };

    const filtered = data.filter((row) => {
      if (row.Juego?.trim() !== activeTab) return false;
      return inRange(row.Fecha?.trim() ?? '');
    });
    return computeGameStats(filtered, activeTab);
  }, [data, activeTab, timeRange, customStart, customEnd]);

  // ── Heatmap colour map (independent of the temporal range filter) ─────────
  // Always derived from the COMPLETE `data` (never the range-filtered set), so
  // the heatmap's own month navigation can roam the full history regardless of
  // the Last 7/30/90 Days / Custom selector. Coloured by per-game head-to-head
  // winner for the active tab.
  const heatmapColorMap = useMemo(
    () => buildGameColorMap(data, activeTab, colors),
    [data, activeTab, colors],
  );

  // Dates that have ANY record (across all games) — used to gate calendar clicks.
  const datesWithData = useMemo(() => {
    const set = new Set<string>();
    for (const row of data) {
      const fecha = row.Fecha?.trim();
      if (fecha) set.add(fecha);
    }
    return set;
  }, [data]);

  // Click a heatmap day → open the drawer with ALL of that day's results.
  function handleDayClick(day: number, month: number, year: number) {
    const mm  = String(month + 1).padStart(2, '0');
    const dd  = String(day).padStart(2, '0');
    const iso = `${year}-${mm}-${dd}`;
    if (datesWithData.has(iso)) setSelectedDate(iso);
  }

  // Day-win tally for the month currently visible in the heatmap. Derived from
  // the COMPLETE data (independent of the range filter): per-game head-to-head
  // tally for the active tab.
  const gameTally = useMemo(
    () => computeGameMonthlyTally(data, activeTab, visibleMonth, visibleYear),
    [data, activeTab, visibleMonth, visibleYear],
  );

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

      {/* Game tabs */}
      <GameTabs<AnalyticsTab> tabs={TABS} active={activeTab} onChange={setActiveTab} ariaLabel="Selección de juego" />

      {/* Time range tabs */}
      <GameTabs<TimeRange>
        tabs={[...TIME_RANGE_TABS]}
        active={timeRange}
        onChange={setTimeRange}
        ariaLabel="Rango temporal"
      />

      {/* Custom date range inputs */}
      {timeRange === 'Custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm text-slate-400">–</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {/* ── Heatmap calendar (per-tab winner colours) ── */}
      <div className="space-y-2">
        <MonthlyTally tally={gameTally} colors={colors} />
        <MiniCalendar
          dateColorMap={heatmapColorMap}
          datesWithData={datesWithData}
          onDayClick={handleDayClick}
          onMonthChange={(m, y) => { setVisibleMonth(m); setVisibleYear(y); }}
        />
      </div>

      {/* ── Metric Cards ── */}
      {!stats ? (
        <p className="text-sm text-slate-400 text-center py-8">
          No data for this selection.
        </p>
      ) : (
        <>
          {/* World Record — one card per player, side by side */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="WR Francisco"
              value={stats.worldRecordByPlayer.francisco ?? '—'}
              icon={<Trophy size={14} />}
            />
            <MetricCard
              label="WR Enrique"
              value={stats.worldRecordByPlayer.enrique ?? '—'}
              icon={<Trophy size={14} />}
            />
          </div>

          {/* Average Time — one card per player, side by side */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Avg Francisco"
              value={stats.avgFrancisco}
              icon={<Clock size={14} />}
            />
            <MetricCard
              label="Avg Enrique"
              value={stats.avgEnrique}
              icon={<Clock size={14} />}
            />
          </div>

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

      <DailyResultsDrawer
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        selectedDate={selectedDate}
        data={data}
      />
    </>
  );
}
