import React, { useState } from 'react';
import { LeaderboardEntry } from '../../types';
import { Trophy, Flame, Award, Medal, TrendingUp, Sparkles, UserCheck } from 'lucide-react';

interface LeaderboardViewProps {
  userUsername: string;
  userBalance: number;
}

const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lb-1',
    rank: 1,
    username: 'Kipchoge_Runner',
    location: 'Eldoret',
    game: 'Aviator',
    stake: 200,
    multiplier: 248.5,
    payout: 49700,
    timestamp: Date.now() - 1000 * 60 * 18,
  },
  {
    id: 'lb-2',
    rank: 2,
    username: 'Mwangi_Simba',
    location: 'Nairobi',
    game: 'Sports Multi-bet',
    stake: 100,
    multiplier: 184.2,
    payout: 18420,
    timestamp: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'lb-3',
    rank: 3,
    username: 'Otieno_Jackpot',
    location: 'Kisumu',
    game: 'Mines',
    stake: 500,
    multiplier: 72.4,
    payout: 36200,
    timestamp: Date.now() - 1000 * 60 * 70,
  },
  {
    id: 'lb-4',
    rank: 4,
    username: 'Fatuma_Coast',
    location: 'Mombasa',
    game: 'Aviator',
    stake: 150,
    multiplier: 65.8,
    payout: 9870,
    timestamp: Date.now() - 1000 * 60 * 110,
  },
  {
    id: 'lb-5',
    rank: 5,
    username: 'Kimani_Nakuru',
    location: 'Nakuru',
    game: 'Penalty Shootout',
    stake: 100,
    multiplier: 30.72,
    payout: 3072,
    timestamp: Date.now() - 1000 * 60 * 140,
  },
  {
    id: 'lb-6',
    rank: 6,
    username: 'Wambua_Machakos',
    location: 'Machakos',
    game: 'Aviator',
    stake: 300,
    multiplier: 28.15,
    payout: 8445,
    timestamp: Date.now() - 1000 * 60 * 210,
  },
  {
    id: 'lb-7',
    rank: 7,
    username: 'Cherono_Kericho',
    location: 'Kericho',
    game: 'Sports Multi-bet',
    stake: 50,
    multiplier: 24.6,
    payout: 1230,
    timestamp: Date.now() - 1000 * 60 * 320,
  },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  userUsername,
  userBalance,
}) => {
  const [filter, setFilter] = useState<'today' | 'week' | 'allTime'>('today');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg border border-yellow-400/50">
            <Trophy className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black font-display text-white">
                Hall of Fame &amp; Big Winners
              </span>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                Live Rankings
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Honoring Kenya's biggest cashout legends across Aviator, Football Accumulators, and Mines!
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'allTime', label: 'All-Time Legends' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer ${
                filter === f.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SAMPLE_LEADERBOARD.slice(0, 3).map((item, idx) => {
          const podiumBg =
            idx === 0
              ? 'from-amber-500/20 via-yellow-500/10 to-slate-950 border-amber-500/50'
              : idx === 1
              ? 'from-slate-400/20 via-slate-500/10 to-slate-950 border-slate-400/50'
              : 'from-orange-600/20 via-amber-700/10 to-slate-950 border-orange-500/50';

          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';

          return (
            <div
              key={item.id}
              className={`relative bg-gradient-to-b ${podiumBg} border rounded-2xl p-4 shadow-xl flex flex-col justify-between overflow-hidden`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl mr-1">{medal}</span>
                  <span className="font-display font-black text-white text-base">
                    {item.username}
                  </span>
                  <div className="text-[11px] text-slate-400">
                    📍 {item.location}, Kenya
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] font-mono font-bold text-amber-300 border border-slate-700">
                  {item.game}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-slate-400 block">Multiplier</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {item.multiplier}x
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Win</span>
                  <span className="text-xl font-black font-display text-white">
                    {item.payout.toLocaleString()}{' '}
                    <span className="text-xs text-amber-400">KES</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table of full rankings */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-display font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Game</th>
                <th className="py-3 px-4">Stake</th>
                <th className="py-3 px-4">Multiplier</th>
                <th className="py-3 px-4 text-right">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {SAMPLE_LEADERBOARD.map(item => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-amber-400">
                    #{item.rank}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white font-sans flex items-center space-x-1.5">
                    <span>{item.username}</span>
                    {item.rank <= 3 && <Sparkles className="w-3 h-3 text-amber-400" />}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-sans">
                    {item.location}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800 font-sans">
                      {item.game}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {item.stake} KES
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {item.multiplier}x
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white text-sm font-sans">
                    {item.payout.toLocaleString()} KES
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User's Own Career Stats Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-mono">Your Account Standing:</span>
            <div className="text-base font-black text-white font-display">
              {userUsername} • Available Balance: <span className="text-emerald-400">{userBalance.toFixed(2)} KES</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block">Personal Best Multiplier</span>
            <span className="text-base font-mono font-bold text-amber-400">42.80x</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 block">Current Rank Tier</span>
            <span className="text-base font-mono font-bold text-emerald-400">Gold Tier</span>
          </div>
        </div>
      </div>
    </div>
  );
};
