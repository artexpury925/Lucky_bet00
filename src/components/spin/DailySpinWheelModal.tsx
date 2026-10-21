import React, { useState, useRef, useEffect } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import { X, Sparkles, Clock, RotateCw, Trophy, Gift, ArrowRight } from 'lucide-react';

interface DailySpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (amount: number, description: string) => void;
  userBalance: number;
}

interface WheelSegment {
  label: string;
  amount: number;
  color: string;
  textColor: string;
  isJackpot?: boolean;
}

const SEGMENTS: WheelSegment[] = [
  { label: '50 KES', amount: 50, color: '#f59e0b', textColor: '#0f172a' },
  { label: '10 KES', amount: 10, color: '#10b981', textColor: '#ffffff' },
  { label: '200 KES', amount: 200, color: '#ec4899', textColor: '#ffffff', isJackpot: true },
  { label: 'Try Again', amount: 0, color: '#334155', textColor: '#94a3b8' },
  { label: '100 KES', amount: 100, color: '#8b5cf6', textColor: '#ffffff', isJackpot: true },
  { label: '25 KES', amount: 25, color: '#06b6d4', textColor: '#ffffff' },
  { label: '500 KES', amount: 500, color: '#ef4444', textColor: '#ffffff', isJackpot: true },
  { label: '15 KES', amount: 15, color: '#eab308', textColor: '#0f172a' },
];

export const DailySpinWheelModal: React.FC<DailySpinWheelModalProps> = ({
  isOpen,
  onClose,
  onReward,
  userBalance,
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check last spin time from localStorage
  useEffect(() => {
    const lastSpin = localStorage.getItem('lucky_last_spin_time');
    if (lastSpin) {
      const diff = Date.now() - parseInt(lastSpin, 10);
      // Cooldown of 24 hours, but we allow demo spins if requested
      if (diff < 24 * 60 * 60 * 1000) {
        setHasSpunToday(true);
      }
    }
  }, [isOpen]);

  // Draw the wheel on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const numSegments = SEGMENTS.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, size, size);

    // Draw outer golden ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
    ctx.restore();

    // Draw wheel segments
    SEGMENTS.forEach((seg, i) => {
      const startAngle = i * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Draw segment text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = seg.textColor;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(seg.label, radius - 20, 5);
      ctx.restore();

      ctx.restore();
    });

    // Draw center hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.restore();
  }, []);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);
    soundEngine.playClick();

    // Weighted random selection: higher chance for 10, 15, 25, 50, slightly lower for 200, 500
    const randomIndex = Math.floor(Math.random() * SEGMENTS.length);
    const chosenSegment = SEGMENTS[randomIndex];

    // Calculate rotation: 5 to 7 full circles + slice angle
    const segmentAngle = 360 / SEGMENTS.length;
    // Top pointer is at 270 degrees (or -90 deg). We align winning slice with top pointer:
    const targetOffset = 270 - (randomIndex * segmentAngle + segmentAngle / 2);
    const totalExtraRotations = 360 * 6; // 6 full turns
    const finalAngle = rotation + totalExtraRotations + ((targetOffset - (rotation % 360) + 360) % 360);

    // Audio tick simulation
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      soundEngine.playWheelTick();
      tickCount++;
      if (tickCount > 25) clearInterval(tickInterval);
    }, 120);

    setRotation(finalAngle);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setResult(chosenSegment);

      if (chosenSegment.amount > 0) {
        soundEngine.playFanfare();
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        onReward(chosenSegment.amount, `Daily Lucky Wheel Win (+${chosenSegment.amount} KES)`);
      } else {
        soundEngine.playCashout();
      }

      localStorage.setItem('lucky_last_spin_time', Date.now().toString());
      setHasSpunToday(true);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-5 text-center text-white relative">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Gift className="w-5 h-5 text-amber-200" />
            <span className="text-[11px] font-black uppercase tracking-widest font-mono bg-slate-950/40 px-2.5 py-0.5 rounded-full border border-white/20">
              Daily Bonus Wheel
            </span>
          </div>
          <h3 className="text-2xl font-black font-display tracking-tight text-white">
            Spin &amp; Win Real Cash!
          </h3>
          <p className="text-xs text-amber-100 mt-0.5">
            Spin daily for instant balance boosts, cashout bonuses &amp; jackpots!
          </p>
        </div>

        {/* Wheel Body */}
        <div className="p-6 flex flex-col items-center justify-center relative bg-slate-950/60">
          {/* Top Indicator Arrow */}
          <div className="relative z-10 -mb-4 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-md" />
          </div>

          {/* Canvas Wheel */}
          <div
            className="w-72 h-72 relative flex items-center justify-center transition-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '4000ms' : '0ms',
              transitionTimingFunction: 'cubic-bezier(0.15, 0.9, 0.25, 1)',
            }}
          >
            <canvas ref={canvasRef} width={288} height={288} className="w-full h-full" />
          </div>

          {/* Winner Celebration Banner */}
          {result && (
            <div className="mt-4 p-3 w-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 rounded-xl text-center animate-fadeIn">
              {result.amount > 0 ? (
                <>
                  <div className="text-xs font-mono uppercase text-amber-400 font-black">
                    🎉 Congratulations!
                  </div>
                  <div className="text-xl font-black font-display text-white mt-0.5">
                    You Won +{result.amount} KES!
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Credited directly to your wallet balance.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-mono uppercase text-slate-400 font-bold">
                    Better Luck Next Time!
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    Spin again tomorrow for another chance!
                  </div>
                </>
              )}
            </div>
          )}

          {/* Spin CTA Button */}
          <div className="mt-5 w-full space-y-2">
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className={`w-full py-3.5 px-4 rounded-xl font-display font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                isSpinning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 active:scale-98 shadow-amber-500/20'
              }`}
            >
              <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'SPINNING...' : hasSpunToday ? 'FREE DEMO SPIN' : 'SPIN THE WHEEL NOW'}</span>
            </button>

            {hasSpunToday && (
              <p className="text-[11px] text-center text-slate-400">
                ⭐ You used your official daily spin. Unlimited demo spins are available for fun!
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 px-6">
          <span>Active Balance: <strong className="text-emerald-400">{userBalance.toFixed(2)} KES</strong></span>
          <span className="flex items-center text-amber-400">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Top Prize: 500 KES
          </span>
        </div>
      </div>
    </div>
  );
};
