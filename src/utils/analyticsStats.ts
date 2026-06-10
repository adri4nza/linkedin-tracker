import type { GameRecord } from '../hooks/useGamesData';
import { timeToSeconds, secondsToTime, calculateWinner } from './timeUtils';

// ---------------------------------------------------------------------------
// Argument-order convention (IMPORTANT)
// ---------------------------------------------------------------------------
// `calculateWinner(recA, recB, gameName)` returns 'a' | 'b' | 'tie' | null and
// the meaning of 'a'/'b' depends ENTIRELY on the argument order at the call
// site. This module faithfully preserves the convention that the AnalyticsPage
// `stats` useMemo has ALWAYS used, to guarantee the metrics produce the EXACT
// same numbers after the extraction:
//
//     calculateWinner(enrique, francisco, juego)
//       → 'a' = Enrique wins   → enriqueWins++
//       → 'b' = Francisco wins → franciscoWins++
//       → 'tie' | null         → not counted as a win for either player
//
// NOTE: this is the OPPOSITE order from `dayWins.ts` / `gameHeatmap.ts`
// (Francisco-first). It is kept INTENTIONALLY because changing it here would
// silently swap the win totals shown by AnalyticsPage. `calculateWinner`
// already resolves victory-by-forfeit/no-show, so a day where only one player
// has a finite time still counts as that player's win.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
/**
 * Shape returned by the AnalyticsPage metrics pipeline. Matches EXACTLY the
 * object previously produced by the inline `stats` useMemo in AnalyticsPage.
 */
export interface GameStats {
  worldRecord: { time: string; player: string };
  /** Per-player world record (best finite time), formatted; null if none. */
  worldRecordByPlayer: { francisco: string | null; enrique: string | null };
  avgOverall: string;
  avgFrancisco: string;
  avgEnrique: string;
  enriqueWins: number;
  franciscoWins: number;
  chartData: Array<{ date: string; francisco?: number; enrique?: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Converts an ISO date (`YYYY-MM-DD`) into the short chart label used by the
 * TrendChart (e.g. `2025-03-07` → `Mar 7`). Extracted here so the metrics
 * pipeline does not depend on AnalyticsPage.
 */
export function isoToChartDate(iso: string): string {
  const [, month, day] = iso.split('-').map(Number);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[month - 1]} ${day}`;
}

/** Mean of the finite times (in seconds) of the given records; Infinity if none. */
function avgSecs(records: GameRecord[]): number {
  const times = records.map((r) => timeToSeconds(r.Tiempo)).filter((t) => isFinite(t));
  return times.length ? times.reduce((a, b) => a + b, 0) / times.length : Infinity;
}

/** Lowest finite time (in seconds) among the given records; Infinity if none. */
function minSecs(records: GameRecord[]): number {
  let best = Infinity;
  for (const r of records) {
    const secs = timeToSeconds(r.Tiempo);
    if (isFinite(secs) && secs < best) best = secs;
  }
  return best;
}

// ---------------------------------------------------------------------------
// computeGameStats
// ---------------------------------------------------------------------------
/**
 * Computes the four AnalyticsPage metrics (World Record, Average Time, Total
 * Wins, TrendChart series) for a SINGLE mini-game.
 *
 * `records` MUST already be filtered by game + time range by the caller (the
 * page keeps that responsibility). `game` is forwarded to `calculateWinner` so
 * the Zip-only retrocesos tiebreaker keeps working.
 *
 * This is a 1:1 extraction of the previous inline `stats` useMemo in
 * AnalyticsPage and produces identical results:
 *   - World Record: the record with the lowest `timeToSeconds(Tiempo)`.
 *   - Average Time: overall + per-player mean of finite times (`secondsToTime`).
 *   - Total Wins: group by date, resolve `calculateWinner(enrique, francisco,
 *     game)` ('a' → enrique, 'b' → francisco), accumulate.
 *   - chartData: one point per date, chronologically sorted, with each player's
 *     time in seconds (`undefined` when that player has no record that day).
 *
 * @returns GameStats, or `null` when there are no records.
 */
export function computeGameStats(records: GameRecord[], game: string): GameStats | null {
  if (!records.length) return null;

  // World record: entry with the lowest time.
  let wrRecord: GameRecord = records[0];
  for (const row of records) {
    if (timeToSeconds(row.Tiempo) < timeToSeconds(wrRecord.Tiempo)) wrRecord = row;
  }

  // Per-player record subsets.
  const byPlayer = (name: string) =>
    records.filter((r) => r.Jugador?.trim().toLowerCase() === name);

  const enriqueRecords = byPlayer('enrique');
  const franciscoRecords = byPlayer('francisco');

  // Overall average across all records.
  const allTimes = records.map((r) => timeToSeconds(r.Tiempo)).filter((t) => isFinite(t));
  const avgOverall = allTimes.length ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : Infinity;

  // Group by date to compare players head-to-head.
  const dateMap = new Map<string, { enrique?: GameRecord; francisco?: GameRecord }>();
  for (const row of records) {
    const date = row.Fecha?.trim() ?? '';
    const player = row.Jugador?.trim().toLowerCase();
    if (!dateMap.has(date)) dateMap.set(date, {});
    const entry = dateMap.get(date)!;
    if (player === 'enrique') entry.enrique = row;
    else if (player === 'francisco') entry.francisco = row;
  }

  let enriqueWins = 0;
  let franciscoWins = 0;
  for (const { enrique, francisco } of dateMap.values()) {
    const result = calculateWinner(enrique, francisco, game);
    if (result === 'a') enriqueWins++;
    else if (result === 'b') franciscoWins++;
  }

  // Chart data sorted chronologically.
  const chartData = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { enrique, francisco }]) => ({
      date: isoToChartDate(date),
      francisco: francisco ? timeToSeconds(francisco.Tiempo) : undefined,
      enrique: enrique ? timeToSeconds(enrique.Tiempo) : undefined,
    }));

  return {
    worldRecord: {
      time: secondsToTime(timeToSeconds(wrRecord.Tiempo)),
      player: wrRecord.Jugador?.trim() ?? '—',
    },
    worldRecordByPlayer: {
      francisco: isFinite(minSecs(franciscoRecords)) ? secondsToTime(minSecs(franciscoRecords)) : null,
      enrique: isFinite(minSecs(enriqueRecords)) ? secondsToTime(minSecs(enriqueRecords)) : null,
    },
    avgOverall: secondsToTime(avgOverall),
    avgFrancisco: secondsToTime(avgSecs(franciscoRecords)),
    avgEnrique: secondsToTime(avgSecs(enriqueRecords)),
    enriqueWins,
    franciscoWins,
    chartData,
  };
}
