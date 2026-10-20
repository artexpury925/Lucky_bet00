import React, { useState } from 'react';
import { AviatorHistoryItem } from '../../types';
import { ShieldCheck, X, History, Sparkles } from 'lucide-react';

interface FlightHistoryProps {
  history: AviatorHistoryItem[];
}

export const FlightHistory: React.FC<FlightHistoryProps> = ({ history }) => {
  const [selectedRound, setSelectedRound] = useState<AviatorHistoryItem | null>(null);

  const getPillStyle = (multiplier: number) => {
    if (multiplier >= 10.0) {
      return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/30 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
    }
    if (multiplier >= 2.0) {
      return 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/30 text-purple-300 border-purple-500/50';
    }
    return 'bg-slate-800/80 text-cyan-400 border-slate-700/60';
  };

  return (
    <div className="w-full">
      <div className="flex items-center space-x-2 py-2 overflow-x-auto scrollbar-none px-1">
        <div className="flex items-center space-x-1 text-slate-500 text-xs font-bold uppercase tracking-wider shrink-0 mr-1">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">History</span>
        </div>

        {history.slice(0, 25).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedRound(item)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-display font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer ${getPillStyle(
              item.multiplier
            )}`}
          >
            {item.multiplier.toFixed(2)}x
          </button>
        ))}
      </div>

      {/* Provably Fair Modal */}
      {selectedRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedRound(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4 text-amber-400">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-white font-display">
                Provably Fair Verification
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Round Number</span>
                <span className="font-display font-bold text-white">
                  #{selectedRound.roundNumber}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Crash Multiplier</span>
                <span className="font-display font-black text-lg text-emerald-400">
                  {selectedRound.multiplier.toFixed(2)}x
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">SHA-256 Hash</span>
                <p className="font-mono text-[10px] text-slate-300 break-all select-all bg-slate-900 p-2 rounded border border-slate-800">
                  {selectedRound.hash}
                </p>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-emerald-300 leading-relaxed flex items-start space-x-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <p>
                  This crash point was generated transparently prior to takeoff using standard
                  cryptographic hash seeds. The result cannot be altered once launched.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRound(null)}
              className="w-full mt-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors font-display"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
