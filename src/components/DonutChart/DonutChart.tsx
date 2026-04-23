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
  breakdown?: Record<string, string[]>;
}

interface DonutChartProps {
  data?: WinRateEntry[];
  onDateSelect?: (date: string) => void;
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
// Helpers
// ---------------------------------------------------------------------------
function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

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
export default function DonutChart({ data = DEFAULT_DATA, onDateSelect }: DonutChartProps) {
  const [selectedSegment, setSelectedSegment] = useState<{ name: string; value: number; breakdown?: Record<string, string[]> } | null>(null);
  const [selectedScore, setSelectedScore] = useState<string | null>(null);
  const { isDark } = useDarkMode();

  const total    = data.reduce((s, e) => s + e.value, 0);
  const topEntry = data.reduce((a, b) => (a.value >= b.value ? a : b));

  function handleCellClick(entry: WinRateEntry) {
    setSelectedSegment((prev) =>
      prev?.name === entry.name ? null : { name: entry.name, value: entry.value, breakdown: entry.breakdown },
    );
    setSelectedScore(null);
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
      <div className="mb-3 flex flex-col items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2">
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
              onClick={() => { setSelectedSegment(null); setSelectedScore(null); }}
              className="ml-1 text-slate-300 hover:text-slate-500 transition-colors text-xs leading-none"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>
          {selectedSegment.breakdown && Object.keys(selectedSegment.breakdown).length > 0 && (
            <div className="pt-1 border-t border-slate-200 dark:border-slate-600 w-full">
              {!selectedScore ? (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {Object.entries(selectedSegment.breakdown)
                    .sort(([a], [b]) => Number(b.split('-')[0]) - Number(a.split('-')[0]))
                    .map(([score, dates]) => (
                      <button
                        key={score}
                        onClick={() => setSelectedScore(score)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                      >
                        <span className="font-bold">{score}</span>
                        <span className="text-slate-400 dark:text-slate-500">×{dates.length}</span>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedScore(null)}
                    className="self-start text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    ← Volver
                  </button>
                  <div className="max-h-32 overflow-y-auto flex flex-wrap gap-1.5">
                    {(selectedSegment.breakdown[selectedScore] ?? []).map((fecha) => (
                      <button
                        key={fecha}
                        onClick={() => onDateSelect?.(fecha)}
                        className="px-2 py-0.5 rounded-md text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors font-medium"
                      >
                        {formatDateShort(fecha)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
