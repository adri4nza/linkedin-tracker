import { useMemo } from 'react';
import { X, Trophy, Zap, Music, Crown, Grid2X2, Puzzle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GameRecord } from '../../hooks/useGamesData';
import { timeToSeconds, isFlawless } from '../../utils/timeUtils';

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
  enriqueFlawless: boolean;
  franciscoFlawless: boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function PlayerRow({
  label,
  value,
  isWinner,
  hasFlawless,
}: {
  label: string;
  value: string;
  isWinner: boolean;
  hasFlawless: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-1.5">
        {hasFlawless && <span className="text-sm">✨</span>}
        <span
          className={`text-sm font-semibold ${
            isWinner ? 'text-blue-500' : 'text-slate-700'
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function GameCard({ game }: { game: ComputedGame }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-2 text-slate-600">
        {game.icon}
        <span className="text-sm font-semibold text-slate-700">{game.name}</span>
      </div>
      <div className="divide-y divide-slate-50">
        <PlayerRow
          label="Francisco"
          value={game.franciscoTime}
          isWinner={game.winner === 'francisco'}
          hasFlawless={game.franciscoFlawless}
        />
        <PlayerRow
          label="Enrique"
          value={game.enriqueTime}
          isWinner={game.winner === 'enrique'}
          hasFlawless={game.enriqueFlawless}
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
      const eTime = timeToSeconds(enrique?.Tiempo ?? '');
      const fTime = timeToSeconds(francisco?.Tiempo ?? '');
      const winner: Player | undefined =
        eTime < fTime ? 'enrique' : fTime < eTime ? 'francisco' : undefined;
      return {
        id:               name.toLowerCase().replace(/\s+/g, '-'),
        name,
        icon:             GAME_ICONS[name] ?? <Puzzle size={16} />,
        enriqueTime:      enrique?.Tiempo ?? '—',
        franciscoTime:    francisco?.Tiempo ?? '—',
        winner,
        enriqueFlawless:   isFlawless(enrique?.['Sin Fallos']),
        franciscoFlawless: isFlawless(francisco?.['Sin Fallos']),
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
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from the right */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-slate-50 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Daily game results"
      >
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-bold text-slate-800">{displayDate}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                Game Results
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors mt-0.5"
              aria-label="Close results panel"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Win banner — only when there are games */}
        {gameResults.length > 0 && (
          <div className="mx-4 mt-4 shrink-0">
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
              <Trophy size={20} className="text-blue-500 shrink-0" />
              <p className="text-sm font-bold text-slate-800">
                {winnerBanner.text}{' '}
                <span className="text-blue-600">{winnerBanner.score}</span>
              </p>
            </div>
          </div>
        )}

        {/* Scrollable game cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {gameResults.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No data for this day.</p>
          ) : (
            gameResults.map((game) => <GameCard key={game.id} game={game} />)
          )}
        </div>
      </aside>
    </>
  );
}

