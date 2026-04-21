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
 * Evaluates whether a 'Sin Fallos' CSV value represents a flawless run.
 * Accepts: 'TRUE', 'true', 'Yes', 'yes', '1'.
 */
export function isFlawless(val: string | undefined): boolean {
  return ['true', 'yes', '1'].includes(val?.trim().toLowerCase() ?? '');
}
