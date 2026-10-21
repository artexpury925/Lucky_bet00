import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import {
  X,
  Share2,
  Copy,
  Check,
  Users,
  Gift,
  Coins,
  Sparkles,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Compute or fall back to user referral code
  const referralCode =
    user.referralCode ||
    `LUCKY-${(user.phoneNumber || '7777').replace(/\D/g, '').slice(-4)}${(user.username || 'LB').slice(0, 3).toUpperCase()}`;

  // Build the full referral link using current origin
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://luckybet.ke';
  const referralLink = `${baseUrl}/?ref=${encodeURIComponent(referralCode)}`;

  const handleCopy = () => {
    soundEngine.playClick();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(referralLink);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    soundEngine.playClick();
    const shareMessage = `🔥 Join me on LUCKY BET! Register now using my referral link and claim an instant 500 KES Welcome Bonus for Aviator & Sports Betting:\n\n${referralLink}\n\nGood luck! 🚀⚽`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNativeShare = async () => {
    soundEngine.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lucky Bet Kenya - Invitation Bonus',
          text: `Join Lucky Bet with my referral code ${referralCode} and claim 500 KES welcome bonus!`,
          url: referralLink,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow Header */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white overflow-hidden shrink-0">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/20 backdrop-blur-sm shadow-inner">
                <Gift className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                    Refer &amp; Earn
                  </span>
                  <span className="text-xs text-amber-200 font-semibold flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> 10% Cash Commission
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white mt-0.5">
                  Invite Friends, Get Paid
                </h3>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-amber-100/90 leading-relaxed relative z-10">
            Share your unique referral link. Whenever your invited friends make a deposit that is approved by the admin, you receive an instant <strong className="text-white underline decoration-amber-300">10% cash bonus</strong> straight to your balance!
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Live Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-1.5">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Friends Invited</span>
              <span className="text-xl font-black font-display text-white mt-0.5">
                {user.referralCount || 0}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1.5">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Total Bonus Earned</span>
              <span className="text-xl font-black font-display text-emerald-400 mt-0.5">
                {(user.referralBonusEarned || 0).toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-normal">KES</span>
              </span>
            </div>
          </div>

          {/* Referral Link Container */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" /> Your Unique Referral Link
              </span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Code: {referralCode}
              </span>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1.5">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent px-2 text-xs font-mono text-slate-300 focus:outline-none truncate selection:bg-amber-500 selection:text-slate-950"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`ml-1 px-3 py-1.5 rounded-md font-display font-extrabold text-xs uppercase flex items-center space-x-1 shrink-0 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Share WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 border border-slate-700 shadow-md transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share More</span>
              </button>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              How the Referral Program Works
            </h4>

            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-500/30">
                  1
                </span>
                <p>
                  <strong className="text-slate-200">Share your link:</strong> Send your personal invite link to friends via WhatsApp, SMS, or social media.
                </p>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-500/30">
                  2
                </span>
                <p>
                  <strong className="text-slate-200">Friend registers:</strong> Your friend signs up with your code and receives a free 500 KES Welcome Bonus.
                </p>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-500/30">
                  3
                </span>
                <p>
                  <strong className="text-emerald-400">Automatic Cash Commission:</strong> Whenever your referred friend requests a deposit and it is approved by the admin/cashier, you get credited with 10% bonus balance instantly!
                </p>
              </div>
            </div>
          </div>

          {/* Program Highlights */}
          <div className="p-3 bg-gradient-to-r from-emerald-950/30 to-teal-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlimited Referrals • Real-time Wallet Credit</span>
            </div>
            <span className="font-bold text-white font-mono bg-emerald-600/30 px-2 py-0.5 rounded border border-emerald-500/40">
              Active
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase font-display tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
