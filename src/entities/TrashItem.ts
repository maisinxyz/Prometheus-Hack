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
  public startX: number;
  public startY: number;

  /** Timestamp when the current drag started (for velocity scoring) */
  public dragStartTimeMs: number = 0;

  /** The lock-on reticle graphic shown during drag */
  private reticle: Phaser.GameObjects.Graphics | null = null;
  private reticleTween: Phaser.Tweens.Tween | null = null;

  /** Cluster B stub — see PRD Track G, step G.2 */
  public readonly componentIds: string[];

  private hintText: Phaser.GameObjects.Text | null = null;
  private dropShadow: Phaser.GameObjects.Sprite;
  private highlightGraphics: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    itemDef: TrashItemDef,
    visualCuesActive: boolean = false
  ) {
    super(scene, x, y, itemDef.spriteKey);

    this.itemDef = itemDef;
    this.startX = x;
    this.startY = y;
    this.componentIds = itemDef.componentIds;

    // Add to scene and enable drag input
    scene.add.existing(this);
    this.setInteractive({ draggable: true, useHandCursor: true });

    // Scale proportionally so the largest dimension is 80
    if (this.width > this.height) {
      this.displayWidth = 80;
      this.scaleY = this.scaleX;
    } else {
      this.displayHeight = 80;
      this.scaleX = this.scaleY;
    }

    // Set depth so items render above background
    this.setDepth(10);

    // --- F.4: Procedural Drop Shadow ---
    this.dropShadow = scene.add.sprite(x + 6, y + 8, itemDef.spriteKey);
    this.dropShadow.setScale(this.scaleX * 0.95, this.scaleY * 0.95);
    this.dropShadow.setTint(0x000000);
    this.dropShadow.setAlpha(0.35);
    this.dropShadow.setDepth(9); // Behind the main sprite

    // --- F.5: Subtle Shading/Highlight Pass ---
    // A small semi-transparent white radial gradient at top-left
    this.highlightGraphics = scene.add.graphics();
    this.highlightGraphics.fillStyle(0xffffff, 0.2);
    this.highlightGraphics.fillCircle(-25, -25, 20);
    this.highlightGraphics.fillStyle(0xffffff, 0.1);
    this.highlightGraphics.fillCircle(-25, -25, 30);
    this.highlightGraphics.setDepth(11); // Above the main sprite
    this.highlightGraphics.x = x;
    this.highlightGraphics.y = y;

    // --- E.4: Difficulty Tier Visual Cues ---
    if (visualCuesActive) {
      // Keep reticle always visible
      this.createReticle();
      
      // Add text label hint under the item
      this.hintText = scene.add.text(x, y + 70, itemDef.correctBinId.toUpperCase(), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      });
      this.hintText.setOrigin(0.5);
      this.hintText.setDepth(12);
    }

    // --- Cluster B: Click detection ---
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.setData('downX', pointer.x);
      this.setData('downY', pointer.y);
    });

    this.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const downX = this.getData('downX');
      const downY = this.getData('downY');
      
      if (downX !== undefined && downY !== undefined) {
        const dist = Phaser.Math.Distance.Between(downX, downY, pointer.x, pointer.y);
        // If moved less than 10 pixels, treat as a click
        if (dist < 10) {
          gameEvents.emit(GAME_EVENTS.ITEM_CLICKED, { item: this });
        }
      }
      this.setData('downX', undefined);
      this.setData('downY', undefined);
    });

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
          this.syncAttachments();
        }
      }
    );

    // --- B.4: Lock-on reticle on drag-start ---
    this.scene.input.on(
      'dragstart',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject === this) {
          this.dragStartTimeMs = Date.now();
          this.startX = this.x;
          this.startY = this.y;
          this.setDepth(20); // Bring to front while dragging

          // Emit lock-on event
          gameEvents.emit(GAME_EVENTS.ITEM_LOCKED_ON, { item: this });

          // Create pulsing cyan reticle if not already active from visualCuesActive
          if (!this.reticle) {
            this.createReticle();
          }
        }
      }
    );

    this.scene.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject === this) {
          this.setDepth(10); // Restore normal depth
          
          // Only destroy reticle if visual cues are NOT active (hintText tracks this)
          if (!this.hintText) {
            this.destroyReticle();
          }
        }
      }
    );
  }

  /**
   * Stub for PRD Section 3, Cluster B (composite item separation).
   * Intended to be called when the user performs a drag-to-separate gesture.
   */
  attemptSeparate(): boolean {
    console.log("Cluster B not implemented — see PRD Section 3");
    return false;
  }

  /** Sync visual attachments (shadow, highlight, reticle) to current sprite position */
  public syncAttachments(): void {
    if (this.reticle) {
      this.reticle.x = this.x;
      this.reticle.y = this.y;
    }
    if (this.hintText) {
      this.hintText.x = this.x;
      this.hintText.y = this.y + 70;
    }
    this.dropShadow.x = this.x + 6;
    this.dropShadow.y = this.y + 8;
    this.highlightGraphics.x = this.x;
    this.highlightGraphics.y = this.y;
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

  /** Clean up event listeners and graphics when this item is destroyed */
  destroy(fromScene?: boolean): void {
    this.destroyReticle();
    if (this.hintText) this.hintText.destroy();
    if (this.dropShadow) this.dropShadow.destroy();
    if (this.highlightGraphics) this.highlightGraphics.destroy();
    super.destroy(fromScene);
  }
}
