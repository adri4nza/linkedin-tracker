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
import { useDarkMode } from '../../hooks/useDarkMode';

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
  colors?: { francisco: string; enrique: string };
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
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((p: TooltipPayloadEntry) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{secondsToTime(p.value as number)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TrendChart({ data, colors }: TrendChartProps) {
  const { isDark } = useDarkMode();
  const franciscoColor = colors?.francisco ?? '#3b82f6';
  const enriqueColor   = colors?.enrique   ?? '#ef4444';

  // Dynamic hex colors for SVG elements (Recharts ignores CSS cascade)
  const tickColor   = isDark ? '#94a3b8' : '#94a3b8'; // slate-400 works in both modes
  const gridColor   = isDark ? '#334155' : '#f1f5f9'; // slate-700 vs slate-100
  const legendColor = isDark ? '#cbd5e1' : '#64748b'; // slate-300 vs slate-500
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Completion Time Trends</h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Lower is better · times in M:SS</p>

      <ResponsiveContainer width="100%" height={210}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: tickColor }}
            tickLine={false}
            axisLine={false}
            ticks={xTicks}
          />
          <YAxis
            tickFormatter={secondsToTime}
            tick={{ fontSize: 10, fill: tickColor }}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="plainline"
            iconSize={18}
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: legendColor }}
          />
          {/* Francisco line */}
          <Line
            type="monotone"
            dataKey="francisco"
            name="Francisco"
            stroke={franciscoColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls={false}
          />
          {/* Enrique — dashed line */}
          <Line
            type="monotone"
            dataKey="enrique"
            name="Enrique"
            stroke={enriqueColor}
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
