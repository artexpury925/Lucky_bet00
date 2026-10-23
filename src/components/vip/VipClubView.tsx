import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import {
  Crown,
  ShieldCheck,
  Sparkles,
  Zap,
  Gift,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';

interface VipClubViewProps {
  userBalance: number;
  userUsername: string;
  totalDeposited: number;
  onClaimCashback: (amount: number, description: string) => void;
}

interface VipTier {
  id: string;
  name: string;
  cashbackPct: number;
  requiredTurnover: number;
  color: string;
  borderColor: string;
  textColor: string;
  perks: string[];
}

const VIP_TIERS: VipTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Starter',
    cashbackPct: 3,
    requiredTurnover: 0,
    color: 'from-amber-900/60 to-slate-900',
    borderColor: 'border-amber-700/50',
    textColor: 'text-amber-500',
    perks: ['Standard M-PESA Payouts', '100 KES Welcome Bonus', 'Community Chat Access'],
  },
  {
    id: 'silver',
    name: 'Silver Striker',
    cashbackPct: 5,
    requiredTurnover: 2000,
    color: 'from-slate-400/20 to-slate-900',
    borderColor: 'border-slate-400/50',
    textColor: 'text-slate-300',
    perks: ['5% Weekly Loss Cashback', 'Daily Free Spin Boosts', 'Priority Deposit Approval'],
  },
  {
    id: 'gold',
    name: 'Gold High-Roller',
    cashbackPct: 8,
    requiredTurnover: 10000,
    color: 'from-amber-500/20 to-slate-900',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
    perks: ['8% Weekly Loss Cashback', 'Instant M-PESA Cashouts (Under 3 mins)', '+5% Aviator Win Multipliers'],
  },
  {
    id: 'platinum',
    name: 'Platinum Legend',
    cashbackPct: 12,
    requiredTurnover: 50000,
    color: 'from-cyan-500/20 to-slate-900',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-400',
    perks: ['12% Weekly Loss Cashback', 'Personal VIP WhatsApp Host', 'Unlimited Daily Withdrawals'],
  },
  {
    id: 'diamond',
    name: 'Diamond King',
    cashbackPct: 15,
    requiredTurnover: 200000,
    color: 'from-purple-500/20 to-slate-900',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400',
    perks: ['15% Weekly Loss Cashback', 'Luxury All-Expenses Trip to EPL Match', 'No-Limit Sports Multi-bets'],
  },
];

export const VipClubView: React.FC<VipClubViewProps> = ({
  userBalance,
  userUsername,
  totalDeposited,
  onClaimCashback,
}) => {
  const [cashbackClaimed, setCashbackClaimed] = useState<boolean>(false);

  // Determine current VIP tier based on deposits / turnover
  const currentTier =
    totalDeposited >= 200000
      ? VIP_TIERS[4]
      : totalDeposited >= 50000
      ? VIP_TIERS[3]
      : totalDeposited >= 10000
      ? VIP_TIERS[2]
      : totalDeposited >= 2000
      ? VIP_TIERS[1]
      : VIP_TIERS[0];

  const nextTierIndex = VIP_TIERS.findIndex(t => t.id === currentTier.id) + 1;
  const nextTier = nextTierIndex < VIP_TIERS.length ? VIP_TIERS[nextTierIndex] : null;

  const currentTurnover = Math.max(totalDeposited * 1.5, 800);
  const targetTurnover = nextTier ? nextTier.requiredTurnover : currentTurnover;
  const progressPct = Math.min(100, Math.round((currentTurnover / targetTurnover) * 100));

  // Calculated weekly cashback reward amount (e.g. 5% of turnover)
  const cashbackAmount = Math.max(150, Math.round(currentTurnover * (currentTier.cashbackPct / 100)));

  const handleClaim = () => {
    if (cashbackClaimed) return;
    soundEngine.playFanfare();
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}

    onClaimCashback(cashbackAmount, `VIP Weekly Cashback (${currentTier.name}: +${cashbackAmount} KES)`);
    setCashbackClaimed(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* VIP Status Banner */}
      <div className="relative bg-gradient-to-r from-amber-600 via-purple-900 to-slate-950 rounded-2xl p-6 text-white overflow-hidden shadow-xl border border-amber-500/40">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-950/70 border-2 border-amber-400/60 flex items-center justify-center text-amber-400 shadow-xl">
              <Crown className="w-9 h-9 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-black uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Current Status
                </span>
                <span className="text-xs text-amber-200 font-bold">{userUsername}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
                {currentTier.name}
              </h2>
              <p className="text-xs text-slate-300">
                Enjoy <strong className="text-amber-300">{currentTier.cashbackPct}% weekly loss cashback</strong> and VIP payout benefits.
              </p>
            </div>
          </div>

          {/* Cashback Card */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/20 text-center w-full md:w-auto shrink-0 space-y-2">
            <div className="text-[11px] text-slate-400 font-mono">Available Weekly Cashback</div>
            <div className="text-2xl font-black font-display text-emerald-400">
              +{cashbackAmount.toLocaleString()} KES
            </div>
            <button
              type="button"
              onClick={handleClaim}
              disabled={cashbackClaimed}
              className={`w-full py-2 px-4 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                !cashbackClaimed
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 animate-pulse active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {cashbackClaimed ? '✓ CASHBACK CLAIMED' : 'CLAIM WEEKLY CASHBACK'}
            </button>
          </div>
        </div>

        {/* Next Tier Progress Bar */}
        {nextTier && (
          <div className="mt-5 pt-4 border-t border-white/10 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">
                Progress to <strong className="text-white">{nextTier.name}</strong> ({nextTier.cashbackPct}% Cashback):
              </span>
              <span className="text-amber-300 font-bold">
                {currentTurnover.toLocaleString()} / {targetTurnover.toLocaleString()} KES ({progressPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tier Comparison Cards */}
      <div>
        <h3 className="text-base font-black font-display text-white mb-3 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>VIP Loyalty Tiers &amp; Benefits</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {VIP_TIERS.map(tier => {
            const isCurrent = tier.id === currentTier.id;

            return (
              <div
                key={tier.id}
                className={`bg-gradient-to-b ${tier.color} border ${
                  isCurrent ? 'border-amber-400 ring-2 ring-amber-400/30' : tier.borderColor
                } rounded-xl p-3.5 flex flex-col justify-between text-xs space-y-3 shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-black font-display text-sm ${tier.textColor}`}>
                      {tier.name}
                    </span>
                    {isCurrent && (
                      <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded font-mono uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black font-mono text-white">
                    {tier.cashbackPct}% <span className="text-xs text-slate-400 font-normal">Cashback</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  {tier.perks.map((perk, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-[11px] text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
