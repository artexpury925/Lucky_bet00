import { AviatorHourlyMood } from '../types';

// Provably fair crash generation and verification system
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Determines the mood dynamically every hour: Fair -> Generous -> Greedy cycle
export function getCurrentHourMood(): AviatorHourlyMood {
  const hour = new Date().getHours();
  const cycle: AviatorHourlyMood[] = ['fair', 'generous', 'greedy'];
  return cycle[hour % 3];
}

export function getMoodDetails(mood: AviatorHourlyMood) {
  switch (mood) {
    case 'generous':
      return {
        name: 'Generous Hour',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        textColor: 'text-emerald-400',
        rtp: 0.99,
        description: 'High multiplier frequency! Smooth skies with frequent high flights.',
      };
    case 'greedy':
      return {
        name: 'Greedy Hour',
        badge: 'bg-red-500/20 text-red-400 border-red-500/40',
        textColor: 'text-red-400',
        rtp: 0.92,
        description: 'Turbulent skies! Lower multipliers with quick sudden drop-offs.',
      };
    case 'fair':
    default:
      return {
        name: 'Fair Hour',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        textColor: 'text-amber-400',
        rtp: 0.97,
        description: 'Standard statistical casino balance with 97% Return-to-Player.',
      };
  }
}

// Generate a realistic crash point with configurable RTP (Return to Player) and mood
export function generateCrashPoint(
  rtpRate: number = 0.97,
  mood?: AviatorHourlyMood
): { multiplier: number; rawValue: number } {
  // If mood is provided, adapt RTP
  let effectiveRtp = rtpRate;
  if (mood) {
    if (mood === 'generous') effectiveRtp = 0.99;
    else if (mood === 'greedy') effectiveRtp = 0.92;
    else effectiveRtp = 0.97;
  }

  // House edge instant crash check
  const instantCrashProbability = 1 - effectiveRtp; // e.g. 1% for generous, 3% for fair, 8% for greedy
  const r = Math.random();

  if (r < instantCrashProbability) {
    return { multiplier: 1.00, rawValue: r };
  }

  // Realistic exponential distribution for crash game
  const normalizedR = (r - instantCrashProbability) / (1 - instantCrashProbability);
  
  let rawMult: number;
  if (mood === 'generous') {
    // Skew higher with occasional rockets
    rawMult = 1.02 / Math.pow(1 - normalizedR, 1.08);
  } else if (mood === 'greedy') {
    // Skew lower: heavy clustering near 1.1x - 2.0x
    rawMult = 0.96 / Math.pow(1 - normalizedR, 0.92);
  } else {
    // Fair
    rawMult = 0.99 / (1 - normalizedR);
  }
  
  // Format to 2 decimal places, minimum 1.01
  const multiplier = Math.max(1.01, Math.min(300.00, Math.floor(rawMult * 100) / 100));

  return { multiplier, rawValue: r };
}
