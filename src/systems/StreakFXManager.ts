import Phaser from 'phaser';
import { UI_THEME } from '../config/UITheme';

/**
 * StreakFXManager
 * Handles visual and audio flair for perfect streaks.
 * NO numeric/gameplay bonuses are triggered here.
 */
export class StreakFXManager {
  private static instance: StreakFXManager;

  private constructor() {}

  public static getInstance(): StreakFXManager {
    if (!StreakFXManager.instance) {
      StreakFXManager.instance = new StreakFXManager();
    }
    return StreakFXManager.instance;
  }

  public getTier(streak: number): number {
    if (streak >= 10) return 4;
    if (streak >= 5) return 3;
    if (streak >= 3) return 2;
    if (streak >= 1) return 1;
    return 0;
  }

  /**
   * Applies the HUD style (border glow/pulse around score readout)
   * based on the current streak tier.
   * Call this from HUDScene when score container is created/updated.
   */
  public applyHUDStyle(scene: Phaser.Scene, scoreContainer: Phaser.GameObjects.Container | Phaser.GameObjects.Graphics, tier: number, backgroundGlow?: Phaser.GameObjects.Graphics) {
    // Clear previous FX
    if (backgroundGlow) {
      backgroundGlow.clear();
      scene.tweens.killTweensOf(backgroundGlow);
    }

    if (tier === 0) return;

    if (!backgroundGlow) return; // Need a graphics object behind the score

    // Convert hex string to number
    const color = parseInt(UI_THEME.goldAccent[0].replace('#', '0x'), 16);

    if (tier === 1) {
      // Subtle gold glow
      backgroundGlow.lineStyle(4, color, 0.4);
      backgroundGlow.strokeRoundedRect(-80, -25, 160, 50, UI_THEME.cornerRadius);
    } else if (tier === 2) {
      // Intensified glow
      backgroundGlow.lineStyle(6, color, 0.7);
      backgroundGlow.strokeRoundedRect(-80, -25, 160, 50, UI_THEME.cornerRadius);
    } else if (tier >= 3) {
      // Pulsing gold continuously
      backgroundGlow.lineStyle(8, color, 1);
      backgroundGlow.strokeRoundedRect(-80, -25, 160, 50, UI_THEME.cornerRadius);
      
      scene.tweens.add({
        targets: backgroundGlow,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Plays summary screen flair when the round summary is shown.
   */
  public playSummaryScreenFX(scene: Phaser.Scene, x: number, y: number, tier: number) {
    if (tier === 0) return;

    if (tier === 1 || tier === 2) {
      // Play ascending stinger if tier 2+
      if (tier === 2) {
        this.playAudio(scene, 'streak_stinger_t2');
      }
    } else if (tier === 3) {
      // Spark icon + distinct fanfare
      this.playAudio(scene, 'streak_stinger_t3');
      const spark = scene.add.text(x + 50, y, '✨', { fontSize: '32px' }).setOrigin(0.5);
      scene.tweens.add({
        targets: spark,
        scale: 1.5,
        angle: 180,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    } else if (tier === 4) {
      // Flame icon + rich fanfare + sparkle burst
      this.playAudio(scene, 'streak_stinger_t4');
      const flame = scene.add.text(x + 50, y, '🔥', { fontSize: '40px' }).setOrigin(0.5);
      scene.tweens.add({
        targets: flame,
        scale: { from: 1, to: 1.3 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Particle burst
      const particles = scene.add.particles(x, y, 'particle_star', {
        speed: { min: 100, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 800,
        quantity: 20
      });
      particles.explode();
    }
  }

  private playAudio(scene: Phaser.Scene, key: string) {
    // Attempt to play if it exists in cache
    if (scene.cache.audio.exists(key)) {
      scene.sound.play(key);
    }
  }
}

export const streakFXManager = StreakFXManager.getInstance();
