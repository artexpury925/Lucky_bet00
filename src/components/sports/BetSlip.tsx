import React, { useState } from 'react';
import { SlipSelection, PlacedSportsBet } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { Receipt, Trash2, X, Sparkles, ChevronUp, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BetSlipProps {
  selections: SlipSelection[];
  placedBets: PlacedSportsBet[];
  userBalance: number;
  onRemoveSelection: (matchId: string, marketName: string) => void;
  onClearSlip: () => void;
  onPlaceBet: (stake: number, totalOdds: number, bonus: number, potentialWin: number) => void;
}

export const BetSlip: React.FC<BetSlipProps> = ({
  selections,
  placedBets,
  userBalance,
  onRemoveSelection,
  onClearSlip,
  onPlaceBet,
}) => {
  const [stake, setStake] = useState<number>(100);
  const [tab, setTab] = useState<'slip' | 'history'>('slip');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const calculateTotalOdds = () => {
    if (selections.length === 0) return 1.0;
    const prod = selections.reduce((acc, curr) => acc * curr.odds, 1);
    return Math.round(prod * 100) / 100;
  };

  const getBonusPercentage = (legsCount: number) => {
    if (legsCount <= 1) return 0;
    if (legsCount === 2) return 5;
    if (legsCount === 3) return 10;
    if (legsCount === 4) return 15;
    return 25; // 5+ legs accumulator boost!
  };

  const totalOdds = calculateTotalOdds();
  const bonusPct = getBonusPercentage(selections.length);
  const baseWin = stake * totalOdds;
  const potentialWin = baseWin * (1 + bonusPct / 100);

  const handlePlace = () => {
    soundEngine.playClick();
    if (stake <= 0 || stake > userBalance || selections.length === 0) return;
    onPlaceBet(stake, totalOdds, bonusPct, potentialWin);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-amber-400" />
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setTab('slip')}
              className={`px-2.5 py-1 text-xs font-display font-bold rounded-lg transition-all ${
                tab === 'slip'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Slip ({selections.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`px-2.5 py-1 text-xs font-display font-bold rounded-lg transition-all ${
                tab === 'history'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Bets ({placedBets.length})
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {tab === 'slip' && selections.length > 0 && (
            <button
              type="button"
              onClick={onClearSlip}
              title="Clear Slip"
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white sm:hidden"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {tab === 'slip' ? (
            selections.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Select odds from any live or upcoming football match to build your bet slip!
              </div>
            ) : (
              <>
                {/* Selections List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selections.map(item => (
                    <div
                      key={`${item.matchId}-${item.marketName}`}
                      className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 relative group text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => onRemoveSelection(item.matchId, item.marketName)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="font-semibold text-slate-200 pr-5 truncate">
                        {item.matchTitle}
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400 text-[11px]">{item.outcomeName}</span>
                        <span className="font-display font-black text-amber-400">
                          {item.odds.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accumulator Bonus Tag */}
                {bonusPct > 0 && (
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 p-2 rounded-xl flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-1 text-amber-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{selections.length} Legs Multi-Boost:</span>
                    </span>
                    <span className="font-display font-extrabold text-amber-400">
                      +{bonusPct}% Bonus
                    </span>
                  </div>
                )}

                {/* Total Odds & Stake */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Odds:</span>
                    <span className="font-display font-black text-lg text-white">
                      {totalOdds.toFixed(2)}
                    </span>
                  </div>

                  {/* Stake controls */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Stake (KES)</span>
                      <span>Balance: {userBalance.toFixed(2)} KES</span>
                    </div>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1.5">
                      <input
                        type="number"
                        min={10}
                        max={userBalance}
                        value={stake}
                        onChange={e => setStake(Math.max(10, Number(e.target.value)))}
                        className="w-full bg-transparent font-display font-bold text-white text-base focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 font-bold">KES</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[50, 100, 200, 500].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setStake(Math.min(userBalance, v))}
                          className="py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Potential Return */}
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Potential Win:</span>
                    <span className="font-display font-black text-base text-emerald-400">
                      {potentialWin.toFixed(2)} KES
                    </span>
                  </div>

                  {/* Place Bet Button */}
                  <button
                    type="button"
                    onClick={handlePlace}
                    disabled={stake <= 0 || stake > userBalance || selections.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-display font-extrabold text-sm uppercase tracking-wider text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-40"
                  >
                    PLACE BET ({stake} KES)
                  </button>
                </div>
              </>
            )
          ) : (
            /* Placed Bets History */
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {placedBets.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No active sports bets placed yet.
                </div>
              ) : (
                placedBets.map(bet => (
                  <div
                    key={bet.id}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-slate-300">
                        {bet.selections.length} Legs Slip
                      </span>
                      {bet.status === 'WON' ? (
                        <span className="text-emerald-400 font-bold flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>WON</span>
                        </span>
                      ) : bet.status === 'LOST' ? (
                        <span className="text-red-400 font-bold">LOST</span>
                      ) : (
                        <span className="text-amber-400 font-bold flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>IN PLAY</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {bet.selections.map(s => s.outcomeName).join(' • ')}
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-500">Stake: {bet.stake} KES</span>
                      <span className="font-display font-bold text-emerald-400">
                        Win: {bet.potentialWin.toFixed(2)} KES
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
