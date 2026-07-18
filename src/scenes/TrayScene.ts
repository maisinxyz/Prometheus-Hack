import Phaser from 'phaser';
import { TrashItem } from '../entities/TrashItem';
import { Bin } from '../entities/Bin';
import { ScoringSystem } from '../systems/ScoringSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { ParticleFXManager } from '../systems/ParticleFXManager';
import { AudioLayerManager } from '../systems/AudioLayerManager';
import { gameEvents, GAME_EVENTS } from '../systems/GameEvents';
import { TrashItemDef } from '../data/schemas/itemSchema';
import { BinDef } from '../data/schemas/binSchema';
import itemsData from '../data/items.json';
import binsData from '../data/bins.json';
import venuesData from '../data/venues.json';
import { ChiSystem } from '../systems/ChiSystem';
import { VenueDecayState, DecayState } from '../systems/VenueDecayState';
import { ParallaxLayer } from '../entities/ParallaxLayer';
import { DifficultySystem } from '../systems/DifficultySystem';
import { DifficultyTierDef } from '../data/schemas/difficultyTierSchema';

/**
 * TrayScene — Core disposal loop.
 * Per PRD Track B, steps B.5, B.8, B.10.
 *
 * Players drag trash items into the correct bins.
 * Scoring is based on correctness and speed.
 * Round ends when the timer expires or all items are sorted.
 */
export class TrayScene extends Phaser.Scene {
  private items: TrashItem[] = [];
  private bins: Bin[] = [];
  private scoringSystem!: ScoringSystem;
  private comboSystem!: ComboSystem;
  private particleFX!: ParticleFXManager;
  private audioManager: AudioLayerManager = new AudioLayerManager();
  private chiSystem!: ChiSystem;
  private venueDecayState!: VenueDecayState;
  private difficultySystem!: DifficultySystem;
  private currentTier!: DifficultyTierDef;

  private venueId: string = 'mackenzie_cafe';
  private roundScore: number = 0;
  private totalDrops: number = 0;
  private correctDrops: number = 0;

  /** Timer values — defaults to 30s, overridden by Track E's difficulty system */
  private roundTimerMs: number = 30000;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private roundStartTimeMs: number = 0;
  private roundEnded: boolean = false;

  /** Number of items per tray — default 6, overridden by Track E */
  private itemsPerTray: number = 6;

  constructor() {
    super({ key: 'TrayScene' });
  }

  init(data: { venueId?: string }): void {
    this.venueId = data?.venueId ?? 'mackenzie_cafe';
    this.roundScore = 0;
    this.totalDrops = 0;
    this.correctDrops = 0;
    this.roundEnded = false;
    this.items = [];
    this.bins = [];
  }

  create(): void {
    this.scoringSystem = new ScoringSystem();
    this.comboSystem = new ComboSystem();
    this.particleFX = new ParticleFXManager(this);
    this.chiSystem = new ChiSystem();
    this.venueDecayState = new VenueDecayState();
    this.difficultySystem = new DifficultySystem();

    // Track E: Determine Difficulty Tier based on current CHI
    const currentChi = this.chiSystem.getChi(this.venueId);
    this.currentTier = this.difficultySystem.getTierForChi(currentChi);

    // Track E: Wire timer and item counts to active tier
    this.roundTimerMs = this.currentTier.trayTimerSec * 1000;
    
    // Determine items per tray (E.6)
    if (this.currentTier.tier === 'beginner') this.itemsPerTray = 4;
    else if (this.currentTier.tier === 'intermediate') this.itemsPerTray = 6;
    else this.itemsPerTray = 9;

    // Track E: Enable Dual Targeting (E.5)
    if (this.currentTier.dualTargeting) {
      this.input.addPointer(1); // Adds a second pointer for multi-touch
    }

    // Draw venue background
    this.createBackground();

    // Create bins along the bottom
    this.createBins();

    // Spawn random items from the venue's item pool
    this.spawnItems();

    // Set up drag-end overlap detection (B.5)
    this.setupDropDetection();

    // Start the round timer (B.8)
    this.startTimer();

    // Launch HUD overlay scene
    this.scene.launch('HUDScene', {
      roundTimerMs: this.roundTimerMs,
      venueId: this.venueId,
    });

    // Debug keybind: press F to force-end round
    this.input.keyboard?.on('keydown-F', () => {
      if (!this.roundEnded) {
        this.endRound();
      }
    });

    // ESC to return to level select
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop('HUDScene');
      this.scene.start('LevelSelectScene');
    });
  }

  /** Create the venue background using ParallaxLayer */
  private createBackground(): void {
    const venueData = venuesData.find((v) => v.id === this.venueId);
    
    // We will use the same image for fg/mid/bg just to test the ParallaxLayer logic
    // since we only have single texture keys defined in venues.json per state.
    // In a real art integration (Track F.1), you'd have 3 separate keys.
    const state = this.venueDecayState.getState(this.venueId);
    let bgKey = 'nyc_map_bg'; // Fallback if no venues data matches

    if (venueData) {
      if (state === DecayState.CLEAN) bgKey = venueData.backgroundKeys.clean;
      else if (state === DecayState.DECLINING) bgKey = venueData.backgroundKeys.grimy;
      else if (state === DecayState.RUINED) bgKey = venueData.backgroundKeys.ruined;
    }

    new ParallaxLayer(this, bgKey, bgKey, bgKey);

    // Venue name in the corner
    const venueName = venueData?.displayName ?? this.venueId;
    const venueLabel = this.add.text(30, 20, venueName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setAlpha(0.6);
    venueLabel.setDepth(50);
  }

  /** Create the 4 bins along the bottom of the screen */
  private createBins(): void {
    const binDefs = binsData as BinDef[];
    const binCount = binDefs.length;
    const totalWidth = 1920;
    const spacing = totalWidth / (binCount + 1);

    for (let i = 0; i < binCount; i++) {
      const binDef = binDefs[i]!;
      const x = spacing * (i + 1);
      const y = 200; // Near top of canvas (back of the page)
      const bin = new Bin(this, x, y, binDef);
      this.bins.push(bin);
    }
  }

  /** Spawn random items from the venue's item pool */
  private spawnItems(): void {
    const venueData = venuesData.find((v) => v.id === this.venueId);
    if (!venueData) return;

    // Get all valid item definitions for this venue (exclude composites per Track E step E.6)
    // Use the policy-patched items data from the registry, fallback to static if not set
    const allItems = (this.registry.get('itemsData') as TrashItemDef[]) || (itemsData as TrashItemDef[]);
    const pool = allItems.filter(
      (item) => venueData.itemPoolIds.includes(item.id) && !item.isComposite
    );

    if (pool.length === 0) return;

    // Pick random items for this tray
    const count = Math.min(this.itemsPerTray, pool.length);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    for (let i = 0; i < this.itemsPerTray; i++) {
      const randomItemDef = selected[i % selected.length]!;

      // Random spread in the bottom half of the screen
      const x = 300 + Math.random() * 1320;
      const y = 600 + Math.random() * 300;

      const item = new TrashItem(
        this, 
        x, 
        y, 
        randomItemDef, 
        this.currentTier.visualCuesActive // Pass visual cues setting (E.4)
      );
      this.items.push(item);
    }
  }

  /**
   * Set up drag-end overlap detection.
   * Per PRD Track B, step B.5.
   */
  private setupDropDetection(): void {
    this.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (!(gameObject instanceof TrashItem) || this.roundEnded) return;

        const item = gameObject;

        // Check overlap with each bin
        let targetBin: Bin | null = null;
        const itemBounds = item.getBounds();

        for (const bin of this.bins) {
          const binBounds = bin.getBounds();
          if (Phaser.Geom.Rectangle.Overlaps(itemBounds, binBounds)) {
            targetBin = bin;
            break;
          }
        }

        if (targetBin) {
          // Resolve the drop
          this.handleDrop(item, targetBin);
        } else {
          // Snap back to original position
          this.tweens.add({
            targets: item,
            x: item.originX,
            y: item.originY,
            duration: 200,
            ease: 'Back.easeOut',
            onUpdate: () => {
              item.syncAttachments();
            }
          });
        }
      }
    );
  }

  /** Handle a resolved drop — scoring, combo, events, cleanup */
  private handleDrop(item: TrashItem, bin: Bin): void {
    const result = this.scoringSystem.resolveDrop(
      item.itemDef.correctBinId,
      bin.binDef.id,
      item.dragStartTimeMs,
      undefined,
      this.currentTier.errorPenaltyMultiplier // Pass penalty scaling (E.3)
    );

    // Update score
    this.roundScore += result.pointsAwarded;
    this.totalDrops++;

    if (result.correct) {
      this.correctDrops++;
      this.comboSystem.registerCorrect();
      bin.playDropAnimation();

      // Track C: Particle FX on correct sort (C.1)
      this.particleFX.playCorrectSortFX(
        { x: bin.x, y: bin.y },
        item.itemDef.id,
        this.comboSystem.getCombo()
      );

      // Track C: Screen shake on correct drop — stronger (C.7)
      this.cameras.main.shake(80, 0.005);
    } else {
      this.comboSystem.registerIncorrect();

      // Track C: Subtle dust on incorrect sort
      this.particleFX.playIncorrectSortFX({ x: bin.x, y: bin.y });

      // Track C: Screen shake on incorrect drop — weaker (C.7)
      this.cameras.main.shake(80, 0.002);
    }

    // Track C: Item-specific SFX on drop (C.8)
    this.audioManager.playDropSFX(item.itemDef.id, result.correct);

    // Emit item-dropped event for Tracks C and D
    gameEvents.emit(GAME_EVENTS.ITEM_DROPPED, { item, bin, result });

    // Animate item into the bin then destroy
    this.tweens.add({
      targets: item,
      x: bin.x,
      y: bin.y,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        // Remove from items array
        const idx = this.items.indexOf(item);
        if (idx !== -1) this.items.splice(idx, 1);
        item.destroy();

        // If all items sorted, end round early
        if (this.items.length === 0 && !this.roundEnded) {
          this.endRound();
        }
      },
    });
  }

  /** Start the round countdown timer */
  private startTimer(): void {
    this.roundStartTimeMs = Date.now();
    this.timerEvent = this.time.delayedCall(this.roundTimerMs, () => {
      if (!this.roundEnded) {
        this.endRound();
      }
    });
  }

  /** Get remaining time in milliseconds (exposed for HUDScene) */
  public getRemainingMs(): number {
    if (this.roundEnded || !this.timerEvent) return 0;
    const elapsed = Date.now() - this.roundStartTimeMs;
    return Math.max(0, this.roundTimerMs - elapsed);
  }

  /** End the round — emit event and show summary */
  private endRound(): void {
    if (this.roundEnded) return;
    this.roundEnded = true;

    // Stop the timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }

    // Calculate accuracy
    const accuracyPct = this.totalDrops > 0
      ? Math.round((this.correctDrops / this.totalDrops) * 100)
      : 0;

    // Emit round-ended event for Tracks C and D
    gameEvents.emit(GAME_EVENTS.ROUND_ENDED, {
      totalScore: this.roundScore,
      accuracyPct,
      venueId: this.venueId,
    });

    // Track D: Meta-game updates
    this.chiSystem.updateChi(this.venueId, accuracyPct);
    this.venueDecayState.registerRound(this.venueId, accuracyPct);

    // Disable all remaining items
    for (const item of this.items) {
      item.disableInteractive();
    }

    // Show round summary after a brief delay
    this.time.delayedCall(500, () => {
      this.showRoundSummary(accuracyPct);
    });
  }

  /** Display a round summary overlay */
  private showRoundSummary(accuracyPct: number): void {
    // Dim background
    const overlay = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.7);
    overlay.setDepth(100);

    // Score display
    const scoreText = this.add.text(960, 350, `Score: ${this.roundScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    scoreText.setOrigin(0.5).setDepth(101);

    // Accuracy
    const accColor = accuracyPct >= 50 ? '#22C55E' : '#EF4444';
    const accText = this.add.text(960, 450, `Accuracy: ${accuracyPct}%`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: accColor,
    });
    accText.setOrigin(0.5).setDepth(101);

    // Stats
    const statsText = this.add.text(
      960,
      530,
      `${this.correctDrops}/${this.totalDrops} correct`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        color: '#aaaaaa',
      }
    );
    statsText.setOrigin(0.5).setDepth(101);

    // Instructions
    const instrText = this.add.text(960, 650, 'Click to play again  |  ESC for level select', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#888888',
    });
    instrText.setOrigin(0.5).setDepth(101);

    // Click to replay
    this.input.once('pointerdown', () => {
      this.scene.stop('HUDScene');
      this.scene.restart({ venueId: this.venueId });
    });
  }

  /** Clean up when leaving scene */
  shutdown(): void {
    this.audioManager.destroy();
    this.scene.stop('HUDScene');
  }
}
