import React, { useState, useEffect, useRef } from 'react';
import {
  AviatorHourlyMood,
  AviatorTheme,
  GamePhase,
  AviatorHistoryItem,
  PlayerBetConfig,
  SimulatedPlayer,
  FootballMatch,
  SlipSelection,
  PlacedSportsBet,
  WalletTransaction,
  UserAccount,
  PendingDeposit,
} from './types';
import { AviatorCanvas } from './components/aviator/AviatorCanvas';
import { BetPanel } from './components/aviator/BetPanel';
import { FlightHistory } from './components/aviator/FlightHistory';
import { LiveBetsTable } from './components/aviator/LiveBetsTable';
import { SportsBetting } from './components/sports/SportsBetting';
import { BetSlip } from './components/sports/BetSlip';
import { MinesGame } from './components/casino/MinesGame';
import { PenaltyShootout } from './components/casino/PenaltyShootout';
import { DailySpinWheelModal } from './components/spin/DailySpinWheelModal';
import { LiveCommunityChat } from './components/chat/LiveCommunityChat';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { ProvablyFairModal } from './components/provablyFair/ProvablyFairModal';
import { MegaJackpot } from './components/jackpot/MegaJackpot';
import { VipClubView } from './components/vip/VipClubView';
import { ResponsibleGamingModal } from './components/responsible/ResponsibleGamingModal';
import { AuthModals } from './components/auth/AuthModals';
import { AuthGateway } from './components/auth/AuthGateway';
import { CashierModal } from './components/cashier/CashierModal';
import { StkPushModal } from './components/cashier/StkPushModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { PushNotificationBanner } from './components/notifications/PushNotificationBanner';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ReferralModal } from './components/referral/ReferralModal';
import { notificationService } from './utils/notificationService';
import { dailyFootballService } from './utils/dailyFootballService';
import { ussdPromptService } from './utils/ussdPromptService';
import { soundEngine } from './utils/soundEngine';
import { generateCrashPoint, sha256, getCurrentHourMood, getMoodDetails } from './utils/provablyFair';
import { realtimeClient } from './utils/realtimeClient';
import confetti from 'canvas-confetti';
import {
  Flame,
  Volume2,
  VolumeX,
  Palette,
  Wallet,
  Shield,
  ShieldCheck,
  Trophy,
  Plane,
  Radio,
  User,
  Plus,
  HelpCircle,
  ExternalLink,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  Gift,
  Bell,
  Sparkles,
  Bomb,
  MessageSquare,
  RotateCw,
  Crown,
  ShieldAlert,
} from 'lucide-react';

// Dynamic daily football matches from live schedule service
const INITIAL_MATCHES: FootballMatch[] = dailyFootballService.getMatches();

// Simulated initial history
const INITIAL_HISTORY: AviatorHistoryItem[] = [
  { id: 'h1', roundNumber: 8421, multiplier: 2.45, timestamp: Date.now() - 40000, hash: 'a4f89b12c8e3...4b1' },
  { id: 'h2', roundNumber: 8422, multiplier: 1.18, timestamp: Date.now() - 35000, hash: 'c901bc430e7...88a' },
  { id: 'h3', roundNumber: 8423, multiplier: 14.82, timestamp: Date.now() - 30000, hash: '7e289f41b2...91d' },
  { id: 'h4', roundNumber: 8424, multiplier: 3.12, timestamp: Date.now() - 25000, hash: '3d8102a9cf...33b' },
  { id: 'h5', roundNumber: 8425, multiplier: 1.05, timestamp: Date.now() - 20000, hash: 'e992b810fa...71c' },
  { id: 'h6', roundNumber: 8426, multiplier: 5.64, timestamp: Date.now() - 15000, hash: '210acbf941...55e' },
  { id: 'h7', roundNumber: 8427, multiplier: 1.88, timestamp: Date.now() - 10000, hash: '88bfe4301a...99f' },
  { id: 'h8', roundNumber: 8428, multiplier: 22.40, timestamp: Date.now() - 5000, hash: '5561a09cb1...22c' },
];

export default function App() {
  // Navigation View
  const [activeTab, setActiveTab] = useState<MainNavTab>('aviator');

  // Theme & Audio
  const [theme, setTheme] = useState<AviatorTheme>('classic-red');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Known legacy virtual phones to ignore
  const VIRTUAL_PHONES = ['0712345678', '0722894102', '0714529381', '0799812401'];

  // Persistent Auth State with Remember Me Support
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const remember = localStorage.getItem('lucky_bet_remember_me') === 'true';
    const localToken = localStorage.getItem('lucky_bet_auth_token');
    const sessionToken = sessionStorage.getItem('lucky_bet_auth_token');
    const activeToken = (remember && localToken) || sessionToken;
    if (activeToken && !VIRTUAL_PHONES.includes(activeToken)) {
      return true;
    }
    return false;
  });

  // User & Wallet State (Real user accounts only)
  const [user, setUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('lucky_bet_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.phoneNumber && !VIRTUAL_PHONES.includes(parsed.phoneNumber)) {
          return parsed;
        }
      } catch {}
    }
    return {
      phoneNumber: '',
      username: '',
      balance: 100.0,
      joinedAt: Date.now(),
      initialBonusClaimed: true,
      totalDepositedDemo: 0,
      totalWithdrawnDemo: 0,
    };
  });

  const handleAuthSuccess = (account: UserAccount, rememberMe: boolean) => {
    setUser(account);
    setIsAuthenticated(true);
    setIsAuthOpen(false);
    // Realtime broadcast to server so admin panel on other devices sees the new user immediately
    realtimeClient.syncUserToServer(account);
  };

  const handleLogout = () => {
    soundEngine.playClick();
    localStorage.removeItem('lucky_bet_auth_token');
    sessionStorage.removeItem('lucky_bet_auth_token');
    localStorage.removeItem('lucky_bet_active_user');
    localStorage.setItem('lucky_bet_remember_me', 'false');
    setIsAuthenticated(false);
    setUser({
      phoneNumber: '',
      username: '',
      balance: 100.0,
      joinedAt: Date.now(),
      initialBonusClaimed: true,
      totalDepositedDemo: 0,
      totalWithdrawnDemo: 0,
    });
  };

  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 'tx-welcome',
      type: 'BONUS',
      amount: 100,
      balanceAfter: 100,
      description: 'Welcome Free Bonus (100 KES)',
      timestamp: Date.now() - 3600000,
    },
  ]);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isCashierOpen, setIsCashierOpen] = useState<boolean>(false);
  const [cashierTab, setCashierTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isReferralOpen, setIsReferralOpen] = useState<boolean>(false);
  const [isSpinOpen, setIsSpinOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isFairOpen, setIsFairOpen] = useState<boolean>(false);
  const [isResponsibleOpen, setIsResponsibleOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [activePushNotification, setActivePushNotification] = useState<any>(null);
  const [notificationHistory, setNotificationHistory] = useState<any[]>(() => notificationService.getHistory());
  const adminClickCounterRef = useRef<number>(0);

  const handleOpenDeposit = () => {
    soundEngine.playClick();
    setCashierTab('deposit');
    setIsCashierOpen(true);
  };

  const handleOpenWithdraw = () => {
    soundEngine.playClick();
    setCashierTab('withdraw');
    setIsCashierOpen(true);
  };

  // Aviator Core State
  const [phase, setPhase] = useState<GamePhase>('WAITING');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [countdown, setCountdown] = useState<number>(5.0);
  const [roundNumber, setRoundNumber] = useState<number>(8429);
  const roundNumberRef = useRef<number>(8429);
  const [history, setHistory] = useState<AviatorHistoryItem[]>(INITIAL_HISTORY);
  const [rtpRate, setRtpRate] = useState<number>(0.97);
  const forcedMultiplierRef = useRef<number | null>(null);

  // Hourly Volatility Mood (Fair, Generous, Greedy cycle)
  const [hourlyMood, setHourlyMood] = useState<AviatorHourlyMood>(() => getCurrentHourMood());
  const hourlyMoodRef = useRef<AviatorHourlyMood>(hourlyMood);
  const [isAutoMood, setIsAutoMood] = useState<boolean>(true);
  const isAutoMoodRef = useRef<boolean>(true);
  const [minutesToShift, setMinutesToShift] = useState<number>(() => 60 - new Date().getMinutes());

  useEffect(() => {
    hourlyMoodRef.current = hourlyMood;
  }, [hourlyMood]);

  useEffect(() => {
    isAutoMoodRef.current = isAutoMood;
  }, [isAutoMood]);

  // Hourly clock check: checks current minute and updates mood rotation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setMinutesToShift(Math.max(1, 60 - now.getMinutes()));
      if (isAutoMoodRef.current) {
        const currentM = getCurrentHourMood();
        setHourlyMood(currentM);
      }
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Player Dual Bet Panels State
  const [bet1, setBet1] = useState<PlayerBetConfig>({
    amount: 50,
    autoCashoutEnabled: false,
    autoCashoutMultiplier: 2.0,
    isPlaced: false,
    hasCashedOut: false,
    cashoutMultiplier: 0,
    winAmount: 0,
  });

  const [bet2, setBet2] = useState<PlayerBetConfig>({
    amount: 100,
    autoCashoutEnabled: false,
    autoCashoutMultiplier: 3.0,
    isPlaced: false,
    hasCashedOut: false,
    cashoutMultiplier: 0,
    winAmount: 0,
  });

  // Simulated live room players
  const [simPlayers, setSimPlayers] = useState<SimulatedPlayer[]>([]);
  const [myFlightHistory, setMyFlightHistory] = useState<
    { round: number; bet: number; mult: number; win: number; date: string }[]
  >([]);

  // Sports Betting State
  const [matches, setMatches] = useState<FootballMatch[]>(INITIAL_MATCHES);
  const [activeSlip, setActiveSlip] = useState<SlipSelection[]>([]);
  const [placedSportsBets, setPlacedSportsBets] = useState<PlacedSportsBet[]>([]);

  // Registered Users Directory (Authoritative real users only)
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('lucky_bet_all_users');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          return list.filter(u => u && u.phoneNumber && !VIRTUAL_PHONES.includes(u.phoneNumber));
        }
      } catch {}
    }
    return [];
  });

  // Pending M-PESA Deposits Queue (Real player deposits only)
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>(() => {
    const saved = localStorage.getItem('lucky_bet_pending_deposits');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          return list.filter(d => d && !['dep-101', 'dep-102'].includes(d.id));
        }
      } catch {}
    }
    return [];
  });

  // Save registered users & pending deposits to localStorage
  useEffect(() => {
    localStorage.setItem('lucky_bet_all_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('lucky_bet_pending_deposits', JSON.stringify(pendingDeposits));
  }, [pendingDeposits]);

  // Keep user in localStorage and sync with registeredUsers
  useEffect(() => {
    if (!user.phoneNumber || VIRTUAL_PHONES.includes(user.phoneNumber)) return;
    localStorage.setItem('lucky_bet_active_user', JSON.stringify(user));
    setRegisteredUsers(prev => {
      const idx = prev.findIndex(u => u.phoneNumber === user.phoneNumber);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = user;
        return updated;
      }
      return [user, ...prev];
    });
  }, [user]);

  // Real-time server sync function
  const refreshLiveStatus = async () => {
    const status = await realtimeClient.fetchLiveStatus();
    if (!status) return;
    if (Array.isArray(status.users)) {
      setRegisteredUsers(status.users.filter(u => u && !VIRTUAL_PHONES.includes(u.phoneNumber)));
    }
    if (Array.isArray(status.pendingDeposits)) {
      setPendingDeposits(status.pendingDeposits.filter(d => d && !['dep-101', 'dep-102'].includes(d.id)));
    }
  };

  // Real-time synchronization across all devices and clients
  useEffect(() => {
    let isMounted = true;

    const syncInitialState = async () => {
      const status = await realtimeClient.fetchLiveStatus();
      if (!isMounted || !status) return;
      if (Array.isArray(status.users)) {
        setRegisteredUsers(status.users.filter(u => u && !VIRTUAL_PHONES.includes(u.phoneNumber)));
      }
      if (Array.isArray(status.pendingDeposits)) {
        setPendingDeposits(status.pendingDeposits.filter(d => d && !['dep-101', 'dep-102'].includes(d.id)));
      }
    };

    syncInitialState();

    // Subscribe to real-time server-sent events (SSE)
    const unsubscribe = realtimeClient.subscribeToEvents(event => {
      if (!isMounted) return;

      if (Array.isArray(event.users)) {
        setRegisteredUsers(event.users.filter(u => u && !VIRTUAL_PHONES.includes(u.phoneNumber)));
      }

      if (Array.isArray(event.pendingDeposits)) {
        setPendingDeposits(event.pendingDeposits.filter(d => d && !['dep-101', 'dep-102'].includes(d.id)));
      }

      if (event.type === 'USER_DELETED' && event.data?.phoneNumber) {
        setRegisteredUsers(prev => prev.filter(u => u.phoneNumber !== event.data.phoneNumber));
      }

      if (event.type === 'ALL_USERS_CLEARED') {
        setRegisteredUsers([]);
        setPendingDeposits([]);
      }

      if (event.type === 'USER_REGISTERED' || event.type === 'USER_UPDATED') {
        if (event.data?.user) {
          const u = event.data.user;
          setRegisteredUsers(prev => {
            const idx = prev.findIndex(item => item.phoneNumber === u.phoneNumber);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...u };
              return updated;
            }
            return [u, ...prev];
          });

          // Sync current active user if updated by admin or another session
          setUser(curr => {
            if (curr.phoneNumber === u.phoneNumber) {
              return { ...curr, ...u };
            }
            return curr;
          });
        }
      }

      if (event.type === 'DEPOSIT_APPROVED') {
        const u = event.data?.updatedUser;
        const dep = event.data?.deposit;
        if (u) {
          setUser(curr => {
            if (curr.phoneNumber === u.phoneNumber) {
              if (dep) {
                notificationService.notifyDepositApproved(dep.amount, dep.code);
              }
              return { ...curr, balance: u.balance, totalDepositedDemo: u.totalDepositedDemo };
            }
            return curr;
          });
        }
      }

      if (event.type === 'REFERRAL_BONUS_AWARDED' && event.data) {
        const data = event.data;
        setUser(curr => {
          if (curr.phoneNumber === data.referrerPhone) {
            recordTransaction(
              'REFERRAL_BONUS',
              data.bonusAmount,
              `Referral Cash Bonus: Friend @${data.friendUsername} deposit (+${data.bonusAmount} KES)`,
              data.newBalance
            );
            notificationService.notifyReferralBonus(
              data.friendUsername,
              data.bonusAmount,
              data.depositAmount
            );
            return {
              ...curr,
              balance: data.newBalance,
              referralBonusEarned: (curr.referralBonusEarned || 0) + data.bonusAmount,
            };
          }
          return curr;
        });
      }
    });

    // Continual short polling every 3 seconds to guarantee updates across devices
    const pollInterval = setInterval(() => {
      syncInitialState();
    }, 3000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Subscribe to Notification Service
  useEffect(() => {
    const unsub = notificationService.subscribe(notif => {
      setActivePushNotification(notif);
      setNotificationHistory(notificationService.getHistory());
    });
    return unsub;
  }, []);

  // Subscribe to Daily Real Football Service (real calendar matchdays & live in-play ticker)
  useEffect(() => {
    const unsub = dailyFootballService.subscribe(liveMatches => {
      setMatches([...liveMatches]);
    });
    return unsub;
  }, []);

  // Periodic mock major tournament push notification alerts (Champions League, Premier League, Derbies)
  useEffect(() => {
    // Immediate teaser notification 8 seconds after app loads
    const initialTimer = setTimeout(() => {
      notificationService.notifyMatchStarting({
        teams: 'Arsenal vs Chelsea',
        league: 'English Premier League • Big Match',
        startsIn: '15 minutes',
        odds: '1.95 | 3.50 | 3.80',
      });
    }, 8000);

    // Fire periodic tournament match alert every 2.5 minutes
    const matchAlertTimer = setInterval(() => {
      notificationService.notifyMatchStarting();
    }, 150000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(matchAlertTimer);
    };
  }, []);

  // Audio mute sync
  useEffect(() => {
    soundEngine.setMuted(isMuted);
  }, [isMuted]);

  // Administrator-Only Access (Protected & Hidden from ordinary users)
  // Accessible ONLY via URL (?admin=true, #admin, /admin-login) or secret shortcut (Ctrl+Alt+A)
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        path.includes('/admin-login') ||
        path.endsWith('admin-login') ||
        hash.includes('admin-login') ||
        hash.includes('#admin') ||
        search.includes('admin-login') ||
        search.includes('admin=true') ||
        search.includes('admin=1')
      ) {
        setIsAdminOpen(true);
      }
    };
    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);

    // Discrete administrator keyboard shortcut: Ctrl+Alt+A or Shift+Alt+A
    const handleAdminKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey || e.shiftKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        soundEngine.playClick();
        setIsAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleAdminKey);

    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('keydown', handleAdminKey);
    };
  }, []);

  // Update wallet ledger
  const recordTransaction = (
    type: WalletTransaction['type'],
    amount: number,
    description: string,
    newBalance: number
  ) => {
    const tx: WalletTransaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type,
      amount,
      balanceAfter: newBalance,
      description,
      timestamp: Date.now(),
    };
    setTransactions(prev => [tx, ...prev.slice(0, 49)]);
  };

  // User submits a deposit request: told to wait until admin confirms
  const handleRequestDeposit = (amount: number, code: string) => {
    const newDep: PendingDeposit = {
      id: 'dep-' + Date.now(),
      phoneNumber: user.phoneNumber,
      username: user.username,
      amount,
      code,
      timestamp: Date.now(),
      status: 'PENDING',
    };
    setPendingDeposits(prev => [newDep, ...prev]);

    // Sync deposit to server so admin sees it in verification queue on any device
    realtimeClient.submitDeposit(newDep);

    recordTransaction(
      'PENDING_DEPOSIT',
      amount,
      `Deposit via M-PESA (${code} - Pending Admin Verification)`,
      user.balance
    );
  };

  // Admin approves incoming deposit request
  const handleApproveDeposit = (id: string) => {
    const deposit = pendingDeposits.find(d => d.id === id);
    if (!deposit) return;

    soundEngine.playCashout();
    setPendingDeposits(prev => prev.filter(d => d.id !== id));

    // Sync approval to server
    realtimeClient.approveDeposit(id);

    if (deposit.phoneNumber === user.phoneNumber) {
      notificationService.notifyDepositApproved(deposit.amount, deposit.code);
      setUser(prev => {
        const newBal = prev.balance + deposit.amount;
        recordTransaction(
          'DEPOSIT_DEMO',
          deposit.amount,
          `Deposit Confirmed by Admin (${deposit.code})`,
          newBal
        );
        return {
          ...prev,
          balance: newBal,
          totalDepositedDemo: prev.totalDepositedDemo + deposit.amount,
        };
      });
    }

    setRegisteredUsers(prev =>
      prev.map(u => {
        if (u.phoneNumber === deposit.phoneNumber) {
          return {
            ...u,
            balance: u.balance + deposit.amount,
            totalDepositedDemo: (u.totalDepositedDemo || 0) + deposit.amount,
          };
        }
        return u;
      })
    );
  };

  const handleRejectDeposit = (id: string) => {
    soundEngine.playClick();
    setPendingDeposits(prev => prev.filter(d => d.id !== id));
    realtimeClient.rejectDeposit(id);
  };

  // Admin directly credits funds to any user
  const handleAdminAddFundsToUser = (phone: string, amount: number) => {
    realtimeClient.adminCreditUser(phone, amount);

    if (phone === user.phoneNumber) {
      setUser(prev => {
        const newBal = prev.balance + amount;
        recordTransaction('BONUS', amount, `Admin Credit (+${amount} KES)`, newBal);
        return { ...prev, balance: newBal };
      });
    }

    setRegisteredUsers(prev =>
      prev.map(u => {
        if (u.phoneNumber === phone) {
          return { ...u, balance: u.balance + amount };
        }
        return u;
      })
    );
  };

  // Direct Add Funds (internal helper)
  const handleAddFunds = (amount: number, description: string) => {
    setUser(prev => {
      const newBal = prev.balance + amount;
      recordTransaction('DEPOSIT_DEMO', amount, description, newBal);
      return {
        ...prev,
        balance: newBal,
        totalDepositedDemo: prev.totalDepositedDemo + amount,
      };
    });
  };

  // M-PESA STK Push Success Handler
  const handleStkPushSuccess = (amount: number, txRef: string) => {
    soundEngine.playCashout();
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setUser(prev => {
      const newBal = prev.balance + amount;
      recordTransaction(
        'DEPOSIT_DEMO',
        amount,
        `M-PESA STK Push Top-Up (Ref: #${txRef})`,
        newBal
      );
      return {
        ...prev,
        balance: newBal,
        totalDepositedDemo: (prev.totalDepositedDemo || 0) + amount,
      };
    });

    setRegisteredUsers(prev =>
      prev.map(u => {
        if (u.phoneNumber === user.phoneNumber) {
          return {
            ...u,
            balance: u.balance + amount,
            totalDepositedDemo: (u.totalDepositedDemo || 0) + amount,
          };
        }
        return u;
      })
    );

    // Sync user state to realtime server
    realtimeClient.syncUserToServer({
      ...user,
      balance: user.balance + amount,
      totalDepositedDemo: (user.totalDepositedDemo || 0) + amount,
    });
  };

  const handleWithdrawFunds = (amount: number, description: string) => {
    // Check cumulative deposits from both user.totalDepositedDemo AND transaction history
    const totalDeposited = Math.max(
      user.totalDepositedDemo || 0,
      transactions
        .filter(t => t.type === 'DEPOSIT_DEMO' || (t.amount > 0 && (t.description?.toLowerCase().includes('deposit') || t.description?.toLowerCase().includes('top up'))))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    );

    if (totalDeposited < 100) {
      notificationService.notifySystem(
        '⚠️ Deposit 100 KES to Withdraw',
        'You must deposit at least 100 KES to verify your account and withdraw your welcome bonus.',
        'OPEN_CASHIER'
      );
      return;
    }

    if (amount > user.balance) {
      notificationService.notifySystem(
        '⚠️ Insufficient Balance',
        `Your current balance is KES ${user.balance.toFixed(2)}. Cannot withdraw KES ${amount.toFixed(2)}.`,
        'OPEN_CASHIER'
      );
      return;
    }

    const newBal = Math.max(0, user.balance - amount);
    setUser(prev => ({
      ...prev,
      balance: newBal,
      totalWithdrawnDemo: (prev.totalWithdrawnDemo || 0) + amount,
    }));
    recordTransaction('WITHDRAW_DEMO', -amount, description, newBal);

    // M-PESA B2C Payout notification
    const txRef = 'WD' + Math.floor(100000 + Math.random() * 900000);
    notificationService.notifySystem(
      '💸 M-PESA Payout Confirmed!',
      `KES ${amount.toFixed(2)} sent to M-PESA phone ${user.phoneNumber || ''}. Ref: #${txRef}. New balance: KES ${newBal.toFixed(2)}.`,
      'OPEN_CASHIER'
    );
  };

  const handleNotificationAction = (payload?: any) => {
    if (!payload) return;
    if (payload.type === 'OPEN_CASHIER') {
      handleOpenDeposit();
    } else if (payload.type === 'OPEN_REFERRAL') {
      setIsReferralOpen(true);
    } else if (payload.type === 'OPEN_SPORTS') {
      setActiveTab('sports');
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } else if (payload.type === 'OPEN_MINES') {
      setActiveTab('mines');
    } else if (payload.type === 'OPEN_PENALTY') {
      setActiveTab('penalty');
    } else if (payload.type === 'OPEN_SPIN') {
      setIsSpinOpen(true);
    }
  };

  // Casino Game Handlers: Mines
  const handleMinesBet = (amount: number, description: string): boolean => {
    if (user.balance < amount) return false;
    setUser(prev => {
      const newBal = prev.balance - amount;
      recordTransaction('MINES_BET', -amount, description, newBal);
      return { ...prev, balance: newBal };
    });
    return true;
  };

  const handleMinesWin = (amount: number, description: string) => {
    setUser(prev => {
      const newBal = prev.balance + amount;
      recordTransaction('MINES_WIN', amount, description, newBal);
      return { ...prev, balance: newBal };
    });
  };

  // Casino Game Handlers: Penalty Shootout
  const handlePenaltyBet = (amount: number, description: string): boolean => {
    if (user.balance < amount) return false;
    setUser(prev => {
      const newBal = prev.balance - amount;
      recordTransaction('PENALTY_BET', -amount, description, newBal);
      return { ...prev, balance: newBal };
    });
    return true;
  };

  const handlePenaltyWin = (amount: number, description: string) => {
    setUser(prev => {
      const newBal = prev.balance + amount;
      recordTransaction('PENALTY_WIN', amount, description, newBal);
      return { ...prev, balance: newBal };
    });
  };

  // Daily Spin & Win Reward
  const handleSpinReward = (amount: number, description: string) => {
    setUser(prev => {
      const newBal = prev.balance + amount;
      recordTransaction('SPIN_WIN', amount, description, newBal);
      return { ...prev, balance: newBal };
    });
  };

  // Live Chat Rain Drop Claim
  const handleClaimRain = (amount: number) => {
    setUser(prev => {
      const newBal = prev.balance + amount;
      recordTransaction('RAIN_CLAIM', amount, `Live Chat Rain Claim (+${amount} KES)`, newBal);
      return { ...prev, balance: newBal };
    });
  };

  // Sports Bet Early Cash Out
  const handleCashOutBet = (betId: string, cashoutValue: number) => {
    setPlacedSportsBets(prev =>
      prev.map(b => (b.id === betId ? { ...b, status: 'WON', potentialWin: cashoutValue } : b))
    );
    setUser(prev => {
      const newBal = prev.balance + cashoutValue;
      recordTransaction('SPORTS_WIN', cashoutValue, `Sports Early Cash Out (+${cashoutValue} KES)`, newBal);
      return { ...prev, balance: newBal };
    });
    soundEngine.playCashout();
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch {}
  };

  // Sports Load Booking Code
  const handleLoadBookingCode = (code: string) => {
    if (matches.length >= 3) {
      const m1 = matches[0];
      const m2 = matches[1];
      const m3 = matches[2];
      setActiveSlip([
        {
          matchId: m1.id,
          matchTitle: `${m1.homeTeam} vs ${m1.awayTeam}`,
          marketName: 'Full Time Result (1X2)',
          outcomeName: `${m1.homeTeam} Win`,
          odds: m1.odds.home,
        },
        {
          matchId: m2.id,
          matchTitle: `${m2.homeTeam} vs ${m2.awayTeam}`,
          marketName: 'Over/Under 2.5 Goals',
          outcomeName: 'Over 2.5 Goals',
          odds: m2.odds.over25,
        },
        {
          matchId: m3.id,
          matchTitle: `${m3.homeTeam} vs ${m3.awayTeam}`,
          marketName: 'Both Teams to Score',
          outcomeName: 'GG (Both Score)',
          odds: m3.odds.bothToScoreYes,
        },
      ]);
      soundEngine.playClick();
      notificationService.notifySystem('Slip Loaded!', `Booking code ${code} loaded with 3 matches into your slip.`);
    }
  };

  // Mega Jackpot Handlers
  const handleJackpotBet = (amount: number, description: string): boolean => {
    if (user.balance < amount) return false;
    setUser(prev => {
      const newBal = prev.balance - amount;
      recordTransaction('JACKPOT_BET', -amount, description, newBal);
      return { ...prev, balance: newBal };
    });
    return true;
  };

  const handleJackpotWin = (amount: number, description: string) => {
    setUser(prev => {
      const newBal = prev.balance + amount;
      recordTransaction('JACKPOT_WIN', amount, description, newBal);
      return { ...prev, balance: newBal };
    });
  };

  // VIP Weekly Cashback Claim Handler
  const handleClaimCashback = (amount: number, description: string) => {
    setUser(prev => {
      const newBal = prev.balance + amount;
      recordTransaction('CASHBACK_CLAIM', amount, description, newBal);
      return { ...prev, balance: newBal };
    });
  };

  // Generate simulated players for each flight round
  const generateSimPlayers = () => {
    const sampleNames = [
      'mwangi_254', 'chebet_pro', 'otieno_fly', 'kip_ace', 'wafula_9',
      'lucy_win', 'kamau_pilot', 'nyambura_k', 'hassan_fast', 'brian_jet',
      'mercy_sky', 'victor_c', 'wambui_vip', 'omondi_gold', 'dennis_ke',
      'grace_star', 'john_m', 'faith_w', 'george_fly', 'esther_win'
    ];

    return sampleNames.map((name, i) => {
      const bet = [20, 50, 100, 200, 500, 1000][Math.floor(Math.random() * 6)];
      // Random target cashout between 1.1x and 12.0x
      const target = Math.round((1.1 + Math.random() * 8.5) * 100) / 100;
      return {
        id: `sim-${i}-${Date.now()}`,
        username: name,
        avatarSeed: name,
        betAmount: bet,
        targetCashout: target,
        cashedOut: false,
      };
    });
  };

  // AVIATOR GAME LOOP
  useEffect(() => {
    let animFrame: number;
    let targetCrashPoint = 2.0;
    let roundSeedHash = '';

    const startWaitingPhase = () => {
      setPhase('WAITING');
      setCurrentMultiplier(1.0);
      setSimPlayers(generateSimPlayers());
      soundEngine.stopFlightEngine();

      const startTime = Date.now();
      const waitingDuration = 5000; // 5 seconds countdown

      const waitTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (waitingDuration - elapsed) / 1000);
        setCountdown(remaining);

        if (remaining <= 0) {
          clearInterval(waitTimer);
          startFlyingPhase();
        }
      }, 50);
    };

    const startFlyingPhase = async () => {
      setPhase('FLYING');
      setCountdown(0);
      roundNumberRef.current += 1;
      const newRoundNumber = roundNumberRef.current;
      setRoundNumber(newRoundNumber);

      // Determine crash multiplier
      if (forcedMultiplierRef.current !== null) {
        targetCrashPoint = forcedMultiplierRef.current;
        forcedMultiplierRef.current = null;
      } else {
        const { multiplier } = generateCrashPoint(rtpRate, hourlyMoodRef.current);
        targetCrashPoint = multiplier;
      }

      // Hash generation for Provably Fair audit
      const clientSeed = 'lucky_bet_kenya_' + Date.now();
      roundSeedHash = await sha256(`round_${newRoundNumber}_mult_${targetCrashPoint}_${clientSeed}`);

      const flightStartTime = Date.now();

      const updateFlight = () => {
        const elapsedSeconds = (Date.now() - flightStartTime) / 1000;
        // Realistic exponential growth curve for crash multiplier
        // M(t) = 1 + 0.08 * t + 0.045 * t^2
        const mult = Math.max(1.0, 1.0 + 0.08 * elapsedSeconds + 0.048 * Math.pow(elapsedSeconds, 2));

        // Audio engine update
        soundEngine.updateFlightEngine(mult, true);

        // Check if plane has reached crash point
        if (mult >= targetCrashPoint) {
          // FLEW AWAY / CRASHED
          setCurrentMultiplier(targetCrashPoint);
          handleRoundCrashed(targetCrashPoint, newRoundNumber, roundSeedHash);
          return;
        }

        setCurrentMultiplier(mult);

        // Auto Cashout checks for player bet 1
        setBet1(prev => {
          if (
            prev.isPlaced &&
            !prev.hasCashedOut &&
            prev.autoCashoutEnabled &&
            mult >= prev.autoCashoutMultiplier
          ) {
            triggerCashout('bet1', prev.autoCashoutMultiplier, prev.amount);
          }
          return prev;
        });

        // Auto Cashout checks for player bet 2
        setBet2(prev => {
          if (
            prev.isPlaced &&
            !prev.hasCashedOut &&
            prev.autoCashoutEnabled &&
            mult >= prev.autoCashoutMultiplier
          ) {
            triggerCashout('bet2', prev.autoCashoutMultiplier, prev.amount);
          }
          return prev;
        });

        // Update simulated players cashing out in real time
        setSimPlayers(prev =>
          prev.map(p => {
            if (!p.cashedOut && mult >= p.targetCashout) {
              return {
                ...p,
                cashedOut: true,
                cashedOutMultiplier: p.targetCashout,
                winAmount: p.betAmount * p.targetCashout,
              };
            }
            return p;
          })
        );

        animFrame = requestAnimationFrame(updateFlight);
      };

      animFrame = requestAnimationFrame(updateFlight);
    };

    const handleRoundCrashed = (
      finalMult: number,
      rNum: number,
      hashStr: string
    ) => {
      setPhase('CRASHED');
      soundEngine.playCrash();

      // Record in history with guaranteed unique ID
      const historyItem: AviatorHistoryItem = {
        id: `round-${rNum}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        roundNumber: rNum,
        multiplier: finalMult,
        timestamp: Date.now(),
        hash: hashStr,
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 39)]);

      // Record personal flight history
      setBet1(prev => {
        if (prev.isPlaced) {
          setMyFlightHistory(curr => [
            {
              round: rNum,
              bet: prev.amount,
              mult: prev.hasCashedOut ? prev.cashoutMultiplier : 0,
              win: prev.hasCashedOut ? prev.winAmount : 0,
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...curr.slice(0, 20),
          ]);
        }
        return prev;
      });

      // Pause for 2.8 seconds on crashed screen, then reset for next flight
      setTimeout(() => {
        // Reset player bets for next flight
        setBet1(prev => ({
          ...prev,
          isPlaced: false,
          hasCashedOut: false,
          cashoutMultiplier: 0,
          winAmount: 0,
        }));
        setBet2(prev => ({
          ...prev,
          isPlaced: false,
          hasCashedOut: false,
          cashoutMultiplier: 0,
          winAmount: 0,
        }));
        startWaitingPhase();
      }, 2800);
    };

    startWaitingPhase();

    return () => {
      cancelAnimationFrame(animFrame);
      soundEngine.stopFlightEngine();
    };
  }, [rtpRate]);

  // Handle Player Cashout Action
  const triggerCashout = (panelId: 'bet1' | 'bet2', mult: number, stake: number) => {
    const winAmt = stake * mult;
    soundEngine.playCashout();

    try {
      confetti({
        particleCount: mult >= 5.0 ? 80 : 35,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}

    if (panelId === 'bet1') {
      setBet1(prev => ({
        ...prev,
        hasCashedOut: true,
        cashoutMultiplier: mult,
        winAmount: winAmt,
      }));
    } else {
      setBet2(prev => ({
        ...prev,
        hasCashedOut: true,
        cashoutMultiplier: mult,
        winAmount: winAmt,
      }));
    }

    // Credit user balance
    setUser(prev => {
      const newBal = prev.balance + winAmt;
      recordTransaction('AVIATOR_WIN', winAmt, `Aviator Win @ ${mult.toFixed(2)}x`, newBal);
      return { ...prev, balance: newBal };
    });
  };

  // Place Bet Handlers
  const handlePlaceBet1 = (
    amt: number,
    autoCash: boolean,
    autoMult: number
  ) => {
    if (amt > user.balance) return;
    setUser(prev => {
      const newBal = prev.balance - amt;
      recordTransaction('AVIATOR_BET', -amt, `Aviator Bet #1 (${amt} KES)`, newBal);
      return { ...prev, balance: newBal };
    });
    setBet1({
      amount: amt,
      autoCashoutEnabled: autoCash,
      autoCashoutMultiplier: autoMult,
      isPlaced: true,
      hasCashedOut: false,
      cashoutMultiplier: 0,
      winAmount: 0,
    });
  };

  const handleCancelBet1 = () => {
    setUser(prev => {
      const newBal = prev.balance + bet1.amount;
      recordTransaction('BONUS', bet1.amount, `Aviator Bet #1 Cancelled Refund`, newBal);
      return { ...prev, balance: newBal };
    });
    setBet1(prev => ({ ...prev, isPlaced: false }));
  };

  const handlePlaceBet2 = (
    amt: number,
    autoCash: boolean,
    autoMult: number
  ) => {
    if (amt > user.balance) return;
    setUser(prev => {
      const newBal = prev.balance - amt;
      recordTransaction('AVIATOR_BET', -amt, `Aviator Bet #2 (${amt} KES)`, newBal);
      return { ...prev, balance: newBal };
    });
    setBet2({
      amount: amt,
      autoCashoutEnabled: autoCash,
      autoCashoutMultiplier: autoMult,
      isPlaced: true,
      hasCashedOut: false,
      cashoutMultiplier: 0,
      winAmount: 0,
    });
  };

  const handleCancelBet2 = () => {
    setUser(prev => {
      const newBal = prev.balance + bet2.amount;
      recordTransaction('BONUS', bet2.amount, `Aviator Bet #2 Cancelled Refund`, newBal);
      return { ...prev, balance: newBal };
    });
    setBet2(prev => ({ ...prev, isPlaced: false }));
  };

  // SPORTS BETTING REAL-TIME SIMULATION
  useEffect(() => {
    const sportsTimer = setInterval(() => {
      setMatches(prevMatches =>
        prevMatches.map(m => {
          if (m.status !== 'LIVE') return m;

          // Increment match minute
          const newMin = m.minute + 1;
          if (newMin >= 90) {
            return { ...m, minute: 90, status: 'FINISHED', startTime: 'FT' };
          }

          // Random goal event (approx 3% chance per tick)
          let newHomeScore = m.homeScore;
          let newAwayScore = m.awayScore;
          if (Math.random() < 0.04) {
            if (Math.random() > 0.5) {
              newHomeScore += 1;
            } else {
              newAwayScore += 1;
            }
          }

          return {
            ...m,
            minute: newMin,
            homeScore: newHomeScore,
            awayScore: newAwayScore,
            // Slight dynamic odds fluctuation
            odds: {
              ...m.odds,
              home: Math.max(1.1, Math.round((m.odds.home + (Math.random() - 0.5) * 0.04) * 100) / 100),
              away: Math.max(1.1, Math.round((m.odds.away + (Math.random() - 0.5) * 0.04) * 100) / 100),
            },
          };
        })
      );
    }, 12000);

    return () => clearInterval(sportsTimer);
  }, []);

  // Sports Bet Slip handlers
  const handleToggleSelection = (selection: SlipSelection) => {
    setActiveSlip(prev => {
      const exists = prev.some(
        s => s.matchId === selection.matchId && s.marketName === selection.marketName
      );
      if (exists) {
        return prev.filter(
          s => !(s.matchId === selection.matchId && s.marketName === selection.marketName)
        );
      }
      return [...prev, selection];
    });
  };

  const handleRemoveSelection = (matchId: string, marketName: string) => {
    setActiveSlip(prev =>
      prev.filter(s => !(s.matchId === matchId && s.marketName === marketName))
    );
  };

  const handleClearSlip = () => {
    setActiveSlip([]);
  };

  const handlePlaceSportsBet = (
    stake: number,
    totalOdds: number,
    bonusPct: number,
    potentialWin: number
  ) => {
    setUser(prev => {
      const newBal = prev.balance - stake;
      recordTransaction('SPORTS_BET', -stake, `Sports Bet (${activeSlip.length} Legs)`, newBal);
      return { ...prev, balance: newBal };
    });

    const newBet: PlacedSportsBet = {
      id: 'sp-' + Date.now(),
      timestamp: Date.now(),
      selections: [...activeSlip],
      stake,
      totalOdds,
      bonusPercentage: bonusPct,
      potentialWin,
      status: 'PENDING',
    };

    setPlacedSportsBets(prev => [newBet, ...prev]);
    setActiveSlip([]);
  };

  // Trigger special admin flight (e.g. 50x or 100x)
  const handleTriggerSpecialFlight = (mult: number) => {
    forcedMultiplierRef.current = mult;
  };

  // Reset balances
  const handleResetBalances = () => {
    setUser({
      phoneNumber: '0712345678',
      username: 'LuckyPlayer_254',
      balance: 1000.0,
      joinedAt: Date.now(),
      initialBonusClaimed: true,
      totalDepositedDemo: 0,
      totalWithdrawnDemo: 0,
    });
    setTransactions([]);
  };

  // Dedicated Gateway: Show Sign In / Sign Up first before entering the app
  if (!isAuthenticated) {
    return (
      <>
        <AuthGateway
          onSuccess={handleAuthSuccess}
        />
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          registeredUsers={registeredUsers}
          pendingDeposits={pendingDeposits}
          onApproveDeposit={handleApproveDeposit}
          onRejectDeposit={handleRejectDeposit}
          onAdminAddFundsToUser={handleAdminAddFundsToUser}
          rtpRate={rtpRate}
          onUpdateRtp={rate => setRtpRate(rate)}
          onTriggerSpecialFlight={handleTriggerSpecialFlight}
          onResetBalances={handleResetBalances}
          hourlyMood={hourlyMood}
          onSetMood={mood => {
            setIsAutoMood(false);
            setHourlyMood(mood);
          }}
          isAutoMood={isAutoMood}
          onToggleAutoMood={auto => {
            setIsAutoMood(auto);
            if (auto) setHourlyMood(getCurrentHourMood());
          }}
          onRefresh={refreshLiveStatus}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#0e121a]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-900/40 transform hover:scale-105 transition-transform">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl sm:text-2xl font-black font-display tracking-tight text-white uppercase">
                  LUCKY <span className="text-amber-400">BET</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  KENYA 254
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-slate-400 tracking-wider">
                Aviator Crash Arena & Live Football
              </span>
            </div>
          </div>

          {/* Center Tabs: Aviator, Sports, Jackpot, Mines, Penalty, VIP, Leaderboard */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/90 shadow-inner overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('aviator');
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'aviator'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plane className="w-3.5 h-3.5 text-white" />
              <span>Aviator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('sports');
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sports'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Sports</span>
            </button>

            {/* MEGA JACKPOT TAB */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('jackpot');
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'jackpot'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md font-black'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>Jackpot</span>
              <span className="bg-red-600 text-white text-[9px] font-mono px-1 rounded-full font-black">25M</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('mines');
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'mines'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bomb className="w-3.5 h-3.5" />
              <span>Mines</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('penalty');
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'penalty'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🥅</span>
              <span>Penalty</span>
            </button>

            {/* VIP CLUB TAB */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('vip');
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'vip'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md font-black'
                  : 'text-purple-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>VIP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('leaderboard');
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏅</span>
              <span className="hidden sm:inline">Rankings</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Room / Theme Switcher */}
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTheme('classic-red')}
                className={`px-2 py-1 rounded-lg font-display text-[11px] font-bold ${
                  theme === 'classic-red' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Classic Red
              </button>
              <button
                type="button"
                onClick={() => setTheme('cyber-neon')}
                className={`px-2 py-1 rounded-lg font-display text-[11px] font-bold ${
                  theme === 'cyber-neon' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cyber Neon
              </button>
              <button
                type="button"
                onClick={() => setTheme('sahara-gold')}
                className={`px-2 py-1 rounded-lg font-display text-[11px] font-bold ${
                  theme === 'sahara-gold' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sahara Gold
              </button>
            </div>

            {/* Demo Balance Display */}
            <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-semibold leading-none">Balance</span>
                <span className="text-xs sm:text-sm font-black font-display text-emerald-400 leading-tight">
                  {user.balance.toFixed(2)} <span className="text-[10px] text-slate-400 font-medium">KES</span>
                </span>
              </div>
            </div>

            {/* HIGH-VISIBILITY DEPOSIT BUTTON */}
            <button
              type="button"
              onClick={handleOpenDeposit}
              className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white font-extrabold text-xs sm:text-sm uppercase font-display flex items-center space-x-1.5 shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>DEPOSIT</span>
            </button>

            {/* HIGH-VISIBILITY WITHDRAW BUTTON */}
            <button
              type="button"
              onClick={handleOpenWithdraw}
              className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm uppercase font-display flex items-center space-x-1.5 shadow-lg shadow-orange-950/60 ring-1 ring-amber-400/50 transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              <span>WITHDRAW</span>
            </button>

            {/* Invite Friends / Referral System */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsReferralOpen(true);
              }}
              title="Invite Friends & Earn 20 KES Cash Bonus on Every Deposit"
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/25 border border-amber-500/40 text-amber-300 transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold font-display shadow-sm active:scale-95"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Refer &amp; Earn</span>
            </button>

            {/* Daily Lucky Spin & Win Button */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsSpinOpen(true);
              }}
              title="Daily Spin & Win Wheel - Free Bonus Cash"
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/40 text-yellow-300 transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold font-display shadow-sm active:scale-95"
            >
              <RotateCw className="w-4 h-4 text-yellow-400" />
              <span className="hidden md:inline">Spin &amp; Win</span>
            </button>

            {/* Live Community Chat Toggle */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsChatOpen(!isChatOpen);
              }}
              title="Live Community Chat & Rain Drops"
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline">Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Notification Center Bell */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsNotificationsOpen(true);
              }}
              title="Notifications & Match Alerts"
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {notificationHistory.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black font-mono">
                  {notificationHistory.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* User Profile / Switch Account */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setAuthInitialMode('login');
                setIsAuthOpen(true);
              }}
              title={`Logged in as ${user.username} (${user.phoneNumber})`}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center space-x-1.5 text-xs"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline font-bold font-display">{user.username}</span>
            </button>

            {/* Log Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Log Out of Lucky Bet"
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer flex items-center space-x-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold text-[11px]">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2.5 sm:p-4 md:p-6 space-y-4">
        {/* Welcome Bonus Announcement Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-red-500/10 to-purple-500/15 border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2 flex-wrap gap-y-1">
                <span className="text-sm sm:text-base font-extrabold text-white font-display">
                  100 KES Welcome Bonus Credited!
                </span>
                {(user.totalDepositedDemo || 0) < 100 ? (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    🔒 Deposit 100 KES to Withdraw
                  </span>
                ) : (
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    ✓ Withdrawal Unlocked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {(user.totalDepositedDemo || 0) < 100 ? (
                  <span>
                    To withdraw your welcome bonus & winnings to M-PESA, deposit a minimum of <strong className="text-amber-400 font-bold">100 KES</strong> to verify your account (Progress: {(user.totalDepositedDemo || 0).toFixed(0)}/100 KES).
                  </span>
                ) : (
                  <span>
                    Account verified! You can withdraw your welcome bonus, referral commissions, and winnings freely to M-PESA.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenDeposit}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black font-display uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>DEPOSIT</span>
            </button>
            <button
              type="button"
              onClick={handleOpenWithdraw}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black font-display uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center space-x-1.5 active:scale-95"
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              <span>WITHDRAW</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Rules</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: AVIATOR CRASH ARENA */}
        {activeTab === 'aviator' && (
          <div className="space-y-3">
            {/* Top Flight History & Hourly Atmosphere Ribbon */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex-1 overflow-hidden w-full sm:w-auto">
                <FlightHistory history={history} />
              </div>

              {/* Hourly Atmosphere Badge & Provably Fair Button */}
              <div className="flex items-center space-x-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-1.5 sm:pt-0 sm:pl-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setIsFairOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-display font-extrabold bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm transition-all cursor-pointer"
                  title="Verify SHA-256 Cryptographic Hash & Multiplier Fairness"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fairness</span>
                </button>

                <div
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-display font-extrabold border shadow-sm transition-all ${getMoodDetails(hourlyMood).badge}`}
                  title={`${getMoodDetails(hourlyMood).description} (Rotates in ${minutesToShift}m)`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  <span className="uppercase">{getMoodDetails(hourlyMood).name}</span>
                  <span className="opacity-75 text-[10px] font-mono">({minutesToShift}m)</span>
                </div>
              </div>
            </div>

            {/* Aviator Grid: Left Bets List + Main Flight Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Left Live Bets Panel (3 cols) */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                <LiveBetsTable
                  players={simPlayers}
                  currentMultiplier={currentMultiplier}
                  myHistory={myFlightHistory}
                />
              </div>

              {/* Center Main Aviator Canvas & Bet Controls (9 cols) */}
              <div className="lg:col-span-9 order-1 lg:order-2 space-y-3">
                {/* Visual Flight Canvas */}
                <AviatorCanvas
                  phase={phase}
                  multiplier={currentMultiplier}
                  theme={theme}
                  countdown={countdown}
                />

                {/* Dual Bet Panels: Bet 1 & Bet 2 side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <BetPanel
                    id="bet1"
                    title="Bet Panel #1"
                    phase={phase}
                    currentMultiplier={currentMultiplier}
                    betConfig={bet1}
                    userBalance={user.balance}
                    onPlaceBet={handlePlaceBet1}
                    onCancelBet={handleCancelBet1}
                    onCashOut={() => triggerCashout('bet1', currentMultiplier, bet1.amount)}
                  />

                  <BetPanel
                    id="bet2"
                    title="Bet Panel #2"
                    phase={phase}
                    currentMultiplier={currentMultiplier}
                    betConfig={bet2}
                    userBalance={user.balance}
                    onPlaceBet={handlePlaceBet2}
                    onCancelBet={handleCancelBet2}
                    onCashOut={() => triggerCashout('bet2', currentMultiplier, bet2.amount)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SPORTS BETTING ARENA */}
        {activeTab === 'sports' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Matches Fixture List (8 cols) */}
            <div className="lg:col-span-8">
              <SportsBetting
                matches={matches}
                activeSlip={activeSlip}
                onToggleSelection={handleToggleSelection}
                onRefreshMatches={() => dailyFootballService.refreshMatches()}
                lastSyncTime={dailyFootballService.getLastSyncTime()}
              />
            </div>

            {/* Bet Slip (4 cols) */}
            <div className="lg:col-span-4">
              <div className="sticky top-20">
                <BetSlip
                  selections={activeSlip}
                  placedBets={placedSportsBets}
                  userBalance={user.balance}
                  onRemoveSelection={handleRemoveSelection}
                  onClearSlip={handleClearSlip}
                  onPlaceBet={handlePlaceSportsBet}
                  onCashOutBet={handleCashOutBet}
                  onLoadBookingCode={handleLoadBookingCode}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MINES CRASH GAME */}
        {activeTab === 'mines' && (
          <MinesGame
            userBalance={user.balance}
            onBet={handleMinesBet}
            onWin={handleMinesWin}
          />
        )}

        {/* VIEW 4: PENALTY SHOOTOUT */}
        {activeTab === 'penalty' && (
          <PenaltyShootout
            userBalance={user.balance}
            onBet={handlePenaltyBet}
            onWin={handlePenaltyWin}
          />
        )}

        {/* VIEW 5: LEADERBOARD & HALL OF FAME */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            userUsername={user.username}
            userBalance={user.balance}
          />
        )}

        {/* VIEW 6: MEGA JACKPOT 25,000,000 KES */}
        {activeTab === 'jackpot' && (
          <MegaJackpot
            userBalance={user.balance}
            onBet={handleJackpotBet}
            onWin={handleJackpotWin}
          />
        )}

        {/* VIEW 7: VIP LOYALTY CLUB & CASHBACK */}
        {activeTab === 'vip' && (
          <VipClubView
            userBalance={user.balance}
            userUsername={user.username}
            totalDeposited={user.totalDepositedDemo || 0}
            onClaimCashback={handleClaimCashback}
          />
        )}
      </main>

      {/* FOOTER & HIDDEN ADMIN ACCESS */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#090c12] py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span
              onClick={() => {
                adminClickCounterRef.current++;
                if (adminClickCounterRef.current >= 5) {
                  adminClickCounterRef.current = 0;
                  soundEngine.playClick();
                  setIsAdminOpen(true);
                }
              }}
              title="LUCKY BET KENYA"
              className="font-display font-extrabold text-slate-300 cursor-default select-none"
            >
              LUCKY BET
            </span>
            <span>• Sports Betting &amp; Aviator Crash Arena</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsReferralOpen(true);
              }}
              className="hover:text-amber-400 text-amber-400 font-bold transition-colors flex items-center space-x-1"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Refer &amp; Earn (20 KES Bonus)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsNotificationsOpen(true);
              }}
              className="hover:text-slate-300 transition-colors flex items-center space-x-1"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Alerts</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsResponsibleOpen(true);
              }}
              className="hover:text-emerald-400 text-slate-400 font-semibold transition-colors flex items-center space-x-1"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>Responsible Gaming</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Fairness &amp; Rules
            </button>
            <button
              type="button"
              onClick={() => setIsCashierOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Cashier &amp; Wallet
            </button>
          </div>
        </div>
      </footer>

      {/* FLOATING PUSH NOTIFICATION BANNER */}
      <PushNotificationBanner
        notification={activePushNotification}
        onDismiss={() => setActivePushNotification(null)}
        onAction={handleNotificationAction}
      />

      {/* MODALS */}
      {/* 1. Auth Modals */}
      <AuthModals
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* 2. Cashier Modal */}
      <CashierModal
        isOpen={isCashierOpen}
        initialTab={cashierTab}
        onClose={() => setIsCashierOpen(false)}
        user={user}
        transactions={transactions}
        onAddFunds={handleAddFunds}
        onRequestDeposit={handleRequestDeposit}
        onWithdrawFunds={handleWithdrawFunds}
      />

      {/* 2b. M-PESA STK Push USSD PIN Prompt Modal */}
      <StkPushModal onSuccess={handleStkPushSuccess} />

      {/* 3. Referral & Earn Modal */}
      <ReferralModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        user={user}
      />

      {/* 4. Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notificationHistory}
        onAction={handleNotificationAction}
        onMarkAllAsRead={() => {
          notificationService.markAllAsRead();
          setNotificationHistory(notificationService.getHistory());
        }}
        onClear={() => {
          notificationService.clearHistory();
          setNotificationHistory([]);
        }}
      />

      {/* 5. Hidden Admin Panel (Accessible by Administrator only via URL /admin-login, ?admin=true, or Ctrl+Alt+A) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        registeredUsers={registeredUsers}
        pendingDeposits={pendingDeposits}
        onApproveDeposit={handleApproveDeposit}
        onRejectDeposit={handleRejectDeposit}
        onAdminAddFundsToUser={handleAdminAddFundsToUser}
        rtpRate={rtpRate}
        onUpdateRtp={rate => setRtpRate(rate)}
        onTriggerSpecialFlight={handleTriggerSpecialFlight}
        onResetBalances={handleResetBalances}
        hourlyMood={hourlyMood}
        onSetMood={mood => {
          setIsAutoMood(false);
          setHourlyMood(mood);
        }}
        isAutoMood={isAutoMood}
        onToggleAutoMood={auto => {
          setIsAutoMood(auto);
          if (auto) setHourlyMood(getCurrentHourMood());
        }}
        onRefresh={refreshLiveStatus}
      />

      {/* 6. How To Play & Rules Modal */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative text-xs text-slate-300 space-y-4">
            <button
              onClick={() => setIsRulesOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 text-amber-400 font-display font-black text-lg">
              <Plane className="w-5 h-5 -rotate-45" />
              <span>How To Play Lucky Bet</span>
            </div>

            <div className="space-y-3 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-1">✈️ Aviator Flight:</span>
                <p>
                  1. Place your bet before takeoff during the 5-second waiting countdown.<br />
                  2. Watch the multiplier rise as the stunt plane ascends.<br />
                  3. Tap <strong>CASH OUT</strong> before the plane flees away to secure your profit! If the plane flies away before you cash out, the bet is lost.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-1">⚽ Sports Betting:</span>
                <p>
                  1. Browse live in-play and upcoming football fixtures.<br />
                  2. Select your predictions (1X2, Over/Under 2.5, GG/NG).<br />
                  3. Combine multiple matches in your Bet Slip for accumulator bonus boosts up to +25%!
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-1">💼 100 KES Welcome Bonus & Withdrawals:</span>
                <p>
                  Every new player receives a <strong>100 KES Welcome Bonus</strong> on signup. To withdraw the welcome bonus, referral rewards, and associated winnings to M-PESA, you must first deposit a minimum of <strong>100 KES</strong> to verify your account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRulesOpen(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl font-display uppercase tracking-wider"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* 7. Daily Spin & Win Modal */}
      <DailySpinWheelModal
        isOpen={isSpinOpen}
        onClose={() => setIsSpinOpen(false)}
        onReward={handleSpinReward}
        userBalance={user.balance}
      />

      {/* 8. Live Community Chat Drawer */}
      <LiveCommunityChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUsername={user.username}
        onClaimRain={handleClaimRain}
      />

      {/* 9. Provably Fair Verifier Modal */}
      <ProvablyFairModal
        isOpen={isFairOpen}
        onClose={() => setIsFairOpen(false)}
        lastRoundHash={history[0]?.hash}
        lastRoundMultiplier={history[0]?.multiplier}
      />

      {/* 10. Responsible Gaming & Deposit Limits Modal */}
      <ResponsibleGamingModal
        isOpen={isResponsibleOpen}
        onClose={() => setIsResponsibleOpen(false)}
      />
    </div>
  );
}
