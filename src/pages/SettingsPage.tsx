import { useState } from 'react';
import { Database, RefreshCw, Save, RotateCcw } from 'lucide-react';
import { CUSTOM_CSV_KEY, getActiveCsvUrl } from '../hooks/useGamesData';

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

  return (
    <>
      {/* Page intro */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-blue-500 font-medium">App configuration and data management.</p>
      </div>

      {/* ── Section A: Data Source ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-blue-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Data Source</h2>
          {isUsingCustom && (
            <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              Custom
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500">
          The app fetches game results from a published Google Sheets CSV. You can override the URL
          below — changes apply after reload.
        </p>

        {/* URL input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            CSV URL
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setSaved(false); }}
            spellCheck={false}
            className="w-full text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 break-all"
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
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={13} />
            Reset to default
          </button>
        </div>
      </div>

      {/* ── Section B: Cache Management ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-blue-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Cache Management</h2>
        </div>

        <p className="text-xs text-slate-500">
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
    </>
  );
}
