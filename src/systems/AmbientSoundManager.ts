export class AmbientSoundManager {
  private static ctx: AudioContext | null = null;
  private static noiseNode: AudioBufferSourceNode | null = null;
  private static filterNode: BiquadFilterNode | null = null;
  private static gainNode: GainNode | null = null;
  private static isPlaying: boolean = false;

  private static init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // White noise
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // Filter to make it sound like wind/ambient rumble
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 400; // Low frequency rumble

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0; // Start silent

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    
    this.noiseNode.start();
  }

  public static play(locationId: string = '') {
    if (!this.ctx) this.init();
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume();
    }
    
    // Adjust filter based on location type
    let targetFreq = 400; // Default soft wind
    let targetVol = 0.15;
    
    if (locationId === 'central_park' || locationId === 'community_garden') {
      targetFreq = 300; // Softer wind
      targetVol = 0.1;
    } else if (locationId === 'times_square' || locationId === 'financial_district_office' || locationId === 'tech_startup' || locationId === 'hot_dog_stand') {
      targetFreq = 1200; // City traffic hum
      targetVol = 0.2;
    } else if (locationId === 'subway_station' || locationId === 'construction_site' || locationId === 'gym') {
      targetFreq = 200; // Deep rumble
      targetVol = 0.25;
    } else if (locationId === 'ferry_docks') {
      targetFreq = 600; // Water/waves roar
      targetVol = 0.2;
    }

    if (this.filterNode) {
      this.filterNode.frequency.setTargetAtTime(targetFreq, this.ctx!.currentTime, 0.5);
    }
    
    if (!this.isPlaying && this.gainNode) {
      this.isPlaying = true;
      // Fade in
      this.gainNode.gain.cancelScheduledValues(this.ctx!.currentTime);
      this.gainNode.gain.setValueAtTime(0, this.ctx!.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(targetVol, this.ctx!.currentTime + 2);
    } else if (this.isPlaying && this.gainNode) {
      // Adjust volume if already playing
      this.gainNode.gain.cancelScheduledValues(this.ctx!.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(targetVol, this.ctx!.currentTime + 1);
    }
  }

  public static stop() {
    if (this.isPlaying && this.gainNode && this.ctx) {
      this.isPlaying = false;
      // Fade out
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    }
  }
}
