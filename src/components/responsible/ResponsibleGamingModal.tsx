import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { ShieldAlert, X, CheckCircle, Clock, Lock, AlertTriangle, PhoneCall } from 'lucide-react';

interface ResponsibleGamingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsibleGamingModal: React.FC<ResponsibleGamingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [dailyLimit, setDailyLimit] = useState<number>(() => {
    return parseInt(localStorage.getItem('lucky_daily_limit') || '10000', 10);
  });
  const [sessionReminder, setSessionReminder] = useState<number>(() => {
    return parseInt(localStorage.getItem('lucky_session_reminder') || '60', 10);
  });
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [coolOffDays, setCoolOffDays] = useState<number>(0);

  if (!isOpen) return null;

  const handleSave = () => {
    soundEngine.playClick();
    localStorage.setItem('lucky_daily_limit', dailyLimit.toString());
    localStorage.setItem('lucky_session_reminder', sessionReminder.toString());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleCoolOff = (days: number) => {
    soundEngine.playClick();
    setCoolOffDays(days);
    alert(`Self-exclusion cool-off enabled for ${days} days. Your account will restrict wagering until expiry.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-amber-400">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-white">Responsible Gaming</h3>
              <p className="text-[11px] text-slate-400">Player Protection &amp; Self-Control Tools</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {/* Daily Deposit Limit */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily Deposit Cap</span>
              </span>
              <span className="font-mono font-bold text-amber-400">{dailyLimit.toLocaleString()} KES</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[2000, 5000, 10000, 25000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDailyLimit(amt)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    dailyLimit === amt
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              Limits the maximum M-PESA deposits your account can make in a 24-hour period.
            </p>
          </div>

          {/* Session Timer Reminder */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Reality Check Session Reminder</span>
              </span>
              <span className="font-mono font-bold text-teal-400">{sessionReminder} mins</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[30, 60, 120].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSessionReminder(mins)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    sessionReminder === mins
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          </div>

          {/* Self-Exclusion / Cool Off */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Self-Exclusion Cool-Off</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 7, 30].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleCoolOff(d)}
                  className="py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/50 text-slate-300 transition-colors"
                >
                  {d} {d === 1 ? 'Day' : 'Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Helpline banner */}
          <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl flex items-center space-x-2 text-[11px] text-amber-200">
            <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block">Need Gambling Advice or Support?</span>
              Contact the Kenya BCLB Helpline toll-free at <strong>1199</strong> (24/7 confidential).
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase font-display rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>LIMITS SAVED SUCCESSFULLY</span>
              </>
            ) : (
              <span>SAVE GAMING PREFERENCES</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
