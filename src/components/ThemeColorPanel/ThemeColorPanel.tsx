/**
 * ThemeColorPanel — reusable inline section for dark-mode toggle + player
 * colour pickers. Used in both the Sidebar (quick access) and SettingsPage.
 *
 * Presentation is intentionally compact so it fits inside the Sidebar without
 * scrolling. SettingsPage wraps it inside its own card with extra padding and
 * a description text.
 */
import { useState } from 'react';
import { Moon, Save } from 'lucide-react';
import { usePlayerColors, TIE_COLOUR } from '../../hooks/usePlayerColors';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function ThemeColorPanel() {
  const { colors, updateColors } = usePlayerColors();
  const [colorInputs, setColorInputs] = useState({ ...colors });
  const [colorsSaved, setColorsSaved] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();

  function handleSaveColors() {
    updateColors(colorInputs);
    setColorsSaved(true);
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <div className="space-y-3">
      {/* Dark mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
        </div>
        <button
          role="switch"
          aria-checked={isDark}
          onClick={toggleDarkMode}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            isDark ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isDark ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <hr className="border-slate-200/60 dark:border-slate-700/50" />

      {/* Player colour pickers */}
      {(
        [{ label: 'Francisco', key: 'francisco' }, { label: 'Enrique', key: 'enrique' }] as const
      ).map(({ label, key }) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
              {colorInputs[key].toUpperCase()}
            </span>
            <input
              type="color"
              value={colorInputs[key]}
              onChange={(e) => {
                setColorInputs((prev) => ({ ...prev, [key]: e.target.value }));
                setColorsSaved(false);
              }}
              className="w-8 h-7 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
            />
          </div>
        </div>
      ))}

      {/* Tie colour — read-only */}
      <div className="flex items-center justify-between opacity-50">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-400">Empates</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 tabular-nums">{TIE_COLOUR.toUpperCase()}</span>
          <div
            className="w-8 h-7 rounded-lg border border-slate-200 dark:border-slate-700"
            style={{ backgroundColor: TIE_COLOUR }}
            title="Fixed — not configurable"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSaveColors}
        disabled={colorsSaved}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-300 shadow-sm hover:shadow-[0_0_14px_-2px_rgba(59,130,246,0.5)]"
      >
        <Save size={12} />
        {colorsSaved ? 'Saved — reloading…' : 'Save Colors'}
      </button>
    </div>
  );
}
