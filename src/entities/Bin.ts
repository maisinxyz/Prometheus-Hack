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
  public readonly binSprite: Phaser.GameObjects.Sprite;
  private readonly labelText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, binDef: BinDef) {
    // Zone size matches bin sprite display area (scaled down for gameplay)
    const zoneWidth = 192;
    const zoneHeight = 256;
    super(scene, x, y, zoneWidth, zoneHeight);

    this.binDef = binDef;

    // Add the zone to the scene
    scene.add.existing(this);

    // Create the visual bin sprite as a child
    this.binSprite = scene.add.sprite(x, y, `bin_${binDef.id}`);
    this.binSprite.setDisplaySize(192, 256);
    this.binSprite.setDepth(5);

    // Add bin label text below the sprite
    this.labelText = scene.add.text(x, y + 140, binDef.displayName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: binDef.color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.labelText.setOrigin(0.5);
    this.labelText.setDepth(6);

    // Set zone depth
    this.setDepth(5);
  }

  /**
   * Returns the bounding rectangle of this bin's zone for overlap detection.
   * Override to ensure we get the zone bounds (not default empty bounds).
   */
  getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }

  /**
   * Play squash-and-stretch animation on successful drop.
   * Per PRD Track C, step C.6 — implemented here since it's on the Bin entity.
   */
  playDropAnimation(): void {
    this.scene.tweens.add({
      targets: this.binSprite,
      scaleX: this.binSprite.scaleX * 1.15,
      scaleY: this.binSprite.scaleY * 0.85,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  /** Clean up child objects */
  destroy(fromScene?: boolean): void {
    this.binSprite.destroy();
    this.labelText.destroy();
    super.destroy(fromScene);
  }
}
