import React, { useState, useEffect } from 'react';
import { ussdPromptService, StkPushRequest } from '../../utils/ussdPromptService';
import { soundEngine } from '../../utils/soundEngine';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Delete,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StkPushModalProps {
  onSuccess?: (amount: number, txRef: string) => void;
}

export const StkPushModal: React.FC<StkPushModalProps> = ({ onSuccess }) => {
  const [request, setRequest] = useState<StkPushRequest | null>(null);
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const unsub = ussdPromptService.subscribe(req => {
      setRequest(req);
      if (req) {
        setPin('');
        setErrorMsg(null);
        setIsSubmitting(false);
      }
    });
    return unsub;
  }, []);

  if (!request) return null;

  const handleKeypadPress = (num: string) => {
    soundEngine.playClick();
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    soundEngine.playClick();
    setPin(prev => prev.slice(0, -1));
  };

  const handleSendPin = async () => {
    if (pin.length < 4) {
      setErrorMsg('Please enter your 4-digit M-PESA PIN');
      return;
    }

    soundEngine.playClick();
    setIsSubmitting(true);
    try {
      const result = await ussdPromptService.submitPin(request.id, pin);
      soundEngine.playCashout();
      if (onSuccess) {
        onSuccess(result.amount, result.transactionRef);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error processing PIN');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    soundEngine.playClick();
    ussdPromptService.cancelPrompt(request.id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* SIM Toolkit Phone Prompt Container */}
      <div className="w-full max-w-sm bg-[#0b1411] border-2 border-emerald-500/70 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden relative">
        {/* Top Safaricom SIM Toolkit Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 p-3.5 sm:p-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-emerald-100 block leading-none">
                Safaricom SIM Toolkit
              </span>
              <h3 className="text-sm font-black font-display tracking-tight text-white mt-0.5">
                Lipa na M-PESA Online
              </h3>
            </div>
          </div>

          {/* 45s Countdown Indicator */}
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-black/30 border border-white/20 text-[11px] font-mono font-bold">
            <Clock className="w-3 h-3 text-emerald-200 animate-spin" />
            <span>{request.timeoutSeconds}s</span>
          </div>
        </div>

        {/* Modal Prompt Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {request.status === 'ACCEPTED' ? (
            <div className="py-6 text-center space-y-2.5 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-base font-black font-display text-white">PIN Accepted!</h4>
              <p className="text-xs text-slate-300">
                Payment of <strong className="text-emerald-400">KES {request.amount.toFixed(2)}</strong> confirmed.
              </p>
              <span className="text-[10px] text-slate-400 font-mono block">Crediting Lucky Bet wallet balance...</span>
            </div>
          ) : request.status === 'TIMEOUT' ? (
            <div className="py-6 text-center space-y-2 animate-fadeIn">
              <XCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h4 className="text-base font-bold text-white">Prompt Timed Out</h4>
              <p className="text-xs text-slate-400">No PIN entered within 45 seconds.</p>
            </div>
          ) : (
            <>
              {/* Payment Prompt Text */}
              <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-3.5 text-xs text-slate-200 leading-relaxed shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2 pb-1.5 border-b border-slate-800">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>USSD Prompt Target:</span>
                  </span>
                  <span className="text-amber-400 font-bold">{request.phoneNumber}</span>
                </div>
                <p className="font-semibold">
                  Enter M-PESA PIN to send <strong className="text-emerald-400 text-sm font-black">KES {request.amount.toFixed(2)}</strong> directly to{' '}
                  <strong className="text-white">Paybill {request.paybill}</strong> (Account:{' '}
                  <span className="font-mono text-amber-400 font-bold">{request.accountReference}</span>)?
                </p>
                <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400/90 font-mono mt-2 pt-2 border-t border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Direct Lipa na M-PESA Paybill Settlement</span>
                </div>
              </div>

              {/* PIN Input Section */}
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Enter 4-Digit M-PESA PIN:
                </label>

                {/* 4 PIN Dots */}
                <div className="flex justify-center items-center space-x-4 py-2">
                  {[0, 1, 2, 3].map(index => {
                    const filled = pin.length > index;
                    return (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                          filled
                            ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)] scale-110'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>

                {errorMsg && (
                  <p className="text-[11px] text-red-400 font-bold animate-shake">{errorMsg}</p>
                )}
              </div>

              {/* On-Screen Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="py-3 bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-base font-black text-white font-mono transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-3 bg-slate-900/60 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 rounded-xl text-xs font-bold text-red-400 transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-base font-black text-white font-mono transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons: Cancel and Send */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase font-display rounded-xl border border-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSendPin}
                  disabled={pin.length < 4 || isSubmitting}
                  className="py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 active:scale-95 text-white font-black text-xs uppercase font-display rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>Send PIN</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
