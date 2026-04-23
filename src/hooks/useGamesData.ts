import { useState, useEffect } from 'react';
import Papa from 'papaparse';

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
}

interface UseGamesDataResult {
  data: GameRecord[];
  isLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGamesData(csvUrl: string): UseGamesDataResult {
  const [data, setData] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!csvUrl) {
      setError('No CSV URL provided.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    Papa.parse<GameRecord>(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.errors.length > 0) {
          setError(results.errors.map((e) => e.message).join('; '));
        } else {
          setData(results.data);
        }
        setIsLoading(false);
      },
      error(err) {
        setError(err.message);
        setIsLoading(false);
      },
    });
  }, [csvUrl]);

  return { data, isLoading, error };
}
