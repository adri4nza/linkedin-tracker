import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../../hooks/useDarkMode';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WinRateEntry {
  name: string;
  value: number; // absolute day count
  color: string;
}

interface DonutChartProps {
  data?: WinRateEntry[];
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const DEFAULT_DATA: WinRateEntry[] = [
  { name: 'Enrique',   value: 11, color: '#3b82f6' },
  { name: 'Francisco', value: 9,  color: '#0f172a' },
  { name: 'Empates',   value: 3,  color: '#94a3b8' },
];

// ---------------------------------------------------------------------------
// Custom centre label
// ---------------------------------------------------------------------------
function CentreLabel({
  cx, cy, topName, topValue, total, isDark,
}: {
  cx: number; cy: number; topName: string; topValue: number; total: number; isDark: boolean;
}) {
  const pct = total > 0 ? Math.round((topValue / total) * 100) : 0;
  const fillPrimary   = isDark ? '#f1f5f9' : '#0f172a'; // slate-100 vs slate-900
  const fillSecondary = isDark ? '#94a3b8' : '#64748b'; // slate-400 vs slate-500
  return (
    <g>
      <text
        x={cx} y={cy - 8}
        textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '18px', fontWeight: 700, fill: fillPrimary }}
      >
        {pct}%
      </text>
      <text
        x={cx} y={cy + 14}
        textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '11px', fill: fillSecondary }}
      >
        {topName}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DonutChart({ data = DEFAULT_DATA }: DonutChartProps) {
  const [selectedSegment, setSelectedSegment] = useState<{ name: string; value: number } | null>(null);
  const { isDark } = useDarkMode();

  const total    = data.reduce((s, e) => s + e.value, 0);
  const topEntry = data.reduce((a, b) => (a.value >= b.value ? a : b));

  function handleCellClick(entry: WinRateEntry) {
    setSelectedSegment((prev) =>
      prev?.name === entry.name ? null : { name: entry.name, value: entry.value },
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
        Days Won
      </p>

      {/* Donut */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={(props) => (
              <CentreLabel
                cx={props.cx}
                cy={props.cy}
                topName={topEntry.name}
                topValue={topEntry.value}
                total={total}
                isDark={isDark}
              />
            )}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.color}
                stroke={selectedSegment?.name === entry.name ? entry.color : 'none'}
                strokeWidth={selectedSegment?.name === entry.name ? 3 : 0}
                opacity={selectedSegment && selectedSegment.name !== entry.name ? 0.45 : 1}
                style={{ cursor: 'pointer', outline: 'none' }}
                onClick={() => handleCellClick(entry)}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Selected segment detail */}
      {selectedSegment && (
        <div className="mb-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <span className="text-xs text-slate-500 dark:text-slate-400">Seleccionado:</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedSegment.name}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
          <span className="text-sm font-semibold text-blue-600">
            {selectedSegment.value} día{selectedSegment.value !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-slate-400">
            ({total > 0 ? Math.round((selectedSegment.value / total) * 100) : 0}%)
          </span>
          <button
            onClick={() => setSelectedSegment(null)}
            className="ml-1 text-slate-300 hover:text-slate-500 transition-colors text-xs leading-none"
            aria-label="Clear selection"
          >
            ✕
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 space-y-2">
        {data.map((entry) => {
          const pct        = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          const isSelected = selectedSegment?.name === entry.name;
          return (
            <div
              key={entry.name}
              className="flex items-center justify-between cursor-pointer rounded-lg px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              onClick={() => handleCellClick(entry)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className={`text-sm transition-colors ${isSelected ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                  {entry.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">{entry.value} días</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 w-9 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
