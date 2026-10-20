import React, { useState } from 'react';
import { UserAccount, WalletTransaction } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { Wallet, ArrowDownLeft, ArrowUpRight, History, CheckCircle2, ShieldCheck, X, Sparkles, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [withdrawPhone, setWithdrawPhone] = useState<string>(user.phoneNumber || '0712345678');
  const [confCode, setConfCode] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    setSuccessMessage(`Deposit request of ${depositAmount} KES submitted! Please wait to receive the funds in your account once confirmed by the administrator.`);
    setErrorMessage(null);
    setConfCode('');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (withdrawAmount < 100) {
      setErrorMessage('Minimum withdrawal amount is 100 KES');
      return;
    }
    if (withdrawAmount > user.balance) {
      setErrorMessage(`Insufficient balance. Current balance is ${user.balance.toFixed(2)} KES`);
      return;
    }

    const txRef = 'WD' + Math.floor(100000 + Math.random() * 900000);
    onWithdrawFunds(withdrawAmount, `Payout to ${withdrawPhone} (Ref: #${txRef} - Processing 5-15 mins)`);
    soundEngine.playCashout();
    setSuccessMessage(`Withdrawal of ${withdrawAmount} KES queued! Due to high number of users, payment verification and M-PESA payout takes 5 to 15 minutes. Transaction Ref: #${txRef}`);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-amber-400 mb-1">
            <Wallet className="w-5 h-5" />
            <h2 className="text-xl font-black font-display text-white">Cashier & Wallet</h2>
          </div>
          <div className="flex justify-between items-end mt-3">
            <div>
              <span className="text-xs text-slate-400">Available Demo Balance</span>
              <div className="text-3xl font-black font-display text-emerald-400">
                {user.balance.toFixed(2)}{' '}
                <span className="text-base text-slate-300 font-semibold">KES</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>Account: {user.username}</span>
              <div className="font-mono text-slate-300">{user.phoneNumber}</div>
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5">
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setActiveTab('deposit');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setActiveTab('withdraw');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'withdraw'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setActiveTab('history');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[460px] overflow-y-auto">
          {successMessage && (
            <div className="mb-4 bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 bg-red-950/60 border border-red-500/50 p-3 rounded-xl text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          {/* DEPOSIT TAB */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-2">
                  Select Deposit Amount (KES)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold font-display border transition-all ${
                        depositAmount === amt
                          ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {amt} KES
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    value={depositAmount}
                    onChange={e => setDepositAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-display font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">
                    KES
                  </span>
                </div>
              </div>

              {/* M-PESA Paybill Reference instructions */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block">M-PESA Paybill Reference</span>
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
                <div className="mt-2">
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Confirmation Code / SMS Message (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. QK89XY2345 Confirmed"
                    value={confCode}
                    onChange={e => setConfCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-display font-extrabold text-sm uppercase tracking-wider text-white rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                CONFIRM PAYMENT & TOP UP
              </button>
            </form>
          )}

          {/* WITHDRAW TAB */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-300 font-semibold">Withdrawal Amount</label>
                  <span className="text-amber-400 font-bold">Min: 100 KES</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[100, 300, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold font-display border transition-all ${
                        withdrawAmount === amt
                          ? 'bg-amber-600 border-amber-400 text-white font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {amt} KES
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

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  M-PESA Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={withdrawPhone}
                  onChange={e => setWithdrawPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Gross Payout:</span>
                  <span className="font-bold text-white font-display">{withdrawAmount} KES</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span className="text-emerald-400 font-bold">0.00 KES (Free Demo)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-bold">
                  <span>Net Amount to Phone:</span>
                  <span className="font-display text-emerald-400 text-sm">
                    {withdrawAmount} KES
                  </span>
                </div>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-amber-200">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-amber-300 block">Verification Queue Notice:</span>
                  Due to high user volume, payment verification and M-PESA transfers take approximately <strong>5 to 15 minutes</strong> to be processed and credited to your phone.
                </div>
              </div>

              <button
                type="submit"
                disabled={user.balance < 100 || withdrawAmount > user.balance}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-display font-extrabold text-sm uppercase tracking-wider text-slate-950 rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer disabled:opacity-40"
              >
                REQUEST WITHDRAWAL
              </button>
            </form>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No transaction history recorded yet.
                </div>
              ) : (
                transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{tx.description}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(tx.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-display font-bold ${
                          tx.amount > 0 ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} KES
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bal: {tx.balanceAfter.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
