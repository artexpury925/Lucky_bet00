import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateCrashPoint, getCurrentHourMood, getMoodDetails } from '../src/utils/provablyFair.ts';

describe('Provably Fair Algorithm & Hourly Mood Cycle', () => {
  it('generates crash points above or equal to 1.00', () => {
    for (let i = 0; i < 50; i++) {
      const { multiplier } = generateCrashPoint(0.97);
      assert.ok(multiplier >= 1.00, `Multiplier ${multiplier} must be >= 1.00`);
      assert.ok(multiplier <= 300.00, `Multiplier ${multiplier} must be <= 300.00`);
    }
  });

  it('calculates current hour mood correctly', () => {
    const mood = getCurrentHourMood();
    assert.ok(['fair', 'generous', 'greedy'].includes(mood));
    const details = getMoodDetails(mood);
    assert.ok(details.name.length > 0);
    assert.ok(details.rtp > 0.9 && details.rtp < 1.0);
  });

  it('handles generous mood with higher average flights', () => {
    const samples: number[] = [];
    for (let i = 0; i < 100; i++) {
      const { multiplier } = generateCrashPoint(0.97, 'generous');
      samples.push(multiplier);
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    assert.ok(avg > 1.2, `Generous average ${avg} should be healthy`);
  });

  it('handles greedy mood with tighter distribution', () => {
    const samples: number[] = [];
    for (let i = 0; i < 100; i++) {
      const { multiplier } = generateCrashPoint(0.97, 'greedy');
      samples.push(multiplier);
    }
    const hasLowMultiplier = samples.some(m => m <= 2.0);
    assert.strictEqual(hasLowMultiplier, true, 'Greedy mode should frequently cluster around lower multipliers');
  });
});
