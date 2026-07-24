import Phaser from 'phaser';
import { gameEvents, GAME_EVENTS, DropResult } from '../systems/GameEvents';
import { UI_THEME } from '../config/UITheme';

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
      const colorTop = Phaser.Display.Color.HexStringToColor(colors[0]).color;
      const colorBottom = Phaser.Display.Color.HexStringToColor(colors[1]).color;
      
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

    // --- Score display (top-right) ---
    createPill(1780, 75, 240, 60);
    this.scoreText = this.add.text(1780, 75, 'SCORE: 0', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.5)', blur: 2, fill: true }
    });
    this.scoreText.setOrigin(0.5).setDepth(200);

    // --- Combo display (top-left) ---
    this.comboPill = createPill(140, 75, 240, 60);
    this.comboPill.setAlpha(0); // Hide initially
    this.comboText = this.add.text(140, 75, '', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.5)', blur: 2, fill: true }
    });
    this.comboText.setOrigin(0.5).setDepth(200);

    // --- Timer display (top-center) ---
    createPill(960, 50, 200, 70);
    this.timerText = this.add.text(960, 50, '', {
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
        const venues = ['mackenzie_cafe', 'financial_district_office', 'nyc_hospital', 'times_square', 'broadway_theater', 'hot_dog_stand', 'subway_station', 'empire_state_building', 'gym', 'central_park', 'public_library', 'art_studio', 'construction_site', 'tech_startup', 'ferry_docks'];
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
            this.scoreText.setText(`SCORE: ${Math.round(tween.getValue())}`);
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
