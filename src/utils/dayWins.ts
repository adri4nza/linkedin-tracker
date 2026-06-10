import type { GameRecord } from '../hooks/useGamesData';
import type { PlayerColors } from '../hooks/usePlayerColors';
import { TIE_COLOUR } from '../hooks/usePlayerColors';
import { calculateWinner } from './timeUtils';

// ---------------------------------------------------------------------------
// Argument-order convention (IMPORTANT)
// ---------------------------------------------------------------------------
// `calculateWinner(recA, recB, gameName)` returns 'a' | 'b' | 'tie' | null, and
// the meaning of 'a'/'b' depends ENTIRELY on the argument order at the call
// site. This module fixes a single, explicit convention and uses it everywhere:
//
//     calculateWinner(francisco, enrique, juego)
//       → 'a'   = Francisco wins
//       → 'b'   = Enrique wins
//       → 'tie' = draw
//       → null  = no contest (neither player has a finite time)
//
// (Note: the legacy DashboardPage useMemo called it with the arguments swapped,
//  i.e. `calculateWinner(enrique, francisco, juego)` → 'a' = Enrique. This
//  module deliberately standardises on the Francisco-first order so that the
//  shared "días ganados" logic has one unambiguous source of truth.)

// ---------------------------------------------------------------------------
// Types (see design.md → Data Models)
// ---------------------------------------------------------------------------

/**
 * Outcome of a single calendar day under the "días ganados" rule.
 * - 'francisco' / 'enrique': that player won the majority of minigames that day.
 * - 'tie': equal minigame wins on a day where both players played the same
 *   number of games.
 * - 'excluded': the two players played a DIFFERENT number of games that day
 *   (eGames !== fGames). Such a day is painted as a tie on the calendar but is
 *   NEVER counted in the monthly tally.
 */
export type DayOutcome = 'francisco' | 'enrique' | 'tie' | 'excluded';

export interface DailyOutcome {
  /** ISO date, YYYY-MM-DD. */
  fecha: string;
  /** 'excluded' = eGames !== fGames (painted tie, not counted). */
  outcome: DayOutcome;
  /** Hex colour for the dateColorMap consumed by MiniCalendar. */
  color: string;
  /** Number of minigames Francisco won that day. 0 for 'excluded' days.
   *  Exposed so presentation layers (e.g. the Dashboard DonutChart breakdown
   *  and the daily-results carousel) can render the per-day score without
   *  re-running the aggregation/`calculateWinner` logic. */
  franciscoWins: number;
  /** Number of minigames Enrique won that day. 0 for 'excluded' days. */
  enriqueWins: number;
}

export interface MonthlyTally {
  /** Days won by Francisco in the month (integer >= 0). */
  francisco: number;
  /** Days won by Enrique in the month (integer >= 0). */
  enrique: number;
  /** Tied days in the month (integer >= 0). */
  ties: number;
}

// ---------------------------------------------------------------------------
// computeDailyOutcomes
// ---------------------------------------------------------------------------
/**
 * Groups GameRecords by date, applies the official "día ganado" rule and
 * produces one DailyOutcome per date that has data.
 *
 * Rule (mirrors the Dashboard DonutChart / BUSINESS_LOGIC.md §4):
 * 1. Group records by `Fecha` → `Juego` → { francisco, enrique }.
 * 2. If the number of games played by each player differs
 *    (`eGames !== fGames`), the day is 'excluded': it gets the tie colour for
 *    the calendar but is not counted in the tally.
 * 3. Otherwise, resolve each minigame with
 *    `calculateWinner(francisco, enrique, juego)` and tally per-game wins.
 *    The player with the majority of minigame wins owns the day; an equal
 *    count is a 'tie'.
 *
 * @param data   Raw GameRecords (any subset; order independent).
 * @param colors Player colour palette used for the dateColorMap.
 * @returns One DailyOutcome per date with data.
 */
export function computeDailyOutcomes(
  data: GameRecord[],
  colors: PlayerColors,
): DailyOutcome[] {
  if (!data.length) return [];

  // Group records by date → game → { francisco, enrique }
  const dateMap = new Map<
    string,
    Map<string, { francisco?: GameRecord; enrique?: GameRecord }>
  >();

  for (const row of data) {
    const fecha = row.Fecha?.trim() ?? '';
    const juego = row.Juego?.trim() ?? '';
    if (!fecha) continue;
    if (!dateMap.has(fecha)) dateMap.set(fecha, new Map());
    const gameMap = dateMap.get(fecha)!;
    if (!gameMap.has(juego)) gameMap.set(juego, {});
    const entry = gameMap.get(juego)!;
    const player = row.Jugador?.trim().toLowerCase();
    if (player === 'francisco') entry.francisco = row;
    else if (player === 'enrique') entry.enrique = row;
  }

  const outcomes: DailyOutcome[] = [];

  for (const [fecha, gameMap] of dateMap.entries()) {
    let eGames = 0;
    let fGames = 0;
    for (const { francisco, enrique } of gameMap.values()) {
      if (francisco) fGames++;
      if (enrique) eGames++;
    }

    // Unequal number of games played → painted tie, but excluded from counts.
    if (eGames !== fGames) {
      outcomes.push({
        fecha,
        outcome: 'excluded',
        color: TIE_COLOUR,
        franciscoWins: 0,
        enriqueWins: 0,
      });
      continue;
    }

    let fWins = 0;
    let eWins = 0;
    for (const [juego, { francisco, enrique }] of gameMap.entries()) {
      const result = calculateWinner(francisco, enrique, juego);
      if (result === 'a') fWins++;
      else if (result === 'b') eWins++;
    }

    if (fWins > eWins) {
      outcomes.push({
        fecha,
        outcome: 'francisco',
        color: colors.francisco,
        franciscoWins: fWins,
        enriqueWins: eWins,
      });
    } else if (eWins > fWins) {
      outcomes.push({
        fecha,
        outcome: 'enrique',
        color: colors.enrique,
        franciscoWins: fWins,
        enriqueWins: eWins,
      });
    } else {
      outcomes.push({
        fecha,
        outcome: 'tie',
        color: TIE_COLOUR,
        franciscoWins: fWins,
        enriqueWins: eWins,
      });
    }
  }

  return outcomes;
}

// ---------------------------------------------------------------------------
// computeMonthlyTally
// ---------------------------------------------------------------------------
/**
 * Counts the day outcomes belonging to a single visible month/year.
 *
 * Only dates whose ISO `Fecha` falls in the given month and year are counted;
 * filler days from adjacent months are ignored by construction. 'excluded'
 * outcomes never increment any counter. A month with no counted dates yields
 * `{ francisco: 0, enrique: 0, ties: 0 }`.
 *
 * @param outcomes Daily outcomes from `computeDailyOutcomes`.
 * @param month    0-based month (0 = January … 11 = December).
 * @param year     Full year, e.g. 2025.
 */
export function computeMonthlyTally(
  outcomes: DailyOutcome[],
  month: number,
  year: number,
): MonthlyTally {
  const tally: MonthlyTally = { francisco: 0, enrique: 0, ties: 0 };

  for (const { fecha, outcome } of outcomes) {
    const [y, m] = fecha.split('-').map(Number);
    // ISO month is 1-based; `month` arg is 0-based.
    if (y !== year || m - 1 !== month) continue;

    if (outcome === 'francisco') tally.francisco++;
    else if (outcome === 'enrique') tally.enrique++;
    else if (outcome === 'tie') tally.ties++;
    // 'excluded' → never counted.
  }

  return tally;
}
