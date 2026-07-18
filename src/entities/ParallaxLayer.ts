import Phaser from 'phaser';

/**
 * ParallaxLayer — Multi-layer parallax background system.
 * Per PRD Track F, step F.3.
 *
 * Takes 3 texture keys (background, midground, foreground) and applies
 * different scroll factors so camera movements (including screen shake
 * from Track C step C.7) create a depth illusion.
 */
export class ParallaxLayer {
  private bgSprite: Phaser.GameObjects.Sprite;
  private midSprite: Phaser.GameObjects.Sprite;
  private fgSprite: Phaser.GameObjects.Sprite;

  constructor(
    scene: Phaser.Scene,
    bgKey: string,
    midKey: string,
    fgKey: string
  ) {
    // Background layer — slowest scroll (deepest)
    this.bgSprite = scene.add.sprite(960, 540, bgKey);
    this.bgSprite.setScrollFactor(0.2);
    this.bgSprite.setDepth(0);

    // Midground layer — medium scroll
    this.midSprite = scene.add.sprite(960, 540, midKey);
    this.midSprite.setScrollFactor(0.5);
    this.midSprite.setDepth(1);

    // Foreground layer — fastest scroll (closest)
    this.fgSprite = scene.add.sprite(960, 540, fgKey);
    this.fgSprite.setScrollFactor(0.8);
    this.fgSprite.setDepth(2);
  }

  /** Swap the background layer texture (used by Track D decay state) */
  setBackgroundTexture(key: string): void {
    this.bgSprite.setTexture(key);
  }

  /** Swap the midground layer texture */
  setMidgroundTexture(key: string): void {
    this.midSprite.setTexture(key);
  }

  /** Swap the foreground layer texture */
  setForegroundTexture(key: string): void {
    this.fgSprite.setTexture(key);
  }

  /** Destroy all layers */
  destroy(): void {
    this.bgSprite.destroy();
    this.midSprite.destroy();
    this.fgSprite.destroy();
  }
}
