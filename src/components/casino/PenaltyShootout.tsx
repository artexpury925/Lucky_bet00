import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import {
  Trophy,
  DollarSign,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface PenaltyShootoutProps {
  userBalance: number;
  onBet: (amount: number, description: string) => boolean;
  onWin: (amount: number, description: string) => void;
}

type TargetZone = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';

const MULTIPLIERS = [1.92, 3.84, 7.68, 15.36, 30.72];

const ZONES: { id: TargetZone; label: string; coords: string }[] = [
  { id: 'top-left', label: 'Top Left (Top Corner)', coords: 'col-start-1 row-start-1' },
  { id: 'top-right', label: 'Top Right (Top Corner)', coords: 'col-start-3 row-start-1' },
  { id: 'center', label: 'Center (Chip Shot)', coords: 'col-start-2 row-start-1' },
  { id: 'bottom-left', label: 'Bottom Left (Low Driven)', coords: 'col-start-1 row-start-2' },
  { id: 'bottom-right', label: 'Bottom Right (Low Driven)', coords: 'col-start-3 row-start-2' },
];

export const PenaltyShootout: React.FC<PenaltyShootoutProps> = ({
  userBalance,
  onBet,
  onWin,
}) => {
  const [stake, setStake] = useState<number>(50);
  const [currentRound, setCurrentRound] = useState<number>(0); // 0 to 5
  const [gameState, setGameState] = useState<'IDLE' | 'KICKING' | 'WAITING_KICK' | 'WON' | 'SAVED'>('IDLE');
  const [roundHistory, setRoundHistory] = useState<('GOAL' | 'SAVED')[]>([]);
  const [lastShotZone, setLastShotZone] = useState<TargetZone | null>(null);
  const [goalieZone, setGoalieZone] = useState<TargetZone | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startShootout = () => {
    if (userBalance < stake) {
      setErrorMsg(`Insufficient balance for KES ${stake}. Please top up first.`);
      return;
    }
    setErrorMsg(null);

    const success = onBet(stake, `Penalty Shootout (Stake: ${stake} KES)`);
    if (!success) return;

    soundEngine.playClick();
    setCurrentRound(0);
    setRoundHistory([]);
    setLastShotZone(null);
    setGoalieZone(null);
    setGameState('WAITING_KICK');
  };

  const handleShoot = (zone: TargetZone) => {
    if (gameState !== 'WAITING_KICK') return;

    setLastShotZone(zone);
    setGameState('KICKING');
    soundEngine.playClick();

    // Goalkeeper picks a dive zone (70% player score chance, 30% goalie save chance)
    const allZones: TargetZone[] = ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];
    const isSave = Math.random() < 0.28;
    const goaliePick = isSave ? zone : allZones.filter(z => z !== zone)[Math.floor(Math.random() * (allZones.length - 1))];

    setGoalieZone(goaliePick);

    setTimeout(() => {
      if (isSave) {
        // Saved by Goalkeeper!
        soundEngine.playExplosion();
        setRoundHistory(prev => [...prev, 'SAVED']);
        setGameState('SAVED');
      } else {
        // GOAL!
        soundEngine.playGoal();
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setRoundHistory(prev => [...prev, 'GOAL']);

        if (nextRound === 5) {
          // Beat all 5 penalties - Grand Trophy Win!
          handleCashout(MULTIPLIERS[4]);
        } else {
          setGameState('WAITING_KICK');
        }
      }
    }, 1000);
  };

  const handleCashout = (overrideMult?: number) => {
    if (currentRound === 0) return;
    const mult = overrideMult || MULTIPLIERS[currentRound - 1];
    const winAmount = Math.round(stake * mult);

    soundEngine.playFanfare();
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}

    onWin(winAmount, `Penalty Shootout Cashout: ${mult}x (+${winAmount} KES)`);
    setGameState('WON');
  };

  const currentMultiplier = currentRound > 0 ? MULTIPLIERS[currentRound - 1] : 1.0;
  const nextMultiplier = MULTIPLIERS[currentRound] || MULTIPLIERS[4];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg border border-amber-400/40">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black font-display text-white">
                Penalty Shootout
              </span>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                Up to 30.72x
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pick your target, beat the keeper, and score up to 5 consecutive penalties to multiply your payout!
            </p>
          </div>
        </div>

        {/* Multiplier Progress Track */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          {MULTIPLIERS.map((mult, idx) => {
            const isCompleted = idx < currentRound;
            const isCurrent = idx === currentRound && gameState === 'WAITING_KICK';

            return (
              <div
                key={mult}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1 border transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                    : isCurrent
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 scale-105 animate-pulse'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>{mult}x</span>
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-950/60 border border-red-500/50 p-3 rounded-xl text-xs text-red-300 text-center">
          {errorMsg}
        </div>
      )}

      {/* Main Pitch Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Game Controls */}
        <div className="lg:col-span-4 bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Penalty Stake</span>
              <span className="text-white font-mono font-bold">{stake} KES</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[20, 50, 100, 200].map(amt => (
                <button
                  key={amt}
                  type="button"
                  disabled={gameState === 'WAITING_KICK' || gameState === 'KICKING'}
                  onClick={() => {
                    soundEngine.playClick();
                    setStake(amt);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                    stake === amt
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="50000"
                disabled={gameState === 'WAITING_KICK' || gameState === 'KICKING'}
                value={stake}
                onChange={e => setStake(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">KES</span>
            </div>
          </div>

          {/* Current Win Info */}
          {currentRound > 0 && gameState !== 'SAVED' && (
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 animate-fadeIn">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Secured Multiplier:</span>
                <span className="text-emerald-400 font-bold font-mono">{currentMultiplier}x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Current Payout:</span>
                <span className="text-white font-bold font-mono">
                  {Math.round(stake * currentMultiplier)} KES
                </span>
              </div>
              <div className="flex justify-between text-xs text-amber-400">
                <span>Next Goal Value:</span>
                <span className="font-mono font-bold">{nextMultiplier}x ({Math.round(stake * nextMultiplier)} KES)</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {gameState === 'IDLE' || gameState === 'WON' || gameState === 'SAVED' ? (
            <button
              type="button"
              onClick={startShootout}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 font-display font-black text-sm uppercase tracking-wider text-slate-950 rounded-xl shadow-lg transition-all cursor-pointer active:scale-98 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>START PENALTY ROUND ({stake} KES)</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCashout()}
                disabled={currentRound === 0}
                className={`w-full py-3.5 font-display font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer active:scale-98 flex items-center justify-center space-x-2 ${
                  currentRound > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>
                  {currentRound > 0
                    ? `TAKE WINNINGS: ${Math.round(stake * currentMultiplier)} KES`
                    : 'SCORE AT LEAST 1 GOAL'}
                </span>
              </button>
              <div className="text-[11px] text-center text-slate-400">
                🎯 Click on any target zone inside the goal to shoot!
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Football Goal Post & Penalty Spot */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative w-full max-w-xl aspect-[16/9] bg-gradient-to-b from-slate-950 via-emerald-950/60 to-emerald-900/80 rounded-2xl border-4 border-slate-700/80 p-4 shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Net Mesh Background Overlay */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #ffffff 10%, transparent 10%)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Goal Posts White Frame */}
            <div className="relative border-4 border-white rounded-t-xl w-full h-[75%] grid grid-cols-3 grid-rows-2 gap-2 p-2 shadow-2xl bg-black/30 backdrop-blur-[2px]">
              {/* Goalkeeper Silhouette */}
              <div
                className={`absolute transition-all duration-500 flex items-center justify-center text-2xl ${
                  goalieZone === 'top-left'
                    ? 'top-4 left-6 -rotate-45'
                    : goalieZone === 'top-right'
                    ? 'top-4 right-6 rotate-45'
                    : goalieZone === 'center'
                    ? 'top-8 left-1/2 -translate-x-1/2 -translate-y-4'
                    : goalieZone === 'bottom-left'
                    ? 'bottom-2 left-6 -rotate-90'
                    : goalieZone === 'bottom-right'
                    ? 'bottom-2 right-6 rotate-90'
                    : 'bottom-2 left-1/2 -translate-x-1/2'
                }`}
              >
                <div className="w-14 h-20 bg-amber-500 rounded-full border-2 border-white flex flex-col items-center justify-center shadow-lg text-slate-950 font-black text-xs">
                  <span>🧤</span>
                  <span>GK</span>
                </div>
              </div>

              {/* Target Zones Buttons */}
              {ZONES.map(z => {
                const isSelected = lastShotZone === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    disabled={gameState !== 'WAITING_KICK'}
                    onClick={() => handleShoot(z.id)}
                    className={`rounded-lg border-2 border-dashed flex items-center justify-center transition-all cursor-pointer ${
                      gameState === 'WAITING_KICK'
                        ? 'border-white/40 hover:border-amber-400 hover:bg-amber-400/20 active:scale-95'
                        : isSelected
                        ? 'border-yellow-400 bg-yellow-400/30'
                        : 'border-white/10 opacity-40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full border border-white/60 flex items-center justify-center text-xs font-bold text-white bg-black/40">
                      🎯
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Penalty Spot & Ball */}
            <div className="relative flex justify-center items-center py-2">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-950 flex items-center justify-center shadow-lg text-sm select-none">
                ⚽
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-4 text-center">
            {gameState === 'WON' && (
              <div className="text-emerald-400 font-black font-display text-base animate-fadeIn">
                🏆 GOOOOOAL! Cashed out {Math.round(stake * currentMultiplier)} KES!
              </div>
            )}
            {gameState === 'SAVED' && (
              <div className="text-red-400 font-black font-display text-base animate-fadeIn">
                🧤 Great save by the keeper! Penalty missed. Try again!
              </div>
            )}
            {gameState === 'WAITING_KICK' && (
              <div className="text-amber-400 font-bold text-xs animate-pulse">
                Goal {currentRound + 1} of 5: Tap a corner or center target inside the net!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
