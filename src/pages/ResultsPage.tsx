import { useState, useMemo } from 'react';
import { Loader2, AlertCircle, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import type { GameRecord } from '../hooks/useGamesData';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { timeToSeconds, isFlawless } from '../utils/timeUtils';

const CSV_URL = getActiveCsvUrl();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 15;
const GAMES = ['All', 'Zip', 'Tango', 'Queens', 'Mini Sudoku', 'Patches'] as const;
type GameFilter = (typeof GAMES)[number];

type SortCol = 'Fecha' | 'Jugador' | 'Juego' | 'Tiempo';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sortValue(row: GameRecord, col: SortCol): string | number {
  if (col === 'Tiempo') return timeToSeconds(row.Tiempo);
  return (row[col] ?? '').trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SortIcon({ col, active, dir }: { col: SortCol; active: SortCol; dir: SortDir }) {
  if (col !== active) return <ChevronsUpDown size={12} className="ml-0.5 text-slate-300 inline" />;
  return dir === 'asc'
    ? <ChevronUp size={12} className="ml-0.5 text-blue-500 inline" />
    : <ChevronDown size={12} className="ml-0.5 text-blue-500 inline" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ResultsPage() {
  const [search, setSearch]           = useState('');
  const [gameFilter, setGameFilter]   = useState<GameFilter>('All');
  const [sortCol, setSortCol]         = useState<SortCol>('Fecha');
  const [sortDir, setSortDir]         = useState<SortDir>('desc');
  const [page, setPage]               = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, error } = useGamesData(CSV_URL);

  // ── 1. Filter ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      if (gameFilter !== 'All' && row.Juego?.trim() !== gameFilter) return false;
      if (q) {
        const inPlayer = row.Jugador?.trim().toLowerCase().includes(q);
        const inGame   = row.Juego?.trim().toLowerCase().includes(q);
        if (!inPlayer && !inGame) return false;
      }
      return true;
    });
  }, [data, search, gameFilter]);

  // ── 2. Sort ──────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const multiplier = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortCol);
      const bv = sortValue(b, sortCol);
      if (av < bv) return -multiplier;
      if (av > bv) return  multiplier;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  // ── 3. Paginate ──────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleGameFilter(val: GameFilter) {
    setGameFilter(val);
    setPage(1);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-400" />
        <p className="text-sm font-medium">Loading game data…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Failed to load data</p>
        <p className="text-xs text-slate-400 max-w-xs">{error}</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page intro */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Game History</h1>
        <p className="text-sm text-blue-500 font-medium">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== data.length && ` of ${data.length}`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search player or game…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Game filter */}
        <select
          value={gameFilter}
          onChange={(e) => handleGameFilter(e.target.value as GameFilter)}
          className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {GAMES.map((g) => (
            <option key={g} value={g}>{g === 'All' ? 'All Games' : g}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-left">
                {(
                  [
                    { key: 'Fecha',   label: 'Date' },
                    { key: 'Jugador', label: 'Player' },
                    { key: 'Juego',   label: 'Game' },
                  ] as { key: SortCol; label: string }[]
                ).map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} active={sortCol} dir={sortDir} />
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  Ed.
                </th>
                <th
                  className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  onClick={() => handleSort('Tiempo')}
                >
                  Time
                  <SortIcon col="Tiempo" active={sortCol} dir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">
                  ✨
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-400">
                    No results found.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr
                    key={i}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setSelectedDate(row.Fecha?.trim() ?? null)}
                  >
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.Fecha?.trim()}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.Jugador?.trim()}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.Juego?.trim()}</td>
                    <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">{row['Edición (n.º)']?.trim()}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.Tiempo?.trim()}</td>
                    <td className="px-3 py-2 text-center">
                      {isFlawless(row['Sin Fallos']) && <span title="Flawless">✨</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page <span className="font-semibold text-slate-700 dark:text-slate-200">{safePage}</span> of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
      <DailyResultsDrawer
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        selectedDate={selectedDate}
        data={data}
      />
    </>
  );
}

