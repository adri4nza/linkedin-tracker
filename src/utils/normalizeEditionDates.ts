import type { GameRecord } from '../hooks/useGamesData';

/**
 * Normalises the `Fecha` of every `GameRecord` so that all records belonging
 * to the same game edition share the same date: the **earliest valid date**
 * found among that edition's records.
 *
 * # Why this is needed
 * Players sometimes complete a LinkedIn minigame after midnight, so their
 * record lands on the calendar day after the edition was published. When both
 * records of the same edition carry different dates, every grouping downstream
 * (dayWins, gameHeatmap, analyticsStats) treats them as two unrelated events —
 * one player appears alone each day, which triggers the "excluded" rule or
 * produces a forfeit win. This pre-processing step unifies them before any
 * aggregation runs.
 *
 * # Grouping key
 * `Juego + Edición (n.º)` — case/whitespace normalised.
 *
 * # Precautions
 * 1. **Invalid / empty dates**: a record whose `Fecha` is absent or does not
 *    match `YYYY-MM-DD` is excluded from the minimum calculation so it cannot
 *    corrupt the result. It still receives the minimum date of its group if
 *    other valid records exist; otherwise its original (possibly empty) `Fecha`
 *    is left untouched.
 * 2. **Empty edition**: records without a non-empty `Edición (n.º)` are
 *    returned as-is — their `Fecha` is never altered. There is nothing to
 *    group them with, so changing their date would be wrong.
 * 3. **Immutability**: the input array is not mutated. Each modified record is
 *    a shallow copy (`{ ...record, Fecha: minDate }`).
 * 4. **Idempotency**: running the function twice on the same data produces the
 *    same result as running it once.
 *
 * @param data Raw `GameRecord[]` as returned by PapaParse (post-enrichment).
 * @returns New array with normalised `Fecha` values.
 */
export function normalizeEditionDates(data: GameRecord[]): GameRecord[] {
  if (!data.length) return data;

  // ISO date regex — accepts YYYY-MM-DD only.
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  // ── Pass 1: build a map of (juego|edicion) → minimum valid date ──────────
  const minDateByEdition = new Map<string, string>();

  for (const row of data) {
    const edicion = row['Edición (n.º)']?.trim() ?? '';
    // Precaution 2: skip records without an edition number.
    if (!edicion) continue;

    const juego = row.Juego?.trim() ?? '';
    const fecha = row.Fecha?.trim() ?? '';
    // Precaution 1: skip records with missing or malformed dates.
    if (!ISO_DATE.test(fecha)) continue;

    const key = `${juego.toLowerCase()}|${edicion}`;
    const current = minDateByEdition.get(key);
    if (!current || fecha < current) {
      // ISO lexicographic order is identical to chronological order for
      // well-formed YYYY-MM-DD strings, so a simple string comparison suffices.
      minDateByEdition.set(key, fecha);
    }
  }

  // ── Pass 2: rewrite Fecha where it differs from the group minimum ─────────
  return data.map((row) => {
    const edicion = row['Edición (n.º)']?.trim() ?? '';
    // Precaution 2: no edition → return untouched.
    if (!edicion) return row;

    const juego   = row.Juego?.trim() ?? '';
    const key     = `${juego.toLowerCase()}|${edicion}`;
    const minDate = minDateByEdition.get(key);

    // No valid date found for this group (all records had bad dates) →
    // leave the record untouched rather than assigning an empty string.
    if (!minDate) return row;

    // Only create a new object when the date actually changes (avoids
    // unnecessary re-renders for records that were already correct).
    if (row.Fecha?.trim() === minDate) return row;

    return { ...row, Fecha: minDate };
  });
}
