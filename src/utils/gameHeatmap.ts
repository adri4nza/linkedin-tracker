import type { GameRecord } from '../hooks/useGamesData';
import type { PlayerColors } from '../hooks/usePlayerColors';
import { TIE_COLOUR } from '../hooks/usePlayerColors';
import { calculateWinner } from './timeUtils';
import type { MonthlyTally } from './dayWins';

// ---------------------------------------------------------------------------
// Argument-order convention (IMPORTANT)
// ---------------------------------------------------------------------------
// `calculateWinner(recA, recB, gameName)` returns 'a' | 'b' | 'tie' | null, and
// the meaning of 'a'/'b' depends ENTIRELY on the argument order at the call
// site. This module fixes the SAME convention used by `dayWins.ts`
// (Francisco-first) so the shared head-to-head logic has one unambiguous
// source of truth:
//
//     calculateWinner(francisco, enrique, juego)
//       → 'a'   = Francisco wins  → colors.francisco (#3b82f6)
//       → 'b'   = Enrique wins    → colors.enrique   (#ef4444)
//       → 'tie' = draw            → tieColor          (#94a3b8)
//       → null  = no contest (neither player has a finite time)
//
// `calculateWinner` already resolves victory-by-forfeit/no-show: when only one
// player has a finite time the present player wins ('a' or 'b'), so those days
// are coloured for the winning player rather than omitted.

// ---------------------------------------------------------------------------
// buildGameColorMap
// ---------------------------------------------------------------------------
/**
 * Builds the heatmap colour map for a single mini-game.
 *
 * Groups ONLY the records whose `Juego` matches `game` by date, evaluates the
 * head-to-head with `calculateWinner(francisco, enrique, game)` and assigns a
 * colour per date:
 *   - 'a'   → colors.francisco (#3b82f6)
 *   - 'b'   → colors.enrique   (#ef4444)
 *   - 'tie' → tieColor         (default TIE_COLOUR #94a3b8)
 * Victory by no-show is included because `calculateWinner` already resolves it.
 *
 * Dates whose result is `null` (no contest) — or that have no records for the
 * selected game — are OMITTED from the map, so the calendar shows no colour
 * indicator for them.
 *
 * Receives the COMPLETE `data` and applies NO temporal range filter: range
 * independence is enforced structurally — the signature does not accept a
 * range argument.
 *
 * @param data     Complete, unfiltered GameRecords (order independent).
 * @param game     Selected mini-game name to build the heatmap for.
 * @param colors   Player colour palette (Francisco / Enrique).
 * @param tieColor Colour used for ties (defaults to TIE_COLOUR #94a3b8).
 * @returns Map keyed by ISO date (YYYY-MM-DD) → hex colour.
 */
export function buildGameColorMap(
  data: GameRecord[],
  game: string,
  colors: PlayerColors,
  tieColor: string = TIE_COLOUR,
): Map<string, string> {
  const colorMap = new Map<string, string>();
  if (!data.length) return colorMap;

  const target = game.trim().toLowerCase();

  // Group ONLY records of the selected game by date → { francisco, enrique }.
  const dateMap = new Map<
    string,
    { francisco?: GameRecord; enrique?: GameRecord }
  >();

  for (const row of data) {
    if (row.Juego?.trim().toLowerCase() !== target) continue;
    const fecha = row.Fecha?.trim() ?? '';
    if (!fecha) continue;
    if (!dateMap.has(fecha)) dateMap.set(fecha, {});
    const entry = dateMap.get(fecha)!;
    const player = row.Jugador?.trim().toLowerCase();
    if (player === 'francisco') entry.francisco = row;
    else if (player === 'enrique') entry.enrique = row;
  }

  for (const [fecha, { francisco, enrique }] of dateMap.entries()) {
    const result = calculateWinner(francisco, enrique, game);
    if (result === 'a') colorMap.set(fecha, colors.francisco);
    else if (result === 'b') colorMap.set(fecha, colors.enrique);
    else if (result === 'tie') colorMap.set(fecha, tieColor);
    // null → no contest: omit the date from the map.
  }

  return colorMap;
}

// ---------------------------------------------------------------------------
// computeGameMonthlyTally
// ---------------------------------------------------------------------------
/**
 * Counts head-to-head day wins for a SINGLE mini-game within one visible
 * month/year, mirroring the Dashboard's MonthlyTally but scoped to `game`.
 *
 * Groups the records of `game` by date, resolves each day with
 * `calculateWinner(francisco, enrique, game)` (Francisco-first convention,
 * victory-by-no-show included) and tallies only the dates that fall in the
 * given month/year:
 *   - 'a'   → francisco++
 *   - 'b'   → enrique++
 *   - 'tie' → ties++
 *   - null  → ignored (no contest)
 *
 * Receives the COMPLETE `data` and applies NO temporal range filter; only the
 * month/year gate is applied. A month with no contested dates yields
 * `{ francisco: 0, enrique: 0, ties: 0 }`.
 *
 * @param data  Complete, unfiltered GameRecords (order independent).
 * @param game  Mini-game name to tally.
 * @param month 0-based month (0 = January … 11 = December).
 * @param year  Full year, e.g. 2025.
 */
export function computeGameMonthlyTally(
  data: GameRecord[],
  game: string,
  month: number,
  year: number,
): MonthlyTally {
  const tally: MonthlyTally = { francisco: 0, enrique: 0, ties: 0 };
  if (!data.length) return tally;

  const target = game.trim().toLowerCase();

  // Group ONLY records of the selected game by date → { francisco, enrique }.
  const dateMap = new Map<
    string,
    { francisco?: GameRecord; enrique?: GameRecord }
  >();

  for (const row of data) {
    if (row.Juego?.trim().toLowerCase() !== target) continue;
    const fecha = row.Fecha?.trim() ?? '';
    if (!fecha) continue;
    if (!dateMap.has(fecha)) dateMap.set(fecha, {});
    const entry = dateMap.get(fecha)!;
    const player = row.Jugador?.trim().toLowerCase();
    if (player === 'francisco') entry.francisco = row;
    else if (player === 'enrique') entry.enrique = row;
  }

  for (const [fecha, { francisco, enrique }] of dateMap.entries()) {
    const [y, m] = fecha.split('-').map(Number);
    // ISO month is 1-based; `month` arg is 0-based.
    if (y !== year || m - 1 !== month) continue;

    const result = calculateWinner(francisco, enrique, game);
    if (result === 'a') tally.francisco++;
    else if (result === 'b') tally.enrique++;
    else if (result === 'tie') tally.ties++;
    // null → no contest: ignored.
  }

  return tally;
}
