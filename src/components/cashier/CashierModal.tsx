import React, { useState, useMemo } from 'react';
import { UserAccount, WalletTransaction } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  History,
  CheckCircle2,
  ShieldCheck,
  X,
  Sparkles,
  Clock,
  Lock,
  Search,
  Filter,
  Receipt,
  ChevronRight,
  Phone,
  AlertCircle,
  Check,
  Copy,
  Trophy,
  Gift,
  Dices,
  Zap,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ussdPromptService } from '../../utils/ussdPromptService';
import { notificationService } from '../../utils/notificationService';

interface CashierModalProps {
  isOpen: boolean;
  initialTab?: 'deposit' | 'withdraw' | 'history';
  onClose: () => void;
  user: UserAccount;
  transactions: WalletTransaction[];
  onAddFunds: (amount: number, description: string) => void;
  onRequestDeposit: (amount: number, code: string) => void;
  onWithdrawFunds: (amount: number, description: string) => void;
}

type HistoryCategory = 'ALL' | 'BETS' | 'WINS' | 'BONUSES' | 'DEPOSITS' | 'WITHDRAWALS';

export const CashierModal: React.FC<CashierModalProps> = ({
  isOpen,
  initialTab = 'deposit',
  onClose,
  user,
  transactions,
  onAddFunds,
  onRequestDeposit,
  onWithdrawFunds,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const [depositAmount, setDepositAmount] = useState<number>(200);
  const [depositPhone, setDepositPhone] = useState<string>(user.phoneNumber || '0712345678');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [withdrawPhone, setWithdrawPhone] = useState<string>(user.phoneNumber || '0712345678');
  const [confCode, setConfCode] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState<boolean>(false);

  // Paybill Direct Configuration
  const [paybillInfo, setPaybillInfo] = useState<{ shortcode: string; paybillAccount: string }>({
    shortcode: '522522',
    paybillAccount: '6234870026939877',
  });

  // Mandatory 2FA SMS OTP State for Withdrawals
  const [isOtpStepOpen, setIsOtpStepOpen] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number>(300);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [maskedRegisteredPhone, setMaskedRegisteredPhone] = useState<string>('');
  const [pendingWithdrawCleanPhone, setPendingWithdrawCleanPhone] = useState<string>('');

  React.useEffect(() => {
    if (!isOpen) return;
    fetch('/api/mpesa/config')
      .then(r => r.json())
      .then(data => {
        if (data?.shortcode) {
          setPaybillInfo({
            shortcode: String(data.shortcode),
            paybillAccount: String(data.paybillAccount || '6234870026939877'),
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOtpStepOpen) return;
    const timer = setInterval(() => {
      setOtpSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOtpStepOpen]);

  // History Tab States
  const [selectedCategory, setSelectedCategory] = useState<HistoryCategory>('ALL');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<WalletTransaction | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  // Requirement: Deposit KES 100 to withdraw welcome bonus & winnings
  const totalDeposited = Math.max(
    user.totalDepositedDemo || 0,
    transactions
      .filter(
        t =>
          t.type === 'DEPOSIT_DEMO' ||
          (t.amount > 0 &&
            (t.description?.toLowerCase().includes('deposit') ||
              t.description?.toLowerCase().includes('top up') ||
              t.description?.toLowerCase().includes('top-up')))
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  );

  const isWithdrawalLocked = totalDeposited < 100;
  const depositRemaining = Math.max(0, 100 - totalDeposited);

  // Category determination helper
  const getCategoryForTransaction = (tx: WalletTransaction): HistoryCategory => {
    if (tx.type === 'DEPOSIT_DEMO' || tx.type === 'PENDING_DEPOSIT') return 'DEPOSITS';
    if (tx.type === 'WITHDRAW_DEMO') return 'WITHDRAWALS';
    if (tx.type.endsWith('_BET')) return 'BETS';
    if (tx.type.endsWith('_WIN')) return 'WINS';
    if (
      tx.type === 'BONUS' ||
      tx.type === 'SPIN_WIN' ||
      tx.type === 'RAIN_CLAIM' ||
      tx.type === 'CASHBACK_CLAIM' ||
      tx.type === 'REFERRAL_BONUS'
    ) {
      return 'BONUSES';
    }
    return tx.amount > 0 ? 'WINS' : 'BETS';
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: transactions.length,
      BETS: 0,
      WINS: 0,
      BONUSES: 0,
      DEPOSITS: 0,
      WITHDRAWALS: 0,
    };

    transactions.forEach(tx => {
      const cat = getCategoryForTransaction(tx);
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return counts;
  }, [transactions]);

  // Filtered transactions for History tab
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const cat = getCategoryForTransaction(tx);
        if (cat !== selectedCategory) return false;
      }

      // Search query filter
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const text = `${tx.description} ${tx.amount} ${tx.id}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [transactions, selectedCategory, historySearchQuery]);

  if (!isOpen) return null;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (depositAmount < 10) {
      setErrorMessage('Minimum deposit is 10 KES');
      return;
    }

    const cleanCode = confCode.trim() || 'QK' + Math.floor(10000000 + Math.random() * 90000000);
    onRequestDeposit(depositAmount, cleanCode);
    soundEngine.playSportsWin();
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } catch {}

    setSuccessMessage(
      `Deposit request of ${depositAmount} KES submitted! Please wait to receive the funds once confirmed by the administrator.`
    );
    setErrorMessage(null);
    setConfCode('');
  };

  // Trigger M-PESA STK Push prompt to player phone directly to Paybill
  const handleTriggerStkPush = (amountToPush?: number, targetPhone?: string) => {
    soundEngine.playClick();
    const targetAmount = amountToPush || depositAmount || 100;
    const phone = (targetPhone || depositPhone || user.phoneNumber || '0712345678').trim();

    // Validate phone number format
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      setErrorMessage('Please enter a valid Safaricom phone number (e.g. 0712345678 or 254712345678)');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(
      `📲 Sending M-PESA USSD Prompt of KES ${targetAmount} to ${phone} for Paybill ${paybillInfo.shortcode}... Enter your M-PESA PIN!`
    );
    ussdPromptService.triggerStkPush(targetAmount, phone, paybillInfo.paybillAccount).catch(() => {});
  };

  // Instant Verification Deposit (Triggers 100 KES STK Push to verify account)
  const handleInstantVerificationDeposit = () => {
    handleTriggerStkPush(100, depositPhone);
  };

  // Request 6-digit SMS 2FA code to user's registered phone number
  const sendWithdrawalOtp = async (cleanDestPhone: string) => {
    const regPhone = (user.phoneNumber || cleanDestPhone).trim();
    setIsSendingOtp(true);
    setOtpError(null);

    try {
      const resp = await fetch('/api/auth/withdrawal-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registeredPhone: regPhone,
          withdrawPhone: cleanDestPhone,
          amount: withdrawAmount,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to send 2FA SMS code.');
      }

      setMaskedRegisteredPhone(data.maskedPhone || regPhone);
      setOtpSecondsLeft(data.expiresInSeconds || 300);
      setResendCooldown(30);
      setOtpCode('');
      setPendingWithdrawCleanPhone(cleanDestPhone);
      setIsOtpStepOpen(true);

      // Deliver in-app SMS notification when carrier SMS gateway key is not yet configured
      if (data.simulatedSmsCode && data.smsPreview) {
        notificationService.notifySystem(
          `📩 SMS Sent to ${regPhone}`,
          data.smsPreview
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to send 2FA SMS code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (isWithdrawalLocked) {
      setErrorMessage(
        `Withdrawal Locked: You must deposit at least 100 KES to verify your account and withdraw your welcome bonus. (Current deposits: ${totalDeposited.toFixed(2)} / 100 KES)`
      );
      return;
    }

    if (withdrawAmount < 100) {
      setErrorMessage('Minimum withdrawal amount is 100 KES');
      return;
    }

    if (withdrawAmount > user.balance) {
      setErrorMessage(`Insufficient balance. Current balance is ${user.balance.toFixed(2)} KES`);
      return;
    }

    const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
    const cleanPhone = withdrawPhone.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage('Please enter a valid Kenyan Safaricom phone number (e.g. 0712345678 or 0112345678)');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    await sendWithdrawalOtp(cleanPhone);
  };

  const handleVerifyOtpAndCompleteWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    const cleanCode = otpCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setOtpError('Please enter the 6-digit verification code sent via SMS.');
      return;
    }

    const regPhone = (user.phoneNumber || pendingWithdrawCleanPhone || withdrawPhone).trim();
    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const resp = await fetch('/api/auth/withdrawal-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registeredPhone: regPhone,
          code: cleanCode,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.verified) {
        setOtpError(data.error || 'Invalid 2FA verification code.');
        setIsVerifyingOtp(false);
        return;
      }

      setIsSubmittingWithdrawal(true);
      const txRef = 'WD' + Math.floor(100000 + Math.random() * 900000);
      const targetPhone = pendingWithdrawCleanPhone || withdrawPhone.replace(/\s+/g, '');

      onWithdrawFunds(
        withdrawAmount,
        `Payout to ${targetPhone} (2FA Verified • Ref: #${txRef})`
      );
      soundEngine.playCashout();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {}

      setIsOtpStepOpen(false);
      setOtpCode('');
      setIsVerifyingOtp(false);
      setIsSubmittingWithdrawal(false);
      setSuccessMessage(
        `✅ 2FA Verified! Withdrawal of KES ${withdrawAmount.toFixed(2)} sent to M-PESA ${targetPhone}. Ref: #${txRef}.`
      );
    } catch (err: any) {
      setOtpError(err?.message || 'Error verifying 2FA SMS code.');
      setIsVerifyingOtp(false);
    }
  };

  const copyReceiptDetails = (tx: WalletTransaction) => {
    soundEngine.playClick();
    const text = `LUCKY BET M-PESA RECEIPT\nRef: #${tx.id}\nType: ${tx.description}\nAmount: ${tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)} KES\nBalance: ${tx.balanceAfter.toFixed(2)} KES\nDate: ${new Date(tx.timestamp).toLocaleString()}\nStatus: COMPLETED`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2 text-amber-400 mb-1">
            <Wallet className="w-5 h-5" />
            <h2 className="text-xl font-black font-display text-white">Cashier &amp; Wallet</h2>
          </div>
          <div className="flex justify-between items-end mt-3">
            <div>
              <span className="text-xs text-slate-400">Available Balance</span>
              <div className="text-2xl sm:text-3xl font-black font-display text-emerald-400">
                {user.balance.toFixed(2)}{' '}
                <span className="text-sm sm:text-base text-slate-300 font-semibold">KES</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{user.username || 'Player'}</span>
              <div className="font-mono text-slate-400">{user.phoneNumber || '07XXXXXXXX'}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setErrorMessage(null);
              setSuccessMessage(null);
              setActiveTab('deposit');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setErrorMessage(null);
              setSuccessMessage(null);
              setActiveTab('withdraw');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'withdraw'
                ? 'bg-amber-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setErrorMessage(null);
              setSuccessMessage(null);
              setActiveTab('history');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History ({transactions.length})</span>
          </button>
        </div>

        {/* Body Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-start space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: DEPOSIT                                           */}
          {/* ======================================================== */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              {/* PRIMARY OPTION: 1-TAP M-PESA STK PUSH (USSD PROMPT) */}
              <div className="bg-gradient-to-br from-emerald-950/80 via-slate-950 to-slate-950 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-black font-display text-white">
                          Direct Paybill USSD STK Push
                        </h4>
                        <span className="text-[9px] font-black uppercase font-mono px-2 py-0.2 rounded bg-emerald-500 text-slate-950">
                          Paybill {paybillInfo.shortcode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Sends an M-PESA USSD prompt to your phone. Input your PIN and funds go directly to Paybill <span className="font-mono text-amber-400 font-bold">{paybillInfo.shortcode}</span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Quick Presets */}
                <div>
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Select Amount (KES)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-bold font-display border transition-all cursor-pointer ${
                          depositAmount === amt
                            ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {amt} KES
                      </button>
                    ))}
                  </div>

                  <div className="relative mt-2">
                    <input
                      type="number"
                      min={10}
                      value={depositAmount}
                      onChange={e => setDepositAmount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-display font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                      KES
                    </span>
                  </div>
                </div>

                {/* Destination Phone Number Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Input Phone Number For Prompt:</span>
                    </label>
                    {user.phoneNumber && depositPhone !== user.phoneNumber && (
                      <button
                        type="button"
                        onClick={() => setDepositPhone(user.phoneNumber)}
                        className="text-[10px] text-amber-400 hover:underline font-mono"
                      >
                        Use Account ({user.phoneNumber})
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
                    <input
                      type="tel"
                      required
                      value={depositPhone}
                      onChange={e => setDepositPhone(e.target.value)}
                      placeholder="e.g. 0712345678 or 254712345678"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>M-PESA SIM Toolkit will pop up immediately on this number.</span>
                    <span className="font-mono text-emerald-400 font-semibold">254 Safaricom</span>
                  </p>
                </div>

                {/* High-visibility Action Button to Push USSD Prompt */}
                <button
                  type="button"
                  onClick={() => handleTriggerStkPush(depositAmount, depositPhone)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-500 hover:to-green-500 active:scale-98 text-white font-black text-xs sm:text-sm uppercase font-display rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-yellow-300 stroke-[3]" />
                  <span>SEND M-PESA USSD PROMPT (KES {depositAmount})</span>
                </button>
              </div>

              {/* SECONDARY OPTION: MANUAL PAYBILL INSTRUCTIONS */}
              <form onSubmit={handleDepositSubmit} className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Or Pay Manually via Paybill:</span>
                  <span className="text-slate-500 text-[11px]">Paybill: 522522</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Business No:</span>
                      <span className="font-mono font-bold text-amber-400">522522</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Account:</span>
                      <span className="font-mono font-bold text-amber-400 truncate block">
                        6234870026939877
                      </span>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Paste M-PESA SMS Confirmation Code (e.g. QK89XY2345)"
                      value={confCode}
                      onChange={e => setConfCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-display font-bold text-xs uppercase tracking-wider text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  Submit Manual Confirmation Code
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: WITHDRAW                                          */}
          {/* ======================================================== */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Requirement Card for Welcome Bonus Withdrawal */}
              {isWithdrawalLocked ? (
                <div className="bg-gradient-to-br from-amber-950/80 via-slate-950 to-slate-950 border border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-xl">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
                      <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                          Withdrawal Locked
                        </span>
                        <span className="text-[11px] text-amber-300 font-bold">
                          Welcome Bonus Rule
                        </span>
                      </div>
                      <h4 className="text-sm font-black font-display text-white mt-1 leading-tight">
                        Deposit 100 KES to Unlock Withdrawals
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        To withdraw your <strong className="text-amber-400">100 KES welcome bonus</strong>, referral rewards, and winnings to M-PESA, you must first deposit a minimum of <strong className="text-white">100 KES</strong> to verify your account.
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Deposit Progress:</span>
                      <span className="text-amber-400 font-bold">
                        {totalDeposited.toFixed(2)} / 100.00 KES ({depositRemaining.toFixed(2)} KES remaining)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((totalDeposited / 100) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Fast-track Verify & Unlock Action */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleInstantVerificationDeposit}
                      className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs uppercase font-display rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span>Instant 100 KES Top-Up</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setDepositAmount(100);
                        setErrorMessage(null);
                        setActiveTab('deposit');
                      }}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase font-display rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <ArrowDownLeft className="w-4 h-4 text-amber-400" />
                      <span>Paybill (522522)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-300 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Account Verified &amp; Withdrawals Active</span>
                    Minimum 100 KES deposit verified ({totalDeposited.toFixed(2)} KES deposited). You can withdraw your balance freely to M-PESA.
                  </div>
                </div>
              )}

              {/* Amount Selection */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-300 font-semibold">Withdrawal Amount</label>
                  <span className="text-amber-400 font-bold">Min: 100 KES • Balance: {user.balance.toFixed(2)} KES</span>
                </div>

                {/* Amount Preset Pills */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[100, 300, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold font-display border transition-all cursor-pointer ${
                        withdrawAmount === amt
                          ? 'bg-amber-600 border-amber-400 text-white font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {amt} KES
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(Math.max(100, Math.floor(user.balance)))}
                    className="py-2 rounded-xl text-xs font-black font-display border bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
                  >
                    MAX (ALL)
                  </button>
                </div>

                {/* Percentage shortcuts */}
                <div className="flex space-x-1.5 mb-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const calculated = Math.max(100, Math.floor((user.balance * pct) / 100));
                        setWithdrawAmount(calculated);
                      }}
                      className="flex-1 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    >
                      {pct === 100 ? '100% MAX' : `${pct}%`}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={100}
                    max={user.balance}
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-display font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">
                    KES
                  </span>
                </div>
              </div>

              {/* M-PESA Phone Number Input */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-300 font-semibold block">
                    M-PESA Phone Number
                  </label>
                  {user.phoneNumber && user.phoneNumber !== withdrawPhone && (
                    <button
                      type="button"
                      onClick={() => setWithdrawPhone(user.phoneNumber)}
                      className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Use {user.phoneNumber}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0712345678"
                    value={withdrawPhone}
                    onChange={e => setWithdrawPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Payout Breakdown */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Gross Payout:</span>
                  <span className="font-bold text-white font-display">{withdrawAmount.toFixed(2)} KES</span>
                </div>
                <div className="flex justify-between">
                  <span>M-PESA B2C Transfer Fee:</span>
                  <span className="text-emerald-400 font-bold">0.00 KES (Free)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Processing Time:</span>
                  <span className="text-amber-400 font-mono font-bold">1 – 5 Minutes</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-800 text-white font-bold">
                  <span>Net Amount Credited:</span>
                  <span className="font-display text-emerald-400 text-base">
                    {withdrawAmount.toFixed(2)} KES
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {isWithdrawalLocked ? (
                <button
                  type="button"
                  onClick={handleInstantVerificationDeposit}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 font-display font-black text-sm uppercase tracking-wider text-white rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
                >
                  <Smartphone className="w-4 h-4 text-yellow-300 stroke-[3]" />
                  <span>SEND 100 KES USSD PROMPT TO UNLOCK WITHDRAWAL</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={user.balance < 100 || withdrawAmount > user.balance || isSubmittingWithdrawal || isSendingOtp}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 font-display font-black text-sm uppercase tracking-wider text-slate-950 rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer disabled:opacity-40 active:scale-98 flex items-center justify-center space-x-2"
                >
                  {isSendingOtp ? (
                    <span>SENDING 2FA SMS CODE...</span>
                  ) : isSubmittingWithdrawal ? (
                    <span>PROCESSING WITHDRAWAL...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 stroke-[3]" />
                      <span>WITHDRAW {withdrawAmount.toFixed(2)} KES (2FA SMS)</span>
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: TRANSACTION HISTORY & CATEGORY FILTER             */}
          {/* ======================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {/* Category Filter Pills (All, Bets, Wins, Bonuses, Deposits, Withdrawals) */}
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
                  <Filter className="w-3 h-3 text-amber-400" />
                  <span>Filter by Category:</span>
                </span>
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'ALL', label: 'All', count: categoryCounts.ALL },
                    { id: 'BETS', label: 'Bets', count: categoryCounts.BETS },
                    { id: 'WINS', label: 'Wins', count: categoryCounts.WINS },
                    { id: 'BONUSES', label: 'Bonuses', count: categoryCounts.BONUSES },
                    { id: 'DEPOSITS', label: 'Deposits', count: categoryCounts.DEPOSITS },
                    { id: 'WITHDRAWALS', label: 'Withdrawals', count: categoryCounts.WITHDRAWALS },
                  ].map(cat => {
                    const isSelected = selectedCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedCategory(cat.id as HistoryCategory);
                        }}
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold font-display flex items-center space-x-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Within History */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  placeholder="Search activity by name or amount..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Transactions List */}
              {filteredTransactions.length === 0 ? (
                <div className="py-10 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">No transactions found in this category.</p>
                  {selectedCategory !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setHistorySearchQuery('');
                      }}
                      className="text-xs text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Clear filter to view all transactions
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map(tx => {
                    const isCredit = tx.amount > 0;
                    const cat = getCategoryForTransaction(tx);

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedReceipt(tx)}
                        title="Click to view digital M-PESA receipt"
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs transition-all cursor-pointer group active:scale-99"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              cat === 'WINS'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : cat === 'BONUSES'
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                                : cat === 'DEPOSITS'
                                ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                                : cat === 'WITHDRAWALS'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {cat === 'WINS' && <Trophy className="w-4 h-4" />}
                            {cat === 'BONUSES' && <Gift className="w-4 h-4" />}
                            {cat === 'DEPOSITS' && <ArrowDownLeft className="w-4 h-4" />}
                            {cat === 'WITHDRAWALS' && <ArrowUpRight className="w-4 h-4" />}
                            {cat === 'BETS' && <Dices className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                              {tx.description}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono">
                                {new Date(tx.timestamp).toLocaleDateString([], {
                                  day: '2-digit',
                                  month: 'short',
                                })}{' '}
                                •{' '}
                                {new Date(tx.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                {cat}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-display font-black text-sm ${
                              isCredit ? 'text-emerald-400' : 'text-slate-300'
                            }`}
                          >
                            {isCredit ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} KES
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Bal: {tx.balanceAfter.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* DIGITAL M-PESA RECEIPT MODAL OVERLAY                    */}
        {/* ======================================================== */}
        {selectedReceipt && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col justify-between animate-fadeIn">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Transaction Receipt
                    </span>
                    <span className="text-sm font-black text-white font-display">
                      M-PESA Official Record
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Header */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center space-y-1">
                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>TRANSACTION COMPLETED</span>
                </span>
                <div
                  className={`text-2xl font-black font-display pt-1 ${
                    selectedReceipt.amount > 0 ? 'text-emerald-400' : 'text-slate-100'
                  }`}
                >
                  {selectedReceipt.amount > 0 ? `+${selectedReceipt.amount.toFixed(2)}` : selectedReceipt.amount.toFixed(2)}{' '}
                  <span className="text-sm font-bold text-slate-400">KES</span>
                </div>
                <p className="text-xs text-slate-300 font-semibold">{selectedReceipt.description}</p>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Transaction ID / Ref:</span>
                  <span className="font-mono text-white font-bold">{selectedReceipt.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Timestamp:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(selectedReceipt.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Category:</span>
                  <span className="font-bold text-amber-400 uppercase">
                    {getCategoryForTransaction(selectedReceipt)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Channel:</span>
                  <span className="font-semibold text-slate-200">Safaricom M-PESA B2C / C2B</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Wallet Balance After:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    KES {selectedReceipt.balanceAfter.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex space-x-2 pt-3">
              <button
                type="button"
                onClick={() => copyReceiptDetails(selectedReceipt)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Receipt Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Receipt</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black font-display text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Back to History
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MANDATORY 2FA SMS VERIFICATION OVERLAY FOR WITHDRAWALS   */}
        {/* ======================================================== */}
        {isOtpStepOpen && (
          <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col justify-between animate-fadeIn">
            <form onSubmit={handleVerifyOtpAndCompleteWithdrawal} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                        Mandatory Security Check
                      </span>
                      <span className="text-sm font-black text-white font-display">
                        2FA SMS Withdrawal Verification
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpStepOpen(false);
                      setOtpCode('');
                      setOtpError(null);
                    }}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                  <p className="text-slate-300 leading-relaxed">
                    Enter the <strong className="text-white">6-digit one-time verification code</strong> sent via SMS to your registered phone number{' '}
                    <span className="font-mono font-bold text-amber-400">{user.phoneNumber || maskedRegisteredPhone}</span>.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400">Withdrawal Amount:</span>
                    <span className="font-display font-black text-emerald-400 text-sm">
                      KES {withdrawAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">M-PESA Destination:</span>
                    <span className="font-mono font-bold text-white">{pendingWithdrawCleanPhone || withdrawPhone}</span>
                  </div>
                </div>

                {/* OTP Input Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      6-Digit SMS Code
                    </label>
                    <span className="font-mono text-[11px] text-amber-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Expires in {Math.floor(otpSecondsLeft / 60)}:{String(otpSecondsLeft % 60).padStart(2, '0')}
                      </span>
                    </span>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={e => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setOtpError(null);
                    }}
                    placeholder="••••••"
                    className="w-full bg-slate-900 border-2 border-amber-500/60 focus:border-amber-400 rounded-xl px-4 py-3.5 text-center text-2xl font-mono font-black tracking-[0.5em] text-white focus:outline-none shadow-inner"
                  />

                  {otpError && (
                    <div className="p-2.5 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 text-[11px]">Didn&apos;t receive the SMS?</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSendingOtp}
                      onClick={() => sendWithdrawalOtp(pendingWithdrawCleanPhone || withdrawPhone.replace(/\s+/g, ''))}
                      className="text-[11px] font-bold text-amber-400 hover:underline disabled:text-slate-500 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend SMS in ${resendCooldown}s` : 'Resend SMS Code'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpStepOpen(false);
                    setOtpCode('');
                    setOtpError(null);
                  }}
                  className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase font-display rounded-xl border border-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpCode.length !== 6 || isVerifyingOtp || otpSecondsLeft <= 0}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-xs uppercase font-display rounded-xl shadow-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  {isVerifyingOtp ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify &amp; Withdraw</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
