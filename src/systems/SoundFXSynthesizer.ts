import { Howler, Howl } from 'howler';

/**
 * Advanced Procedural Foley Synthesizer
 * Uses Web Audio API with pink noise and complex filtering to create realistic sound effects.
 */
export class SoundFXSynthesizer {
  private static instance: SoundFXSynthesizer;
  private ctx: AudioContext | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  private constructor() {
    this.setupUnlock();
  }

  private setupUnlock() {
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (typeof Howler !== 'undefined' && Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().catch(() => {});
      }
    };
    
    // Listen to all possible interaction events to forcefully unlock audio on iOS/Safari
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  public static getInstance(): SoundFXSynthesizer {
    if (!SoundFXSynthesizer.instance) {
      SoundFXSynthesizer.instance = new SoundFXSynthesizer();
    }
    return SoundFXSynthesizer.instance;
  }

  private getContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    
    if (typeof Howler !== 'undefined' && Howler.ctx) {
      this.ctx = Howler.ctx as AudioContext;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.generatePinkNoise();
      return this.ctx;
    }
    
    // Fallback if Howler isn't ready
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        this.generatePinkNoise();
        return this.ctx;
      }
    } catch {
      // Ignore
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

  // --- Retro 8-bit Video Game Sounds ---
  // Pure synthesized chiptune audio, no remote fetches needed.

  public playCardboardDrop(weight: number = 0.5) {
    this.getContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Retro "boop" (triangle wave pitch drop for softer sound)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3 * weight, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playCrumple(weight: number = 0.3) {
    this.getContext();
    if (!this.ctx || !this.pinkNoiseBuffer) return;
    const t = this.ctx.currentTime;
    
    // Retro "blip" (short noise burst)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.pinkNoiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3 * weight, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    
    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.1);
  }

  public playGlassShatter(weight: number = 0.7) {
    this.getContext();
    if (!this.ctx || !this.pinkNoiseBuffer) return;
    const t = this.ctx.currentTime;
    
    // Retro "crash" (white noise high pass explosion)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.pinkNoiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.linearRampToValueAtTime(5000, t + 0.2);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4 * weight, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.35);
  }

  public playGravelCrunch(weight: number = 1.0) {
    this.getContext();
    if (!this.ctx || !this.pinkNoiseBuffer) return;
    const t = this.ctx.currentTime;
    
    // Retro "thud/crunch" (low pass noise burst)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.pinkNoiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5 * weight, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.25);
  }

  public playCrusherGrind() {
    this.getContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Retro "machine rumble" (triangle with LFO)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(40, t);
    osc.frequency.linearRampToValueAtTime(30, t + 0.4);
    
    // Add rapid amplitude modulation to simulate gears
    const amOsc = this.ctx.createOscillator();
    amOsc.type = 'sine';
    amOsc.frequency.value = 25; // 25Hz chatter
    
    const amGain = this.ctx.createGain();
    amGain.gain.value = 0.5;
    amOsc.connect(amGain.gain);
    amOsc.start(t);
    amOsc.stop(t + 0.5);
    
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(0.15, t + 0.05); // Much softer
    masterGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    osc.connect(amGain);
    amGain.connect(masterGain);
    masterGain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.55);
  }

  public playErrorBuzz() {
    this.getContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Classic 8-bit wrong answer buzz (softened)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.2);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  public playDropSFX(itemId: string, spriteKey?: string) {
    this.getContext();
    if (!this.ctx) return;
    
    const key = (spriteKey || itemId).toLowerCase();
    
    // Scale volume based on material weight
    if (key.includes('rock') || key.includes('brick') || key.includes('concrete')) {
      this.playGravelCrunch(1.5); // Very heavy
    } else if (key.includes('tape') || key.includes('paper') || key.includes('tissue') || key.includes('wrapper') || key.includes('napkin')) {
      this.playCrumple(0.3); // Very light
    } else if (key.includes('glass') || key.includes('bottle') || key.includes('can') || key.includes('jar')) {
      this.playGlassShatter(0.8); // Medium-heavy and sharp
    } else if (key.includes('box') || key.includes('cardboard') || key.includes('carton')) {
      this.playCardboardDrop(0.6); // Medium
    } else {
      // Default light drop
      this.playCardboardDrop(0.4);
    }
  }
}

export const soundFXSynthesizer = SoundFXSynthesizer.getInstance();
