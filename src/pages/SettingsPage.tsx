import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <Settings size={40} className="text-slate-300" />
      <h1 className="text-lg font-bold text-slate-700">Settings</h1>
      <p className="text-sm text-slate-400">App configuration — coming soon.</p>
    </div>
  );
}
