import { X, Home, TrendingUp, Trophy, Settings, Palette } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ThemeColorPanel from '../ThemeColorPanel/ThemeColorPanel';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
  { icon: Trophy, label: 'Game Results', path: '/results' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  // Dashboard uses exact match; other items use startsWith so nested routes stay highlighted
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar glass panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 flex flex-col bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-700/50 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-blue-500" />
            <span className="font-bold text-slate-800 dark:text-slate-100 text-base tracking-tight">LinkedIn Tracker</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 active:scale-95 transition-all duration-300"
            aria-label="Close menu"
          >
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => (
              <Link
                key={label}
                to={path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 ${
                  isActive(path)
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/15'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
        </nav>

        {/* Theme & Colors — collapsible quick-access section */}
        <div className="px-3 pb-4">
          <div className="border-t border-slate-200/60 dark:border-slate-700/50 pt-3">
            <details className="group">
              <summary className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer select-none text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-300 list-none">
                <div className="flex items-center gap-3">
                  <Palette size={18} />
                  <span className="text-sm font-medium">Theme &amp; Colors</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14" height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 transition-transform duration-200 group-open:rotate-180 text-slate-400"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div className="mt-2 px-3 pb-1">
                <ThemeColorPanel />
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200/60 dark:border-slate-700/50 mt-auto">
          <p className="text-xs text-slate-400 text-center">LinkedIn Games Tracker v1.0</p>
        </div>
      </aside>
    </>
  );
}
