import { Trophy, Flame } from 'lucide-react';

interface WinnerCardProps {
  /** Nombre del ganador. 'Tie' para empate. Undefined = sin partidas hoy. */
  winner?: string;
  score?: string;
  streakDays?: number;
}

export default function WinnerCard({ winner, score, streakDays = 0 }: WinnerCardProps) {
  const noGames = !winner;
  const isTie   = winner === 'Tie';

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-4">
        {/* Trophy icon container */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${noGames ? 'bg-slate-50' : 'bg-blue-50'}`}>
          <Trophy size={26} className={noGames ? 'text-slate-300' : 'text-blue-500'} />
        </div>

        {/* Text */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            Today's Winner
          </p>
          {noGames ? (
            <p className="text-sm font-medium text-slate-400">No games played yet today</p>
          ) : isTie ? (
            <p className="text-sm font-bold text-slate-800">
              Tied today{' '}
              <span className="text-blue-600">{score}</span>
            </p>
          ) : (
            <p className="text-sm font-bold text-slate-800">
              {winner} won today{' '}
              <span className="text-blue-600">{score}</span>
            </p>
          )}
        </div>
      </div>

      {/* Streak badge — only when there are games and streak > 0 */}
      {!noGames && streakDays > 0 && (
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600">
            <Flame size={13} className="text-blue-500" />
            {streakDays} Day Streak
          </span>
        </div>
      )}
    </div>
  );
}
