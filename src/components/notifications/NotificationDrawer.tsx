import React, { useState } from 'react';
import { PushNotificationItem } from '../../types';
import { notificationService } from '../../utils/notificationService';
import { soundEngine } from '../../utils/soundEngine';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Trophy,
  CheckCircle2,
  Gift,
  Sparkles,
  ArrowRight,
  Send,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotificationItem[];
  onAction: (payload?: PushNotificationItem['actionPayload']) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onAction,
  onMarkAllAsRead,
  onClear,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'DEPOSIT_APPROVED' | 'MATCH_STARTING' | 'REFERRAL_BONUS'>('ALL');
  const [permissionState, setPermissionState] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filter === 'ALL') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRequestPermission = async () => {
    soundEngine.playClick();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermissionState(res);
        if (res === 'granted') {
          notificationService.push({
            type: 'SYSTEM',
            title: '🔔 System Push Notifications Enabled',
            body: 'You will now receive desktop and mobile push alerts for deposit approvals and major tournament fixtures!',
          });
        }
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
  };

  const formatTimestamp = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getIcon = (type: PushNotificationItem['type']) => {
    switch (type) {
      case 'DEPOSIT_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'MATCH_STARTING':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'REFERRAL_BONUS':
        return <Gift className="w-4 h-4 text-orange-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-black text-base text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black font-mono">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Deposit updates, tournament alerts &amp; bonuses</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onMarkAllAsRead();
                }}
                title="Mark all as read"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onClear();
                }}
                title="Clear all notifications"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'DEPOSIT_APPROVED', label: 'Deposits' },
            { id: 'MATCH_STARTING', label: 'Tournaments' },
            { id: 'REFERRAL_BONUS', label: 'Referrals' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setFilter(tab.id as any);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-400">No notifications in this filter</p>
              <p className="text-xs text-slate-500 mt-0.5">Use the test buttons below to trigger simulated alerts</p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.read
                    ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                    : 'bg-slate-950/90 border-slate-700/80 text-white shadow-md'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                        {item.type.replace('_', ' ')}
                      </span>
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {item.body}
                    </p>

                    {item.actionLabel && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            onAction(item.actionPayload);
                            onClose();
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Interactive Simulator Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Push Alert Testing Sandbox:
            </span>
            {permissionState === 'default' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="text-[11px] text-amber-400 hover:underline font-bold"
              >
                Enable Browser Notifications &rarr;
              </button>
            )}
            {permissionState === 'granted' && (
              <span className="text-[10px] text-emerald-400 font-mono">
                ● Device alerts active
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                notificationService.notifyDepositApproved(500, 'QK' + Math.floor(10000000 + Math.random() * 90000000));
              }}
              className="py-2 px-3 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simulate Deposit Approval</span>
            </button>

            <button
              type="button"
              onClick={() => {
                notificationService.notifyMatchStarting();
              }}
              className="py-2 px-3 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Simulate Match Starting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
