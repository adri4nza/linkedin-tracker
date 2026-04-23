import { useState } from 'react';
import { Database, RefreshCw, Save, RotateCcw, Palette, Moon } from 'lucide-react';
import { CUSTOM_CSV_KEY, getActiveCsvUrl } from '../hooks/useGamesData';
import { usePlayerColors, TIE_COLOUR } from '../hooks/usePlayerColors';
import { useDarkMode } from '../hooks/useDarkMode';

const ENV_URL: string = (import.meta.env.VITE_CSV_URL as string | undefined) ?? '';

/** Strip the cache-busting `t=` param so the input shows a clean URL. */
function stripCacheBuster(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete('t');
    return u.toString();
  } catch {
    return url;
  }
}

export default function SettingsPage() {
  const [urlInput, setUrlInput] = useState(() =>
    stripCacheBuster(getActiveCsvUrl()),
  );
  const [saved, setSaved] = useState(false);

  const { colors, updateColors } = usePlayerColors();
  const [colorInputs, setColorInputs] = useState({ ...colors });
  const [colorsSaved, setColorsSaved] = useState(false);

  const { isDark, toggleDarkMode } = useDarkMode();

  const isUsingCustom = Boolean(localStorage.getItem(CUSTOM_CSV_KEY));

  function handleSave() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    localStorage.setItem(CUSTOM_CSV_KEY, trimmed);
    setSaved(true);
    setTimeout(() => window.location.reload(), 800);
  }

  function handleReset() {
    localStorage.removeItem(CUSTOM_CSV_KEY);
    setUrlInput(ENV_URL);
    window.location.reload();
  }

  function handleForceRefresh() {
    window.location.reload();
  }

  function handleSaveColors() {
    updateColors(colorInputs);
    setColorsSaved(true);
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <>
      {/* Page intro */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-blue-500 font-medium">App configuration and data management.</p>
      </div>

      {/* ── Section A: Data Source ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-blue-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Data Source</h2>
          {isUsingCustom && (
            <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              Custom
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          The app fetches game results from a published Google Sheets CSV. You can override the URL
          below — changes apply after reload.
        </p>

        {/* URL input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            CSV URL
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setSaved(false); }}
            spellCheck={false}
            className="w-full text-xs font-mono text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 break-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={13} />
            {saved ? 'Saved — reloading…' : 'Save URL'}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw size={13} />
            Reset to default
          </button>
        </div>
      </div>

      {/* ── Section B: Cache Management ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-blue-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Cache Management</h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Google Sheets can take up to 5 minutes to publish the latest entries. Use the button
          below to force a clean download, bypassing any browser cache.
        </p>

        <button
          onClick={handleForceRefresh}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={13} />
          Force Refresh Data
        </button>
      </div>

      {/* ── Section C: Theme & Colors ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-blue-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Theme &amp; Colors</h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize the highlight color for each player. Changes apply after saving.
        </p>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Moon size={15} className="text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
          </div>
          <button
            role="switch"
            aria-checked={isDark}
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              isDark ? 'bg-blue-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <hr className="border-slate-100 dark:border-slate-700" />

        <div className="space-y-3">
          {(
            [{ label: 'Francisco', key: 'francisco' }, { label: 'Enrique', key: 'enrique' }] as const
          ).map(({ label, key }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  {colorInputs[key].toUpperCase()}
                </span>
                <input
                  type="color"
                  value={colorInputs[key]}
                  onChange={(e) => {
                    setColorInputs((prev) => ({ ...prev, [key]: e.target.value }));
                    setColorsSaved(false);
                  }}
                  className="w-10 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                />
              </div>
            </div>
          ))}

          {/* Tie color — read-only */}
          <div className="flex items-center justify-between opacity-50">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-400">Empates</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{TIE_COLOUR.toUpperCase()}</span>
              <div
                className="w-10 h-8 rounded-lg border border-slate-200"
                style={{ backgroundColor: TIE_COLOUR }}
                title="Fixed — not configurable"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveColors}
          disabled={colorsSaved}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={13} />
          {colorsSaved ? 'Saved — reloading…' : 'Save Colors'}
        </button>
      </div>
    </>
  );
}
