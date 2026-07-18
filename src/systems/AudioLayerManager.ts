import { gameEvents, GAME_EVENTS, DropResult } from './GameEvents';

/**
 * AudioLayerManager — Layered-stem adaptive soundtrack using Howler.js.
 * Per PRD Track C, steps C.3, C.5, C.8.
 *
 * Wraps 4 Howl instances (drums, bass, synth_pads, lead) that all loop
 * simultaneously. Combo tier controls which stems are audible:
 *   - combo 0:  drums only
 *   - combo ≥1: +bass
 *   - combo ≥2: +synth_pads
 *   - combo ≥4: +lead (full at 5x)
 *
 * On mistake: dramatic silence (all stems fade to 0 in 150ms),
 * then drums-only resume after 500ms.
 *
 * NOTE: Howler.js requires audio files to exist at the specified paths.
 * Until placeholder audio stems are provided (step C.4), this manager
 * will initialize silently and skip playback if files are missing.
 */
export class AudioLayerManager {
  private stems: {
    drums: Howl | null;
    bass: Howl | null;
    synth_pads: Howl | null;
    lead: Howl | null;
  } = {
    drums: null,
    bass: null,
    synth_pads: null,
    lead: null,
  };

  private currentComboTier: number = 0;
  private isSilenced: boolean = false;
  private silenceTimeout: ReturnType<typeof setTimeout> | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the audio stems. Call once when the TrayScene starts.
   * Safe to call even if audio files don't exist — will log a warning and skip.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Check if Howl is available (it may not be in test environments)
    if (typeof Howl === 'undefined') {
      console.log('AudioLayerManager: Howler.js not available, skipping audio init');
      return;
    }

    const stemPaths: Record<string, string> = {
      drums: '/assets/audio/stems/PLACEHOLDER_drums.mp3',
      bass: '/assets/audio/stems/PLACEHOLDER_bass.mp3',
      synth_pads: '/assets/audio/stems/PLACEHOLDER_synth_pads.mp3',
      lead: '/assets/audio/stems/PLACEHOLDER_lead.mp3',
    };

    for (const [name, path] of Object.entries(stemPaths)) {
      try {
        const howl = new Howl({
          src: [path],
          loop: true,
          volume: name === 'drums' ? 1.0 : 0.0,
          onloaderror: (_id: number, err: unknown) => {
            console.log(`AudioLayerManager: Could not load ${name} stem (${err}) — audio placeholder needed`);
            this.stems[name as keyof typeof this.stems] = null;
          },
        });
        this.stems[name as keyof typeof this.stems] = howl;
      } catch {
        console.log(`AudioLayerManager: Error creating Howl for ${name}`);
      }
    }

    // Start all stems simultaneously (those that loaded successfully)
    this.playAll();

    // Subscribe to events
    gameEvents.on(GAME_EVENTS.COMBO_CHANGED, (payload: { combo: number }) => {
      this.setComboTier(payload.combo);
    });

    gameEvents.on(GAME_EVENTS.ITEM_DROPPED, (payload: { result: DropResult }) => {
      if (!payload.result.correct) {
        this.cutToSilence();
      }
    });
  }

  /** Start all stems playing (from beginning, in sync) */
  private playAll(): void {
    for (const [, howl] of Object.entries(this.stems)) {
      if (howl) {
        howl.play();
      }
    }
  }

  /**
   * Set stem volumes based on combo tier.
   * Per PRD: combo 0=drums, ≥1=+bass, ≥2=+synth, ≥4=+lead
   */
  setComboTier(combo: number): void {
    if (this.isSilenced) return; // Don't change during dramatic silence

    this.currentComboTier = combo;

    this.fadeStem('drums', 1.0); // Always on
    this.fadeStem('bass', combo >= 1 ? 0.8 : 0.0);
    this.fadeStem('synth_pads', combo >= 2 ? 0.7 : 0.0);
    this.fadeStem('lead', combo >= 4 ? 0.9 : 0.0);
  }

  /**
   * Fade a single stem to target volume over 300ms.
   */
  private fadeStem(name: string, targetVolume: number): void {
    const howl = this.stems[name as keyof typeof this.stems];
    if (!howl) return;

    const currentVolume = howl.volume();
    if (Math.abs(currentVolume - targetVolume) > 0.01) {
      howl.fade(currentVolume, targetVolume, 300);
    }
  }

  /**
   * Cut ALL stems to silence on mistake.
   * Per PRD C.5: fade to 0 in 150ms, resume drums-only after 500ms.
   */
  cutToSilence(): void {
    this.isSilenced = true;

    // Fade all to 0 in 150ms
    for (const [, howl] of Object.entries(this.stems)) {
      if (howl) {
        howl.fade(howl.volume(), 0, 150);
      }
    }

    // Clear any existing resume timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }

    // Resume from drums-only after 500ms
    this.silenceTimeout = setTimeout(() => {
      this.isSilenced = false;
      this.fadeStem('drums', 1.0);
      // Reset combo tier to 0 (drums only)
      this.currentComboTier = 0;
    }, 500);
  }

  /**
   * Play a one-shot thud SFX.
   * Per PRD Track C, step C.8.
   */
  playThud(): void {
    if (typeof Howl === 'undefined') return;

    try {
      const thud = new Howl({
        src: ['/assets/audio/sfx/thud.mp3'],
        volume: 0.6,
        onloaderror: () => {
          // Silently skip if thud SFX file doesn't exist yet
        },
      });
      thud.play();
    } catch {
      // Skip if Howler isn't available
    }
  }

  /** Stop all stems and clean up */
  destroy(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }

    gameEvents.off(GAME_EVENTS.COMBO_CHANGED);
    gameEvents.off(GAME_EVENTS.ITEM_DROPPED);

    for (const [, howl] of Object.entries(this.stems)) {
      if (howl) {
        howl.stop();
        howl.unload();
      }
    }

    this.initialized = false;
  }
}
