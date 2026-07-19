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
  private readonly dropShadow: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, binDef: BinDef) {
    // Zone size matches bin sprite display area (scaled down for gameplay)
    // Zone size scaled for the counter top
    const zoneWidth = 180;
    const zoneHeight = 110;
    super(scene, x, y, zoneWidth, zoneHeight);

    this.binDef = binDef;

    // Add the zone to the scene
    scene.add.existing(this);

    // Create the visual bin sprite as a child
    this.binSprite = scene.add.sprite(x, y, `bin_${binDef.id}`);
    this.binSprite.setDisplaySize(180, 110);
    this.binSprite.setDepth(5);

    // Add bin label text below the hole (on the wooden counter face)
    this.labelText = scene.add.text(x, y + 80, binDef.displayName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.labelText.setOrigin(0.5);
    this.labelText.setDepth(6);

    // --- F.4: Procedural Drop Shadow ---
    this.dropShadow = scene.add.sprite(x + 6, y + 8, `bin_${binDef.id}`);
    this.dropShadow.setDisplaySize(180 * 0.95, 110 * 0.95);
    this.dropShadow.setTint(0x000000);
    this.dropShadow.setAlpha(0.35);
    this.dropShadow.setDepth(4); // Behind the main sprite

    // Set zone depth
    this.setDepth(5);
  }

  /**
   * Returns the bounding rectangle of this bin's zone for overlap detection.
   * Override to ensure we get the zone bounds
   */
  getBounds<O extends Phaser.Geom.Rectangle>(output?: O): O {
    const rect = output || new Phaser.Geom.Rectangle();
    rect.setTo(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
    return rect as O;
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
