import { useMemo } from 'react';
import { X, Trophy, Zap, Music, Crown, Grid2X2, Puzzle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GameRecord } from '../../hooks/useGamesData';
import { calculateWinner } from '../../utils/timeUtils';
import { usePlayerColors } from '../../hooks/usePlayerColors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const GAME_ICONS: Record<string, ReactNode> = {
  'Zip':         <Zap size={16} />,
  'Tango':       <Music size={16} />,
  'Queens':      <Crown size={16} />,
  'Mini Sudoku': <Grid2X2 size={16} />,
  'Patches':     <Puzzle size={16} />,
};

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DailyResultsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** ISO date string YYYY-MM-DD for the selected day. */
  selectedDate: string | null;
  data: GameRecord[];
}

type Player = 'francisco' | 'enrique';

interface ComputedGame {
  id: string;
  name: string;
  icon: ReactNode;
  enriqueTime: string;
  franciscoTime: string;
  winner: Player | undefined;
  /** True only for the Zip game, which uses the retrocesos indicator. */
  isZip: boolean;
  /** Backtrack count; null = unknown/unparsed (no star awarded). */
  enriqueRetrocesos: number | null;
  franciscoRetrocesos: number | null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
/**
 * Renders the Zip-only retrocesos indicator:
 *   - ✨ strictly when count === 0 (verified perfect run).
 *   - numeric "(N)" for a known positive count.
 *   - nothing for unknown (null) counts or non-Zip games.
 */
function RetrocesosIndicator({ isZip, count }: { isZip: boolean; count: number | null }) {
  if (!isZip || count == null) return null;
  if (count === 0) {
    return <span className="text-sm" title="Zip sin retrocesos">✨</span>;
  }
  return (
    <span
      className="text-xs font-medium text-slate-400 dark:text-slate-500"
      title={`${count} retroceso${count !== 1 ? 's' : ''}`}
    >
      ({count})
    </span>
  );
}

function PlayerRow({
  label,
  value,
  isWinner,
  isZip,
  retrocesos,
  glowColor,
}: {
  label: string;
  value: string;
  isWinner: boolean;
  isZip: boolean;
  retrocesos: number | null;
  glowColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <RetrocesosIndicator isZip={isZip} count={retrocesos} />
        <span
          className={`text-sm font-semibold transition-all duration-300 ${
            isWinner ? 'winner-glow' : 'text-slate-700 dark:text-slate-200'
          }`}
          style={isWinner ? { color: glowColor, ['--glow' as string]: glowColor } : undefined}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function GameCard({ game, colors }: { game: ComputedGame; colors: { francisco: string; enrique: string } }) {
  return (
    <div className="bg-white/60 dark:bg-slate-800/40 rounded-2xl px-4 py-3 shadow-sm border border-slate-200/60 dark:border-slate-700/50 transition-all duration-300 hover:border-slate-300/70 dark:hover:border-slate-600/60">
      <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400">
        {game.icon}
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{game.name}</span>
      </div>
      <div className="divide-y divide-slate-100/60 dark:divide-slate-700/50">
        <PlayerRow
          label="Francisco"
          value={game.franciscoTime}
          isWinner={game.winner === 'francisco'}
          isZip={game.isZip}
          retrocesos={game.franciscoRetrocesos}
          glowColor={colors.francisco}
        />
        <PlayerRow
          label="Enrique"
          value={game.enriqueTime}
          isWinner={game.winner === 'enrique'}
          isZip={game.isZip}
          retrocesos={game.enriqueRetrocesos}
          glowColor={colors.enrique}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DailyResultsDrawer({
  isOpen,
  onClose,
  selectedDate,
  data,
}: DailyResultsDrawerProps) {
  const { colors } = usePlayerColors();

  // Filter records for the selected date
  const dateRecords = useMemo(() => {
    if (!selectedDate) return [];
    return data.filter((r) => r.Fecha?.trim() === selectedDate);
  }, [data, selectedDate]);

  // Build computed game results
  const gameResults = useMemo((): ComputedGame[] => {
    const gameMap = new Map<string, { enrique?: GameRecord; francisco?: GameRecord }>();
    for (const row of dateRecords) {
      const game   = row.Juego?.trim() ?? 'Unknown';
      const player = row.Jugador?.trim().toLowerCase();
      if (!gameMap.has(game)) gameMap.set(game, {});
      const entry = gameMap.get(game)!;
      if (player === 'enrique')   entry.enrique   = row;
      else if (player === 'francisco') entry.francisco = row;
    }

    return [...gameMap.entries()].map(([name, { enrique, francisco }]) => {
      // Centralized head-to-head resolution: lower time wins, victory by
      // forfeit (missing time) and, on exact ties, the Zip-only retrocesos
      // tiebreaker (fewer backtracks wins).
      // calculateWinner(francisco, enrique, name) → 'a' = francisco, 'b' = enrique.
      const result = calculateWinner(francisco, enrique, name);
      const winner: Player | undefined =
        result === 'a' ? 'francisco' : result === 'b' ? 'enrique' : undefined;
      return {
        id:               name.toLowerCase().replace(/\s+/g, '-'),
        name,
        icon:             GAME_ICONS[name] ?? <Puzzle size={16} />,
        enriqueTime:      enrique?.Tiempo ?? '—',
        franciscoTime:    francisco?.Tiempo ?? '—',
        winner,
        isZip:               name.trim().toLowerCase() === 'zip',
        enriqueRetrocesos:   enrique?.Retrocesos ?? null,
        franciscoRetrocesos: francisco?.Retrocesos ?? null,
      };
    });
  }, [dateRecords]);

  // Tally daily winner for the banner
  const winnerBanner = useMemo(() => {
    let e = 0, f = 0;
    for (const g of gameResults) {
      if (g.winner === 'enrique')   e++;
      else if (g.winner === 'francisco') f++;
    }
    if (e > f) return { text: 'Enrique won',   score: `${e} - ${f}` };
    if (f > e) return { text: 'Francisco won', score: `${f} - ${e}` };
    return        { text: 'Tied',              score: `${e} - ${f}` };
  }, [gameResults]);

  const displayDate = selectedDate ? formatDisplayDate(selectedDate) : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer glass panel — slides in from the right, floats over the UI */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border-l border-slate-200/60 dark:border-slate-700/50 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Daily game results"
      >
        {/* Header */}
        <div className="bg-white/40 dark:bg-slate-900/30 px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">{displayDate}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                Game Results
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 active:scale-95 transition-all duration-300 mt-0.5"
              aria-label="Close results panel"
            >
              <X size={18} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Win banner — only when there are games */}
        {gameResults.length > 0 && (
          <div className="mx-4 mt-4 shrink-0">
            <div className="flex items-center gap-3 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 rounded-2xl px-4 py-3 shadow-sm">
              <Trophy size={20} className="text-blue-500 shrink-0" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {winnerBanner.text}{' '}
                <span className="text-blue-600 dark:text-blue-400">{winnerBanner.score}</span>
              </p>
            </div>
          </div>
        )}

        {/* Scrollable game cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {gameResults.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No data for this day.</p>
          ) : (
            gameResults.map((game) => <GameCard key={game.id} game={game} colors={colors} />)
          )}
        </div>
      </aside>
    </>
  );
}

