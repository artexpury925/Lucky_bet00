import React, { useState } from 'react';
import { SimulatedPlayer, AviatorHistoryItem } from '../../types';
import { Users, User, Trophy, ArrowUpRight } from 'lucide-react';

interface LiveBetsTableProps {
  players: SimulatedPlayer[];
  currentMultiplier: number;
  myHistory: { round: number; bet: number; mult: number; win: number; date: string }[];
}

export const LiveBetsTable: React.FC<LiveBetsTableProps> = ({
  players,
  currentMultiplier,
  myHistory,
}) => {
  const [tab, setTab] = useState<'all' | 'my' | 'top'>('all');

  const topWins = [
    { username: 'kip_pro_88', mult: 84.52, bet: 500, win: 42260, date: 'Today 01:45' },
    { username: 'omondi_jet', mult: 62.10, bet: 200, win: 12420, date: 'Today 00:30' },
    { username: 'nairobi_ace', mult: 48.75, bet: 1000, win: 48750, date: 'Yesterday' },
    { username: 'mwangi_fly', mult: 35.20, bet: 300, win: 10560, date: 'Yesterday' },
    { username: 'chebet_star', mult: 29.80, bet: 500, win: 14900, date: 'Yesterday' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-80 sm:h-96">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`flex-1 py-1.5 text-xs font-bold font-display uppercase rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            tab === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Bets ({players.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('my')}
          className={`flex-1 py-1.5 text-xs font-bold font-display uppercase rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            tab === 'my'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>My Bets</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('top')}
          className={`flex-1 py-1.5 text-xs font-bold font-display uppercase rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            tab === 'top'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Top Wins</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 text-xs">
        {tab === 'all' && (
          <div>
            <div className="grid grid-cols-12 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 bg-slate-950/30 sticky top-0 backdrop-blur-sm">
              <span className="col-span-5">Player</span>
              <span className="col-span-3 text-right">Bet (KES)</span>
              <span className="col-span-4 text-right">Cashout / Win</span>
            </div>

            {players.map((p) => {
              const hasCashedOut = p.cashedOut;
              const cashoutMult = p.cashedOutMultiplier || 0;
              const winAmount = (p.betAmount * cashoutMult).toFixed(2);

              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-12 px-3 py-2 items-center transition-colors ${
                    hasCashedOut
                      ? 'bg-emerald-950/20 text-emerald-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="col-span-5 flex items-center space-x-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold flex items-center justify-center text-slate-300 uppercase shrink-0">
                      {p.username.slice(0, 2)}
                    </span>
                    <span className="truncate">{p.username}</span>
                  </div>

                  <div className="col-span-3 text-right font-display font-semibold">
                    {p.betAmount}
                  </div>

                  <div className="col-span-4 text-right font-display">
                    {hasCashedOut ? (
                      <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                        <span>{cashoutMult.toFixed(2)}x</span>
                        <span>(+{winAmount})</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">In flight...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'my' && (
          <div>
            <div className="grid grid-cols-12 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 bg-slate-950/30 sticky top-0 backdrop-blur-sm">
              <span className="col-span-4">Round</span>
              <span className="col-span-4 text-right">Stake</span>
              <span className="col-span-4 text-right">Payout</span>
            </div>

            {myHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No bets placed yet. Join the next flight!
              </div>
            ) : (
              myHistory.map((h, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-800/40"
                >
                  <div className="col-span-4">
                    <span className="font-display font-bold text-slate-200">#{h.round}</span>
                    <span className="block text-[10px] text-slate-500">{h.date}</span>
                  </div>
                  <div className="col-span-4 text-right font-display text-slate-300">
                    {h.bet.toFixed(2)} KES
                  </div>
                  <div className="col-span-4 text-right font-display">
                    {h.win > 0 ? (
                      <span className="text-emerald-400 font-bold">
                        +{h.win.toFixed(2)} KES ({h.mult.toFixed(2)}x)
                      </span>
                    ) : (
                      <span className="text-red-400 font-semibold">0.00 KES</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'top' && (
          <div>
            <div className="grid grid-cols-12 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 bg-slate-950/30 sticky top-0 backdrop-blur-sm">
              <span className="col-span-5">Player</span>
              <span className="col-span-3 text-right">Mult</span>
              <span className="col-span-4 text-right">Won</span>
            </div>

            {topWins.map((win, i) => (
              <div
                key={i}
                className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-800/30"
              >
                <div className="col-span-5 flex items-center space-x-1.5 truncate">
                  <span className="font-bold text-amber-400 font-display">#{i + 1}</span>
                  <span className="text-slate-200 font-medium truncate">{win.username}</span>
                </div>
                <div className="col-span-3 text-right font-display font-bold text-amber-400">
                  {win.mult.toFixed(2)}x
                </div>
                <div className="col-span-4 text-right font-display font-extrabold text-emerald-400">
                  +{win.win.toLocaleString()} KES
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
