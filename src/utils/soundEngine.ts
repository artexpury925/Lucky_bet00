// Web Audio API Procedural Sound Engine for Aviator & Casino Effects
class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopFlightEngine();
    }
  }

  // Realistic propeller / turbine engine pitch that bends up with the multiplier
  public updateFlightEngine(multiplier: number, isFlying: boolean) {
    if (this.isMuted || !isFlying) {
      this.stopFlightEngine();
      return;
    }

    this.initContext();
    if (!this.ctx) return;

    if (!this.engineOsc) {
      try {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();

        this.engineOsc.type = 'sawtooth';
        this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        this.engineOsc.start();
      } catch (e) {
        console.warn('Audio start error', e);
      }
    }

    if (this.engineOsc && this.ctx) {
      // Base frequency 110Hz, scales with multiplier logarithmically
      const targetFreq = Math.min(650, 100 + Math.log(multiplier) * 160);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    }
  }

  public stopFlightEngine() {
    if (this.engineOsc) {
      try {
        if (this.engineGain && this.ctx) {
          this.engineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
        }
        setTimeout(() => {
          try {
            this.engineOsc?.stop();
            this.engineOsc?.disconnect();
          } catch {}
          this.engineOsc = null;
          this.engineGain = null;
        }, 80);
      } catch {
        this.engineOsc = null;
        this.engineGain = null;
      }
    }
  }

  // Crash sound: dramatic whoosh and low thud as the plane flees away
  public playCrash() {
    this.stopFlightEngine();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // White noise explosion / whoosh
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);

      // Low bass thud
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(120, t);
      bass.frequency.exponentialRampToValueAtTime(30, t + 0.45);

      bassGain.gain.setValueAtTime(0.25, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bass.start(t);
      bass.stop(t + 0.5);
    } catch {}
  }

  // Cashout success jingle (sparkling ascending chords)
  public playCashout() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  // Button click tick
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  // Win chime for sports betting
  public playSportsWin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const chords = [440, 554.37, 659.25, 880];
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }
}

export const soundEngine = new SoundEngine();
