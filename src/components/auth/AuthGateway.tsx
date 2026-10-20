import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
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
} from 'lucide-react';

interface AuthGatewayProps {
  onSuccess: (account: UserAccount, rememberMe: boolean) => void;
  onOpenAdmin: () => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({ onSuccess, onOpenAdmin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveredPass, setRecoveredPass] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick demo account pre-fill for fast testing
  const handleDemoFill = (demoPhone: string, demoUser: string) => {
    soundEngine.playClick();
    setPhone(demoPhone);
    setUsername(demoUser);
    setPassword('1234');
    setError(null);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter a valid phone number (e.g. 0712345678)');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    const cleanUsername = username.trim() || `Player_${cleanPhone.slice(-4)}`;

    const newAccount: UserAccount = {
      phoneNumber: cleanPhone,
      username: cleanUsername,
      balance: 500, // 500 KES Instant Free Welcome Bonus
      joinedAt: Date.now(),
      initialBonusClaimed: true,
      totalDepositedDemo: 0,
      totalWithdrawnDemo: 0,
    };

    // Store user credentials
    localStorage.setItem(`user_${cleanPhone}`, JSON.stringify({ ...newAccount, password }));

    // Handle persistent Remember Me vs session
    if (rememberMe) {
      localStorage.setItem('lucky_bet_remember_me', 'true');
      localStorage.setItem('lucky_bet_auth_token', cleanPhone);
      localStorage.setItem('lucky_bet_active_user', JSON.stringify(newAccount));
    } else {
      localStorage.setItem('lucky_bet_remember_me', 'false');
      localStorage.removeItem('lucky_bet_auth_token');
      sessionStorage.setItem('lucky_bet_auth_token', cleanPhone);
      localStorage.setItem('lucky_bet_active_user', JSON.stringify(newAccount));
    }

    soundEngine.playSportsWin();
    onSuccess(newAccount, rememberMe);
  };

  const handleLogin = (e: React.FormEvent) => {
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

    const stored = localStorage.getItem(`user_${cleanPhone}`);
    let account: UserAccount;

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
      } catch {
        account = {
          phoneNumber: cleanPhone,
          username: `Player_${cleanPhone.slice(-4)}`,
          balance: 500,
          joinedAt: Date.now(),
          initialBonusClaimed: true,
          totalDepositedDemo: 0,
          totalWithdrawnDemo: 0,
        };
      }
    } else {
      // First-time number logging in: automatically provision welcome demo account
      account = {
        phoneNumber: cleanPhone,
        username: `Player_${cleanPhone.slice(-4) || 'VIP'}`,
        balance: 500,
        joinedAt: Date.now(),
        initialBonusClaimed: true,
        totalDepositedDemo: 0,
        totalWithdrawnDemo: 0,
      };
      localStorage.setItem(`user_${cleanPhone}`, JSON.stringify({ ...account, password }));
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

        {/* Admin Access Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onOpenAdmin();
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Admin Portal</span>
        </button>
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
              <div className="text-[10px] text-slate-400">Admin live sync</div>
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
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 font-display font-black text-sm uppercase tracking-wider text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  <span>Sign In & Enter Game</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Demo Credentials helper */}
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-2 font-semibold">
                    Quick Demo Profiles (1-Click Fill):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoFill('0712345678', 'LuckyPlayer_254')}
                      className="text-[11px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors"
                    >
                      0712345678 (Player 254)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoFill('0722894102', 'Kiprotich_99')}
                      className="text-[11px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors"
                    >
                      0722894102 (Kiprotich)
                    </button>
                  </div>
                </div>
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
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 font-display font-black text-sm uppercase tracking-wider text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  <span>Create Account & Get 500 KES</span>
                  <ArrowRight className="w-4 h-4" />
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
                    Retrieve Demo Password
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

            {/* Bottom Admin Portal Hint */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Admin credentials: KENYA@254</span>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenAdmin();
                }}
                className="text-amber-400/90 hover:text-amber-300 font-bold hover:underline"
              >
                Open Admin Portal &rarr;
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a0c10] border-t border-slate-900 py-3 px-4 text-center text-xs text-slate-500 z-10">
        Lucky Bet Kenya &copy; 2026. Free-to-Play Entertainment & Crash Game Simulation.
      </footer>
    </div>
  );
};
