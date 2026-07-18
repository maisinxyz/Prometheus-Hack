import Phaser from 'phaser';
import { TrashItemDef } from '../data/schemas/itemSchema';
import { gameEvents, GAME_EVENTS } from '../systems/GameEvents';

/**
 * TrashItem — Draggable trash item sprite.
 * Per PRD Track B, steps B.1, B.3, B.4.
 *
 * Features:
 *   - Extends Phaser.GameObjects.Sprite
 *   - Stores itemDef for bin-matching logic
 *   - Draggable with smooth input tracking
 *   - Pulsing cyan lock-on reticle on drag-start (B.4)
 *   - Tracks drag start time for velocity scoring
 */
export class TrashItem extends Phaser.GameObjects.Sprite {
  public readonly itemDef: TrashItemDef;

  /** Position the item was in before the current drag (for snap-back) */
  public originX: number;
  public originY: number;

  /** Timestamp when the current drag started (for velocity scoring) */
  public dragStartTimeMs: number = 0;

  /** The lock-on reticle graphic shown during drag */
  private reticle: Phaser.GameObjects.Graphics | null = null;
  private reticleTween: Phaser.Tweens.Tween | null = null;

  /** Cluster B stub — see PRD Track G, step G.2 */
  public readonly componentIds: string[];

  constructor(scene: Phaser.Scene, x: number, y: number, itemDef: TrashItemDef) {
    super(scene, x, y, itemDef.spriteKey);

    this.itemDef = itemDef;
    this.originX = x;
    this.originY = y;
    this.componentIds = itemDef.componentIds;

    // Add to scene and enable drag input
    scene.add.existing(this);
    this.setInteractive({ draggable: true, useHandCursor: true });

    // Set display size to 128×128 (items are 256×256 source, displayed at half)
    this.setDisplaySize(128, 128);

    // Set depth so items render above background
    this.setDepth(10);

    // --- B.3: Drag input ---
    this.scene.input.on(
      'drag',
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number
      ) => {
        if (gameObject === this) {
          this.x = dragX;
          this.y = dragY;
          // Move reticle with item
          if (this.reticle) {
            this.reticle.x = dragX;
            this.reticle.y = dragY;
          }
        }
      }
    );

    // --- B.4: Lock-on reticle on drag-start ---
    this.scene.input.on(
      'dragstart',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject === this) {
          this.dragStartTimeMs = Date.now();
          this.originX = this.x;
          this.originY = this.y;
          this.setDepth(20); // Bring to front while dragging

          // Emit lock-on event
          gameEvents.emit(GAME_EVENTS.ITEM_LOCKED_ON, { item: this });

          // Create pulsing cyan reticle
          this.createReticle();
        }
      }
    );

    this.scene.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject === this) {
          this.setDepth(10); // Restore normal depth
          this.destroyReticle();
        }
      }
    );
  }

  /**
   * Cluster B stub — see PRD Track G, step G.2.
   * Currently always returns false. Future: implements item separation mechanic.
   */
  attemptSeparate(): boolean {
    // Cluster B not implemented — see PRD Section 3
    return false;
  }

  /** Create the pulsing lock-on reticle graphic */
  private createReticle(): void {
    const radius = this.displayWidth / 2 + 8;
    this.reticle = this.scene.add.graphics();
    this.reticle.lineStyle(3, 0x00ffff, 1.0);
    this.reticle.strokeCircle(0, 0, radius);
    this.reticle.x = this.x;
    this.reticle.y = this.y;
    this.reticle.setDepth(19); // Just behind the dragged item

    // Pulsing alpha tween: 0.4 ↔ 1.0, 500ms, yoyo repeat
    this.reticleTween = this.scene.tweens.add({
      targets: this.reticle,
      alpha: { from: 1.0, to: 0.4 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Destroy the lock-on reticle and its tween */
  private destroyReticle(): void {
    if (this.reticleTween) {
      this.reticleTween.destroy();
      this.reticleTween = null;
    }
    if (this.reticle) {
      this.reticle.destroy();
      this.reticle = null;
    }
  }

  /** Clean up event listeners when this item is destroyed */
  destroy(fromScene?: boolean): void {
    this.destroyReticle();
    super.destroy(fromScene);
  }
}
