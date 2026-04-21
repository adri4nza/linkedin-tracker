import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';

// ---------------------------------------------------------------------------
// Simulated dataset — Queens completion times in seconds (Oct 1 – Oct 14)
// Francisco improves (↓), Enrique regresses (↑)
// ---------------------------------------------------------------------------
const chartData = [
  { date: 'Oct 1', francisco: 92, enrique: 88 },
  { date: 'Oct 2', francisco: 88, enrique: 93 },
  { date: 'Oct 3', francisco: 85, enrique: 98 },
  { date: 'Oct 4', francisco: 82, enrique: 102 },
  { date: 'Oct 5', francisco: 79, enrique: 106 },
  { date: 'Oct 6', francisco: 76, enrique: 109 },
  { date: 'Oct 7', francisco: 74, enrique: 112 },
  { date: 'Oct 8', francisco: 72, enrique: 114 },
  { date: 'Oct 9', francisco: 70, enrique: 116 },
  { date: 'Oct 10', francisco: 68, enrique: 117 },
  { date: 'Oct 11', francisco: 66, enrique: 118 },
  { date: 'Oct 12', francisco: 64, enrique: 119 },
  { date: 'Oct 13', francisco: 62, enrique: 120 },
  { date: 'Oct 14', francisco: 96, enrique: 121 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
type ChartTooltipProps = TooltipProps<number, string>;

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-900">{formatTime(p.value as number)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TrendChart() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Completion Time Trends</h3>
      <p className="text-xs text-slate-400 mb-4">Lower is better · Queens game</p>

      <ResponsiveContainer width="100%" height={210}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            // Show only first and last label to match the reference image
            ticks={['Oct 1', 'Oct 14']}
          />
          <YAxis
            tickFormatter={formatTime}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            domain={[60, 150]}
            ticks={[60, 90, 120, 150]}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="plainline"
            iconSize={18}
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          {/* Francisco — solid dark line */}
          <Line
            type="monotone"
            dataKey="francisco"
            name="Francisco"
            stroke="#0f172a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          {/* Enrique — dashed line */}
          <Line
            type="monotone"
            dataKey="enrique"
            name="Enrique"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
