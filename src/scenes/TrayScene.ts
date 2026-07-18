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
import { metaGameController } from '../systems/MetaGameController';
import { ParallaxLayer } from '../entities/ParallaxLayer';

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

  private venueId: string = 'mackenzie_cafe';
  private roundScore: number = 0;
  private totalDrops: number = 0;
  private correctDrops: number = 0;
  private parallaxLayer: ParallaxLayer | null = null;

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
    this.audioManager.init();

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

  /** Create a simple background for the venue */
  private createBackground(): void {
    const venueData = venuesData.find((v) => v.id === this.venueId);
    if (!venueData) return;

    const decayState = metaGameController.venueDecayState.getState(this.venueId);
    let bgKey = venueData.backgroundKeys.clean;
    if (decayState === 'DECLINING') bgKey = venueData.backgroundKeys.grimy;
    if (decayState === 'RUINED') bgKey = venueData.backgroundKeys.ruined;

    this.parallaxLayer = new ParallaxLayer(this, bgKey, 'placeholder_mid', 'placeholder_fg');

    // Venue name in the corner
    const venueName = venueData.displayName;
    const venueLabel = this.add.text(30, 20, venueName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    venueLabel.setAlpha(0.6);
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
      const y = 900; // Near bottom of canvas
      const bin = new Bin(this, x, y, binDef);
      this.bins.push(bin);
    }
  }

  /** Spawn random items from the venue's item pool */
  private spawnItems(): void {
    const venueData = venuesData.find((v) => v.id === this.venueId);
    if (!venueData) return;

    // Get all valid item definitions for this venue (exclude composites per Track E step E.6)
    const allItems = itemsData as TrashItemDef[];
    const pool = allItems.filter(
      (item) => venueData.itemPoolIds.includes(item.id) && !item.isComposite
    );

    if (pool.length === 0) return;

    // Pick random items for this tray
    const count = Math.min(this.itemsPerTray, pool.length);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Position items in a grid in the upper area of the screen
    const cols = Math.min(count, 4);
    const startX = 960 - ((cols - 1) * 200) / 2;
    const startY = 250;
    const gapX = 200;
    const gapY = 180;

    for (let i = 0; i < selected.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * gapX;
      const y = startY + row * gapY;

      const item = new TrashItem(this, x, y, selected[i]!);
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
      item.dragStartTimeMs
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
        bin.binDef.id,
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

    // Track C: Thud SFX on every drop (C.8)
    this.audioManager.playThud();

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

    // Update parallax background based on new decay state (D.5)
    const newDecayState = metaGameController.venueDecayState.getState(this.venueId);
    const venueData = venuesData.find((v) => v.id === this.venueId);
    if (venueData && this.parallaxLayer) {
      let bgKey = venueData.backgroundKeys.clean;
      if (newDecayState === 'DECLINING') bgKey = venueData.backgroundKeys.grimy;
      if (newDecayState === 'RUINED') bgKey = venueData.backgroundKeys.ruined;
      this.parallaxLayer.setBackgroundTexture(bgKey);
    }

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
