import Phaser from 'phaser';
import { BinDef } from '../data/schemas/binSchema';
import { UI_THEME } from '../config/UITheme';

/**
 * Bin — Drop-target zone with visual sprite, floor contact shadow,
 * and dynamic environmental lighting projection.
 * Per PRD Track B, step B.2.
 */
export class Bin extends Phaser.GameObjects.Zone {
  public readonly binDef: BinDef;
  public readonly backSprite: Phaser.GameObjects.Sprite;
  public readonly frontSprite: Phaser.GameObjects.Sprite;
  public readonly shadowGraphics: Phaser.GameObjects.Graphics;
  public readonly glowGraphics: Phaser.GameObjects.Graphics;
  public readonly glossGraphics: Phaser.GameObjects.Graphics;
  public baseX: number;
  public baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, binDef: BinDef) {
    // Hitbox size for the bin opening (the 'hole')
    const zoneWidth = 180;
    const zoneHeight = 100;
    super(scene, x, y - 60, zoneWidth, zoneHeight); // Shift zone up to align with the visual hole

    this.binDef = binDef;
    this.baseX = x;
    this.baseY = y;

    // Add the zone to the scene
    scene.add.existing(this);

    // ── 1. Ground Contact Drop Shadow (Anchors bin to floor) ──
    this.shadowGraphics = scene.add.graphics({ x, y });
    this.shadowGraphics.fillStyle(0x000000, 0.45);
    this.shadowGraphics.fillEllipse(0, 75, 150, 45); // Dark ambient occlusion shadow under base
    this.shadowGraphics.fillStyle(0x000000, 0.25);
    this.shadowGraphics.fillEllipse(0, 80, 180, 55); // Soft outer shadow radius
    this.shadowGraphics.setDepth(23);

    // ── 2. Environmental Lighting & Distinguishable Category Glow ──
    this.glowGraphics = scene.add.graphics({ x, y });
    const colorInt = Phaser.Display.Color.HexStringToColor(binDef.color).color;
    
    // Category color halo around top opening for instant readability
    this.glowGraphics.fillStyle(colorInt, 0.22);
    this.glowGraphics.fillCircle(0, -60, 110);
    this.glowGraphics.fillStyle(colorInt, 0.35);
    this.glowGraphics.fillCircle(0, -60, 85);

    const venueId = (scene as any).venueId;

    // Projected Light Rays & Warm Ambient Cast
    if (venueId === 'mackenzie_cafe') {
      // Warm tungsten pendant light projection
      this.glowGraphics.fillStyle(0xFFDAB9, 0.18);
      this.glowGraphics.fillTriangle(-70, -120, 70, -120, 110, 90);
    } else if (venueId === 'nyc_hospital') {
      // Clinical overhead light cast
      this.glowGraphics.fillStyle(0x38BDF8, 0.15);
      this.glowGraphics.fillEllipse(0, 0, 140, 180);
    } else if (venueId === 'public_library') {
      // Warm library banker's light cast
      this.glowGraphics.fillStyle(0x22C55E, 0.15);
      this.glowGraphics.fillCircle(0, -50, 95);
    } else if (venueId === 'central_park') {
      // Soft afternoon sunlight cast
      this.glowGraphics.fillStyle(0xFDE047, 0.15);
      this.glowGraphics.fillTriangle(-90, -140, 50, -140, 90, 90);
    }

    this.glowGraphics.setDepth(24);

    // ── 3. Back Rim + Hole Sprite ──
    this.backSprite = scene.add.sprite(x, y, `bin_${binDef.id}_back`);
    this.backSprite.setDepth(25);

    // ── 4. Front Body Sprite with Per-Venue Thematic Tints ──
    this.frontSprite = scene.add.sprite(x, y, `bin_${binDef.id}_front`);
    this.frontSprite.setDepth(35);

    if (venueId === 'mackenzie_cafe') {
      // Warm oak & brass cafe motif tint
      this.frontSprite.setTint(0xffebd2);
      this.backSprite.setTint(0xffebd2);
    } else if (venueId === 'nyc_hospital') {
      // Sterile clinical stainless steel tint
      this.frontSprite.setTint(0xe2e8f0);
      this.backSprite.setTint(0xe2e8f0);
    } else if (venueId === 'public_library') {
      // Polished mahogany & brass library motif tint
      this.frontSprite.setTint(0xfff3e0);
      this.backSprite.setTint(0xfff3e0);
    } else if (venueId === 'central_park') {
      // Park cast-iron dark green motif tint
      this.frontSprite.setTint(0xf1f5f9);
      this.backSprite.setTint(0xf1f5f9);
    }

    // ── 5. Specular Lighting & Directional Gloss Highlight ──
    this.glossGraphics = scene.add.graphics({ x, y });
    this.glossGraphics.fillStyle(0xffffff, UI_THEME.glossHighlightAlpha);
    this.glossGraphics.beginPath();
    this.glossGraphics.moveTo(-20, -70);
    this.glossGraphics.lineTo(30, -70);
    this.glossGraphics.lineTo(-30, 80);
    this.glossGraphics.lineTo(-80, 80);
    this.glossGraphics.closePath();
    this.glossGraphics.fillPath();
    this.glossGraphics.setDepth(36);

    this.setDepth(25);
  }

  /**
   * Override setPosition to synchronize all bin components to the new (x, y) coordinates
   */
  setPosition(x: number, y?: number): this {
    const targetY = y ?? x;
    super.setPosition(x, targetY - 60);
    if (this.shadowGraphics) this.shadowGraphics.setPosition(x, targetY);
    if (this.glowGraphics) this.glowGraphics.setPosition(x, targetY);
    if (this.backSprite) this.backSprite.setPosition(x, targetY);
    if (this.frontSprite) this.frontSprite.setPosition(x, targetY);
    if (this.glossGraphics) this.glossGraphics.setPosition(x, targetY);
    return this;
  }

  /**
   * Returns the bounding rectangle of this bin's zone for overlap detection.
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
      targets: [this.backSprite, this.frontSprite, this.shadowGraphics, this.glowGraphics, this.glossGraphics],
      scaleX: this.backSprite.scaleX * 1.05,
      scaleY: this.backSprite.scaleY * 0.95,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  /**
   * Override setScale to apply to children sprites and shadow graphics as well
   */
  setScale(x: number, y?: number): this {
    super.setScale(x, y);
    const scaleY = y ?? x;
    this.backSprite.setScale(x, scaleY);
    this.frontSprite.setScale(x, scaleY);
    this.shadowGraphics.setScale(x, scaleY);
    this.glowGraphics.setScale(x, scaleY);
    this.glossGraphics.setScale(x, scaleY);
    return this;
  }

  /**
   * Override setVisible to apply to children sprites and shadow graphics as well
   */
  setVisible(value: boolean): this {
    super.setVisible(value);
    this.backSprite.setVisible(value);
    this.frontSprite.setVisible(value);
    this.shadowGraphics.setVisible(value);
    this.glowGraphics.setVisible(value);
    this.glossGraphics.setVisible(value);
    return this;
  }

  /** Clean up child objects */
  destroy(fromScene?: boolean): void {
    this.shadowGraphics.destroy();
    this.backSprite.destroy();
    this.frontSprite.destroy();
    this.glowGraphics.destroy();
    this.glossGraphics.destroy();
    super.destroy(fromScene);
  }
}
