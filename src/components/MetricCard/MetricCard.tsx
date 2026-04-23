import type { ReactNode } from 'react';

export interface SubItem {
  name: string;
  value: string;
  /** Dot colour variant */
  variant?: 'dark' | 'blue';
}

export interface MetricCardProps {
  /** All-caps label shown above the main value */
  label: string;
  /** Primary large value (e.g. "1:12", "1,204") */
  value: string;
  /** Optional icon displayed next to the label */
  icon?: ReactNode;
  /** Optional badge text (e.g. "New") */
  badge?: string;
  /** "Held by ..." subtitle */
  heldBy?: string;
  /** Per-player breakdown rows */
  subItems?: SubItem[];
  /** Green positive trend line (e.g. "+12% vs last month") */
  trend?: string;
}

export default function MetricCard({
  label,
  value,
  icon,
  badge,
  heldBy,
  subItems,
  trend,
}: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {label}
          </span>
        </div>
        {badge && (
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {/* Main value */}
      <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{value}</p>

      {/* "Held by" subtitle */}
      {heldBy && (
        <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
          Held by <span className="font-semibold text-slate-700 dark:text-slate-200">{heldBy}</span>
        </p>
      )}

      {/* Trend indicator */}
      {trend && (
        <p className="flex items-center gap-1 text-sm text-emerald-600 font-semibold mt-1.5">
          <span>↑</span>
          {trend}
        </p>
      )}

      {/* Per-player sub-items */}
      {subItems && subItems.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {subItems.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    item.variant === 'blue' ? 'bg-blue-500' : 'bg-slate-900 dark:bg-slate-200'
                  }`}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
