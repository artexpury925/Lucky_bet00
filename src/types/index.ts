export type AviatorTheme = 'classic-red' | 'cyber-neon' | 'sahara-gold';
export type AviatorHourlyMood = 'greedy' | 'fair' | 'generous';

export type GamePhase = 'WAITING' | 'FLYING' | 'CRASHED';

export interface AviatorHistoryItem {
  id: string;
  roundNumber: number;
  multiplier: number;
  timestamp: number;
  hash: string;
}

export interface PlayerBetConfig {
  amount: number;
  autoCashoutEnabled: boolean;
  autoCashoutMultiplier: number;
  isPlaced: boolean; // Queued or active in round
  hasCashedOut: boolean;
  cashoutMultiplier: number;
  winAmount: number;
}

export interface SimulatedPlayer {
  id: string;
  username: string;
  avatarSeed: string;
  betAmount: number;
  targetCashout: number;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  winAmount?: number;
}

// Sports betting types
export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED';

export interface FootballMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: MatchStatus;
  startTime: string;
  odds: {
    home: number; // 1
    draw: number; // X
    away: number; // 2
    over25: number;
    under25: number;
    bothToScoreYes: number;
    bothToScoreNo: number;
  };
}

export interface SlipSelection {
  matchId: string;
  matchTitle: string;
  marketName: string;
  outcomeName: string;
  odds: number;
}

export interface PendingDeposit {
  id: string;
  phoneNumber: string;
  username: string;
  amount: number;
  code: string;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface PlacedSportsBet {
  id: string;
  timestamp: number;
  selections: SlipSelection[];
  stake: number;
  totalOdds: number;
  bonusPercentage: number;
  potentialWin: number;
  status: 'PENDING' | 'WON' | 'LOST';
}

export interface WalletTransaction {
  id: string;
  type: 'BONUS' | 'DEPOSIT_DEMO' | 'WITHDRAW_DEMO' | 'AVIATOR_WIN' | 'AVIATOR_BET' | 'SPORTS_BET' | 'SPORTS_WIN' | 'PENDING_DEPOSIT';
  amount: number;
  balanceAfter: number;
  description: string;
  timestamp: number;
}

export interface UserAccount {
  phoneNumber: string;
  username: string;
  balance: number;
  joinedAt: number;
  initialBonusClaimed: boolean;
  totalDepositedDemo: number;
  totalWithdrawnDemo: number;
}
