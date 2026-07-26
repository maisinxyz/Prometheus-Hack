import Phaser from 'phaser';
import { gameEvents, GAME_EVENTS, DropResult } from '../systems/GameEvents';
import { UI_THEME } from '../config/UITheme';
import { perfectStreakSystem } from '../systems/PerfectStreakSystem';
import { streakFXManager } from '../systems/StreakFXManager';
import { GlossyButton } from '../entities/GlossyButton';

/**
 * HUDScene — Score/combo/timer overlay with juice effects.
 * Per PRD Track B step B.10 + Track C step C.2.
 *
 * Runs as a parallel scene over TrayScene.
 * Subscribes to game events and updates display in real-time.
 * Includes fire border effect at 5x combo.
 */
export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private comboPill!: Phaser.GameObjects.Container;
  private timerText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  private currentScore: number = 0;
  private roundTimerMs: number = 30000;
  private startTimeMs: number = 0;

  // Track C: Fire border at 5x combo (C.2)
  private fireBorderEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private fireBorderActive: boolean = false;

  private scoreGlow!: Phaser.GameObjects.Graphics;

  private weatherName: string = '';
  private weatherDesc: string = '';
  private weatherEffect: string = '';
  private weatherColor: string = '#ffffff';

  constructor() {
    super({ key: 'HUDScene' });
  }

  init(data: { roundTimerMs?: number, weatherName?: string, weatherDesc?: string, weatherEffect?: string, weatherColor?: string }): void {
    this.roundTimerMs = data?.roundTimerMs ?? 30000;
    this.currentScore = 0;
    this.startTimeMs = Date.now();
    this.fireBorderActive = false;
    this.fireBorderEmitters = [];
    
    this.weatherName = data?.weatherName || 'Clear Skies';
    this.weatherDesc = data?.weatherDesc || 'The environment is stabilizing.';
    this.weatherEffect = data?.weatherEffect || 'Normal conditions.';
    this.weatherColor = data?.weatherColor || '#ffffff';
  }

  create(): void {
    // Generate the fire particle texture if needed
    this.createFireParticleTexture();

    // Helper to draw a glossy pill behind text
    const createPill = (x: number, y: number, width: number, height: number, colors: string[] = [...UI_THEME.primaryGradient]) => {
      const container = this.add.container(x, y);
      const colorTop = Phaser.Display.Color.HexStringToColor(colors[0] || '#ffffff').color;
      const colorBottom = Phaser.Display.Color.HexStringToColor(colors[1] || '#ffffff').color;
      
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.4);
      shadow.fillRoundedRect(-width / 2 + 4, -height / 2 + 6, width, height, UI_THEME.cornerRadius);
      
      const bg = this.add.graphics();
      bg.fillGradientStyle(colorTop, colorTop, colorBottom, colorBottom, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, UI_THEME.cornerRadius);
      
      const gloss = this.add.graphics();
      gloss.fillStyle(0xffffff, UI_THEME.glossHighlightAlpha);
      const r = UI_THEME.cornerRadius;
      gloss.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height * 0.4, { tl: r-2, tr: r-2, bl: 0, br: 0 } as any);
      
      container.add([shadow, bg, gloss]);
      container.setDepth(190);
      return container;
    };

    // --- Top-Right Settings / Help ---
    const topY = 120;
    const width = 1920;
    
    // Help button removed to avoid overlapping with SCORE

    // --- Score display (top-right) ---
    this.scoreGlow = this.add.graphics({ x: 1780, y: 120 }).setDepth(185);
    createPill(1780, 120, 240, 60);
    this.scoreText = this.add.text(1780, 120, 'SCORE: 0', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.5)', blur: 2, fill: true }
    });
    this.scoreText.setOrigin(0.5).setDepth(200);

    // Initial streak style
    const initialStreak = perfectStreakSystem.getCurrentStreak();
    const initialTier = streakFXManager.getTier(initialStreak);
    streakFXManager.applyHUDStyle(this, this.scoreGlow, initialTier, this.scoreGlow);

    // --- Combo display (top-left) ---
    this.comboPill = createPill(140, 120, 240, 60);
    this.comboPill.setAlpha(0); // Hide initially
    this.comboText = this.add.text(140, 120, '', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.5)', blur: 2, fill: true }
    });
    this.comboText.setOrigin(0.5).setDepth(200);

    // --- Timer display (top-center) ---
    createPill(960, 120, 200, 70);
    this.timerText = this.add.text(960, 120, '', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.5)', blur: 2, fill: true }
    });
    this.timerText.setOrigin(0.5).setDepth(200);

    // --- Feedback text (center, fades out) ---
    this.feedbackText = this.add.text(960, 540, '', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.feedbackText.setOrigin(0.5).setDepth(200).setAlpha(0);

    // --- Weather Event Box (Removed per request) ---
    // --- Debug CHI Reset Button (bottom-right, inset for visibility) ---
    const resetBtnBg = this.add.rectangle(1800, 1000, 240, 50, 0x00aa00, 0.85)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(200);
    const resetBtnText = this.add.text(1800, 1000, '🔄 Reset CHI (No Smog)', {
      fontFamily: '"Nunito", sans-serif', fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(201);
    resetBtnBg.on('pointerdown', () => {
      // Set all venues to 100 CHI (max) to remove smog
      if (typeof localStorage !== 'undefined') {
        const venues = ['mackenzie_cafe', 'financial_district_office', 'nyc_hospital', 'times_square', 'hot_dog_stand', 'subway_station', 'gym', 'central_park', 'public_library', 'art_studio', 'construction_site', 'tech_startup', 'ferry_docks'];
        for (const v of venues) {
          localStorage.setItem('trashdash_chi_' + v, '100');
        }
        window.location.reload();
      }
    });

    // --- Subscribe to game events ---
    gameEvents.on(
      GAME_EVENTS.ITEM_DROPPED,
      (payload: { result: DropResult }) => {
        // Animate score counter
        this.tweens.addCounter({
          from: this.currentScore,
          to: this.currentScore + payload.result.pointsAwarded,
          duration: 300,
          ease: 'Sine.easeOut',
          onUpdate: (tween) => {
            const val = tween.getValue();
            this.scoreText.setText(`SCORE: ${Math.round(val || 0)}`);
          }
        });
        
        this.currentScore += payload.result.pointsAwarded;

        // Show feedback
        if (payload.result.correct) {
          const bonus = payload.result.velocityMultiplier > 1 ? ' ⚡FAST!' : '';
          this.showFeedback(`+${payload.result.pointsAwarded}${bonus}`, '#22C55E');
        } else {
          this.showFeedback(`${payload.result.pointsAwarded}`, '#EF4444');
        }
      }
    );

    gameEvents.on(
      GAME_EVENTS.STREAK_CHANGED,
      (payload: { current: number, tierChanged: boolean }) => {
        const tier = streakFXManager.getTier(payload.current);
        streakFXManager.applyHUDStyle(this, this.scoreGlow, tier, this.scoreGlow);
      }
    );

    gameEvents.on(
      GAME_EVENTS.COMBO_CHANGED,
      (payload: { combo: number }) => {
        if (payload.combo > 0) {
          this.comboPill.setAlpha(1);
          this.comboText.setText(`COMBO ×${payload.combo}`);
          // Scale pulse on combo increase
          this.tweens.add({
            targets: [this.comboText, this.comboPill],
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeOut',
          });

          // Change combo text color at higher combos
          if (payload.combo >= 5) {
            this.comboText.setColor(UI_THEME.dangerAccent);
          } else if (payload.combo >= 3) {
            this.comboText.setColor(UI_THEME.goldAccent[0]);
          } else {
            this.comboText.setColor('#ffffff');
          }
        } else {
          this.comboPill.setAlpha(0);
          this.comboText.setText('');
        }

        // Track C: Fire border at 5x combo (C.2)
        if (payload.combo >= 5 && !this.fireBorderActive) {
          this.startFireBorder();
        } else if (payload.combo < 5 && this.fireBorderActive) {
          this.stopFireBorder();
        }
      }
    );

    gameEvents.on(GAME_EVENTS.ROUND_ENDED, () => {
      // Stop updating timer
      this.timerText.setText('TIME UP!');
      this.timerText.setColor('#EF4444');
      // Stop fire border
      this.stopFireBorder();
    });
  }

  update(): void {
    // Update timer countdown every frame
    const elapsed = Date.now() - this.startTimeMs;
    const remaining = Math.max(0, this.roundTimerMs - elapsed);
    const seconds = Math.ceil(remaining / 1000);

    this.timerText.setText(`${seconds}s`);

    // Flash red when time is low
    if (seconds <= 5 && seconds > 0) {
      this.timerText.setColor('#EF4444');
    } else if (seconds > 5) {
      this.timerText.setColor('#ffffff');
    }
  }

  /** Generate the fire particle texture */
  private createFireParticleTexture(): void {
    if (this.textures.exists('particle_fire_hud')) return;

    // Create a soft radial gradient (blurred circle) for additive blending
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    this.textures.addCanvas('particle_fire_hud', canvas);
  }

  /**
   * Start the fire border effect — realistic flames roaring from the bottom
   */
  private startFireBorder(): void {
    this.fireBorderActive = true;

    // Create a realistic roaring fire at the very bottom of the screen
    const emitter = this.add.particles(0, 0, 'particle_fire_hud', {
      x: { min: 0, max: 1920 }, // Span entire width
      y: { min: 1060, max: 1090 }, // At the bottom
      angle: { min: 260, max: 280 }, // Straight UP (270 is up)
      speed: { min: 100, max: 250 },
      scale: { start: 2.5, end: 0.1 }, // Starts large, shrinks as it rises
      lifespan: { min: 500, max: 1200 }, // How high the flames go
      alpha: { start: 0.7, end: 0 },
      tint: [
        0xffff00, // Yellow core
        0xffaa00, // Orange
        0xff4400, // Red
        0x550000  // Dark red tip
      ],
      frequency: 10, // Intense!
      quantity: 5,
      blendMode: Phaser.BlendModes.ADD,
    });
    emitter.setDepth(250);

    // Add some random sparks flying out of the fire
    const sparkEmitter = this.add.particles(0, 0, 'particle_fire_hud', {
      x: { min: 0, max: 1920 },
      y: { min: 1060, max: 1080 },
      angle: { min: 250, max: 290 },
      speed: { min: 200, max: 400 },
      scale: { start: 0.4, end: 0 },
      lifespan: { min: 600, max: 1500 },
      alpha: { start: 1, end: 0 },
      tint: 0xffffaa, // Bright yellow/white
      frequency: 50,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      gravityY: 100 // Sparks arc and fall slightly
    });
    sparkEmitter.setDepth(251);

    this.fireBorderEmitters.push(emitter, sparkEmitter);
  }

  /** Stop the fire border effect */
  private stopFireBorder(): void {
    this.fireBorderActive = false;

    for (const emitter of this.fireBorderEmitters) {
      emitter.stop();
      // Destroy after existing particles fade out
      this.time.delayedCall(700, () => {
        emitter.destroy();
      });
    }
    this.fireBorderEmitters = [];
  }

  /** Show floating feedback text that fades out */
  private showFeedback(text: string, color: string): void {
    this.feedbackText.setText(text);
    this.feedbackText.setColor(color);
    this.feedbackText.setAlpha(1);
    this.feedbackText.y = 540;

    this.tweens.add({
      targets: this.feedbackText,
      y: 440,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
    });
  }

  /** Clean up event subscriptions and effects */
  shutdown(): void {
    this.stopFireBorder();
    gameEvents.off(GAME_EVENTS.ITEM_DROPPED);
    gameEvents.off(GAME_EVENTS.COMBO_CHANGED);
    gameEvents.off(GAME_EVENTS.ROUND_ENDED);
    gameEvents.off(GAME_EVENTS.STREAK_CHANGED);
  }
}
