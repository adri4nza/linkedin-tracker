import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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
  cx, cy, topName, topValue, total,
}: {
  cx: number; cy: number; topName: string; topValue: number; total: number;
}) {
  const pct = total > 0 ? Math.round((topValue / total) * 100) : 0;
  return (
    <g>
      <text
        x={cx} y={cy - 8}
        textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '18px', fontWeight: 700, fill: '#0f172a' }}
      >
        {pct}%
      </text>
      <text
        x={cx} y={cy + 14}
        textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '11px', fill: '#64748b' }}
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

  const total    = data.reduce((s, e) => s + e.value, 0);
  const topEntry = data.reduce((a, b) => (a.value >= b.value ? a : b));

  function handleCellClick(entry: WinRateEntry) {
    setSelectedSegment((prev) =>
      prev?.name === entry.name ? null : { name: entry.name, value: entry.value },
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
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
        <div className="mb-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs text-slate-500">Seleccionado:</span>
          <span className="text-sm font-bold text-slate-800">{selectedSegment.name}</span>
          <span className="text-xs text-slate-400">—</span>
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
              className="flex items-center justify-between cursor-pointer rounded-lg px-1 py-0.5 hover:bg-slate-50 transition-colors"
              onClick={() => handleCellClick(entry)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className={`text-sm transition-colors ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                  {entry.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{entry.value} días</span>
                <span className="text-sm font-semibold text-slate-800 w-9 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
