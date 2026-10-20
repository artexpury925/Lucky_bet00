import React, { useState } from 'react';
import { GamePhase, PlayerBetConfig } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { Minus, Plus, Zap, CheckCircle2 } from 'lucide-react';

interface BetPanelProps {
  id: 'bet1' | 'bet2';
  title: string;
  phase: GamePhase;
  currentMultiplier: number;
  betConfig: PlayerBetConfig;
  userBalance: number;
  onPlaceBet: (amount: number, autoCashoutEnabled: boolean, autoCashoutMultiplier: number) => void;
  onCancelBet: () => void;
  onCashOut: () => void;
}

export const BetPanel: React.FC<BetPanelProps> = ({
  title,
  phase,
  currentMultiplier,
  betConfig,
  userBalance,
  onPlaceBet,
  onCancelBet,
  onCashOut,
}) => {
  const [amount, setAmount] = useState<number>(betConfig.amount || 50);
  const [autoCashout, setAutoCashout] = useState<boolean>(betConfig.autoCashoutEnabled || false);
  const [autoMultiplier, setAutoMultiplier] = useState<number>(betConfig.autoCashoutMultiplier || 2.0);
  const [activeTab, setActiveTab] = useState<'bet' | 'auto'>('bet');

  const presets = [20, 50, 100, 200, 500];

  const handleQuickAdd = (delta: number) => {
    soundEngine.playClick();
    setAmount(prev => Math.max(10, Math.min(userBalance, prev + delta)));
  };

  const handlePresetSelect = (val: number) => {
    soundEngine.playClick();
    setAmount(Math.min(userBalance, val));
  };

  const handlePlace = () => {
    soundEngine.playClick();
    if (amount <= 0 || amount > userBalance) return;
    onPlaceBet(amount, autoCashout, autoMultiplier);
  };

  const livePotentialWin = (amount * currentMultiplier).toFixed(2);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
          {title}
        </span>
        <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('bet')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'bet'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auto')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center space-x-1 ${
              activeTab === 'auto'
                ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Auto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
        {/* Left Inputs Section */}
        <div className="space-y-2">
          {/* Amount Stepper */}
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800 focus-within:border-slate-600 transition-colors">
            <button
              type="button"
              disabled={betConfig.isPlaced && phase === 'FLYING'}
              onClick={() => handleQuickAdd(-10)}
              className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors disabled:opacity-40"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center font-display font-bold text-lg text-white">
              <input
                type="number"
                disabled={betConfig.isPlaced && phase === 'FLYING'}
                value={amount}
                min={10}
                max={userBalance}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-transparent text-center focus:outline-none"
              />
            </div>
            <button
              type="button"
              disabled={betConfig.isPlaced && phase === 'FLYING'}
              onClick={() => handleQuickAdd(10)}
              className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-1">
            {presets.map(val => (
              <button
                key={val}
                type="button"
                disabled={betConfig.isPlaced && phase === 'FLYING'}
                onClick={() => handlePresetSelect(val)}
                className={`py-1 text-[11px] font-bold rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-30 ${
                  amount === val ? 'ring-1 ring-amber-500 text-amber-400 font-extrabold' : ''
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {/* Auto Cashout Config (if Auto tab) */}
          {activeTab === 'auto' && (
            <div className="flex items-center justify-between bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/60 text-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={autoCashout}
                  onChange={e => setAutoCashout(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-900"
                />
                <span className="font-medium">Auto Cashout</span>
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.1"
                  min="1.01"
                  max="100"
                  value={autoMultiplier}
                  disabled={!autoCashout}
                  onChange={e => setAutoMultiplier(parseFloat(e.target.value) || 2.0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-display font-bold text-amber-400 text-xs disabled:opacity-40"
                />
                <span className="text-slate-400 text-xs">x</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Action / Bet Button Section */}
        <div className="h-full flex items-center">
          {/* Phase 1: Not placed yet */}
          {!betConfig.isPlaced && (
            <button
              type="button"
              onClick={handlePlace}
              disabled={phase === 'FLYING' || amount <= 0 || amount > userBalance}
              className="w-full h-20 md:h-24 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white shadow-lg shadow-emerald-950/50 flex flex-col items-center justify-center font-display font-extrabold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
            >
              <span className="text-base sm:text-xl group-hover:scale-105 transition-transform">
                {phase === 'FLYING' ? 'WAIT NEXT ROUND' : 'BET'}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold opacity-90 mt-0.5">
                {phase === 'FLYING' ? 'In Flight' : `${amount.toFixed(2)} KES`}
              </span>
            </button>
          )}

          {/* Phase 2: Placed & Waiting for takeoff */}
          {betConfig.isPlaced && phase === 'WAITING' && (
            <button
              type="button"
              onClick={onCancelBet}
              className="w-full h-20 md:h-24 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg shadow-red-950/50 flex flex-col items-center justify-center font-display font-bold uppercase transition-all cursor-pointer"
            >
              <span className="text-lg">CANCEL BET</span>
              <span className="text-xs opacity-90">{amount.toFixed(2)} KES (QUEUED)</span>
            </button>
          )}

          {/* Phase 3: Active in flight and NOT cashed out yet */}
          {betConfig.isPlaced && phase === 'FLYING' && !betConfig.hasCashedOut && (
            <button
              type="button"
              onClick={onCashOut}
              className="w-full h-20 md:h-24 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-slate-950 shadow-xl shadow-orange-950/60 flex flex-col items-center justify-center font-display font-black tracking-wide uppercase transition-all cursor-pointer animate-pulse"
            >
              <span className="text-xs sm:text-sm tracking-wider font-extrabold opacity-90">
                CASH OUT
              </span>
              <span className="text-2xl sm:text-3xl font-black mt-0.5">
                {livePotentialWin} <span className="text-base font-bold">KES</span>
              </span>
            </button>
          )}

          {/* Phase 4: Cashed out successfully */}
          {betConfig.isPlaced && betConfig.hasCashedOut && (
            <div className="w-full h-20 md:h-24 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex flex-col items-center justify-center text-center p-2">
              <div className="flex items-center space-x-1 text-emerald-400 text-xs font-bold uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cashed Out</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-display text-white mt-0.5">
                +{betConfig.winAmount.toFixed(2)} KES
              </div>
              <span className="text-xs text-emerald-300 font-semibold font-display">
                @ {betConfig.cashoutMultiplier.toFixed(2)}x
              </span>
            </div>
          )}

          {/* Phase 5: Crashed and player lost */}
          {betConfig.isPlaced && phase === 'CRASHED' && !betConfig.hasCashedOut && (
            <div className="w-full h-20 md:h-24 rounded-xl bg-red-950/60 border border-red-500/40 flex flex-col items-center justify-center text-center p-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Flew Away
              </span>
              <span className="text-lg font-bold font-display text-slate-300 mt-1">
                Lost {amount.toFixed(2)} KES
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
