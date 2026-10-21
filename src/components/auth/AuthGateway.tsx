import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { realtimeClient } from '../../utils/realtimeClient';
import {
  Plane,
  ShieldCheck,
  Sparkles,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Trophy,
  Flame,
  KeyRound,
  Copy,
  ArrowRight,
  Shield,
  HelpCircle,
  Loader2,
  Gift,
} from 'lucide-react';

interface AuthGatewayProps {
  onSuccess: (account: UserAccount, rememberMe: boolean) => void;
  onOpenAdmin?: () => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || (window.location.hash.includes('ref=') ? window.location.hash.split('ref=')[1] : '');
      if (ref) {
        localStorage.setItem('lucky_referrer_code', ref.trim());
        return ref.trim();
      }
      return localStorage.getItem('lucky_referrer_code') || '';
    }
    return '';
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveredPass, setRecoveredPass] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter a valid phone number (at least 9 digits, e.g. 0712345678)');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    const cleanUsername = username.trim() || `Player_${cleanPhone.slice(-4)}`;

    setIsSubmitting(true);
    setError(null);

    // Register on the server so that the admin panel on ANY device/phone/browser sees them immediately
    const res = await realtimeClient.registerUser({
      phoneNumber: cleanPhone,
      username: cleanUsername,
      password,
      referredBy: referralCode.trim() || undefined,
    });

    setIsSubmitting(false);

    let finalAccount: UserAccount;
    if (res.success && res.user) {
      finalAccount = res.user;
    } else {
      // Local fallback in case network was momentarily slow
      finalAccount = {
        phoneNumber: cleanPhone,
        username: cleanUsername,
        balance: 500,
        joinedAt: Date.now(),
        initialBonusClaimed: true,
        totalDepositedDemo: 0,
        totalWithdrawnDemo: 0,
        referredBy: referralCode.trim() || undefined,
      };
      realtimeClient.syncUserToServer(finalAccount, password);
    }

    // Store user credentials
    localStorage.setItem(`user_${cleanPhone}`, JSON.stringify({ ...finalAccount, password }));

    // Handle persistent Remember Me vs session
    if (rememberMe) {
      localStorage.setItem('lucky_bet_remember_me', 'true');
      localStorage.setItem('lucky_bet_auth_token', cleanPhone);
      localStorage.setItem('lucky_bet_active_user', JSON.stringify(finalAccount));
    } else {
      localStorage.setItem('lucky_bet_remember_me', 'false');
      localStorage.removeItem('lucky_bet_auth_token');
      sessionStorage.setItem('lucky_bet_auth_token', cleanPhone);
      localStorage.setItem('lucky_bet_active_user', JSON.stringify(finalAccount));
    }

    soundEngine.playSportsWin();
    onSuccess(finalAccount, rememberMe);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter your registered phone number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Verify credentials against server for cross-device & cross-browser access
    const res = await realtimeClient.loginUser({
      phoneNumber: cleanPhone,
      password,
    });

    setIsSubmitting(false);

    let account: UserAccount;

    if (res.success && res.user) {
      account = res.user;
      localStorage.setItem(`user_${cleanPhone}`, JSON.stringify({ ...account, password }));
    } else {
      // Check local storage fallback
      const stored = localStorage.getItem(`user_${cleanPhone}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          account = {
            phoneNumber: parsed.phoneNumber || cleanPhone,
            username: parsed.username || `Player_${cleanPhone.slice(-4)}`,
            balance: typeof parsed.balance === 'number' ? parsed.balance : 500,
            joinedAt: parsed.joinedAt || Date.now(),
            initialBonusClaimed: parsed.initialBonusClaimed ?? true,
            totalDepositedDemo: parsed.totalDepositedDemo || 0,
            totalWithdrawnDemo: parsed.totalWithdrawnDemo || 0,
          };
          // Sync account to server so admin sees it now
          realtimeClient.syncUserToServer(account, password);
        } catch {
          setError(res.error || 'Failed to authenticate');
          return;
        }
      } else {
        setError(res.error || 'Account not found. Please create an account first.');
        return;
      }
    }

    if (rememberMe) {
      localStorage.setItem('lucky_bet_remember_me', 'true');
      localStorage.setItem('lucky_bet_auth_token', cleanPhone);
      localStorage.setItem('lucky_bet_active_user', JSON.stringify(account));
    } else {
      localStorage.setItem('lucky_bet_remember_me', 'false');
      localStorage.removeItem('lucky_bet_auth_token');
      sessionStorage.setItem('lucky_bet_auth_token', cleanPhone);
      localStorage.setItem('lucky_bet_active_user', JSON.stringify(account));
    }

    soundEngine.playSportsWin();
    onSuccess(account, rememberMe);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError('Enter your registered phone number');
      return;
    }

    const stored = localStorage.getItem(`user_${cleanPhone}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecoveredPass(parsed.password || '1234');
      } catch {
        setRecoveredPass('1234');
      }
    } else {
      setRecoveredPass('Pass@2026');
    }
    setError(null);
  };

  const copyPasswordToClipboard = () => {
    if (!recoveredPass) return;
    navigator.clipboard.writeText(recoveredPass);
    setCopied(true);
    soundEngine.playCashout();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Bar */}
      <header className="w-full bg-[#0e121a]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-900/40">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black font-display tracking-tight text-white uppercase">
                LUCKY <span className="text-amber-400">BET</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                KENYA 254
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Aviator Crash Arena & Live Football</span>
          </div>
        </div>

        {/* Verified Security Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </header>

      {/* Main Authentication Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 z-10">
        {/* Left Column: Hero & Perks */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-display uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>500 KES Instant Free Welcome Bonus</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white leading-tight">
            Fly High on Aviator. <br />
            <span className="bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Cash Out Before It Crashes.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
            Sign in or create your free account to enter Kenya's favorite Aviator crash game and sports arena simulator. Real-time odds, provably fair multipliers, and simulated M-PESA deposits.
          </p>

          {/* Value Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-left">
              <Trophy className="w-5 h-5 text-amber-400 mb-1.5" />
              <div className="text-xs font-bold text-white">500 KES Bonus</div>
              <div className="text-[10px] text-slate-400">Awarded immediately</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-left">
              <Flame className="w-5 h-5 text-red-400 mb-1.5" />
              <div className="text-xs font-bold text-white">100x Multipliers</div>
              <div className="text-[10px] text-slate-400">Dual bet controls</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-left col-span-2 sm:col-span-1">
              <Shield className="w-5 h-5 text-emerald-400 mb-1.5" />
              <div className="text-xs font-bold text-white">Live Cross-Device</div>
              <div className="text-[10px] text-slate-400">Instant cloud sync</div>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Form Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            {/* Mode Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-display font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-amber-500 to-red-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-display font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-amber-500 to-red-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up (+500 KES)
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-950/70 border border-red-500/60 p-3 rounded-xl text-xs text-red-300 flex items-center space-x-2 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0712345678"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setMode('forgot');
                        setError(null);
                      }}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 accent-amber-500 cursor-pointer"
                    />
                    <span>Remember me on this device</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Stays logged in</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 font-display font-black text-sm uppercase tracking-wider text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Verifying Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In & Enter Game</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>New Player Promo:</strong> Get <strong>500 KES free credit</strong> instantly in your wallet!
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Phone Number (M-PESA)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0712345678"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Choose Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Kip_Pilot254"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 4 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Referral Code (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center">
                      <Gift className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      Referral Code <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                    </label>
                    {referralCode && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Active Referral Applied
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Gift className="w-4 h-4 text-amber-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. LUCKY-7777ARN"
                      value={referralCode}
                      onChange={e => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono uppercase tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Have an invitation link or friend's code? Enter it here to activate referral commission.
                  </p>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 accent-amber-500 cursor-pointer"
                    />
                    <span>Remember me on this device</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Auto-login</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 font-display font-black text-sm uppercase tracking-wider text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Creating Account & Syncing...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Get 500 KES</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Your Registered Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0712345678"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {recoveredPass ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/50 space-y-3">
                    <span className="text-xs text-slate-400 block font-semibold">Your Password:</span>
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

                    <button
                      type="button"
                      onClick={() => {
                        setPassword(recoveredPass);
                        setMode('login');
                      }}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-red-600 text-slate-950 font-display font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Fill Password & Sign In
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

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a0c10] border-t border-slate-900 py-3.5 px-4 text-center text-xs text-slate-500 z-10">
        Lucky Bet Kenya &copy; 2026. Sports Betting &amp; Aviator Crash Arena. All Rights Reserved.
      </footer>
    </div>
  );
};
