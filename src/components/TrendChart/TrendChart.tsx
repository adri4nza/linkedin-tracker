import { useMemo } from 'react';
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
import type { TooltipPayload, TooltipPayloadEntry } from 'recharts';
import { secondsToTime } from '../../utils/timeUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ChartDataPoint {
  date: string;
  francisco?: number;
  enrique?: number;
}

interface TrendChartProps {
  data: ChartDataPoint[];
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: TooltipPayloadEntry) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-900">{secondsToTime(p.value as number)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TrendChart({ data }: TrendChartProps) {
  const xTicks = useMemo(() => {
    if (data.length < 2) return data.map((d) => d.date);
    return [data[0].date, data[data.length - 1].date];
  }, [data]);

  const yDomain = useMemo((): [number, number] => {
    const values = data.flatMap((d) =>
      [d.francisco, d.enrique].filter((v): v is number => v !== undefined && isFinite(v)),
    );
    if (!values.length) return [0, 300];
    const step = 30;
    const lo = Math.floor(Math.min(...values) / step) * step;
    const hi = Math.ceil(Math.max(...values) / step) * step;
    return lo < hi ? [lo, hi] : [Math.max(0, lo - step), hi + step];
  }, [data]);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Completion Time Trends</h3>
      <p className="text-xs text-slate-400 mb-4">Lower is better · times in M:SS</p>

      <ResponsiveContainer width="100%" height={210}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            ticks={xTicks}
          />
          <YAxis
            tickFormatter={secondsToTime}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
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
            connectNulls={false}
          />
          {/* Enrique — dashed blue line */}
          <Line
            type="monotone"
            dataKey="enrique"
            name="Enrique"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
