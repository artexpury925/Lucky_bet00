import React, { useEffect, useState } from 'react';
import { PushNotificationItem } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { X, Bell, ExternalLink, CheckCircle2, Trophy, Gift, ArrowRight } from 'lucide-react';

interface PushNotificationBannerProps {
  notification: PushNotificationItem | null;
  onDismiss: () => void;
  onAction: (payload?: PushNotificationItem['actionPayload']) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 7500; // 7.5 seconds display
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'DEPOSIT_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'MATCH_STARTING':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'REFERRAL_BONUS':
        return <Gift className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-amber-400" />;
    }
  };

  const getAccentGradient = () => {
    switch (notification.type) {
      case 'DEPOSIT_APPROVED':
        return 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/40';
      case 'MATCH_STARTING':
        return 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/40';
      case 'REFERRAL_BONUS':
        return 'from-orange-500/20 via-pink-500/10 to-transparent border-orange-500/40';
      default:
        return 'from-blue-500/20 via-slate-500/10 to-transparent border-blue-500/40';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-auto transition-all duration-300">
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl border shadow-2xl shadow-black/80 ${getAccentGradient()}`}
      >
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* App Icon / Type Badge */}
            <div className="shrink-0 relative">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center shadow-inner">
                {getIcon()}
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            </div>

            {/* Notification Text */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-0.5">
                <span className="font-bold text-amber-400">LUCKY BET PUSH</span>
                <span>•</span>
                <span>Just now</span>
              </div>
              <h4 className="text-sm font-black font-display text-white leading-tight">
                {notification.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                {notification.body}
              </p>

              {/* Action Button */}
              {notification.actionLabel && (
                <div className="mt-2.5 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onAction(notification.actionPayload);
                      onDismiss();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black text-xs font-display flex items-center space-x-1 shadow-md transition-all cursor-pointer"
                  >
                    <span>{notification.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onDismiss();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dismiss countdown progress bar */}
        <div className="w-full bg-slate-950/60 h-1">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
