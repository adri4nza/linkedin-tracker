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
  onScoreSelect?: (player: string, playerColor: string, score: string, dates: string[]) => void;
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
  const fillPrimary   = isDark ? '#f1f5f9' : '#0f172a';
  const fillSecondary = isDark ? '#94a3b8' : '#64748b';
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
export default function DonutChart({ data = DEFAULT_DATA, onScoreSelect }: DonutChartProps) {
  const [selectedSegment, setSelectedSegment] = useState<{
    name: string;
    value: number;
    color: string;
    breakdown?: Record<string, string[]>;
  } | null>(null);
  const { isDark } = useDarkMode();

  const total    = data.reduce((s, e) => s + e.value, 0);
  const topEntry = data.reduce((a, b) => (a.value >= b.value ? a : b));

  function handleCellClick(entry: WinRateEntry) {
    setSelectedSegment((prev) =>
      prev?.name === entry.name
        ? null
        : { name: entry.name, value: entry.value, color: entry.color, breakdown: entry.breakdown },
    );
  }

  function handleScorePillClick(score: string) {
    if (!selectedSegment?.breakdown) return;
    const dates = [...(selectedSegment.breakdown[score] ?? [])]
      .sort((a, b) => b.localeCompare(a)); // newest first (ISO lexicographic = chronological)
    onScoreSelect?.(selectedSegment.name, selectedSegment.color, score, dates);
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/50 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Days Won
        </p>
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
          {total} días
        </span>
      </div>

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

      {/* Score pills — shown when a segment is selected */}
      {selectedSegment?.breakdown && Object.keys(selectedSegment.breakdown).length > 0 && (
        <div className="mb-3 px-2 py-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedSegment.color }}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {selectedSegment.name}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                · {selectedSegment.value} día{selectedSegment.value !== 1 ? 's' : ''}
                {' '}({total > 0 ? Math.round((selectedSegment.value / total) * 100) : 0}%)
              </span>
            </div>
            <button
              onClick={() => setSelectedSegment(null)}
              className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 active:scale-95 transition-all duration-200"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>

          {/* Score pills — each opens the ScoreBreakdownDrawer */}
          <div className="flex flex-wrap justify-center gap-1.5 px-1">
            {Object.entries(selectedSegment.breakdown)
              .sort(([a], [b]) => Number(b.split('-')[0]) - Number(a.split('-')[0]))
              .map(([score, dates]) => (
                <button
                  key={score}
                  onClick={() => handleScorePillClick(score)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                             bg-white/70 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600/50
                             text-slate-700 dark:text-slate-200
                             hover:border-slate-300 dark:hover:border-slate-500
                             active:scale-95 transition-all duration-200 shadow-sm"
                >
                  <span>{score}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: selectedSegment.color + '20',
                      color: selectedSegment.color,
                    }}
                  >
                    ×{dates.length}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 space-y-1">
        {data.map((entry) => {
          const pct        = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          const isSelected = selectedSegment?.name === entry.name;
          return (
            <div
              key={entry.name}
              className="flex items-center justify-between cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 active:scale-[0.98] transition-all duration-300"
              onClick={() => handleCellClick(entry)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
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
