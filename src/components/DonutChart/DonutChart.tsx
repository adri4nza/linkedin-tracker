import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WinRateEntry {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data?: WinRateEntry[];
  /** Name of the leading player shown in the centre label */
  leader?: string;
}

// ---------------------------------------------------------------------------
// Defaults — 55% Enrique vs 45% Francisco
// ---------------------------------------------------------------------------
const DEFAULT_DATA: WinRateEntry[] = [
  { name: 'Enrique', value: 55, color: '#3b82f6' },
  { name: 'Francisco', value: 45, color: '#0f172a' },
];

// ---------------------------------------------------------------------------
// Custom centre label rendered as SVG
// ---------------------------------------------------------------------------
function CentreLabel({ cx, cy, leader, value }: { cx: number; cy: number; leader: string; value: number }) {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '18px', fontWeight: 700, fill: '#0f172a' }}>
        {value}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '11px', fill: '#64748b' }}>
        {leader}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DonutChart({ data = DEFAULT_DATA, leader }: DonutChartProps) {
  const topEntry = data.reduce((a, b) => (a.value >= b.value ? a : b));
  const displayLeader = leader ?? topEntry.name;
  const displayValue = topEntry.value;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
        Global Win Rate
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
                leader={displayLeader}
                value={displayValue}
              />
            )}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-2 space-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-600">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
