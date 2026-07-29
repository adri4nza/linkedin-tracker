/**
 * Maps each minigame name (exact string as stored in GameRecord.Juego) to its
 * public logo path. Paths are absolute from the web root so Vite serves them
 * directly from /public without any import overhead.
 *
 * Keys are lowercase-trimmed to match the normalisation used everywhere else
 * in the codebase (row.Juego?.trim().toLowerCase()).
 */
export const GAME_LOGOS: Record<string, string> = {
  zip:          '/zip-logo.png',
  tango:        '/tango-logo.jpg',
  queens:       '/queens-logo.png',
  'mini sudoku': '/mini_sudoku-logo.jpg',
  patches:      '/patches-logo.png',
};

/**
 * Returns the logo path for a given game name, or undefined when not found.
 * Normalises the input the same way the rest of the codebase does.
 */
export function getGameLogo(gameName: string): string | undefined {
  return GAME_LOGOS[gameName.trim().toLowerCase()];
}
