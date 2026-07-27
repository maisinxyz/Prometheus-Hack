import Phaser from 'phaser';
import { TrashItem } from '../entities/TrashItem';
import { ThreeJSService } from '../services/ThreeJSService';
import { Bin } from '../entities/Bin';
import { RockCrusher } from '../entities/RockCrusher';
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
import { GardenSystem } from '../systems/GardenSystem';
import { TutorialController } from '../systems/TutorialController';
import { MapLibreService } from '../services/MapLibreService';

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
  private gardenSystem!: GardenSystem;

  private venueId: string = 'mackenzie_cafe';
  private roundScore: number = 0;
  private totalDrops: number = 0;
  private correctDrops: number = 0;
  
  private tutorialActive: boolean = false;
  private tutorialController!: TutorialController;
  
  private crusher: RockCrusher | null = null;
  
  private currentEventId: 'smog' | 'flood' | 'normal' | 'festival' = 'normal';
  private scoreMultiplier: number = 1;

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

  // All venue IDs that use the ThreeJS 3D background (texture-based + procedural)
  private static readonly THREE_D_VENUE_IDS = [
    'construction_site', 'ferry_docks', 'tech_startup', 'subway_station', 'gym', 'art_studio', 'financial_district_office', 'times_square', 'hot_dog_stand',
    'central_park', 'nyc_hospital', 'mackenzie_cafe', 'public_library',
  ];

  create(): void {
    if (TrayScene.THREE_D_VENUE_IDS.includes(this.venueId)) {
      ThreeJSService.showVenue(this.venueId);
      MapLibreService.hideMap();
    } else {
      ThreeJSService.hide();
      MapLibreService.hideMap();
    }

    this.scoringSystem = new ScoringSystem();
    this.comboSystem = new ComboSystem();
    this.particleFX = new ParticleFXManager(this);
    this.chiSystem = new ChiSystem();
    this.venueDecayState = new VenueDecayState();
    this.difficultySystem = new DifficultySystem();
    this.gardenSystem = new GardenSystem();

    // Track E: Determine Difficulty Tier based on current CHI
    const currentChi = this.chiSystem.getChi(this.venueId);
    this.currentTier = this.difficultySystem.getTierForChi(currentChi);

    // Track E: Wire timer and item counts to active tier
    this.roundTimerMs = this.currentTier.trayTimerSec * 1000;
    
    // Determine items per tray (Cluster B override: 10-15)
    this.itemsPerTray = Phaser.Math.Between(10, 15);

    // Track E: Enable Dual Targeting (E.5)
    if (this.currentTier.dualTargeting) {
      this.input.addPointer(1); // Adds a second pointer for multi-touch
    }

    // Draw venue background
    this.createBackground();

    // Create bins along the bottom
    this.createBins();

    // Create rock crusher for construction site
    if (this.venueId === 'construction_site') {
      // Place it on the bottom right, aligned vertically with the bins
      this.crusher = new RockCrusher(this, 1650, 850);
      this.crusher.setDepth(20);
    }

    // Spawn random items from the venue's item pool
    this.spawnItems();

    // Set up drag-end overlap detection (B.5)
    this.setupDropDetection();
    
    // Set up click detection (Cluster B)
    gameEvents.on(GAME_EVENTS.ITEM_CLICKED, this.handleItemClicked, this);
    this.events.once('shutdown', () => {
      gameEvents.off(GAME_EVENTS.ITEM_CLICKED, this.handleItemClicked, this);
      if (this.venueId === 'construction_site') {
        MapLibreService.hideMap();
      }
    });

    // Ensure tutorial completion flags are set so gameplay is never blocked
    localStorage.setItem('trashdash_tutorial_complete', 'true');
    localStorage.setItem('trashdash_interactive_tutorial_complete', 'true');
    this.startTimer();

    const totalChi = this.chiSystem.getTotalChi(venuesData.map(v => v.id));
    const maxChi = venuesData.length * 100;
    
    let weatherName = '';
    let weatherDesc = '';
    let weatherEffect = '';
    let weatherColor = '#ffffff';
    
    if (totalChi <= maxChi * 0.25) {
      this.currentEventId = 'smog';
      weatherName = 'Smog Day';
      weatherDesc = 'The city is choked with toxic smog.';
      weatherEffect = 'Visibility severely reduced. Use your pointer to see!';
      weatherColor = '#dc2626'; // red
      
      // Removed the visual smog overlay per user request — it now only shows on LevelSelectScene
    } else if (totalChi <= maxChi * 0.5) {
      this.currentEventId = 'flood';
      weatherName = 'Flash Flood';
      weatherDesc = 'Climate change has caused severe flooding.';
      weatherEffect = 'Trash bobs erratically in the water!';
      weatherColor = '#f59e0b'; // orange
    } else if (totalChi <= maxChi * 0.75) {
      this.currentEventId = 'normal';
      weatherName = 'Clear Skies';
      weatherDesc = 'The environment is stabilizing.';
      weatherEffect = 'Normal conditions.';
      weatherColor = '#10b981'; // emerald
    } else {
      this.currentEventId = 'festival';
      weatherName = 'Eco-Festival';
      weatherDesc = 'The city celebrates your zero-waste efforts!';
      weatherEffect = 'Score multiplier x2!';
      weatherColor = '#a855f7'; // purple
      this.scoreMultiplier = 2;
    }

    // Launch HUD overlay scene
    this.scene.launch('HUDScene', {
      roundTimerMs: this.roundTimerMs,
      venueId: this.venueId,
      weatherName,
      weatherDesc,
      weatherEffect,
      weatherColor
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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  /** Create the venue background */
  private createBackground(): void {
    if (TrayScene.THREE_D_VENUE_IDS.includes(this.venueId)) {
      // Background handled by ThreeJSService behind the canvas
      
      // Add a title text
      const displayNames: Record<string, string> = {
        construction_site: 'Construction Site',
        ferry_docks: 'Ferry at the Docks',
        tech_startup: 'Tech Startup',
        subway_station: 'Subway Station',
        gym: 'Fitness Center',
        central_park: 'Central Park',
        nyc_hospital: 'NYC Hospital',
        mackenzie_cafe: 'Mackenzie Cafe',
        public_library: 'Public Library',
        financial_district_office: 'Financial District Office',
        times_square: 'Times Square',
        hot_dog_stand: 'Hot Dog Stand',
      };
      const title = displayNames[this.venueId] ?? 'Venue';
      this.add.text(30, 20, title, {
        fontFamily: '"Nunito", sans-serif', fontSize: '28px', color: '#ffffff', fontStyle: 'bold',
        shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true }
      }).setAlpha(0.8).setDepth(50);
      return;
    }

    const venueData = venuesData.find((v) => v.id === this.venueId);
    
    // We will use the same image for fg/mid/bg just to test the ParallaxLayer logic
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
      fontFamily: '"Nunito", sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true }
    }).setAlpha(0.8);
    venueLabel.setDepth(50);
  }

  /** Create the 4 bins along the bottom of the screen */
  private createBins(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    let binY = height - 160;
    let binScale = 1;
    let spacing = 240;

    const binDefs = binsData as BinDef[];
    const binCount = binDefs.length;
    
    const venueData = venuesData.find(v => v.id === this.venueId);
    
    // Group bins evenly
    const startX = (width / 2) - (spacing * (binCount - 1)) / 2;

    for (let i = 0; i < binCount; i++) {
      const binDef = binDefs[i]!;
      let x = startX + i * spacing;
      let y = binY;
      let scale = binScale;
      
      if (venueData && venueData.binPositions && venueData.binPositions.length > i) {
        const binPos = venueData.binPositions[i]!;
        x = binPos.x;
        y = binPos.y;
        if ('scale' in binPos && binPos.scale !== undefined) {
          scale = binPos.scale;
        }
      }
      
      const bin = new Bin(this, x, y, binDef);
      bin.setScale(scale);
      this.bins.push(bin);
    }
  }

  /** Spawn random items from the venue's item pool */
  private spawnItems(): void {
    const venueData = venuesData.find((v) => v.id === this.venueId);
    if (!venueData) return;

    // Get all valid item definitions for this venue
    // Use the policy-patched items data from the registry, fallback to static if not set
    const allItems = (this.registry.get('itemsData') as TrashItemDef[]) || (itemsData as TrashItemDef[]);
    const pool = allItems.filter(
      (item) => venueData.itemPoolIds.includes(item.id)
    );

    if (pool.length === 0) return;

    // Pick random items for this tray (10-15 as requested)
    this.itemsPerTray = Phaser.Math.Between(10, 15);
    const selectedPool = [...pool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < this.itemsPerTray; i++) {
      const itemDef = selectedPool[i % selectedPool.length]!;

      let maxAttempts = 20;
      let safeSpawnFound = false;

      // Extract valid zones based on allowedZones
      let validZones: any[] = [];
      const venueSpawnZones = venueData.spawnZones as Record<string, {x: number, y: number, width: number, height: number}> | undefined;
      
      if (venueSpawnZones && itemDef.allowedZones && itemDef.allowedZones.length > 0) {
        for (const zoneName of itemDef.allowedZones) {
          if (venueSpawnZones[zoneName]) {
            validZones.push(venueSpawnZones[zoneName]);
          }
        }
      }

      while (maxAttempts > 0 && !safeSpawnFound) {
        let x, y;
        
        if (validZones.length > 0) {
          // Pick a random valid zone
          const zone = validZones[Phaser.Math.Between(0, validZones.length - 1)];
          x = Phaser.Math.Between(zone.x, zone.x + zone.width);
          y = Phaser.Math.Between(zone.y, zone.y + zone.height);
        } else {
          // Scatter items on the floor area
          const padding = 150;
          x = Phaser.Math.Between(padding, 1920 - padding);
          y = Phaser.Math.Between(730, 880);
        }

        // Estimate item bounds (assuming approx 100x100 size for safety)
        const spawnRect = new Phaser.Geom.Rectangle(x - 50, y - 50, 100, 100);

        let overlapping = false;

        // Check bins
        for (const bin of this.bins) {
          if (Phaser.Geom.Rectangle.Overlaps(spawnRect, bin.getBounds())) {
            overlapping = true;
            break;
          }
        }

        // Check crusher
        if (!overlapping && this.crusher) {
          if (Phaser.Geom.Rectangle.Overlaps(spawnRect, this.crusher.getBounds())) {
            overlapping = true;
          }
        }

        if (!overlapping) {
          safeSpawnFound = true;
          const item = new TrashItem(this, x, y, itemDef, this.currentTier.visualCuesActive);
          item.baseX = x;
          item.baseY = y;
          item.setDepth(100); // Always in front of crusher (20) and bins (35)
          
          if (validZones.length > 0) {
            // Natural surface spawn: small hop or already resting
            item.y -= 10;
            this.tweens.add({
              targets: item,
              y: y,
              duration: Phaser.Math.Between(150, 300),
              ease: 'Sine.easeOut'
            });
          } else {
            // Default drop-in spawn
            item.y -= 50;
            this.tweens.add({
              targets: item,
              y: y,
              duration: Phaser.Math.Between(400, 700),
              ease: 'Quad.easeOut'
            });
          }

          this.items.push(item);

          if (this.currentEventId === 'flood') {
            this.tweens.add({
              targets: item,
              y: `-=${10 + Math.random() * 20}`,
              x: `+=${(Math.random() - 0.5) * 30}`,
              yoyo: true,
              repeat: -1,
              duration: 800 + Math.random() * 600,
              ease: 'Sine.easeInOut'
            });
          }
        }
        maxAttempts--;
      }
    }
  }

  /**
   * Set up drag-end overlap detection.
   * Per PRD Track B, step B.5.
   */
  private setupDropDetection(): void {

    this.input.on(
      'dragstart',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (!(gameObject instanceof TrashItem) || this.roundEnded) return;
        // (Drag start logic if any)
      }
    );

    this.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (!(gameObject instanceof TrashItem) || this.roundEnded) return;

        const item = gameObject;

        // TASK 1.6: Guard against double-processing — if this item was already
        // resolved by a prior dragend event during its destruction tween, skip it.
        if (item.processed) return;

        // Check overlap with crusher first
        if (this.crusher && this.crusher.intersectsInput(item.x, item.y)) {
          if (this.crusher.acceptsItem(item)) {
            // It's a rock, crush it!
            this.crusher.crushItem(item, (newItemDef, spawnX, spawnY) => {
              const newItem = new TrashItem(this, spawnX, spawnY, newItemDef, this.currentTier.visualCuesActive);
              newItem.baseX = spawnX;
              newItem.baseY = spawnY;
              newItem.setDepth(100);
              newItem.y -= 50;
              this.tweens.add({
                targets: newItem,
                y: spawnY,
                duration: 500,
                ease: 'Quad.easeOut',
                onUpdate: () => {
                  newItem.syncAttachments();
                }
              });
              
              // Replace in array
              const idx = this.items.indexOf(item);
              if (idx !== -1) {
                this.items[idx] = newItem;
              } else {
                this.items.push(newItem);
              }
            });
            return; // Drag handled by crusher
          } else {
            // Crusher rejects this item, screen shakes and item will fall to the ground
            this.cameras.main.shake(100, 0.005);
          }
        }

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
          // Trash gravity: item falls to the ground
          const targetGroundY = this.getGroundY(item);
          const heightDiff = targetGroundY - item.y;

          if (heightDiff > 0) {
            item.setData('isFalling', true);
            const fallTween = this.tweens.add({
              targets: item,
              y: targetGroundY,
              duration: Math.max(450, heightDiff * 1.5),
              ease: 'Quad.easeIn',
              onUpdate: () => {
                item.syncAttachments();

                // Continuous check: if item is brick/rock and intersects crusher input zone while falling into it
                if (this.crusher && (item.itemDef.spriteKey === 'brick' || item.itemDef.spriteKey === 'rock') && !item.processed) {
                  if (this.crusher.intersectsInput(item.x, item.y)) {
                    fallTween.stop();
                    item.processed = true;
                    item.setData('isFalling', false);
                    this.crusher.crushItem(item, (newItemDef, spawnX, spawnY) => {
                      const newItem = new TrashItem(this, item.x, item.y, newItemDef, this.currentTier.visualCuesActive);
                      newItem.baseX = item.x;
                      newItem.baseY = item.y;
                      newItem.setDepth(100);
                      newItem.y -= 50;
                      this.tweens.add({
                        targets: newItem,
                        y: spawnY,
                        duration: 500,
                        ease: 'Quad.easeOut',
                        onUpdate: () => {
                          newItem.syncAttachments();
                        }
                      });

                      const idx = this.items.indexOf(item);
                      if (idx !== -1) {
                        this.items[idx] = newItem;
                      } else {
                        this.items.push(newItem);
                      }
                    });
                  }
                }
              },
              onComplete: () => {
                item.setData('isFalling', false);
                item.startX = item.x;
                item.startY = item.y;
                item.baseX = item.x;
                item.baseY = item.y;
              }
            });
          } else {
            // Already at or below ground level
            item.setData('isFalling', false);
            item.startX = item.x;
            item.startY = item.y;
            item.baseX = item.x;
            item.baseY = item.y;
          }
        }
      }
    );
  }

  /** Calculate the ground Y position for an item to land on */
  private getGroundY(item: TrashItem): number {
    const venueData = venuesData.find(v => v.id === this.venueId);
    if (venueData && venueData.spawnZones && venueData.spawnZones.GroundZone) {
      const gz = venueData.spawnZones.GroundZone;
      return gz.y + gz.height - (item.displayHeight / 2);
    }
    return 860;
  }

  /**
   * Cluster B: Handle composite item clicks.
   */
  private handleItemClicked(data: { item: TrashItem }): void {
    if (this.roundEnded) return;
    const { item } = data;

    // Only respond to clicks if the item is a composite
    if (!item.itemDef.isComposite) return;

    // Pause this scene
    this.scene.pause('TrayScene');
    this.scene.pause('HUDScene');

    // Launch the separation minigame scene
    this.scene.launch('SeparationMinigameScene', {
      item,
      venueId: this.venueId,
      onScore: (points: number, isCorrect: boolean) => {
        const pts = points * this.scoreMultiplier;
        this.roundScore += pts;
        gameEvents.emit(GAME_EVENTS.ITEM_DROPPED, {
          result: { correct: isCorrect, pointsAwarded: pts, velocityMultiplier: 1 }
        });
      },
      onComplete: (success: boolean) => {
        // Callback when minigame finishes
        this.scene.resume('TrayScene');
        this.scene.resume('HUDScene');
        
        // Remove the composite item from tray visually
        const index = this.items.indexOf(item);
        if (index !== -1) {
          this.items.splice(index, 1);
        }
        item.destroy();

        // Apply scoring based on minigame result
        if (success) {
          // Award massive bonus for properly separating items!
          const pts = 500 * this.scoreMultiplier;
          this.roundScore += pts;
          this.correctDrops++;
          this.comboSystem.registerCorrect();
          this.cameras.main.shake(100, 0.005);
          gameEvents.emit(GAME_EVENTS.ITEM_DROPPED, {
            result: { correct: true, pointsAwarded: pts, velocityMultiplier: 1 }
          });
        } else {
          // Normal penalty for failing the minigame
          const penaltyResult = this.scoringSystem.resolveDrop('none', 'none', 0, 0, this.currentTier.errorPenaltyMultiplier, false);
          const pts = penaltyResult.pointsAwarded * this.scoreMultiplier;
          this.roundScore += pts;
          this.comboSystem.registerIncorrect();
          this.cameras.main.shake(80, 0.002);
          gameEvents.emit(GAME_EVENTS.ITEM_DROPPED, {
            result: { correct: false, pointsAwarded: pts, velocityMultiplier: 1 }
          });
        }
        
        gameEvents.emit(GAME_EVENTS.COMBO_CHANGED, { combo: this.comboSystem.getCombo() });
      }
    });
  }

  /** Handle a resolved drop ?" scoring, combo, events, cleanup */
  private handleDrop(item: TrashItem, bin: Bin): void {
    // TASK 1.6: Prevent double-processing of the same item.
    // Root cause: dragend can fire while the item is still tweening from a prior drop,
    // because the item isn't removed from the items array until the tween completes.
    // Setting processed=true and disabling interactive immediately prevents any
    // subsequent dragend from re-resolving this item.
    if (item.processed) return;
    item.processed = true;
    item.disableInteractive();

    const result = this.scoringSystem.resolveDrop(
      item.itemDef.correctBinId,
      bin.binDef.id,
      item.dragStartTimeMs,
      undefined,
      this.currentTier.errorPenaltyMultiplier, // Pass penalty scaling (E.3)
      item.itemDef.isComposite // Pass composite flag (Cluster B)
    );

    // If tutorial is active and they dropped the item correctly
    if (this.tutorialActive && result.correct && this.items.length > 0) {
      this.tutorialActive = false;
      this.tutorialController.completeTutorial();
      
      // Re-enable dragging for all remaining items
      this.items.forEach(i => {
        if (i.active) i.setInteractive({ draggable: true });
      });
      
      // Start the timer
      this.startTimer();
    }

    result.pointsAwarded = result.pointsAwarded * this.scoreMultiplier;

    // Update score
    this.roundScore += result.pointsAwarded;
    this.totalDrops++;

    if (result.correct) {
      this.correctDrops++;
      this.comboSystem.registerCorrect();
      bin.playDropAnimation();
      
      // Award progress based on correct bin
      const targetBinId = item.itemDef.correctBinId;
      if (['compost', 'recycling', 'plastic', 'landfill'].includes(targetBinId)) {
        this.gardenSystem.addProgress(targetBinId, 1);
      }

      // Track C: Particle FX on correct sort (C.1)
      this.particleFX.playCorrectSortFX(
        { x: bin.x, y: bin.y },
        item.itemDef.id,
        this.comboSystem.getCombo()
      );

      // Floating animation
      const text = this.add.text(bin.x, bin.y - 50, '+Bonus!', {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '32px',
        color: '#22c55e',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(100);
      this.tweens.add({
        targets: text,
        y: bin.y - 120,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => text.destroy()
      });

      // Track C: Screen shake on correct drop — stronger (C.7)
      this.cameras.main.shake(50, 0.002);
    } else {
      this.comboSystem.registerIncorrect();

      // Track C: Subtle dust on incorrect sort
      this.particleFX.playIncorrectSortFX({ x: bin.x, y: bin.y });

      // Track C: Screen shake on incorrect drop — weaker (C.7)
      this.cameras.main.shake(50, 0.001);
    }

    // Track C: Item-specific SFX on drop (C.8)
    this.audioManager.playDropSFX(item.itemDef.id, result.correct);

    // Emit item-dropped event for Tracks C and D
    gameEvents.emit(GAME_EVENTS.ITEM_DROPPED, { item, bin, result });

    // 2.5D visual depth: put item behind the front rim but in front of the back rim!
    item.setDepth(bin.backSprite.depth + 1);

    // Animate item falling deep into the bin then destroy
    this.tweens.add({
      targets: item,
      x: bin.x,
      y: bin.y + 60, // Fall down into the hole
      scaleX: 0.2,
      scaleY: 0.2,
      alpha: 0,
      duration: 300,
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

  /** Timer pausing for overlays */
  private pauseTimeMs: number = 0;
  
  /** Stop everything if scene shuts down early */
  private cleanup(): void {
    if (this.timerEvent) this.timerEvent.remove();
    ThreeJSService.hide();
  }

  public pauseTimer(): void {
    if (this.timerEvent && !this.timerEvent.paused) {
      this.timerEvent.paused = true;
      this.pauseTimeMs = Date.now();
    }
  }

  public resumeTimer(): void {
    if (this.timerEvent && this.timerEvent.paused) {
      this.timerEvent.paused = false;
      const pausedDuration = Date.now() - this.pauseTimeMs;
      this.roundStartTimeMs += pausedDuration;
    }
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

    // Set tutorial complete flag if we ran it
    if (this.venueId === venuesData[0]?.id) {
      localStorage.setItem('trashdash_tutorial_complete', 'true');
    }

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
      fontFamily: '"Nunito", sans-serif',
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    scoreText.setOrigin(0.5).setDepth(101);

    // Accuracy
    const accColor = accuracyPct >= 50 ? '#22C55E' : '#EF4444';
    const accText = this.add.text(960, 450, `Accuracy: ${accuracyPct}%`, {
      fontFamily: '"Nunito", sans-serif',
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
        fontFamily: '"Nunito", sans-serif',
        fontSize: '32px',
        color: '#aaaaaa',
      }
    );
    statsText.setOrigin(0.5).setDepth(101);

    // Instructions
    const instrText = this.add.text(960, 650, 'Click to play again  |  ESC for level select', {
      fontFamily: '"Nunito", sans-serif',
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

  update(_time: number, _delta: number): void {
    if (TrayScene.THREE_D_VENUE_IDS.includes(this.venueId)) {
      const threeService = ThreeJSService as any;

      if (threeService.isActive && threeService.camera) {
        // Update bins
        for (const bin of this.bins) {
          if (!(bin as any).worldPosition && bin.baseX !== undefined) {
            (bin as any).worldPosition = threeService.unprojectPhaserToWorld(bin.baseX, bin.baseY, 50);
          }
          if ((bin as any).worldPosition) {
            const pos = threeService.projectWorldToPhaser((bin as any).worldPosition);
            bin.setPosition(pos.x, pos.y);
            bin.setVisible(pos.visible);
          }
        }

        // Update rock crusher
        if (this.crusher && (this.crusher as any).baseX !== undefined) {
          const c = this.crusher as any;
          if (!c.worldPosition) {
            c.worldPosition = threeService.unprojectPhaserToWorld(c.baseX, c.baseY, 50);
          }
          const pos = threeService.projectWorldToPhaser(c.worldPosition);
          c.setPosition(pos.x, pos.y);
          c.setVisible(pos.visible);
        }

        // Update trash items
        for (const item of this.items) {
          if (!item || !item.active) continue;

          if (!item.getData('isBeingDragged')) {
            // If the item just finished moving/falling, update its baseline world position
            if (item.x !== item.baseX || item.y !== item.baseY || !(item as any).worldPosition) {
              item.baseX = item.x;
              item.baseY = item.y;
              (item as any).worldPosition = threeService.unprojectPhaserToWorld(item.baseX, item.baseY, 50);
            }
            
            if ((item as any).worldPosition) {
              const pos = threeService.projectWorldToPhaser((item as any).worldPosition);
              // Only override the position if it's not currently animating in a tween
              if (!this.tweens.isTweening(item)) {
                item.setPosition(pos.x, pos.y);
                item.setVisible(pos.visible);
                // Also update its baseline so it doesn't immediately reset worldPosition next frame
                item.baseX = pos.x;
                item.baseY = pos.y;
                item.syncAttachments(); // Required for TrashItem since text and shadows must move with it
              }
            }
          } else {
            // While dragging, clear its world position so it recalculates when dropped
            (item as any).worldPosition = null;
            item.setVisible(true); // Always visible when dragging
          }
        }
      }
    }
  }
}
