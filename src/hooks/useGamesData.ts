import { useReducer, useEffect } from 'react';
import Papa from 'papaparse';
import { extractRetrocesos } from '../utils/timeUtils';
import { normalizeEditionDates } from '../utils/normalizeEditionDates';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const CUSTOM_CSV_KEY = 'CUSTOM_CSV_URL';

/**
 * Returns the active CSV URL:
 * 1. localStorage override (CUSTOM_CSV_URL)
 * 2. env var VITE_CSV_URL
 *
 * Appends a cache-busting `t` param so browsers never serve a stale response.
 */
export function getActiveCsvUrl(): string {
  const base =
    (typeof localStorage !== 'undefined' && localStorage.getItem(CUSTOM_CSV_KEY)) ||
    (import.meta.env.VITE_CSV_URL as string | undefined) ||
    '';
  if (!base) return '';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}t=${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface GameRecord {
  Fecha: string;
  Jugador: string;
  Juego: string;
  'Edición (n.º)': string;
  Tiempo: string;
  'Top Ranking (%)': string;
  'Sin Fallos': string;
  'Pistas/Notas': string;
  'Mensaje Original': string;
  /**
   * Backtrack count for the 'Zip' game. NOT a CSV column — it is derived
   * on-the-fly client-side in `useGamesData` from 'Mensaje Original'.
   * `null` = unknown/unparsed (and never awarded the ✨ star).
   */
  Retrocesos?: number | null;
}

export interface UseGamesDataResult {
  data: GameRecord[];
  isLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Reducer — keeps all state transitions in one place so the effect only ever
// dispatches from async callbacks, never synchronously in its own body.
// ---------------------------------------------------------------------------
type Action =
  | { type: 'success'; payload: GameRecord[] }
  | { type: 'failure'; payload: string }
  | { type: 'no_url' };

function reducer(_state: UseGamesDataResult, action: Action): UseGamesDataResult {
  switch (action.type) {
    case 'success':
      return { data: action.payload, isLoading: false, error: null };
    case 'failure':
      return { data: [], isLoading: false, error: action.payload };
    case 'no_url':
      return { data: [], isLoading: false, error: 'No CSV URL provided.' };
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGamesData(csvUrl: string): UseGamesDataResult {
  const [state, dispatch] = useReducer(
    reducer,
    // Initial state: loading if we have a URL, error if we don't.
    csvUrl
      ? { data: [], isLoading: true, error: null }
      : { data: [], isLoading: false, error: 'No CSV URL provided.' },
  );

  useEffect(() => {
    // No URL → dispatch from inside the effect but only when csvUrl changes,
    // which avoids synchronous setState on every render.
    if (!csvUrl) {
      dispatch({ type: 'no_url' });
      return;
    }

    // PapaParse dispatches only from async callbacks — no synchronous setState.
    Papa.parse<GameRecord>(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.errors.length > 0) {
          dispatch({
            type: 'failure',
            payload: results.errors.map((e) => e.message).join('; '),
          });
        } else {
          // Step 1 — Enrich: derive Zip 'Retrocesos' from 'Mensaje Original'.
          const enriched = results.data.map((row) =>
            row.Juego?.trim().toLowerCase() === 'zip'
              ? { ...row, Retrocesos: extractRetrocesos(row['Mensaje Original']) }
              : row,
          );
          // Step 2 — Normalise: unify dates for same-edition records so that
          // a player who completed a game after midnight (next calendar day)
          // is still compared against the other player on the correct date.
          const normalized = normalizeEditionDates(enriched);
          dispatch({ type: 'success', payload: normalized });
        }
      },
      error(err) {
        dispatch({ type: 'failure', payload: err.message });
      },
    });
  }, [csvUrl]);

  return state;
}
