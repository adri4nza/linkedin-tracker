import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'LinkedIn Tracker' }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={22} className="text-slate-700" />
          </button>
          <span className="font-bold text-slate-800 text-base">{title}</span>
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 select-none">
          LT
        </div>
      </header>

      {/* Page content — max-w-md keeps it mobile-proportioned on larger screens */}
      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {children}
      </main>
    </div>
  );
}
