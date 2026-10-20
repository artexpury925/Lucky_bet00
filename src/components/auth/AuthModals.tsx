import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { KeyRound, Phone, Lock, User, CheckCircle2, Copy, Sparkles, X } from 'lucide-react';

interface AuthModalsProps {
  isOpen: boolean;
  initialMode: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess: (account: UserAccount) => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [recoveredPass, setRecoveredPass] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number (e.g. 0712345678)');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    const newAccount: UserAccount = {
      phoneNumber: phone,
      username: username || `Player_${phone.slice(-4)}`,
      balance: 500, // 500 Free Welcome Bonus on account creation
      joinedAt: Date.now(),
      initialBonusClaimed: true,
      totalDepositedDemo: 0,
      totalWithdrawnDemo: 0,
    };

    // Store in localStorage
    localStorage.setItem(`user_${phone}`, JSON.stringify({ ...newAccount, password }));
    localStorage.setItem('lucky_bet_active_user', JSON.stringify(newAccount));

    soundEngine.playSportsWin();
    onSuccess(newAccount);
    onClose();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    const stored = localStorage.getItem(`user_${phone}`);
    if (!stored) {
      // Allow instant demo registration if not found
      const defaultAcc: UserAccount = {
        phoneNumber: phone,
        username: `Player_${phone.slice(-4) || 'VIP'}`,
        balance: 500,
        joinedAt: Date.now(),
        initialBonusClaimed: true,
        totalDepositedDemo: 0,
        totalWithdrawnDemo: 0,
      };
      localStorage.setItem(`user_${phone}`, JSON.stringify({ ...defaultAcc, password: password || '1234' }));
      localStorage.setItem('lucky_bet_active_user', JSON.stringify(defaultAcc));
      onSuccess(defaultAcc);
      onClose();
      return;
    }

    const parsed = JSON.parse(stored);
    if (parsed.password && parsed.password !== password) {
      setError('Incorrect password. Click "Forgot Password" to recover instantly.');
      return;
    }

    localStorage.setItem('lucky_bet_active_user', JSON.stringify(parsed));
    onSuccess(parsed);
    onClose();
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!phone) {
      setError('Enter your registered phone number');
      return;
    }

    const stored = localStorage.getItem(`user_${phone}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setRecoveredPass(parsed.password || '1234');
    } else {
      // If fresh number, generate one
      setRecoveredPass('Pass@2026');
    }
    setError(null);
  };

  const copyPasswordToClipboard = () => {
    if (recoveredPass) {
      navigator.clipboard.writeText(recoveredPass);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setPassword(recoveredPass);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-red-500/20 px-3 py-1 rounded-full border border-amber-500/30 text-amber-400 text-xs font-bold font-display uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lucky Bet Arena</span>
          </div>
          <h2 className="text-2xl font-black font-display text-white">
            {mode === 'register' && 'Create Account'}
            {mode === 'login' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'register' && 'Sign up & receive 500 KES Free Welcome Bonus'}
            {mode === 'login' && 'Enter your phone number and password'}
            {mode === 'forgot' && 'Instant password lookup by phone number'}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/60 border border-red-500/50 p-2.5 rounded-xl text-xs text-red-300 mb-4 text-center">
            {error}
          </div>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Username / Nickname
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. CaptainAviator"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Create a password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>500 KES demo credits will be credited to your balance instantly!</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-display font-extrabold text-sm uppercase tracking-wider text-slate-950 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Sign Up & Get 500 KES
            </button>

            <div className="text-center text-xs text-slate-400 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-400 font-semibold">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('forgot');
                  }}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-display font-extrabold text-sm uppercase tracking-wider text-slate-950 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Log In
            </button>

            <div className="text-center text-xs text-slate-400 pt-2">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('register');
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                Sign Up & Claim 500 KES
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Enter Your Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {recoveredPass ? (
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/50 space-y-2">
                <span className="text-xs text-slate-400 block">Your Password:</span>
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-mono text-base font-bold text-amber-400">
                    {recoveredPass}
                  </span>
                  <button
                    type="button"
                    onClick={copyPasswordToClipboard}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
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
                <p className="text-[11px] text-emerald-400">
                  Password copied! You can now log in directly.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setPassword(recoveredPass);
                    setMode('login');
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  Proceed to Login
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-display font-extrabold text-sm uppercase tracking-wider text-slate-950 rounded-xl transition-all cursor-pointer"
              >
                Retrieve Password
              </button>
            )}

            <div className="text-center text-xs text-slate-400">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-400 font-bold hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
