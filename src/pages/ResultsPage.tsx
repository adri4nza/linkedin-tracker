import Layout from '../components/Layout/Layout';
import { Trophy } from 'lucide-react';

export default function ResultsPage() {
  return (
    <Layout title="Game Results">
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Trophy size={40} className="text-slate-300" />
        <h1 className="text-lg font-bold text-slate-700">Game Results</h1>
        <p className="text-sm text-slate-400">Daily game results — coming soon.</p>
      </div>
    </Layout>
  );
}
