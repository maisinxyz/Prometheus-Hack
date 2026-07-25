import { Howler } from 'howler';

/**
 * Advanced Procedural Foley Synthesizer
 * Uses Web Audio API with pink noise and complex filtering to create realistic sound effects.
 */
export class SoundFXSynthesizer {
  private static instance: SoundFXSynthesizer;
  private ctx: AudioContext | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  private constructor() {}

  public static getInstance(): SoundFXSynthesizer {
    if (!SoundFXSynthesizer.instance) {
      SoundFXSynthesizer.instance = new SoundFXSynthesizer();
    }
    return SoundFXSynthesizer.instance;
  }

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    
    if (typeof Howler !== 'undefined' && Howler.ctx) {
      this.ctx = Howler.ctx as AudioContext;
      this.generatePinkNoise();
      return this.ctx;
    }
    return null;
  }

  private generatePinkNoise() {
    if (!this.ctx || this.pinkNoiseBuffer) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    this.pinkNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      let white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // compensate gain
      b6 = white * 0.115926;
    }
  }

  public playDropSFX(itemId: string, spriteKey?: string) {
    this.getContext();
    if (!this.ctx) return;
    
    const key = spriteKey || itemId;
    
    if (key.includes('rock') || key.includes('brick') || key.includes('concrete')) {
      this.playGravelCrunch();
    } else if (key.includes('tape') || key.includes('paper') || key.includes('tissue') || key.includes('wrapper') || key.includes('napkin')) {
      this.playCrumple();
    } else if (key.includes('glass') || key.includes('bottle') || key.includes('can')) {
      this.playGlassShatter();
    } else {
      this.playCardboardDrop();
    }
  }

  public playCardboardDrop() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Analog kick drum style thud
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(3.0, t + 0.01); // Very loud punch
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playCrumple() {
    if (!this.ctx || !this.pinkNoiseBuffer) return;
    const t = this.ctx.currentTime;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.pinkNoiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800; // Let more sound through
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    
    // Multiple fast loud crinkles
    for(let i=0; i<6; i++) {
      const time = t + (i * 0.06) + (Math.random() * 0.02);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(4.0 + Math.random()*2, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    }
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(t);
    noise.stop(t + 0.5);
  }

  public playGlassShatter() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // FM synthesis for glass/metal clank
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(2200, t);
    
    const modulator = this.ctx.createOscillator();
    modulator.type = 'square';
    modulator.frequency.setValueAtTime(3500, t);
    
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(2000, t); // Modulation index
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency); // FM modulation
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(2.0, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    carrier.connect(gain);
    gain.connect(this.ctx.destination);
    
    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + 0.4);
    carrier.stop(t + 0.4);
    
    // Also add a little highpass noise for the scatter
    if (this.pinkNoiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.pinkNoiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 3000;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0, t + 0.05);
      noiseGain.gain.linearRampToValueAtTime(3.0, t + 0.06);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      noise.connect(noiseFilter).connect(noiseGain).connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.3);
    }
  }

  public playGravelCrunch() {
    if (!this.ctx || !this.pinkNoiseBuffer) return;
    const t = this.ctx.currentTime;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.pinkNoiseBuffer;
    
    // Combine sawtooth for heavy grit
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(4.0, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.1, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    noise.connect(filter);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(t);
    osc.start(t);
    noise.stop(t + 0.35);
    osc.stop(t + 0.35);
  }

  /** Continuous Grinding for Rock Crusher */
  public playCrusherGrind() {
    this.getContext();
    if (!this.ctx || !this.pinkNoiseBuffer) return;
    const t = this.ctx.currentTime;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.pinkNoiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.linearRampToValueAtTime(2000, t + 0.2);
    filter.frequency.linearRampToValueAtTime(800, t + 0.5);
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, t);
    osc.frequency.linearRampToValueAtTime(30, t + 0.5);
    
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(4.0, t + 0.05); // VERY LOUD
    masterGain.gain.setValueAtTime(4.0, t + 0.4);
    masterGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    
    noise.connect(filter);
    filter.connect(masterGain);
    osc.connect(masterGain);
    masterGain.connect(this.ctx.destination);
    
    noise.start(t);
    osc.start(t);
    noise.stop(t + 0.65);
    osc.stop(t + 0.65);
  }
  /** Error Buzz */
  public playErrorBuzz() {
    this.getContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.2);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1.0, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.35);
  }
  public playErrorBuzz() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.2);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1.0, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.35);
  }
}

export const soundFXSynthesizer = SoundFXSynthesizer.getInstance();
