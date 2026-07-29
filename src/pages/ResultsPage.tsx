import { useState, useMemo } from 'react';
import { Loader2, AlertCircle, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useGamesData, getActiveCsvUrl } from '../hooks/useGamesData';
import type { GameRecord } from '../hooks/useGamesData';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';
import { pivotRecords, sortPivotRows } from '../utils/pivot';
import type { PivotRow, PivotSortCol, SortDir, WinnerLabel } from '../utils/pivot';
import { usePlayerColors, TIE_COLOUR } from '../hooks/usePlayerColors';
import type { PlayerColors } from '../hooks/usePlayerColors';

const CSV_URL = getActiveCsvUrl();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 15;
const GAMES = ['All', 'Zip', 'Tango', 'Queens', 'Mini Sudoku', 'Patches'] as const;
type GameFilter = (typeof GAMES)[number];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SortIcon({ col, active, dir }: { col: PivotSortCol; active: PivotSortCol; dir: SortDir }) {
  if (col !== active) return <ChevronsUpDown size={12} className="ml-0.5 text-slate-300 inline" />;
  return dir === 'asc'
    ? <ChevronUp size={12} className="ml-0.5 text-blue-500 inline" />
    : <ChevronDown size={12} className="ml-0.5 text-blue-500 inline" />;
}

/**
 * Zip-only backtrack indicator, reused per player cell:
 *   ✨ when Retrocesos === 0, the number when > 0, — when unknown (null).
 * Only rendered when the row's game is Zip.
 */
function RetroIndicator({ retro }: { retro: number | null }) {
  if (retro === 0) return <span title="Zip sin retrocesos">✨</span>;
  if (retro != null) {
    return (
      <span
        className="text-xs font-medium text-slate-500 dark:text-slate-400"
        title={`${retro} retroceso${retro !== 1 ? 's' : ''}`}
      >
        {retro}
      </span>
    );
  }
  return <span className="text-slate-300 dark:text-slate-600">—</span>;
}

/** A single player cell: time plus the Zip retrocesos indicator, or — if absent. */
function PlayerCell({
  record,
  isZip,
  highlight,
  glowColor,
}: {
  record?: GameRecord;
  isZip: boolean;
  highlight: boolean;
  glowColor?: string;
}) {
  if (!record) {
    return <span className="text-slate-300 dark:text-slate-600">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`font-mono font-semibold transition-all duration-300 ${
          highlight ? 'winner-glow' : 'text-slate-800 dark:text-slate-200'
        }`}
        style={highlight ? { color: glowColor, ['--glow' as string]: glowColor } : undefined}
      >
        {record.Tiempo?.trim() || '—'}
      </span>
      {isZip && <RetroIndicator retro={record.Retrocesos ?? null} />}
    </span>
  );
}

/** Winner column cell, colored with the project's player colors. */
function WinnerCell({ winner, colors }: { winner: WinnerLabel; colors: PlayerColors }) {
  if (winner === 'francisco') {
    return (
      <span
        className="inline-flex items-center font-semibold text-xs px-2.5 py-1 rounded-full"
        style={{ color: colors.francisco, backgroundColor: colors.francisco + '1a' }}
      >
        Francisco
      </span>
    );
  }
  if (winner === 'enrique') {
    return (
      <span
        className="inline-flex items-center font-semibold text-xs px-2.5 py-1 rounded-full"
        style={{ color: colors.enrique, backgroundColor: colors.enrique + '1a' }}
      >
        Enrique
      </span>
    );
  }
  if (winner === 'tie') {
    return (
      <span
        className="inline-flex items-center font-semibold text-xs px-2.5 py-1 rounded-full"
        style={{ color: TIE_COLOUR, backgroundColor: TIE_COLOUR + '1a' }}
      >
        Empate
      </span>
    );
  }
  return <span className="text-slate-300 dark:text-slate-600">—</span>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ResultsPage() {
  const [search, setSearch]             = useState('');
  const [gameFilter, setGameFilter]     = useState<GameFilter>('All');
  const [sortCol, setSortCol]           = useState<PivotSortCol>('Fecha');
  const [sortDir, setSortDir]           = useState<SortDir>('desc');
  const [page, setPage]                 = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, error } = useGamesData(CSV_URL);
  const { colors } = usePlayerColors();

  // ── 0. Pivot ──────────────────────────────────────────────────────────────
  const pivoted = useMemo(() => pivotRecords(data), [data]);

  // ── 1. Filter (game + search) ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pivoted.filter((row) => {
      if (gameFilter !== 'All' && row.juego !== gameFilter) return false;
      if (q) {
        const inGame  = row.juego.toLowerCase().includes(q);
        const inDate  = row.fecha.toLowerCase().includes(q);
        const inEd    = row.edicion.toLowerCase().includes(q);
        if (!inGame && !inDate && !inEd) return false;
      }
      return true;
    });
  }, [pivoted, search, gameFilter]);

  // ── 2. Sort ─────────────────────────────────────────────────────────────────
  const sorted = useMemo(
    () => sortPivotRows(filtered, sortCol, sortDir),
    [filtered, sortCol, sortDir],
  );

  // ── 3. Paginate (over pivoted rows) ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSort(col: PivotSortCol) {
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
          {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
          {filtered.length !== pivoted.length && ` of ${pivoted.length}`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search game or date…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/50 rounded-xl shadow-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
          />
        </div>

        {/* Game filter */}
        <select
          value={gameFilter}
          onChange={(e) => handleGameFilter(e.target.value as GameFilter)}
          className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
        >
          {GAMES.map((g) => (
            <option key={g} value={g}>{g === 'All' ? 'All Games' : g}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/40 text-left">
                {(
                  [
                    { key: 'Fecha',        label: 'Date' },
                    { key: 'JuegoEdicion', label: 'Game / Ed.' },
                  ] as { key: PivotSortCol; label: string }[]
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
                <th
                  className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  onClick={() => handleSort('Tiempo')}
                  title="Francisco (tiempo / retrocesos en Zip)"
                >
                  Francisco
                  <SortIcon col="Tiempo" active={sortCol} dir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap" title="Enrique (tiempo / retrocesos en Zip)">
                  Enrique
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap text-center">
                  Winner
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">
                    No results found.
                  </td>
                </tr>
              ) : (
                pageRows.map((row: PivotRow) => {
                  const isZip = row.juego.trim().toLowerCase() === 'zip';
                  return (
                    <tr
                      key={row.key}
                      className="cursor-pointer hover:bg-slate-800/5 dark:hover:bg-slate-700/40 active:scale-[0.99] transition-all duration-300"
                      onClick={() => setSelectedDate(row.fecha || null)}
                    >
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.fecha}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-400">{row.juego}</span>
                        {row.edicion && <span className="text-slate-400 text-xs ml-1">#{row.edicion}</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <PlayerCell record={row.francisco} isZip={isZip} highlight={row.winner === 'francisco'} glowColor={colors.francisco} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <PlayerCell record={row.enrique} isZip={isZip} highlight={row.winner === 'enrique'} glowColor={colors.enrique} />
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <WinnerCell winner={row.winner} colors={colors} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/60 dark:border-slate-700/50">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-300"
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
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-300"
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
