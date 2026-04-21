import { X, Trophy, Zap, Music, Crown, Grid2X2, Puzzle } from 'lucide-react';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DailyResultsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Display date string, e.g. "April 21, 2026" */
  date?: string;
}

type Player = 'francisco' | 'enrique';

interface GameResult {
  id: string;
  name: string;
  icon: ReactNode;
  francisco: string;
  enrique: string;
  /** Which player had the lower / winning time. Undefined = draw / no comparison. */
  winner?: Player;
  /** Which player gets the ✨ flawless spark. */
  flawless?: Player;
}

// ---------------------------------------------------------------------------
// Static dataset (matches the reference image)
// ---------------------------------------------------------------------------
const GAME_RESULTS: GameResult[] = [
  {
    id: 'zip',
    name: 'Zip',
    icon: <Zap size={16} />,
    francisco: '0:45',
    enrique: '0:42',
    winner: 'enrique',
    flawless: 'enrique',
  },
  {
    id: 'tango',
    name: 'Tango',
    icon: <Music size={16} />,
    francisco: '1:12',
    enrique: '1:18',
    winner: 'francisco',
  },
  {
    id: 'queens',
    name: 'Queens',
    icon: <Crown size={16} />,
    francisco: '2:05',
    enrique: '1:55',
    winner: 'enrique',
    flawless: 'enrique',
  },
  {
    id: 'mini-sudoku',
    name: 'Mini Sudoku',
    icon: <Grid2X2 size={16} />,
    francisco: '0:38',
    enrique: '0:45',
    winner: 'francisco',
  },
  {
    id: 'patches',
    name: 'Patches',
    icon: <Puzzle size={16} />,
    francisco: '0:38',
    enrique: '0:45',
    winner: 'francisco',
  },
];

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

function GameCard({ game }: { game: GameResult }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
      {/* Game header */}
      <div className="flex items-center gap-2 mb-2 text-slate-600">
        {game.icon}
        <span className="text-sm font-semibold text-slate-700">{game.name}</span>
      </div>
      <div className="divide-y divide-slate-50">
        <PlayerRow
          label="Francisco"
          value={game.francisco}
          isWinner={game.winner === 'francisco'}
          hasFlawless={game.flawless === 'francisco'}
        />
        <PlayerRow
          label="Enrique"
          value={game.enrique}
          isWinner={game.winner === 'enrique'}
          hasFlawless={game.flawless === 'enrique'}
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
  date = 'April 21, 2026',
}: DailyResultsDrawerProps) {
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
              <p className="text-base font-bold text-slate-800">{date}</p>
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

        {/* Win banner */}
        <div className="mx-4 mt-4 shrink-0">
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
            <Trophy size={20} className="text-blue-500 shrink-0" />
            <p className="text-sm font-bold text-slate-800">
              Enrique won{' '}
              <span className="text-blue-600">3 - 2</span>
            </p>
          </div>
        </div>

        {/* Scrollable game cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {GAME_RESULTS.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </aside>
    </>
  );
}
