/**
 * GameDotRow — shared presentational component.
 *
 * Renders a row of 5 minigame logos, each with a coloured dot underneath
 * indicating who won that game on a specific date:
 *   Francisco colour → Francisco won
 *   Enrique colour   → Enrique won
 *   tieColor         → tie
 *   transparent      → no contest (both times Infinity / missing)
 *
 * Pure presentation: receives pre-filtered `dateRecords` so it does no
 * data fetching itself.
 */
import type { GameRecord } from '../../hooks/useGamesData';
import { calculateWinner } from '../../utils/timeUtils';
import { GAME_LOGOS } from '../../config/gameLogos';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** Display order — consistent with the rest of the app. */
export const GAME_ORDER = ['Zip', 'Tango', 'Queens', 'Mini Sudoku', 'Patches'] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface GameDotRowProps {
  /** Records already filtered to the target date. */
  dateRecords: GameRecord[];
  franciscoColor: string;
  enriqueColor: string;
  tieColor: string;
  /** Size class for each logo. Defaults to 'md' (w-7 h-7). */
  size?: 'sm' | 'md';
}

// ---------------------------------------------------------------------------
// Single game dot
// ---------------------------------------------------------------------------
function GameDot({
  gameName,
  dateRecords,
  franciscoColor,
  enriqueColor,
  tieColor,
  size,
}: {
  gameName: string;
  dateRecords: GameRecord[];
  franciscoColor: string;
  enriqueColor: string;
  tieColor: string;
  size: 'sm' | 'md';
}) {
  const logo = GAME_LOGOS[gameName.toLowerCase()];

  const francisco = dateRecords.find(
    (r) => r.Juego?.trim() === gameName && r.Jugador?.trim().toLowerCase() === 'francisco',
  );
  const enrique = dateRecords.find(
    (r) => r.Juego?.trim() === gameName && r.Jugador?.trim().toLowerCase() === 'enrique',
  );

  // Francisco-first convention (matches dayWins.ts, gameHeatmap.ts, pivot.ts).
  const result   = calculateWinner(francisco, enrique, gameName);
  const dotColor =
    result === 'a'    ? franciscoColor :
    result === 'b'    ? enriqueColor   :
    result === 'tie'  ? tieColor       :
    'transparent';                       // null = no contest

  const imgCls  = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const fallCls = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <div className="flex flex-col items-center gap-1">
      {logo ? (
        <img
          src={logo}
          alt={gameName}
          className={`${imgCls} rounded object-contain`}
        />
      ) : (
        <div className={`${fallCls} rounded bg-slate-200/60 dark:bg-slate-700/60 flex items-center justify-center`}>
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
            {gameName.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
        aria-hidden="true"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------
export default function GameDotRow({
  dateRecords,
  franciscoColor,
  enriqueColor,
  tieColor,
  size = 'md',
}: GameDotRowProps) {
  // Only render games that have at least one record for this date.
  const gamesWithData = GAME_ORDER.filter((game) =>
    dateRecords.some((r) => r.Juego?.trim() === game),
  );

  return (
    <div className="flex items-end justify-around w-full">
      {gamesWithData.map((game) => (
        <GameDot
          key={game}
          gameName={game}
          dateRecords={dateRecords}
          franciscoColor={franciscoColor}
          enriqueColor={enriqueColor}
          tieColor={tieColor}
          size={size}
        />
      ))}
    </div>
  );
}
