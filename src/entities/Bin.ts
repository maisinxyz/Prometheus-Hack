import Phaser from 'phaser';
import { BinDef } from '../data/schemas/binSchema';

/**
 * Bin — Drop-target zone with visual sprite.
 * Per PRD Track B, step B.2.
 *
 * Uses a Phaser.GameObjects.Zone for the invisible hitbox
 * with a child Sprite for the visual bin icon.
 * Exposes getBounds() for overlap checks in TrayScene.
 */
export class Bin extends Phaser.GameObjects.Zone {
  public readonly binDef: BinDef;
  public readonly backSprite: Phaser.GameObjects.Sprite;
  public readonly frontSprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, binDef: BinDef) {
    // Hitbox size for the bin opening (the 'hole')
    const zoneWidth = 180;
    const zoneHeight = 100;
    super(scene, x, y - 60, zoneWidth, zoneHeight); // Shift zone up to align with the visual hole

    this.binDef = binDef;

    // Add the zone to the scene
    scene.add.existing(this);

    // Create the back rim + hole sprite
    this.backSprite = scene.add.sprite(x, y, `bin_${binDef.id}_back`);
    this.backSprite.setDepth(5);

    // Create the front body + front rim sprite
    this.frontSprite = scene.add.sprite(x, y, `bin_${binDef.id}_front`);
    this.frontSprite.setDepth(15);

    // Set zone depth so debug rects (if any) render correctly
    this.setDepth(5);
  }

  /**
   * Returns the bounding rectangle of this bin's zone for overlap detection.
   * Overridden to properly account for runtime scaling.
   */
  getBounds<O extends Phaser.Geom.Rectangle>(output?: O): O {
    const rect = output || new Phaser.Geom.Rectangle();
    const w = this.width * this.scaleX;
    const h = this.height * this.scaleY;
    rect.setTo(
      this.x - w / 2,
      this.y - h / 2,
      w,
      h
    );
    return rect as O;
  }

  /**
   * Play squash-and-stretch animation on successful drop.
   */
  playDropAnimation(): void {
    this.scene.tweens.add({
      targets: [this.backSprite, this.frontSprite],
      scaleX: this.backSprite.scaleX * 1.05,
      scaleY: this.backSprite.scaleY * 0.95,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  /**
   * Override setScale to apply to children sprites as well
   */
  setScale(x: number, y?: number): this {
    super.setScale(x, y);
    const scaleY = y ?? x;
    this.backSprite.setScale(x, scaleY);
    this.frontSprite.setScale(x, scaleY);
    return this;
  }

  /** Clean up child objects */
  destroy(fromScene?: boolean): void {
    this.backSprite.destroy();
    this.frontSprite.destroy();
    super.destroy(fromScene);
  }
}
