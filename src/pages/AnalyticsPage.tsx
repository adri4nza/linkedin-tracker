import { useState } from 'react';
import { Trophy, Clock, CheckCircle, Calendar } from 'lucide-react';
import MetricCard from '../components/MetricCard/MetricCard';
import TrendChart from '../components/TrendChart/TrendChart';

const TIME_RANGES = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('Last 30 Days');

  return (
    <>
      {/* Page intro */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Performance Overview</h1>
        <p className="text-sm text-blue-500 font-medium">
          Real-time metrics and comparative analysis.
        </p>
      </div>

      {/* Time-range selector */}
      <div className="flex items-center gap-2">
        <Calendar size={15} className="text-slate-400 shrink-0" />
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {TIME_RANGES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* ── Metric Cards ── */}

      {/* World Record */}
      <MetricCard
        label="World Record"
        value="1:12"
        icon={<Trophy size={14} />}
        badge="New"
        heldBy="Francisco"
      />

      {/* Average Time */}
      <MetricCard
        label="Average Time"
        value="1:48"
        icon={<Clock size={14} />}
        subItems={[
          { name: 'Francisco', value: '1:36', variant: 'dark' },
          { name: 'Enrique', value: '2:01', variant: 'blue' },
        ]}
      />

      {/* Total Wins */}
      <MetricCard
        label="Total Wins"
        value="1,204"
        icon={<CheckCircle size={14} />}
        trend="+12% vs last month"
      />

      {/* Line chart */}
      <TrendChart />
    </>
  );
}
