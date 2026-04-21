import Layout from '../components/Layout/Layout';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <Layout title="Dashboard">
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <LayoutDashboard size={40} className="text-slate-300" />
        <h1 className="text-lg font-bold text-slate-700">Dashboard</h1>
        <p className="text-sm text-slate-400">Main view — coming soon.</p>
      </div>
    </Layout>
  );
}
