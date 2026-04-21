/**
 * Converts a 'M:SS' or 'MM:SS' time string to total seconds.
 * Returns Infinity if the format is invalid (no winner for that entry).
 */
export function timeToSeconds(time: string): number {
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
