import { useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'PLAYER_COLOURS';

export const TIE_COLOUR = '#94a3b8';

export const PLAYER_COLOUR_DEFAULTS = {
  francisco: '#3b82f6',
  enrique:   '#ef4444',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PlayerColors {
  francisco: string;
  enrique:   string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
function readFromStorage(): PlayerColors {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Partial<PlayerColors>) : {};
    return { ...PLAYER_COLOUR_DEFAULTS, ...parsed };
  } catch {
    return { ...PLAYER_COLOUR_DEFAULTS };
  }
}

/**
 * Provides the current player color palette (read from localStorage) and an
 * updateColors function that persists changes. The tie color is always #94a3b8
 * and is not configurable.
 *
 * Color changes take full effect on the next page load (same pattern as the
 * CSV URL setting). Call window.location.reload() after updateColors() to
 * apply immediately.
 */
export function usePlayerColors() {
  const colors = useMemo<PlayerColors>(readFromStorage, []);

  const updateColors = useCallback((next: Partial<PlayerColors>) => {
    const current = readFromStorage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }));
  }, []);

  return { colors, updateColors };
}
