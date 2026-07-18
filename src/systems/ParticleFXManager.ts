import Phaser from 'phaser';
import { generatePlaceholderTexture } from '../util/PlaceholderArtGenerator';

/**
 * ParticleFXManager — Particle effects for correct sorts.
 * Per PRD Track C, step C.1.
 *
 * Each bin type produces a different colored particle burst.
 * Particle scale and lifespan increase with combo count.
 */
export class ParticleFXManager {
  private scene: Phaser.Scene;
  private initialized: boolean = false;

  // Particle texture keys per bin type
  private static readonly PARTICLE_MAP: Record<string, { key: string; color: number }> = {
    paper: { key: 'particle_confetti', color: 0x3B82F6 },
    compost: { key: 'particle_sparkle', color: 0x22C55E },
    plastic: { key: 'particle_splash', color: 0xEAB308 },
    landfill: { key: 'particle_dust', color: 0x6B7280 },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ensureTextures();
  }

  /** Generate small particle textures if they don't exist yet */
  private ensureTextures(): void {
    if (this.initialized) return;
    this.initialized = true;

    for (const [, info] of Object.entries(ParticleFXManager.PARTICLE_MAP)) {
      if (!this.scene.textures.exists(info.key)) {
        // Generate a small circular particle texture
        const gfx = this.scene.add.graphics();
        gfx.fillStyle(info.color, 1);
        gfx.fillCircle(8, 8, 8);
        gfx.generateTexture(info.key, 16, 16);
        gfx.destroy();
      }
    }

    // Also generate a generic white particle for the fire border
    if (!this.scene.textures.exists('particle_fire')) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0xff6600, 1);
      gfx.fillCircle(6, 6, 6);
      gfx.generateTexture('particle_fire', 12, 12);
      gfx.destroy();
    }
  }

  /**
   * Play a particle burst at the given position for a correct sort.
   * Per PRD C.1: scale and lifespan increase with combo count.
   */
  playCorrectSortFX(
    position: { x: number; y: number },
    binId: string,
    comboCount: number
  ): void {
    const particleInfo = ParticleFXManager.PARTICLE_MAP[binId] ?? {
      key: 'particle_dust',
      color: 0xaaaaaa,
    };

    // Ensure the texture exists
    if (!this.scene.textures.exists(particleInfo.key)) {
      this.ensureTextures();
    }

    // Scale with combo: larger and longer-lived at higher combos
    const scaleFactor = 0.5 + Math.min(comboCount, 5) * 0.15;
    const lifespanFactor = 400 + Math.min(comboCount, 5) * 100;
    const quantity = 8 + Math.min(comboCount, 5) * 4;

    const emitter = this.scene.add.particles(position.x, position.y, particleInfo.key, {
      speed: { min: 80, max: 200 },
      scale: { start: scaleFactor, end: 0 },
      lifespan: lifespanFactor,
      quantity: quantity,
      gravityY: 150,
      alpha: { start: 1, end: 0 },
      angle: { min: 0, max: 360 },
      emitting: false,
    });
    emitter.setDepth(50);

    // Emit a single burst then clean up
    emitter.explode(quantity);

    // Auto-destroy after particles are done
    this.scene.time.delayedCall(lifespanFactor + 100, () => {
      emitter.destroy();
    });
  }

  /**
   * Play an incorrect-sort effect — subtle dust puff (less rewarding).
   */
  playIncorrectSortFX(position: { x: number; y: number }): void {
    if (!this.scene.textures.exists('particle_dust')) {
      this.ensureTextures();
    }

    const emitter = this.scene.add.particles(position.x, position.y, 'particle_dust', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.3, end: 0 },
      lifespan: 300,
      quantity: 5,
      alpha: { start: 0.5, end: 0 },
      angle: { min: 0, max: 360 },
      emitting: false,
    });
    emitter.setDepth(50);

    emitter.explode(5);

    this.scene.time.delayedCall(400, () => {
      emitter.destroy();
    });
  }
}
