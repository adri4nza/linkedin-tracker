import { useMemo } from 'react';
import { X, ChevronRight } from 'lucide-react';
import type { GameRecord } from '../../hooks/useGamesData';
import { usePlayerColors, TIE_COLOUR } from '../../hooks/usePlayerColors';
import GameDotRow from '../GameDotRow/GameDotRow';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ScoreBreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  player: string;
  playerColor: string;
  score: string;
  /** ISO dates (YYYY-MM-DD) already sorted newest-first by the caller. */
  dates: string[];
  data: GameRecord[];
  onDateSelect: (date: string) => void;
}

// ---------------------------------------------------------------------------
// Date card
// ---------------------------------------------------------------------------
function DateCard({
  fecha,
  data,
  franciscoColor,
  enriqueColor,
  tieColor,
  onClick,
}: {
  fecha: string;
  data: GameRecord[];
  franciscoColor: string;
  enriqueColor: string;
  tieColor: string;
  onClick: () => void;
}) {
  const dateRecords = useMemo(
    () => data.filter((r) => r.Fecha?.trim() === fecha),
    [data, fecha],
  );

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/50 dark:bg-slate-800/40 rounded-2xl px-4 py-3
                 border border-slate-200/60 dark:border-slate-700/50
                 hover:border-slate-300/70 dark:hover:border-slate-600/50
                 active:scale-[0.97] transition-all duration-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {formatDisplayDate(fecha)}
        </span>
        <ChevronRight size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
      </div>

      <GameDotRow
        dateRecords={dateRecords}
        franciscoColor={franciscoColor}
        enriqueColor={enriqueColor}
        tieColor={tieColor}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ScoreBreakdownDrawer({
  isOpen,
  onClose,
  player,
  playerColor,
  score,
  dates,
  data,
  onDateSelect,
}: ScoreBreakdownDrawerProps) {
  const { colors } = usePlayerColors();

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

      {/* Drawer glass panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 max-w-full
                    bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl
                    border-l border-slate-200/60 dark:border-slate-700/50
                    z-50 shadow-2xl flex flex-col
                    transform transition-transform duration-300 ease-in-out ${
                      isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
        aria-label={`${player} ${score} victories`}
      >
        {/* Header */}
        <div className="bg-white/40 dark:bg-slate-900/30 px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: playerColor }}
                />
                <p className="text-base font-bold tracking-tight" style={{ color: playerColor }}>
                  {player}
                </p>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Victorias {score} · {dates.length} día{dates.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 active:scale-95 transition-all duration-300 mt-0.5"
              aria-label="Close panel"
            >
              <X size={18} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Scrollable date cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {dates.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No dates found.</p>
          ) : (
            dates.map((fecha) => (
              <DateCard
                key={fecha}
                fecha={fecha}
                data={data}
                franciscoColor={colors.francisco}
                enriqueColor={colors.enrique}
                tieColor={TIE_COLOUR}
                onClick={() => onDateSelect(fecha)}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}
