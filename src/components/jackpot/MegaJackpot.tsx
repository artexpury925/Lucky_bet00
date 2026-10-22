import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  RotateCcw,
  Dice5,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface MegaJackpotProps {
  userBalance: number;
  onBet: (amount: number, description: string) => boolean;
  onWin: (amount: number, description: string) => void;
}

interface JackpotFixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  pick: '1' | 'X' | '2' | null;
  actualResult?: '1' | 'X' | '2';
}

const INITIAL_FIXTURES: JackpotFixture[] = [
  { id: 1, homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League', startTime: 'Sat 17:00', pick: null },
  { id: 2, homeTeam: 'Newcastle', awayTeam: 'Aston Villa', league: 'Premier League', startTime: 'Sat 17:00', pick: null },
  { id: 3, homeTeam: 'Brighton', awayTeam: 'Wolves', league: 'Premier League', startTime: 'Sat 17:00', pick: null },
  { id: 4, homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', league: 'Kenya Premier League', startTime: 'Sat 18:00', pick: null },
  { id: 5, homeTeam: 'Tusker FC', awayTeam: 'Bandari', league: 'Kenya Premier League', startTime: 'Sat 18:00', pick: null },
  { id: 6, homeTeam: 'Juventus', awayTeam: 'AC Milan', league: 'Serie A', startTime: 'Sat 20:45', pick: null },
  { id: 7, homeTeam: 'Real Madrid', awayTeam: 'Atletico Madrid', league: 'La Liga', startTime: 'Sat 22:00', pick: null },
  { id: 8, homeTeam: 'Sevilla', awayTeam: 'Real Betis', league: 'La Liga', startTime: 'Sun 16:15', pick: null },
  { id: 9, homeTeam: 'Dortmund', awayTeam: 'Leipzig', league: 'Bundesliga', startTime: 'Sun 17:30', pick: null },
  { id: 10, homeTeam: 'Lyon', awayTeam: 'Marseille', league: 'Ligue 1', startTime: 'Sun 21:00', pick: null },
  { id: 11, homeTeam: 'Man City', awayTeam: 'Liverpool', league: 'Premier League', startTime: 'Sun 18:30', pick: null },
  { id: 12, homeTeam: 'Roma', awayTeam: 'Napoli', league: 'Serie A', startTime: 'Sun 20:45', pick: null },
  { id: 13, homeTeam: 'Inter Milan', awayTeam: 'Lazio', league: 'Serie A', startTime: 'Sun 20:45', pick: null },
];

export const MegaJackpot: React.FC<MegaJackpotProps> = ({
  userBalance,
  onBet,
  onWin,
}) => {
  const [fixtures, setFixtures] = useState<JackpotFixture[]>(INITIAL_FIXTURES);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'tickets' | 'bonuses'>('fixtures');
  const [placedTickets, setPlacedTickets] = useState<
    { id: string; picks: Record<number, '1' | 'X' | '2'>; score?: number; wonAmount?: number }[]
  >([]);
  const [simulationResult, setSimulationResult] = useState<{
    correctCount: number;
    wonBonus: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const TICKET_PRICE = 50;

  const handlePick = (fixtureId: number, outcome: '1' | 'X' | '2') => {
    soundEngine.playClick();
    setFixtures(prev =>
      prev.map(f => (f.id === fixtureId ? { ...f, pick: f.pick === outcome ? null : outcome } : f))
    );
  };

  const handleAutoPick = () => {
    soundEngine.playClick();
    const outcomes: ('1' | 'X' | '2')[] = ['1', 'X', '2'];
    setFixtures(prev =>
      prev.map(f => {
        // Realistic distribution: 45% home, 28% draw, 27% away
        const rand = Math.random();
        const pick = rand < 0.45 ? '1' : rand < 0.73 ? 'X' : '2';
        return { ...f, pick };
      })
    );
  };

  const handleClear = () => {
    soundEngine.playClick();
    setFixtures(prev => prev.map(f => ({ ...f, pick: null })));
    setSimulationResult(null);
  };

  const pickedCount = fixtures.filter(f => f.pick !== null).length;

  const handlePlaceTicket = () => {
    if (pickedCount < 13) {
      setErrorMsg(`Please make a prediction for all 13 matches (${13 - pickedCount} remaining).`);
      return;
    }
    if (userBalance < TICKET_PRICE) {
      setErrorMsg(`Insufficient balance for 50 KES ticket. Please top up your wallet.`);
      return;
    }
    setErrorMsg(null);

    const success = onBet(TICKET_PRICE, `Mega Jackpot Ticket (#13-Matches Entry)`);
    if (!success) return;

    soundEngine.playFanfare();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    const picksRecord: Record<number, '1' | 'X' | '2'> = {};
    fixtures.forEach(f => {
      if (f.pick) picksRecord[f.id] = f.pick;
    });

    const newTicket = {
      id: 'JP-' + Math.floor(100000 + Math.random() * 900000),
      picks: picksRecord,
    };

    setPlacedTickets(prev => [newTicket, ...prev]);
    setActiveTab('tickets');
  };

  // Simulate Weekend Matches to check ticket against results
  const handleSimulateMatches = (ticketId: string) => {
    soundEngine.playClick();
    const targetTicket = placedTickets.find(t => t.id === ticketId);
    if (!targetTicket) return;

    const outcomes: ('1' | 'X' | '2')[] = ['1', 'X', '2'];
    let correct = 0;

    // Simulate results
    fixtures.forEach(f => {
      const userPick = targetTicket.picks[f.id];
      // 70% probability to match for fun and demo thrills
      const simulatedResult: '1' | 'X' | '2' =
        Math.random() < 0.72 ? userPick : outcomes[Math.floor(Math.random() * 3)];

      if (simulatedResult === userPick) {
        correct++;
      }
    });

    // Payout table:
    // 13 correct = 25,000,000 KES
    // 12 correct = 1,000,000 KES
    // 11 correct = 250,000 KES
    // 10 correct = 50,000 KES
    // < 10 = Consolation / free bet 50 KES if 9
    let bonusWon = 0;
    if (correct === 13) bonusWon = 25000000;
    else if (correct === 12) bonusWon = 1000000;
    else if (correct === 11) bonusWon = 250000;
    else if (correct === 10) bonusWon = 50000;
    else if (correct === 9) bonusWon = 100;

    if (bonusWon > 0) {
      soundEngine.playFanfare();
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      } catch {}
      onWin(bonusWon, `Mega Jackpot Bonus (${correct}/13 Correct Picks: +${bonusWon.toLocaleString()} KES)`);
    } else {
      soundEngine.playSportsWin();
    }

    setPlacedTickets(prev =>
      prev.map(t =>
        t.id === ticketId ? { ...t, score: correct, wonAmount: bonusWon } : t
      )
    );
    setSimulationResult({ correctCount: correct, wonBonus: bonusWon });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 rounded-2xl p-6 text-white overflow-hidden shadow-xl">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 bg-slate-950/40 px-3 py-1 rounded-full border border-white/20 text-yellow-300 text-xs font-mono font-black uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Weekly Grand Jackpot</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
              KES 25,000,000
            </h2>
            <p className="text-xs sm:text-sm text-yellow-100 font-medium">
              Predict 13 weekend football matches for only <strong className="text-white">50 KES</strong>. Huge cash bonuses for 10, 11 &amp; 12 correct picks!
            </p>
          </div>

          <div className="flex flex-col items-center bg-slate-950/60 p-3.5 rounded-2xl border border-white/20 shrink-0 text-center">
            <span className="text-[10px] text-slate-300 uppercase font-bold">Ticket Stake</span>
            <span className="text-2xl font-black font-display text-emerald-400">50 KES</span>
            <span className="text-[11px] text-amber-300 font-mono mt-0.5">Closes: Saturday 17:00</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('fixtures')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all ${
              activeTab === 'fixtures'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            13 Fixtures ({pickedCount}/13)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all ${
              activeTab === 'tickets'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            My Jackpot Tickets ({placedTickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bonuses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all ${
              activeTab === 'bonuses'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Prize Tiers
          </button>
        </div>

        {activeTab === 'fixtures' && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAutoPick}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer"
            >
              <Dice5 className="w-3.5 h-3.5" />
              <span>Auto Pick (Lucky Dip)</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
              title="Clear all selections"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-950/60 border border-red-500/50 p-3 rounded-xl text-xs text-red-300 text-center">
          {errorMsg}
        </div>
      )}

      {/* VIEW: 13 FIXTURES LIST */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          <div className="space-y-2.5">
            {fixtures.map(f => (
              <div
                key={f.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-amber-400 shrink-0">
                    {f.id}
                  </span>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center space-x-2">
                      <span>{f.homeTeam}</span>
                      <span className="text-slate-500 text-xs">vs</span>
                      <span>{f.awayTeam}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>{f.league}</span>
                      <span>•</span>
                      <span>{f.startTime}</span>
                    </div>
                  </div>
                </div>

                {/* 1 X 2 Pick Buttons */}
                <div className="grid grid-cols-3 gap-2 w-full sm:w-64">
                  {(['1', 'X', '2'] as const).map(out => {
                    const isPicked = f.pick === out;
                    const label = out === '1' ? '1 (Home)' : out === 'X' ? 'X (Draw)' : '2 (Away)';
                    return (
                      <button
                        key={out}
                        type="button"
                        onClick={() => handlePick(f.id, out)}
                        className={`py-2 rounded-lg font-display text-xs font-black uppercase transition-all cursor-pointer ${
                          isPicked
                            ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {out}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Submission Bar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Jackpot Progress:</span>
              <span className="text-sm font-bold text-white">
                {pickedCount} of 13 Fixtures Selected
              </span>
            </div>

            <button
              type="button"
              onClick={handlePlaceTicket}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-98 ${
                pickedCount === 13
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              PLACE MEGA JACKPOT TICKET (50 KES)
            </button>
          </div>
        </div>
      )}

      {/* VIEW: MY JACKPOT TICKETS & RESULTS SIMULATION */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {placedTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No Mega Jackpot tickets placed yet. Pick your 13 matches to enter the 25 Million KES prize pool!
            </div>
          ) : (
            placedTickets.map(ticket => (
              <div
                key={ticket.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="font-display font-black text-white text-sm">
                        Ticket Ref: {ticket.id}
                      </span>
                      <div className="text-[11px] text-slate-400">13 Fixtures • Stake: 50 KES</div>
                    </div>
                  </div>

                  {ticket.score !== undefined ? (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Match Score</span>
                      <span className="text-base font-black font-mono text-emerald-400">
                        {ticket.score} / 13 Correct
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimulateMatches(ticket.id)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase font-display rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      ⚡ Check Live Match Results
                    </button>
                  )}
                </div>

                {ticket.wonAmount !== undefined && ticket.wonAmount > 0 && (
                  <div className="bg-emerald-950/40 border border-emerald-500/50 p-3 rounded-xl text-center text-emerald-300 font-bold text-xs animate-fadeIn">
                    🎉 Won {ticket.wonAmount.toLocaleString()} KES Bonus Cash! Credited to your wallet balance.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW: PRIZE TIERS */}
      {activeTab === 'bonuses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-amber-400 block text-sm">🏆 13 / 13 Matches</span>
            <div className="text-2xl font-black font-display text-white">KES 25,000,000</div>
            <p className="text-slate-400">Grand Jackpot shared equally among all 13/13 correct predictions.</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-emerald-400 block text-sm">🥈 12 / 13 Matches</span>
            <div className="text-xl font-black font-display text-white">KES 1,000,000</div>
            <p className="text-slate-400">First-tier bonus payout for missing only 1 match.</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-teal-400 block text-sm">🥉 11 / 13 Matches</span>
            <div className="text-lg font-black font-display text-white">KES 250,000</div>
            <p className="text-slate-400">Second-tier bonus reward for 11 correct picks.</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-blue-400 block text-sm">🏅 10 / 13 Matches</span>
            <div className="text-lg font-black font-display text-white">KES 50,000</div>
            <p className="text-slate-400">Third-tier cash bonus reward for 10 correct picks.</p>
          </div>
        </div>
      )}
    </div>
  );
};
