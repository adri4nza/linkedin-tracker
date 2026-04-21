import { useState } from 'react';
import Layout from '../components/Layout/Layout';
import WinnerCard from '../components/WinnerCard/WinnerCard';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import DonutChart from '../components/DonutChart/DonutChart';
import DailyResultsDrawer from '../components/DailyResultsDrawer/DailyResultsDrawer';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(day: number, month: number, year: number): string {
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

export default function DashboardPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState('');

  function handleDayClick(day: number, month: number, year: number) {
    setDrawerDate(formatDate(day, month, year));
    setDrawerOpen(true);
  }

  return (
    <Layout title="Corporate Dashboard">
      <WinnerCard winner="Enrique" score="3 - 2" streakDays={5} />
      <MiniCalendar
        initialYear={2023}
        initialMonth={9}
        highlightedDay={6}
        onDayClick={handleDayClick}
      />
      <DonutChart />

      <DailyResultsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        date={drawerDate}
      />
    </Layout>
  );
}
