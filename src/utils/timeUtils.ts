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
 *
 * NOTE: No longer used as a head-to-head tiebreaker (see calculateWinner).
 * Kept for any informational display needs.
 */
export function isFlawless(val: string | undefined): boolean {
  return ['true', 'yes', '1'].includes(val?.trim().toLowerCase() ?? '');
}

/**
 * Extracts the Zip 'Retrocesos' (backtracks) count on-the-fly from the raw
 * LinkedIn message text (the 'Mensaje Original' CSV column). Runs client-side
 * so no Google Sheet migration is required.
 *
 * Returns:
 *   0    → perfect run: text explicitly states "no backtracks" / "sin retrocesos".
 *   N    → explicit number, singular or plural, ES/EN (e.g. "1 retroceso", "2 backtracks").
 *   null → UNKNOWN. No reliable signal in the text, so we do NOT assume 0.
 *          This prevents awarding the ✨ (star) to mis-parsed or legacy records.
 *
 * Order matters: perfect-run phrases are checked before the numeric regex so a
 * "sin retrocesos" never falls through to the unknown branch.
 */
export function extractRetrocesos(text?: string | null): number | null {
  if (!text) return null;

  // 1. Perfect runs → explicit 0
  if (/no\s+backtracks|sin\s+retrocesos/i.test(text)) return 0;

  // 2. Explicit number (singular/plural, both languages)
  const numeric = text.match(/(\d+)\s*(?:retroceso|retrocesos|backtrack|backtracks)/i);
  if (numeric) return parseInt(numeric[1], 10);

  // 3. Unknown — no reliable signal
  return null;
}

// ---------------------------------------------------------------------------
// Head-to-Head
// ---------------------------------------------------------------------------
interface HeadToHeadRecord {
  Tiempo?: string | null;
  /** Pre-computed backtrack count (client-side); null = unknown. */
  Retrocesos?: number | null;
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
 * 3. Exact-time tie:
 *    - For 'Zip' only: fewer 'Retrocesos' (backtracks) wins. Equal count, or
 *      an unknown count on either side (null), → 'tie'.
 *    - For every other game: always 'tie' (no point awarded).
 * 4. Both times Infinity → null (no contest, match not counted).
 *
 * @param gameName Name of the mini-game; drives the Zip-only tiebreaker.
 */
export function calculateWinner(
  recA: HeadToHeadRecord | undefined,
  recB: HeadToHeadRecord | undefined,
  gameName: string,
): MatchResult {
  const tA = timeToSeconds(recA?.Tiempo);
  const tB = timeToSeconds(recB?.Tiempo);

  if (!isFinite(tA) && !isFinite(tB)) return null;
  if (!isFinite(tA)) return 'b';
  if (!isFinite(tB)) return 'a';

  if (tA < tB) return 'a';
  if (tB < tA) return 'b';

  // Exact tie — Zip-only retrocesos tiebreaker (fewer backtracks wins).
  // Only decisive when BOTH counts are known; an unknown (null) yields a tie.
  if (gameName.trim().toLowerCase() === 'zip') {
    const rA = recA?.Retrocesos ?? null;
    const rB = recB?.Retrocesos ?? null;
    if (rA != null && rB != null) {
      if (rA < rB) return 'a';
      if (rB < rA) return 'b';
    }
  }

  return 'tie';
}
