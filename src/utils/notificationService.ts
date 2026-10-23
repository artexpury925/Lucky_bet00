import { PushNotificationItem } from '../types';
import { soundEngine } from './soundEngine';

type NotificationListener = (notification: PushNotificationItem) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private history: PushNotificationItem[] = [];

  constructor() {
    // Seed initial welcome & tournament notification
    this.history = [
      {
        id: 'init-tourn-1',
        type: 'MATCH_STARTING',
        title: '⚽ UEFA Champions League: Man City vs Real Madrid',
        body: 'Major European clash kicks off soon! Boosted home odds at 2.15x. Place your bets now.',
        timestamp: Date.now() - 1000 * 60 * 12,
        read: false,
        actionLabel: 'Bet Now',
        actionPayload: { type: 'OPEN_SPORTS' },
      },
      {
        id: 'init-welcome',
        type: 'SYSTEM',
        title: '🎉 Welcome to Lucky Bet Kenya!',
        body: 'Your 100 KES welcome credit is active. Invite friends with your referral link to earn 20 KES on every deposit they make!',
        timestamp: Date.now() - 1000 * 60 * 30,
        read: false,
        actionLabel: 'Invite Friends',
        actionPayload: { type: 'OPEN_REFERRAL' },
      },
    ];
  }

  public subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getHistory(): PushNotificationItem[] {
    return [...this.history];
  }

  public markAllAsRead() {
    this.history = this.history.map(item => ({ ...item, read: true }));
  }

  public markAsRead(id: string) {
    this.history = this.history.map(item =>
      item.id === id ? { ...item, read: true } : item
    );
  }

  public clearHistory() {
    this.history = [];
  }

  public push(item: Omit<PushNotificationItem, 'id' | 'timestamp' | 'read'>) {
    const fullItem: PushNotificationItem = {
      ...item,
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      read: false,
    };

    // Prepend to history
    this.history.unshift(fullItem);
    if (this.history.length > 50) {
      this.history.pop();
    }

    // Play procedural notification chime
    soundEngine.playNotification();

    // Trigger browser native system notification if supported and granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(fullItem.title, {
          body: fullItem.body,
          icon: '/favicon.ico',
        });
      } catch {}
    }

    // Notify all active listeners
    this.listeners.forEach(listener => {
      try {
        listener(fullItem);
      } catch (err) {
        console.warn('Notification listener error:', err);
      }
    });

    return fullItem;
  }

  // Trigger deposit approval alert
  public notifyDepositApproved(amount: number, code: string) {
    return this.push({
      type: 'DEPOSIT_APPROVED',
      title: `🎉 Deposit Approved! +KES ${amount.toFixed(2)}`,
      body: `Your deposit request (${code}) has been approved by the cashier and credited to your wallet balance.`,
      actionLabel: 'View Wallet',
      actionPayload: { type: 'OPEN_CASHIER' },
    });
  }

  // Trigger tournament match starting soon alert
  public notifyMatchStarting(matchDetails?: { teams: string; league: string; startsIn: string; odds: string }) {
    const defaultMatches = [
      {
        teams: 'Arsenal vs Chelsea',
        league: 'English Premier League',
        startsIn: '15 minutes',
        odds: '1.95 | 3.50 | 3.80',
      },
      {
        teams: 'Real Madrid vs Barcelona',
        league: 'La Liga El Clásico',
        startsIn: '20 minutes',
        odds: '2.20 | 3.40 | 3.10',
      },
      {
        teams: 'Gor Mahia vs AFC Leopards',
        league: 'Mashemeji Derby - Kenya Premier League',
        startsIn: '10 minutes',
        odds: '1.85 | 3.10 | 4.20',
      },
      {
        teams: 'Bayern Munich vs PSG',
        league: 'UEFA Champions League',
        startsIn: '25 minutes',
        odds: '2.05 | 3.60 | 3.30',
      },
    ];

    const pick = matchDetails || defaultMatches[Math.floor(Math.random() * defaultMatches.length)];

    return this.push({
      type: 'MATCH_STARTING',
      title: `⚽ Match Starting Soon: ${pick.teams}`,
      body: `Major fixture in ${pick.league} kicks off in ${pick.startsIn}! Boosted odds: ${pick.odds}. Place your picks now.`,
      actionLabel: 'Bet Match',
      actionPayload: { type: 'OPEN_SPORTS' },
    });
  }

  // Trigger referral bonus alert
  public notifyReferralBonus(friendUsername: string, bonusAmount: number, depositAmount: number) {
    return this.push({
      type: 'REFERRAL_BONUS',
      title: `🎁 Referral Bonus Credited! +KES ${bonusAmount.toFixed(2)}`,
      body: `Your invited friend @${friendUsername} made an approved deposit of KES ${depositAmount}. You earned an instant 20 KES cash bonus!`,
      actionLabel: 'Invite More',
      actionPayload: { type: 'OPEN_REFERRAL' },
    });
  }
}

export const notificationService = new NotificationService();
