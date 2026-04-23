/**
 * Converts a 'M:SS' or 'MM:SS' time string to total seconds.
 * Returns Infinity for null, undefined, empty strings, or invalid formats.
 */
export function timeToSeconds(time?: string | null): number {
  if (!time || time.trim() === '') return Infinity;
  const [m, s] = time.trim().split(':').map(Number);
  if (isNaN(m) || isNaN(s)) return Infinity;
  return m * 60 + s;
}

/**
 * Converts total seconds to a 'M:SS' display string.
 * Returns '—' for non-finite or negative values.
 */
export function secondsToTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '—';
  const total = Math.round(secs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Evaluates whether a 'Sin Fallos' CSV value represents a flawless run.
 * Accepts: 'TRUE', 'true', 'Yes', 'yes', '1'.
 */
export function isFlawless(val: string | undefined): boolean {
  return ['true', 'yes', '1'].includes(val?.trim().toLowerCase() ?? '');
}

// ---------------------------------------------------------------------------
// Head-to-Head
// ---------------------------------------------------------------------------
interface HeadToHeadRecord {
  Tiempo?: string | null;
  'Sin Fallos'?: string | null;
}

/** 'a' = first player wins, 'b' = second wins, 'tie' = draw, null = no contest */
export type MatchResult = 'a' | 'b' | 'tie' | null;

/**
 * Determines the winner of a head-to-head matchup.
 *
 * Rules (in order):
 * 1. Lower time wins (primary criterion).
 * 2. Victory by forfeit: if one player's time is Infinity/missing and the
 *    other's is valid, the valid player wins automatically.
 * 3. Exact-time tie → flawless tiebreaker: flawless player wins.
 *    Both/neither flawless → 'tie' (no point awarded).
 * 4. Both times Infinity → null (no contest, match not counted).
 */
export function calculateWinner(
  recA: HeadToHeadRecord | undefined,
  recB: HeadToHeadRecord | undefined,
): MatchResult {
  const tA = timeToSeconds(recA?.Tiempo);
  const tB = timeToSeconds(recB?.Tiempo);

  if (!isFinite(tA) && !isFinite(tB)) return null;
  if (!isFinite(tA)) return 'b';
  if (!isFinite(tB)) return 'a';

  if (tA < tB) return 'a';
  if (tB < tA) return 'b';

  // Exact tie — flawless tiebreaker
  const fA = isFlawless(recA?.['Sin Fallos'] ?? undefined);
  const fB = isFlawless(recB?.['Sin Fallos'] ?? undefined);
  if (fA && !fB) return 'a';
  if (fB && !fA) return 'b';
  return 'tie';
}
