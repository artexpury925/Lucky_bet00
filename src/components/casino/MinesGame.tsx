import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import {
  Bomb,
  Gem,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Play,
  CheckCircle,
} from 'lucide-react';

interface MinesGameProps {
  userBalance: number;
  onBet: (amount: number, description: string) => boolean;
  onWin: (amount: number, description: string) => void;
}

interface TileState {
  index: number;
  isMine: boolean;
  revealed: boolean;
}

// Multiplier calculation for Mines game (Fair mathematical house edge 0.97)
function calculateMultiplier(minesCount: number, gemsRevealed: number): number {
  if (gemsRevealed === 0) return 1.0;
  let prob = 1.0;
  for (let i = 0; i < gemsRevealed; i++) {
    prob *= (25 - minesCount - i) / (25 - i);
  }
  const rawMult = (1 / prob) * 0.97;
  return Math.max(1.01, Math.round(rawMult * 100) / 100);
}

export const MinesGame: React.FC<MinesGameProps> = ({
  userBalance,
  onBet,
  onWin,
}) => {
  const [stake, setStake] = useState<number>(50);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'WON' | 'LOST'>('IDLE');
  const [grid, setGrid] = useState<TileState[]>(() =>
    Array.from({ length: 25 }, (_, i) => ({ index: i, isMine: false, revealed: false }))
  );
  const [gemsCount, setGemsCount] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startGame = () => {
    if (userBalance < stake) {
      setErrorMsg(`Insufficient balance for KES ${stake}. Please deposit or lower stake.`);
      return;
    }
    setErrorMsg(null);

    const success = onBet(stake, `Mines Bet (Stake: ${stake} KES, ${minesCount} Mines)`);
    if (!success) return;

    soundEngine.playClick();

    // Place mines randomly
    const mineIndices = new Set<number>();
    while (mineIndices.size < minesCount) {
      mineIndices.add(Math.floor(Math.random() * 25));
    }

    const newGrid: TileState[] = Array.from({ length: 25 }, (_, i) => ({
      index: i,
      isMine: mineIndices.has(i),
      revealed: false,
    }));

    setGrid(newGrid);
    setGemsCount(0);
    setCurrentMultiplier(1.0);
    setGameState('PLAYING');
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'PLAYING') return;
    const tile = grid[index];
    if (tile.revealed) return;

    if (tile.isMine) {
      // Boom! Game Over
      soundEngine.playExplosion();
      setGrid(prev =>
        prev.map(t => (t.index === index ? { ...t, revealed: true } : { ...t, revealed: true }))
      );
      setGameState('LOST');
    } else {
      // Gem Found!
      soundEngine.playDiamond();
      const nextGems = gemsCount + 1;
      const nextMult = calculateMultiplier(minesCount, nextGems);

      setGrid(prev =>
        prev.map(t => (t.index === index ? { ...t, revealed: true } : t))
      );
      setGemsCount(nextGems);
      setCurrentMultiplier(nextMult);

      // Check if all gems uncovered
      if (nextGems === 25 - minesCount) {
        handleCashout(nextMult);
      }
    }
  };

  const handleCashout = (overrideMult?: number) => {
    if (gameState !== 'PLAYING' || gemsCount === 0) return;
    const mult = overrideMult || currentMultiplier;
    const winAmount = Math.round(stake * mult);

    soundEngine.playFanfare();
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {}

    onWin(winAmount, `Mines Cashout: ${mult}x (+${winAmount} KES)`);
    // Reveal rest of grid
    setGrid(prev => prev.map(t => ({ ...t, revealed: true })));
    setGameState('WON');
  };

  const handleAutoPick = () => {
    if (gameState !== 'PLAYING') return;
    const unrevealed = grid.filter(t => !t.revealed);
    if (unrevealed.length === 0) return;
    const randomTile = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    handleTileClick(randomTile.index);
  };

  const nextMultiplier = calculateMultiplier(minesCount, gemsCount + 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-lg border border-emerald-500/40">
            <Gem className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black font-display text-white">
                Mines Crash
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                97% RTP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Uncover diamonds, avoid the bombs, and cash out before you detonate!
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 self-end sm:self-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block">Current Multiplier</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {currentMultiplier.toFixed(2)}x
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 block">Diamonds Found</span>
            <span className="text-lg font-black font-mono text-amber-400">
              {gemsCount} / {25 - minesCount}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-950/60 border border-red-500/50 p-3 rounded-xl text-xs text-red-300 text-center">
          {errorMsg}
        </div>
      )}

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Game Controls (Bet, Mines selector, Actions) */}
        <div className="lg:col-span-4 bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4">
          {/* Bet Amount */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Bet Stake</span>
              <span className="text-white font-mono font-bold">{stake} KES</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[20, 50, 100, 200].map(amt => (
                <button
                  key={amt}
                  type="button"
                  disabled={gameState === 'PLAYING'}
                  onClick={() => {
                    soundEngine.playClick();
                    setStake(amt);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                    stake === amt
                      ? 'bg-emerald-600 text-white'
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
                disabled={gameState === 'PLAYING'}
                value={stake}
                onChange={e => setStake(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">KES</span>
            </div>
          </div>

          {/* Mines Selector */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Number of Mines</span>
              <span className="text-red-400 font-mono font-bold">{minesCount} Bombs</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 3, 5, 10].map(m => (
                <button
                  key={m}
                  type="button"
                  disabled={gameState === 'PLAYING'}
                  onClick={() => {
                    soundEngine.playClick();
                    setMinesCount(m);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                    minesCount === m
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Next Tile Profit Preview */}
          {gameState === 'PLAYING' && (
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Next Diamond Value:</span>
                <span className="text-emerald-400 font-bold font-mono">{nextMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Cashout Amount:</span>
                <span className="text-white font-bold font-mono">
                  {Math.round(stake * currentMultiplier)} KES
                </span>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          {gameState === 'IDLE' || gameState === 'WON' || gameState === 'LOST' ? (
            <button
              type="button"
              onClick={startGame}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-display font-black text-sm uppercase tracking-wider text-white rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer active:scale-98 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START MINES ROUND ({stake} KES)</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCashout()}
                disabled={gemsCount === 0}
                className={`w-full py-3.5 font-display font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer active:scale-98 flex items-center justify-center space-x-2 ${
                  gemsCount > 0
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 shadow-amber-950/40 animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>
                  {gemsCount > 0
                    ? `CASH OUT ${Math.round(stake * currentMultiplier)} KES`
                    : 'PICK A TILE FIRST'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleAutoPick}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all"
              >
                🎲 Random Safe Pick
              </button>
            </div>
          )}
        </div>

        {/* Right Side: 5x5 Mines Tile Grid */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner max-w-md w-full aspect-square">
            {grid.map(tile => {
              const isRevealed = tile.revealed;
              const isMine = tile.isMine;

              return (
                <button
                  key={tile.index}
                  type="button"
                  disabled={gameState !== 'PLAYING' || isRevealed}
                  onClick={() => handleTileClick(tile.index)}
                  className={`relative w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300 ${
                    !isRevealed
                      ? gameState === 'PLAYING'
                        ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700/80 hover:border-emerald-500 hover:scale-105 active:scale-95 cursor-pointer shadow-md'
                        : 'bg-slate-900 border border-slate-800 cursor-default'
                      : isMine
                      ? 'bg-gradient-to-br from-red-600 to-rose-900 border-2 border-red-500 animate-shake'
                      : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {isRevealed && (
                    <div className="animate-fadeIn scale-110">
                      {isMine ? (
                        <Bomb className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                      ) : (
                        <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 drop-shadow-md animate-bounce" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="mt-4 text-center">
            {gameState === 'WON' && (
              <div className="text-emerald-400 font-black font-display text-sm animate-fadeIn">
                🎉 Won {Math.round(stake * currentMultiplier)} KES at {currentMultiplier.toFixed(2)}x Multiplier!
              </div>
            )}
            {gameState === 'LOST' && (
              <div className="text-red-400 font-black font-display text-sm animate-fadeIn">
                💥 Boom! Hit a bomb. Better luck on the next sweep!
              </div>
            )}
            {gameState === 'PLAYING' && (
              <div className="text-slate-400 text-xs">
                Tap any tile to uncover gems. Cash out anytime to lock in your profit!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
