import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Corporate Dashboard',
  '/analytics': 'Analytics',
  '/results': 'Game Results',
  '/settings': 'Settings',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = ROUTE_TITLES[pathname] ?? 'LinkedIn Tracker';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={22} className="text-slate-700 dark:text-slate-200" />
          </button>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{title}</span>
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 select-none">
          LT
        </div>
      </header>

      {/* Page content — max-w-md keeps it mobile-proportioned on larger screens */}
      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        <Outlet />
      </main>
    </div>
  );
}
