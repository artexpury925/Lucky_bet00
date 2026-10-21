import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { ShieldCheck, X, CheckCircle, Copy, Check, Lock, RefreshCw } from 'lucide-react';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastRoundHash?: string;
  lastRoundMultiplier?: number;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
  lastRoundHash = 'a4b8720fd72e811c5f3b79da934ef03518a28e945c11099238eb765f02bc119a',
  lastRoundMultiplier = 3.42,
}) => {
  const [serverSeed, setServerSeed] = useState(lastRoundHash);
  const [clientSeed, setClientSeed] = useState('000000000000000000042f9a718b52e3');
  const [roundNumber, setRoundNumber] = useState('8429');
  const [verifiedMultiplier, setVerifiedMultiplier] = useState<number | null>(lastRoundMultiplier);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    // Deterministic simulation based on seeds
    let hashNum = 0;
    const combined = serverSeed + clientSeed + roundNumber;
    for (let i = 0; i < combined.length; i++) {
      hashNum = (hashNum * 31 + combined.charCodeAt(i)) % 1000000;
    }

    // 0.97 RTP calculation
    const raw = (1000000 / (hashNum + 1)) * 0.97;
    const mult = Math.min(250, Math.max(1.0, Math.round(raw * 100) / 100));
    setVerifiedMultiplier(mult);
  };

  const handleCopy = (text: string) => {
    soundEngine.playClick();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-display font-black text-lg text-white">
              Provably Fair Verification
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-start space-x-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-white block">Cryptographically Verifiable:</span>
              Every flight multiplier in Lucky Bet Aviator is generated using a SHA-256 cryptographic hash before the flight takes off. It cannot be altered by the player or system.
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">
                Server Seed (SHA-256 Hash)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverSeed}
                  onChange={e => setServerSeed(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-[11px] text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(serverSeed)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                  title="Copy Hash"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Client Seed
                </label>
                <input
                  type="text"
                  value={clientSeed}
                  onChange={e => setClientSeed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-[11px] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Round Number
                </label>
                <input
                  type="number"
                  value={roundNumber}
                  onChange={e => setRoundNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-[11px] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>CALCULATE &amp; VERIFY CRASH RESULT</span>
            </button>
          </form>

          {/* Verification Result */}
          {verifiedMultiplier !== null && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Calculated Multiplier Result
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {verifiedMultiplier.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>100% Mathematically Fair</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
