import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import {
  ShieldCheck,
  Users,
  Sliders,
  CheckCircle,
  XCircle,
  Rocket,
  LogOut,
  X,
  PlusCircle,
  Clock,
  Search,
  Sparkles,
} from 'lucide-react';
import { AviatorHourlyMood, UserAccount, PendingDeposit } from '../../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: UserAccount[];
  pendingDeposits: PendingDeposit[];
  onApproveDeposit: (id: string) => void;
  onRejectDeposit: (id: string) => void;
  onAdminAddFundsToUser: (phone: string, amount: number) => void;
  rtpRate: number;
  onUpdateRtp: (rate: number) => void;
  onTriggerSpecialFlight: (multiplier: number) => void;
  onResetBalances: () => void;
  hourlyMood: AviatorHourlyMood;
  onSetMood: (mood: AviatorHourlyMood) => void;
  isAutoMood: boolean;
  onToggleAutoMood: (auto: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  registeredUsers,
  pendingDeposits,
  onApproveDeposit,
  onRejectDeposit,
  onAdminAddFundsToUser,
  rtpRate,
  onUpdateRtp,
  onTriggerSpecialFlight,
  onResetBalances,
  hourlyMood,
  onSetMood,
  isAutoMood,
  onToggleAutoMood,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('KENYA@254');
  const [password, setPassword] = useState<string>('KENYA@254');
  const [error, setError] = useState<string | null>(null);

  // Admin Dashboard Tabs
  const [adminTab, setAdminTab] = useState<'deposits' | 'users' | 'flight'>('deposits');

  // Selected User Add Funds State
  const [selectedUserPhone, setSelectedUserPhone] = useState<string | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState<number>(500);
  const [fundsSuccess, setFundsSuccess] = useState<string | null>(null);
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    const u = username.trim().toUpperCase();
    const p = password.trim().toUpperCase();

    if (u === 'KENYA@254' && p === 'KENYA@254') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid admin credentials. Use username KENYA@254 and password KENYA@254');
    }
  };

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playCashout();

    if (!selectedUserPhone || addFundsAmount <= 0) return;

    onAdminAddFundsToUser(selectedUserPhone, addFundsAmount);
    setFundsSuccess(`Successfully credited +${addFundsAmount} KES to ${selectedUserPhone}!`);
    setTimeout(() => {
      setFundsSuccess(null);
      setSelectedUserPhone(null);
    }, 2500);
  };

  const filteredUsers = registeredUsers.filter(
    u =>
      u.username.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.phoneNumber.includes(searchUserQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/80 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!isAuthenticated ? (
          /* ADMIN LOGIN SCREEN */
          <div className="p-8 max-w-md mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center mx-auto mb-4 text-slate-950 shadow-lg shadow-amber-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black font-display text-white">Admin Management</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Restricted portal. Enter administrator credentials to proceed.
            </p>

            {error && (
              <div className="bg-red-950/70 border border-red-500/60 p-2.5 rounded-xl text-xs text-red-300 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="KENYA@254"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="KENYA@254"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 font-display font-extrabold text-sm uppercase tracking-wider text-slate-950 rounded-xl shadow-lg transition-all cursor-pointer"
              >
                ACCESS ADMINISTRATION
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div>
            {/* Top Bar */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-display font-bold text-white text-base">
                  Lucky Bet Platform Dashboard
                </span>
                <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                  KENYA@254
                </span>
              </div>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {/* Dashboard Sub-navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 py-2 space-x-2">
              <button
                type="button"
                onClick={() => setAdminTab('deposits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  adminTab === 'deposits'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Deposits ({pendingDeposits.filter(d => d.status === 'PENDING').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  adminTab === 'users'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Registered Users ({registeredUsers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('flight')}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  adminTab === 'flight'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Plane Mood & Controls</span>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[520px] overflow-y-auto">
              {fundsSuccess && (
                <div className="bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{fundsSuccess}</span>
                </div>
              )}

              {/* TAB 1: PENDING DEPOSITS QUEUE */}
              {adminTab === 'deposits' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center space-x-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Incoming M-PESA Deposit Verification Queue</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Paybill: 522522</span>
                  </div>

                  {pendingDeposits.filter(d => d.status === 'PENDING').length === 0 ? (
                    <div className="text-xs text-slate-500 py-6 text-center">
                      No pending deposit verification requests in queue!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingDeposits
                        .filter(d => d.status === 'PENDING')
                        .map(item => (
                          <div
                            key={item.id}
                            className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white">{item.username}</span>
                                <span className="font-mono text-slate-400 text-[11px]">{item.phoneNumber}</span>
                                <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                                  {item.code}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="font-display font-black text-emerald-400 text-sm">
                                +{item.amount} KES
                              </span>
                              <div className="flex space-x-1">
                                <button
                                  type="button"
                                  onClick={() => onApproveDeposit(item.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Verify & Credit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRejectDeposit(item.id)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: REGISTERED USERS MANAGEMENT & ADD FUNDS */}
              {adminTab === 'users' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>All Registered Users ({registeredUsers.length})</span>
                    </h4>

                    {/* Search User */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search phone or username..."
                        value={searchUserQuery}
                        onChange={e => setSearchUserQuery(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Add Funds Modal Form if user selected */}
                  {selectedUserPhone && (
                    <form
                      onSubmit={handleAddFundsSubmit}
                      className="bg-slate-900 p-3.5 rounded-xl border border-amber-500/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                          <PlusCircle className="w-4 h-4" />
                          <span>Add Funds to: {selectedUserPhone}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedUserPhone(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min={10}
                            value={addFundsAmount}
                            onChange={e => setAddFundsAmount(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-display font-bold focus:outline-none focus:border-emerald-500"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                            KES
                          </span>
                        </div>

                        <div className="flex space-x-1">
                          {[200, 500, 1000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setAddFundsAmount(amt)}
                              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-display font-bold text-slate-300"
                            >
                              +{amt}
                            </button>
                          ))}
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-display font-bold text-xs uppercase tracking-wider text-white rounded-lg shadow-md cursor-pointer"
                        >
                          Credit User
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Users Table */}
                  <div className="divide-y divide-slate-800/80">
                    <div className="grid grid-cols-12 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 bg-slate-900/40 rounded-t-lg">
                      <span className="col-span-4">User</span>
                      <span className="col-span-3">Phone</span>
                      <span className="col-span-3 text-right">Balance</span>
                      <span className="col-span-2 text-right">Actions</span>
                    </div>

                    {filteredUsers.map(u => (
                      <div
                        key={u.phoneNumber}
                        className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-900/60 transition-colors text-xs"
                      >
                        <div className="col-span-4 font-bold text-white truncate">
                          {u.username}
                        </div>
                        <div className="col-span-3 font-mono text-slate-400 text-[11px]">
                          {u.phoneNumber}
                        </div>
                        <div className="col-span-3 text-right font-display font-extrabold text-emerald-400">
                          {u.balance.toFixed(2)} KES
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserPhone(u.phoneNumber);
                              setAddFundsAmount(500);
                            }}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] font-bold font-display cursor-pointer"
                          >
                            + Add Funds
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PLANE MOOD & FLIGHT CONTROLS */}
              {adminTab === 'flight' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Set Aviator Flight Mood (Generous, Fair, Greedy)</span>
                  </h4>

                  {/* Hourly Volatility Mood Selector */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Active Flight Setting:
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleAutoMood(!isAutoMood)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                          isAutoMood
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isAutoMood ? '● Auto Clock Cycle (Rotates Every Hour)' : 'Manual Admin Override'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => onSetMood('generous')}
                        className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${
                          hourlyMood === 'generous'
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg font-black'
                            : 'bg-slate-950 text-emerald-400/80 border-slate-800 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="text-sm font-display font-black">GENEROUS</div>
                        <div className="text-[10px] opacity-80 mt-0.5">99% RTP • High Multipliers</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSetMood('fair')}
                        className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${
                          hourlyMood === 'fair'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg font-black'
                            : 'bg-slate-950 text-amber-400/80 border-slate-800 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="text-sm font-display font-black">FAIR</div>
                        <div className="text-[10px] opacity-80 mt-0.5">97% RTP • Balanced Standard</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSetMood('greedy')}
                        className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${
                          hourlyMood === 'greedy'
                            ? 'bg-red-600 text-white border-red-400 shadow-lg font-black'
                            : 'bg-slate-950 text-red-400/80 border-slate-800 hover:border-red-500/40'
                        }`}
                      >
                        <div className="text-sm font-display font-black">GREEDY</div>
                        <div className="text-[10px] opacity-80 mt-0.5">92% RTP • Quick Crashes</div>
                      </button>
                    </div>
                  </div>

                  {/* Special Flight Boost Test */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-200 block">
                      Force Special Flight Multiplier:
                    </span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => onTriggerSpecialFlight(50.0)}
                        className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Force 50x Rocket Flight</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onTriggerSpecialFlight(100.0)}
                        className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-display font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Force 100x Rocket Flight</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
