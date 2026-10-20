import React, { useState } from 'react';
import { FootballMatch, SlipSelection } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { Flame, Clock, Radio, Trophy, ArrowUp, ArrowDown } from 'lucide-react';

interface SportsBettingProps {
  matches: FootballMatch[];
  activeSlip: SlipSelection[];
  onToggleSelection: (selection: SlipSelection) => void;
}

export const SportsBetting: React.FC<SportsBettingProps> = ({
  matches,
  activeSlip,
  onToggleSelection,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Fixtures', icon: Trophy },
    { id: 'LIVE', label: 'Live In-Play', icon: Radio, count: matches.filter(m => m.status === 'LIVE').length },
    { id: 'Premier League', label: 'Premier League' },
    { id: 'Kenya Premier League', label: 'Kenya Premier League' },
    { id: 'Champions League', label: 'Champions League' },
    { id: 'La Liga', label: 'La Liga' },
  ];

  const filteredMatches = matches.filter(m => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'LIVE') return m.status === 'LIVE';
    return m.league === activeCategory;
  });

  const isSelected = (matchId: string, marketName: string, outcomeName: string) => {
    return activeSlip.some(
      s => s.matchId === matchId && s.marketName === marketName && s.outcomeName === outcomeName
    );
  };

  const handlePick = (match: FootballMatch, marketName: string, outcomeName: string, odds: number) => {
    soundEngine.playClick();
    onToggleSelection({
      matchId: match.id,
      matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
      marketName,
      outcomeName,
      odds,
    });
  };

  return (
    <div className="space-y-4">
      {/* Category Pills Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveCategory(cat.id);
              }}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />}
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-black text-amber-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Match Cards List */}
      <div className="space-y-3">
        {filteredMatches.map(match => {
          const isLive = match.status === 'LIVE';

          return (
            <div
              key={match.id}
              className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 sm:p-4 shadow-xl transition-all"
            >
              {/* Header: League & Status */}
              <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-slate-800/60">
                <span className="font-semibold text-slate-400 uppercase tracking-wider">
                  {match.league}
                </span>

                {isLive ? (
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1 text-red-400 font-bold bg-red-950/40 border border-red-500/40 px-2 py-0.5 rounded-full text-[11px] animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>LIVE</span>
                    </span>
                    <span className="font-display font-bold text-amber-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{match.minute}'</span>
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 font-display font-medium">
                    {match.startTime}
                  </span>
                )}
              </div>

              {/* Match Teams & Live Score */}
              <div className="flex items-center justify-between my-2">
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm sm:text-base text-slate-100">
                      {match.homeTeam}
                    </span>
                    {isLive && (
                      <span className="font-display font-black text-lg text-amber-400 ml-2">
                        {match.homeScore}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm sm:text-base text-slate-100">
                      {match.awayTeam}
                    </span>
                    {isLive && (
                      <span className="font-display font-black text-lg text-amber-400 ml-2">
                        {match.awayScore}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary 1 X 2 Markets */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/60">
                {/* 1 (Home) */}
                <button
                  type="button"
                  onClick={() => handlePick(match, '1X2', '1 (Home Win)', match.odds.home)}
                  className={`py-2 px-2 rounded-lg font-display text-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    isSelected(match.id, '1X2', '1 (Home Win)')
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-75">1</span>
                  <span className="text-sm font-black">{match.odds.home.toFixed(2)}</span>
                </button>

                {/* X (Draw) */}
                <button
                  type="button"
                  onClick={() => handlePick(match, '1X2', 'X (Draw)', match.odds.draw)}
                  className={`py-2 px-2 rounded-lg font-display text-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    isSelected(match.id, '1X2', 'X (Draw)')
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-75">X</span>
                  <span className="text-sm font-black">{match.odds.draw.toFixed(2)}</span>
                </button>

                {/* 2 (Away) */}
                <button
                  type="button"
                  onClick={() => handlePick(match, '1X2', '2 (Away Win)', match.odds.away)}
                  className={`py-2 px-2 rounded-lg font-display text-xs flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    isSelected(match.id, '1X2', '2 (Away Win)')
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-75">2</span>
                  <span className="text-sm font-black">{match.odds.away.toFixed(2)}</span>
                </button>
              </div>

              {/* Secondary Markets (Over/Under 2.5, GG/NG) */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => handlePick(match, 'Totals', 'Over 2.5', match.odds.over25)}
                  className={`py-1 px-1 rounded font-display text-[11px] flex justify-between items-center border transition-all cursor-pointer ${
                    isSelected(match.id, 'Totals', 'Over 2.5')
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-slate-950/40 hover:bg-slate-800/80 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Ov 2.5</span>
                  <span className="font-bold">{match.odds.over25.toFixed(2)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePick(match, 'Totals', 'Under 2.5', match.odds.under25)}
                  className={`py-1 px-1 rounded font-display text-[11px] flex justify-between items-center border transition-all cursor-pointer ${
                    isSelected(match.id, 'Totals', 'Under 2.5')
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-slate-950/40 hover:bg-slate-800/80 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Un 2.5</span>
                  <span className="font-bold">{match.odds.under25.toFixed(2)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePick(match, 'GG/NG', 'GG (Both Score)', match.odds.bothToScoreYes)}
                  className={`py-1 px-1 rounded font-display text-[11px] flex justify-between items-center border transition-all cursor-pointer ${
                    isSelected(match.id, 'GG/NG', 'GG (Both Score)')
                      ? 'bg-purple-600 text-white border-purple-400 font-bold'
                      : 'bg-slate-950/40 hover:bg-slate-800/80 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>GG</span>
                  <span className="font-bold">{match.odds.bothToScoreYes.toFixed(2)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePick(match, 'GG/NG', 'NG (No Goal)', match.odds.bothToScoreNo)}
                  className={`py-1 px-1 rounded font-display text-[11px] flex justify-between items-center border transition-all cursor-pointer ${
                    isSelected(match.id, 'GG/NG', 'NG (No Goal)')
                      ? 'bg-purple-600 text-white border-purple-400 font-bold'
                      : 'bg-slate-950/40 hover:bg-slate-800/80 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>NG</span>
                  <span className="font-bold">{match.odds.bothToScoreNo.toFixed(2)}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
