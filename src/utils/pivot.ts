import type { GameRecord } from '../hooks/useGamesData';
import { calculateWinner, timeToSeconds } from './timeUtils';

// ---------------------------------------------------------------------------
// Argument-order convention (IMPORTANT)
// ---------------------------------------------------------------------------
// `calculateWinner(recA, recB, gameName)` returns 'a' | 'b' | 'tie' | null and
// the meaning of 'a'/'b' depends ENTIRELY on the argument order at the call
// site. This module fixes a single, explicit convention (matching dayWins.ts):
//
//     calculateWinner(francisco, enrique, juego)
//       → 'a'   = Francisco wins   → WinnerLabel 'francisco'
//       → 'b'   = Enrique wins     → WinnerLabel 'enrique'
//       → 'tie' = draw             → WinnerLabel 'tie'
//       → null  = no contest       → WinnerLabel 'none'
//
// Note: `calculateWinner` already resolves victory-by-forfeit: when one
// player's time is Infinity/missing and the other's is finite, the finite
// player wins. So a row where only one player is present with a finite time
// maps to that player automatically; no special-casing is required here.

// ---------------------------------------------------------------------------
// Types (see design.md → Data Models)
// ---------------------------------------------------------------------------

/** Observable winner label. 'none' ← calculateWinner returned null. */
export type WinnerLabel = 'francisco' | 'enrique' | 'tie' | 'none';

export interface PivotRow {
  /** Unique key: `${Fecha}|${Juego}|${Edición}`. */
  key: string;
  /** ISO date, YYYY-MM-DD. */
  fecha: string;
  juego: string;
  edicion: string;
  /** Francisco's record for this key; absent => render cell as "—". */
  francisco?: GameRecord;
  /** Enrique's record for this key; absent => render cell as "—". */
  enrique?: GameRecord;
  /** Mapped result of calculateWinner(francisco, enrique, juego). */
  winner: WinnerLabel;
  /** min(tFrancisco, tEnrique) in seconds; Infinity if both absent/invalid. */
  sortTimeSecs: number;
}

/** Sortable columns of the pivoted table. */
export type PivotSortCol = 'Fecha' | 'JuegoEdicion' | 'Tiempo';

export type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// pivotRecords
// ---------------------------------------------------------------------------
/**
 * Groups GameRecords into head-to-head rows keyed by the unique combination
 * `Fecha + Juego + Edición`, holding at most one record per player.
 *
 * Duplicate resolution (deterministic): if the same player has more than one
 * record for the same key, the record with the lower time (fewer seconds via
 * `timeToSeconds`) is kept. This guarantees no input record is duplicated and
 * each row carries at most one record per player (preserves the pivot
 * integrity property).
 *
 * @param records Raw GameRecords (any subset; order independent).
 * @returns One PivotRow per unique `Fecha+Juego+Edición` combination.
 */
export function pivotRecords(records: GameRecord[]): PivotRow[] {
  const rowMap = new Map<string, PivotRow>();

  for (const row of records) {
    const fecha = row.Fecha?.trim() ?? '';
    const juego = row.Juego?.trim() ?? '';
    const edicion = row['Edición (n.º)']?.trim() ?? '';
    const key = `${fecha}|${juego}|${edicion}`;

    let pivot = rowMap.get(key);
    if (!pivot) {
      pivot = {
        key,
        fecha,
        juego,
        edicion,
        winner: 'none',
        sortTimeSecs: Infinity,
      };
      rowMap.set(key, pivot);
    }

    const player = row.Jugador?.trim().toLowerCase();
    if (player === 'francisco') {
      pivot.francisco = pickLowerTime(pivot.francisco, row);
    } else if (player === 'enrique') {
      pivot.enrique = pickLowerTime(pivot.enrique, row);
    }
  }

  // Finalise derived fields (winner + sortTimeSecs) per row.
  const rows: PivotRow[] = [];
  for (const pivot of rowMap.values()) {
    pivot.winner = mapWinner(
      calculateWinner(pivot.francisco, pivot.enrique, pivot.juego),
    );
    const tF = timeToSeconds(pivot.francisco?.Tiempo);
    const tE = timeToSeconds(pivot.enrique?.Tiempo);
    pivot.sortTimeSecs = Math.min(tF, tE);
    rows.push(pivot);
  }

  return rows;
}

/**
 * Deterministically keeps the record with the lower time. When there is no
 * incumbent, the candidate wins. Ties (equal time, including both Infinity)
 * keep the incumbent, so the first-seen record is preserved on a draw.
 */
function pickLowerTime(
  current: GameRecord | undefined,
  candidate: GameRecord,
): GameRecord {
  if (!current) return candidate;
  return timeToSeconds(candidate.Tiempo) < timeToSeconds(current.Tiempo)
    ? candidate
    : current;
}

/** Maps a calculateWinner result to the observable WinnerLabel. */
function mapWinner(result: ReturnType<typeof calculateWinner>): WinnerLabel {
  switch (result) {
    case 'a':
      return 'francisco';
    case 'b':
      return 'enrique';
    case 'tie':
      return 'tie';
    default:
      return 'none';
  }
}

// ---------------------------------------------------------------------------
// sortPivotRows
// ---------------------------------------------------------------------------
/**
 * Returns a monotonically ordered permutation of `rows` by the given column.
 *
 * Rows with no finite time (`sortTimeSecs === Infinity`) are ALWAYS placed at
 * the end of the order, independently of `dir`. The remaining rows are sorted
 * by the requested column in the requested direction. Within the trailing
 * group, rows keep a deterministic order by the same column comparator.
 *
 * @param rows Pivoted rows to sort (not mutated).
 * @param col  Column to sort by.
 * @param dir  Sort direction for the finite-time group.
 */
export function sortPivotRows(
  rows: PivotRow[],
  col: PivotSortCol,
  dir: SortDir,
): PivotRow[] {
  const multiplier = dir === 'asc' ? 1 : -1;

  const finite: PivotRow[] = [];
  const infinite: PivotRow[] = [];
  for (const row of rows) {
    if (row.sortTimeSecs === Infinity) infinite.push(row);
    else finite.push(row);
  }

  const compare = (a: PivotRow, b: PivotRow): number => {
    const av = sortValue(a, col);
    const bv = sortValue(b, col);
    if (av < bv) return -multiplier;
    if (av > bv) return multiplier;
    return 0;
  };

  finite.sort(compare);
  infinite.sort(compare);

  return [...finite, ...infinite];
}

/** Comparable value of a row for a given sort column. */
function sortValue(row: PivotRow, col: PivotSortCol): string | number {
  switch (col) {
    case 'Tiempo':
      return row.sortTimeSecs;
    case 'Fecha':
      return row.fecha;
    case 'JuegoEdicion':
      return `${row.juego.toLowerCase()} ${row.edicion.padStart(6, '0')}`;
  }
}
