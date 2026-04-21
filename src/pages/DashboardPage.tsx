import Layout from '../components/Layout/Layout';
import WinnerCard from '../components/WinnerCard/WinnerCard';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import DonutChart from '../components/DonutChart/DonutChart';

export default function DashboardPage() {
  return (
    <Layout title="Corporate Dashboard">
      <WinnerCard winner="Enrique" score="3 - 2" streakDays={5} />
      <MiniCalendar initialYear={2023} initialMonth={9} highlightedDay={6} />
      <DonutChart />
    </Layout>
  );
}
