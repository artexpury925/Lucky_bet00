import React, { useEffect, useRef } from 'react';
import { GamePhase, AviatorTheme } from '../../types';

interface AviatorCanvasProps {
  phase: GamePhase;
  multiplier: number;
  theme: AviatorTheme;
  countdown: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const AviatorCanvas: React.FC<AviatorCanvasProps> = ({
  phase,
  multiplier,
  theme,
  countdown,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const planeAnimRef = useRef<{ propAngle: number; planeX: number; planeY: number; planeAngle: number }>({
    propAngle: 0,
    planeX: 0,
    planeY: 0,
    planeAngle: 0,
  });

  // Canvas theme palettes
  const getThemeColors = () => {
    switch (theme) {
      case 'cyber-neon':
        return {
          bg: '#090d16',
          grid: '#1e293b',
          curveStroke: '#06b6d4',
          curveGlow: '#06b6d4',
          fillGradientStart: 'rgba(6, 182, 212, 0.35)',
          fillGradientEnd: 'rgba(99, 102, 241, 0.02)',
          planeBody: '#38bdf8',
          planeWing: '#0284c7',
          exhaust: '#22d3ee',
        };
      case 'sahara-gold':
        return {
          bg: '#140f09',
          grid: '#291e14',
          curveStroke: '#f59e0b',
          curveGlow: '#d97706',
          fillGradientStart: 'rgba(245, 158, 11, 0.35)',
          fillGradientEnd: 'rgba(217, 119, 6, 0.02)',
          planeBody: '#fbbf24',
          planeWing: '#d97706',
          exhaust: '#fde68a',
        };
      case 'classic-red':
      default:
        return {
          bg: '#0f0709',
          grid: '#251217',
          curveStroke: '#ef4444',
          curveGlow: '#dc2626',
          fillGradientStart: 'rgba(239, 68, 68, 0.4)',
          fillGradientEnd: 'rgba(220, 38, 38, 0.02)',
          planeBody: '#ef4444',
          planeWing: '#b91c1c',
          exhaust: '#f87171',
        };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const colors = getThemeColors();

      // Clear Canvas
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle perspective runway grid
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Propeller angle continuous spin
      planeAnimRef.current.propAngle += 0.35;

      const paddingLeft = 40;
      const paddingBottom = 40;
      const paddingTop = 40;
      const paddingRight = 60;

      const flightWidth = width - paddingLeft - paddingRight;
      const flightHeight = height - paddingBottom - paddingTop;

      if (phase === 'FLYING' || phase === 'CRASHED') {
        // Multiplier progression mapping
        // Progress runs smoothly as multiplier increases
        const progress = Math.min(1, Math.max(0, (multiplier - 1) / (multiplier > 10 ? 30 : 6)));
        
        // Target coordinates for plane tip
        const startX = paddingLeft;
        const startY = height - paddingBottom;

        let endX = startX + flightWidth * (0.15 + 0.8 * Math.pow(progress, 0.7));
        let endY = startY - flightHeight * (0.1 + 0.85 * Math.pow(progress, 0.8));

        // When crashed, plane shoots off screen
        if (phase === 'CRASHED') {
          planeAnimRef.current.planeX += 16;
          planeAnimRef.current.planeY -= 8;
          endX = planeAnimRef.current.planeX;
          endY = planeAnimRef.current.planeY;
        } else {
          planeAnimRef.current.planeX = endX;
          planeAnimRef.current.planeY = endY;
        }

        // Draw curved flight area gradient and curve
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        const controlX = startX + (endX - startX) * 0.55;
        const controlY = startY;

        ctx.quadraticCurveTo(controlX, controlY, endX, endY);

        // Fill area below flight curve
        ctx.lineTo(endX, startY);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, endY, 0, startY);
        grad.addColorStop(0, colors.fillGradientStart);
        grad.addColorStop(1, colors.fillGradientEnd);
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.strokeStyle = colors.curveStroke;
        ctx.lineWidth = 4;
        ctx.shadowColor = colors.curveGlow;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();

        // Spawn exhaust particles
        if (phase === 'FLYING') {
          for (let i = 0; i < 2; i++) {
            particlesRef.current.push({
              x: endX - 10,
              y: endY + 4,
              vx: -(2 + Math.random() * 3),
              vy: (Math.random() - 0.5) * 1.5,
              size: 2 + Math.random() * 4,
              alpha: 0.8,
              color: colors.exhaust,
            });
          }
        }

        // Update and draw exhaust particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          p.size += 0.2;

          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Calculate plane angle tangent
        const angle = Math.atan2(endY - controlY, endX - controlX) * 0.5;
        planeAnimRef.current.planeAngle = angle;

        // Draw stunt plane
        drawAirplane(ctx, endX, endY, angle, colors, planeAnimRef.current.propAngle);
      } else {
        // WAITING PHASE: Plane idle on runway
        const runwayX = paddingLeft + 30;
        const runwayY = height - paddingBottom - 10;
        planeAnimRef.current.planeX = runwayX;
        planeAnimRef.current.planeY = runwayY;
        drawAirplane(ctx, runwayX, runwayY, 0, colors, planeAnimRef.current.propAngle);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [phase, multiplier, theme]);

  // High quality vector Biplane / Stunt Plane rendering
  const drawAirplane = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    colors: ReturnType<typeof getThemeColors>,
    propAngle: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Glow effect
    ctx.shadowColor = colors.curveGlow;
    ctx.shadowBlur = 14;

    // Plane Fuselage (Streamlined racer)
    ctx.fillStyle = colors.planeBody;
    ctx.beginPath();
    ctx.moveTo(28, 0); // Nose tip
    ctx.quadraticCurveTo(8, -9, -20, -7);
    ctx.lineTo(-30, -18); // Tail fin top
    ctx.lineTo(-24, -2);
    ctx.lineTo(-32, 2);
    ctx.lineTo(-22, 6);
    ctx.quadraticCurveTo(8, 8, 28, 0);
    ctx.closePath();
    ctx.fill();

    // Canopy / Cockpit glass
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(3, -4, 9, 4, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Main Wing
    ctx.fillStyle = colors.planeWing;
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.lineTo(-10, -22);
    ctx.lineTo(-16, -22);
    ctx.lineTo(-4, -1);
    ctx.closePath();
    ctx.fill();

    // Bottom wing highlight
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(-8, 16);
    ctx.lineTo(-14, 16);
    ctx.lineTo(-3, 2);
    ctx.closePath();
    ctx.fill();

    // Propeller Hub & Blade Spin
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(28, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Spinning propeller blur
    ctx.save();
    ctx.translate(28, 0);
    ctx.rotate(propAngle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(-2, -18, 4, 36);
    ctx.restore();

    ctx.restore();
  };

  return (
    <div className="relative w-full h-80 sm:h-96 md:h-[420px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0c0d14] shadow-2xl flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={900}
        height={450}
        className="w-full h-full object-cover"
      />

      {/* Floating Center Multiplier Display */}
      {phase === 'FLYING' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="text-6xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.45)]">
            {multiplier.toFixed(2)}x
          </div>
          <div className="mt-2 text-xs uppercase tracking-widest text-slate-300 font-semibold bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/50">
            Current Multiplier
          </div>
        </div>
      )}

      {/* Crashed State Overlay */}
      {phase === 'CRASHED' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-[2px] transition-all">
          <span className="text-xs font-bold tracking-widest uppercase text-red-400 mb-1">
            Round Terminated
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold uppercase text-red-500 font-display tracking-wide drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
            Flew Away!
          </div>
          <div className="mt-2 text-5xl sm:text-6xl font-black font-display text-white drop-shadow-md">
            {multiplier.toFixed(2)}x
          </div>
        </div>
      )}

      {/* Waiting Phase Countdown & Progress */}
      {phase === 'WAITING' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="relative flex items-center justify-center mb-4">
            <svg className="w-20 h-20 -rotate-90 transform">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                className="text-amber-500 transition-all duration-200"
                fill="transparent"
                strokeDasharray="213"
                strokeDashoffset={213 - (213 * (5 - countdown)) / 5}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-2xl font-black font-display text-white">
              {Math.max(1, Math.ceil(countdown))}s
            </span>
          </div>
          <p className="text-sm sm:text-base font-semibold tracking-wider uppercase text-slate-200">
            Waiting for next flight
          </p>
          <div className="w-48 sm:w-64 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-100"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
