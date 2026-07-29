import type { MonthlyTally as MonthlyTallyData } from '../../utils/dayWins';
import type { PlayerColors } from '../../hooks/usePlayerColors';
import { TIE_COLOUR } from '../../hooks/usePlayerColors';

export interface MonthlyTallyProps {
  /** Per-month day-win counts (Francisco / Enrique / ties). */
  tally: MonthlyTallyData;
  /** Player colour palette ({ francisco, enrique }). */
  colors: PlayerColors;
  /** Tie colour. Defaults to TIE_COLOUR (#94a3b8). */
  tieColor?: string;
}

/**
 * Pure presentation component for the monthly day-wins tally shown next to the
 * Dashboard MiniCalendar. It performs NO aggregation — it simply renders the
 * three counts it receives, in the order Francisco / Enrique / Empates, each
 * tinted with its colour (Req 1.2, 1.10).
 */
export default function MonthlyTally({
  tally,
  colors,
  tieColor = TIE_COLOUR,
}: MonthlyTallyProps) {
  const items: Array<{ label: string; count: number; color: string }> = [
    { label: 'Francisco', count: tally.francisco, color: colors.francisco },
    { label: 'Enrique', count: tally.enrique, color: colors.enrique },
    { label: 'Empates', count: tally.ties, color: tieColor },
  ];

  // Presentation-only: highlight the leading player (ties excluded) with a glow.
  // Does not alter any tally logic.
  const leadCount = Math.max(tally.francisco, tally.enrique);
  const isLeader = (label: string, count: number) =>
    count > 0 && count === leadCount && label !== 'Empates' && tally.francisco !== tally.enrique;

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 rounded-2xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/50 shadow-sm px-4 py-3 transition-colors duration-300">
      {items.map(({ label, count, color }) => {
        const leader = isLeader(label, count);
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${leader ? 'winner-glow' : ''}`}
              style={{ backgroundColor: color, ['--glow' as string]: color }}
              aria-hidden="true"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
            <span
              className={`text-base font-bold tabular-nums transition-all duration-300 ${leader ? 'winner-glow' : ''}`}
              style={{ color, ['--glow' as string]: color }}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
