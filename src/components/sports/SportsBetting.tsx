import React, { useState } from 'react';
import { FootballMatch, SlipSelection } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import {
  Flame,
  Clock,
  Radio,
  Trophy,
  ArrowUp,
  ArrowDown,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  RotateCw,
  Search,
  Calendar,
  Shield,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface SportsBettingProps {
  matches: FootballMatch[];
  activeSlip: SlipSelection[];
  onToggleSelection: (selection: SlipSelection) => void;
  onRefreshMatches?: () => Promise<any>;
  lastSyncTime?: number;
}

export const SportsBetting: React.FC<SportsBettingProps> = ({
  matches,
  activeSlip,
  onToggleSelection,
  onRefreshMatches,
  lastSyncTime,
}) => {
  const [activeDateFilter, setActiveDateFilter] = useState<'ALL' | 'LIVE' | 'TODAY' | 'TOMORROW' | 'WEEKEND'>('ALL');
  const [activeLeague, setActiveLeague] = useState<string>('ALL');
  const [expandedRadarId, setExpandedRadarId] = useState<string | null>(null);
  const [expandedMarketsId, setExpandedMarketsId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const dateFilters = [
    { id: 'ALL', label: 'All Fixtures', icon: Trophy },
    {
      id: 'LIVE',
      label: 'Live In-Play',
      icon: Radio,
      badge: matches.filter(m => m.status === 'LIVE').length,
    },
    { id: 'TODAY', label: "Today's Matches", icon: Calendar },
    { id: 'TOMORROW', label: 'Tomorrow', icon: Clock },
    { id: 'WEEKEND', label: 'Weekend Special', icon: Flame },
  ];

  const leagues = [
    { id: 'ALL', label: 'All Leagues' },
    { id: 'Premier League', label: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'Kenya Premier League', label: 'Kenya Premier League 🇰🇪' },
    { id: 'Champions League', label: 'Champions League ⭐' },
    { id: 'La Liga', label: 'La Liga 🇪🇸' },
    { id: 'Serie A', label: 'Serie A 🇮🇹' },
    { id: 'Bundesliga', label: 'Bundesliga 🇩🇪' },
  ];

  const handleRefresh = async () => {
    if (!onRefreshMatches || isRefreshing) return;
    soundEngine.playClick();
    setIsRefreshing(true);
    try {
      await onRefreshMatches();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const filteredMatches = matches.filter(m => {
    // 1. Date filter
    if (activeDateFilter === 'LIVE' && m.status !== 'LIVE') return false;
    if (activeDateFilter === 'TODAY' && m.dayLabel !== 'TODAY' && m.status !== 'LIVE') return false;
    if (activeDateFilter === 'TOMORROW' && m.dayLabel !== 'TOMORROW') return false;
    if (activeDateFilter === 'WEEKEND' && m.dayLabel !== 'WEEKEND') return false;

    // 2. League filter
    if (activeLeague !== 'ALL' && m.league !== activeLeague) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.homeTeam} ${m.awayTeam} ${m.league}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
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

  // Same-game multi / Bet builder helper
  const handleAddBetBuilder = (match: FootballMatch) => {
    soundEngine.playClick();
    handlePick(match, '1X2', '1 (Home Win)', match.odds.home);
    handlePick(match, 'Totals', 'Over 2.5', match.odds.over25);
    handlePick(match, 'GG/NG', 'GG (Both Score)', match.odds.bothToScoreYes);
  };

  return (
    <div className="space-y-4">
      {/* Live Sync & Daily Update Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-white font-display">Real-Time Football Fixtures</span>
              <span className="flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Feed Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live &amp; upcoming matches updated daily • Current Premier League, FKF Kenya, &amp; European fixtures
            </p>
          </div>
        </div>

        {/* Search & Refresh Actions */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search team or league..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {onRefreshMatches && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Live Fixtures and Odds"
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold font-display flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {dateFilters.map(filter => {
          const Icon = filter.icon;
          const isActive = activeDateFilter === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveDateFilter(filter.id as any);
              }}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{filter.label}</span>
              {filter.badge !== undefined && filter.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-black text-amber-400' : 'bg-red-500 text-white'
                }`}>
                  {filter.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* League Filter Sub-Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {leagues.map(l => (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveLeague(l.id);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeLeague === l.id
                ? 'bg-slate-800 text-white font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No matches found for this filter</h3>
          <p className="text-xs text-slate-400">
            Try switching to "All Fixtures" or selecting another league to see today's matches.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveDateFilter('ALL');
              setActiveLeague('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs font-display uppercase tracking-wider"
          >
            Show All Matches
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map(match => {
            const isLive = match.status === 'LIVE';
            const isRadarOpen = expandedRadarId === match.id;
            const isMarketsOpen = expandedMarketsId === match.id;

            return (
              <div
                key={match.id}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 sm:p-4 shadow-xl transition-all"
              >
                {/* Header: League, Day, Status & Live Radar Toggle */}
                <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">
                      {match.league}
                    </span>
                    {match.dayLabel && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        match.dayLabel === 'LIVE'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : match.dayLabel === 'TODAY'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : match.dayLabel === 'TOMORROW'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {match.dayLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
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
                      <span className="text-slate-400 font-display font-semibold text-xs flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{match.startTime}</span>
                      </span>
                    )}

                    {/* Live Pitch Radar Toggle Button */}
                    {isLive && (
                      <button
                        type="button"
                        onClick={() => setExpandedRadarId(isRadarOpen ? null : match.id)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase flex items-center space-x-1 border transition-colors ${
                          isRadarOpen
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span className="hidden sm:inline">{isRadarOpen ? 'Hide Radar' : 'Live Radar'}</span>
                        {isRadarOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Match Teams & Live Score */}
                <div className="flex items-center justify-between my-2">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                        <span className="font-bold text-sm sm:text-base text-slate-100">
                          {match.homeTeam}
                        </span>
                      </div>
                      {isLive && (
                        <span className="font-display font-black text-xl text-amber-400 ml-2">
                          {match.homeScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="font-bold text-sm sm:text-base text-slate-100">
                          {match.awayTeam}
                        </span>
                      </div>
                      {isLive && (
                        <span className="font-display font-black text-xl text-amber-400 ml-2">
                          {match.awayScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE LIVE MATCH RADAR & STATS VISUALIZER */}
                {isLive && isRadarOpen && (
                  <div className="my-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-fadeIn">
                    {/* Miniature Pitch Event Visualizer */}
                    <div className="relative w-full h-24 bg-gradient-to-r from-emerald-950 via-green-950 to-emerald-950 rounded-lg border border-emerald-500/30 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/20" />
                      <div className="absolute w-12 h-12 rounded-full border border-white/20" />
                      <div className="relative z-10 flex flex-col items-center text-center space-y-1">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 bg-black/60 px-2.5 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>⚡ {match.minute}' Attack: {match.homeTeam} Pressing Box!</span>
                        </div>
                        <span className="text-[10px] text-slate-300 font-mono">
                          Dangerous attacks: {match.stats?.dangerousAttacksHome || 45} vs {match.stats?.dangerousAttacksAway || 32}
                        </span>
                      </div>
                    </div>

                    {/* Match Stats Bars */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                        <span className="text-slate-400 block text-[9px] uppercase font-mono">Possession</span>
                        <span className="font-bold font-mono text-white">
                          {match.stats?.possessionHome || 55}% - {match.stats?.possessionAway || 45}%
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                        <span className="text-slate-400 block text-[9px] uppercase font-mono">Shots on Target</span>
                        <span className="font-bold font-mono text-amber-400">
                          {match.stats?.shotsOnTargetHome || 5} - {match.stats?.shotsOnTargetAway || 3}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                        <span className="text-slate-400 block text-[9px] uppercase font-mono">Corner Kicks</span>
                        <span className="font-bold font-mono text-emerald-400">
                          {match.stats?.cornersHome || 4} - {match.stats?.cornersAway || 2}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* EXPANDABLE MULTI-MARKETS DRAWER (Double Chance, Draw No Bet, Totals 1.5 & 3.5) */}
                {isMarketsOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-fadeIn">
                    {/* Double Chance */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Double Chance
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePick(match, 'Double Chance', '1X (Home or Draw)', match.odds.doubleChance1X || 1.25)}
                          className={`py-1.5 px-2 rounded text-xs font-display flex justify-between items-center border cursor-pointer ${
                            isSelected(match.id, 'Double Chance', '1X (Home or Draw)')
                              ? 'bg-blue-600 text-white border-blue-400 font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-[10px] opacity-75">1X</span>
                          <span className="font-bold">{(match.odds.doubleChance1X || 1.25).toFixed(2)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePick(match, 'Double Chance', '12 (Home or Away)', match.odds.doubleChance12 || 1.30)}
                          className={`py-1.5 px-2 rounded text-xs font-display flex justify-between items-center border cursor-pointer ${
                            isSelected(match.id, 'Double Chance', '12 (Home or Away)')
                              ? 'bg-blue-600 text-white border-blue-400 font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-[10px] opacity-75">12</span>
                          <span className="font-bold">{(match.odds.doubleChance12 || 1.30).toFixed(2)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePick(match, 'Double Chance', 'X2 (Draw or Away)', match.odds.doubleChanceX2 || 1.45)}
                          className={`py-1.5 px-2 rounded text-xs font-display flex justify-between items-center border cursor-pointer ${
                            isSelected(match.id, 'Double Chance', 'X2 (Draw or Away)')
                              ? 'bg-blue-600 text-white border-blue-400 font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-[10px] opacity-75">X2</span>
                          <span className="font-bold">{(match.odds.doubleChanceX2 || 1.45).toFixed(2)}</span>
                        </button>
                      </div>
                    </div>

                    {/* Draw No Bet */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Draw No Bet (DNB)
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePick(match, 'Draw No Bet', 'Home DNB', match.odds.drawNoBetHome || 1.35)}
                          className={`py-1.5 px-2 rounded text-xs font-display flex justify-between items-center border cursor-pointer ${
                            isSelected(match.id, 'Draw No Bet', 'Home DNB')
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span>1 (DNB)</span>
                          <span className="font-bold">{(match.odds.drawNoBetHome || 1.35).toFixed(2)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePick(match, 'Draw No Bet', 'Away DNB', match.odds.drawNoBetAway || 2.45)}
                          className={`py-1.5 px-2 rounded text-xs font-display flex justify-between items-center border cursor-pointer ${
                            isSelected(match.id, 'Draw No Bet', 'Away DNB')
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span>2 (DNB)</span>
                          <span className="font-bold">{(match.odds.drawNoBetAway || 2.45).toFixed(2)}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Controls: More Markets & Bet Builder */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedMarketsId(isMarketsOpen ? null : match.id)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isMarketsOpen ? 'Hide Markets' : '+More Markets (Double Chance, DNB)'}</span>
                    {isMarketsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBetBuilder(match)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/40 rounded-lg text-[10px] font-bold font-display uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>+Bet Builder Treble</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
