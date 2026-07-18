import Phaser from 'phaser';
import { gameEvents, GAME_EVENTS, DropResult } from '../systems/GameEvents';

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
  private timerText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  private currentScore: number = 0;
  private roundTimerMs: number = 30000;
  private startTimeMs: number = 0;

  // Track C: Fire border at 5x combo (C.2)
  private fireBorderEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private fireBorderActive: boolean = false;

  constructor() {
    super({ key: 'HUDScene' });
  }

  init(data: { roundTimerMs?: number }): void {
    this.roundTimerMs = data?.roundTimerMs ?? 30000;
    this.currentScore = 0;
    this.startTimeMs = Date.now();
    this.fireBorderActive = false;
    this.fireBorderEmitters = [];
  }

  create(): void {
    // Generate the fire particle texture if needed
    this.createFireParticleTexture();

    // --- Score display (top-left) ---
    this.scoreText = this.add.text(40, 60, 'SCORE: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.scoreText.setDepth(200);

    // --- Combo display (top-right) ---
    this.comboText = this.add.text(1880, 60, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#00FFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.comboText.setOrigin(1, 0).setDepth(200);

    // --- Timer display (top-center) ---
    this.timerText = this.add.text(960, 30, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.timerText.setOrigin(0.5, 0).setDepth(200);

    // --- Feedback text (center, fades out) ---
    this.feedbackText = this.add.text(960, 540, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.feedbackText.setOrigin(0.5).setDepth(200).setAlpha(0);

    // --- Subscribe to game events ---
    gameEvents.on(
      GAME_EVENTS.ITEM_DROPPED,
      (payload: { result: DropResult }) => {
        this.currentScore += payload.result.pointsAwarded;
        this.scoreText.setText(`SCORE: ${this.currentScore}`);

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
      GAME_EVENTS.COMBO_CHANGED,
      (payload: { combo: number }) => {
        if (payload.combo > 0) {
          this.comboText.setText(`COMBO ×${payload.combo}`);
          // Scale pulse on combo increase
          this.tweens.add({
            targets: this.comboText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeOut',
          });

          // Change combo text color at higher combos
          if (payload.combo >= 5) {
            this.comboText.setColor('#FF6600');
          } else if (payload.combo >= 3) {
            this.comboText.setColor('#FFD700');
          } else {
            this.comboText.setColor('#00FFFF');
          }
        } else {
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

    const gfx = this.add.graphics();
    gfx.fillStyle(0xff6600, 1);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('particle_fire_hud', 8, 8);
    gfx.destroy();
  }

  /**
   * Start the fire border effect — orange/red particles along all 4 edges.
   * Per PRD Track C, step C.2.
   */
  private startFireBorder(): void {
    this.fireBorderActive = true;

    // Define edge zones for the 4 borders
    const edges = [
      // Top edge
      { x: 960, y: 5, width: 1920, height: 10, angle: { min: 80, max: 100 } },
      // Bottom edge
      { x: 960, y: 1075, width: 1920, height: 10, angle: { min: 260, max: 280 } },
      // Left edge
      { x: 5, y: 540, width: 10, height: 1080, angle: { min: 350, max: 370 } },
      // Right edge
      { x: 1915, y: 540, width: 10, height: 1080, angle: { min: 170, max: 190 } },
    ];

    for (const edge of edges) {
      const emitter = this.add.particles(0, 0, 'particle_fire_hud', {
        x: { min: edge.x - edge.width / 2, max: edge.x + edge.width / 2 },
        y: { min: edge.y - edge.height / 2, max: edge.y + edge.height / 2 },
        speed: { min: 20, max: 60 },
        scale: { start: 0.8, end: 0 },
        lifespan: { min: 300, max: 600 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xff0000, 0xff3300, 0xff6600, 0xffaa00],
        frequency: 20,
        quantity: 2,
        blendMode: Phaser.BlendModes.ADD,
      });
      emitter.setDepth(250);

      this.fireBorderEmitters.push(emitter);
    }
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
  }
}
