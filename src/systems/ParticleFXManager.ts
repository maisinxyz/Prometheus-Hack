import Phaser from 'phaser';


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
  private readonly binConfigs: Record<string, { key: string; color: number }> = {
    compost: { key: 'particle_leaf', color: 0x22C55E }, // Green
    recycling: { key: 'particle_confetti', color: 0x3B82F6 }, // Blue
    landfill: { key: 'particle_smoke', color: 0x111111 }, // Black
    plastic: { key: 'particle_splash', color: 0x6B7280 }, // Grey
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ensureTextures();
  }

  /** Generate small particle textures if they don't exist yet */
  private ensureTextures(): void {
    if (this.initialized) return;
    this.initialized = true;

    for (const [, info] of Object.entries(this.binConfigs)) {
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
    itemId: string,
    comboCount: number
  ): void {
    // Map item IDs to specific particle effects, fallback to bin-based effects
    let particleKey = 'particle_dust';
    let pColor = 0xaaaaaa;
    let effectType = 'burst'; // 'burst' or 'glow'
    let lifespanFactor = 400 + Math.min(comboCount, 5) * 100;
    
    // Check for specific item overrides
    if (itemId === 'smartphone' || itemId === 'laptop_battery') {
      particleKey = 'particle_fire'; // Reusing fire particle for glow
      pColor = 0x00ff00; // Green glow
      effectType = 'glow';
      lifespanFactor = 800; // Glow lasts longer
    } else if (itemId.includes('plastic') || itemId.includes('bottle')) {
      particleKey = 'particle_splash';
      pColor = 0x6B7280; // Grey
    } else if (itemId.includes('paper') || itemId.includes('napkin') || itemId.includes('document') || itemId.includes('cardboard')) {
      particleKey = 'particle_confetti';
      pColor = 0x3B82F6; // Blue (Recycling)
    } else if (itemId.includes('food') || itemId.includes('apple') || itemId.includes('coffee')) {
      particleKey = 'particle_sparkle';
      pColor = 0x22C55E;
    }

    // Ensure the texture exists
    if (!this.scene.textures.exists(particleKey)) {
      this.ensureTextures();
    }

    // Scale with combo: larger and longer-lived at higher combos
    const scaleFactor = 0.5 + Math.min(comboCount, 5) * 0.15;
    const quantity = effectType === 'glow' ? 4 : (8 + Math.min(comboCount, 5) * 4);

    const emitter = this.scene.add.particles(position.x, position.y, particleKey, {
      speed: effectType === 'glow' ? { min: 20, max: 50 } : { min: 80, max: 200 },
      scale: effectType === 'glow' ? { start: scaleFactor * 2, end: 0 } : { start: scaleFactor, end: 0 },
      lifespan: lifespanFactor,
      quantity: quantity,
      gravityY: effectType === 'glow' ? -50 : 150, // Glow floats up, burst falls down
      alpha: { start: effectType === 'glow' ? 0.8 : 1, end: 0 },
      tint: pColor,
      angle: { min: 0, max: 360 },
      emitting: false,
      blendMode: effectType === 'glow' ? 'ADD' : 'NORMAL'
    });
    emitter.setDepth(50);

    // Emit a single burst then clean up
    emitter.explode(quantity);

    // Auto-destroy after particles are done
    this.scene.time.delayedCall(lifespanFactor + 100, () => {
      emitter.destroy();
    });

    // Track 11: Accessibility pass - Checkmark icon
    const checkText = this.scene.add.text(position.x, position.y - 20, '✓', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '48px',
      color: '#22c55e',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(60);

    this.scene.tweens.add({
      targets: checkText,
      y: position.y - 80,
      alpha: 0,
      duration: lifespanFactor,
      onComplete: () => checkText.destroy()
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

    // Clean up
    this.scene.time.delayedCall(600, () => {
      emitter.destroy();
    });

    // Track 11: Accessibility pass - X icon
    const crossText = this.scene.add.text(position.x, position.y - 20, '✗', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '48px',
      color: '#ef4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(60);

    this.scene.tweens.add({
      targets: crossText,
      y: position.y - 60,
      alpha: 0,
      duration: 600,
      onComplete: () => crossText.destroy()
    });
  }
}
