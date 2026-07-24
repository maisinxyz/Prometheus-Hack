import Phaser from 'phaser';
import { TrashItemDef } from '../data/schemas/itemSchema';
import { gameEvents, GAME_EVENTS } from '../systems/GameEvents';
import { UI_THEME } from '../config/UITheme';

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

  /**
   * TASK 1.6: Guard flag to prevent double-processing of a single drop.
   * Set to true once handleDrop() processes this item. Any subsequent
   * dragend events on the same item will be ignored.
   */
  public processed: boolean = false;

  /** The lock-on reticle graphic shown during drag */
  private reticle: Phaser.GameObjects.Graphics | null = null;
  private reticleTween: Phaser.Tweens.Tween | null = null;

  /** Cluster B stub — see PRD Track G, step G.2 */
  public readonly componentIds: string[];

  private labelText: Phaser.GameObjects.Text;
  private visualCuesActive: boolean;
  private dropShadow: Phaser.GameObjects.Sprite;

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
    this.visualCuesActive = visualCuesActive;

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
    const targetScale = this.scaleX;

    // Set depth so items render above background
    this.setDepth(10);

    // --- F.4: Procedural Drop Shadow ---
    this.dropShadow = scene.add.sprite(x + 6, y + 8, itemDef.spriteKey);
    this.dropShadow.setScale(targetScale * 0.95);
    this.dropShadow.setTint(0x000000);
    this.dropShadow.setAlpha(0.35);
    this.dropShadow.setDepth(9); // Behind the main sprite

    // Add text label under the item
    this.labelText = scene.add.text(x, y + 50, itemDef.displayName, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.labelText.setOrigin(0.5);
    this.labelText.setDepth(12);

    // --- Pop-in Animation ---
    this.setScale(0);
    this.dropShadow.setScale(0);
    this.labelText.setScale(0);

    scene.tweens.add({
      targets: [this, this.labelText],
      scale: targetScale,
      duration: UI_THEME.popInDuration,
      ease: 'Back.easeOut'
    });
    
    scene.tweens.add({
      targets: this.dropShadow,
      scale: targetScale * 0.95,
      duration: UI_THEME.popInDuration,
      ease: 'Back.easeOut'
    });

    // --- E.4: Difficulty Tier Visual Cues ---
    if (this.visualCuesActive) {
      // Keep reticle always visible
      this.createReticle();
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
          // (Removed reticle per user request)
        }
      }
    );

    this.scene.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject === this) {
          this.setDepth(10); // Restore normal depth
          
          // Only destroy reticle if visual cues are NOT active
          if (!this.visualCuesActive) {
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
    if (this.labelText) {
      this.labelText.x = this.x;
      this.labelText.y = this.y + 50;
    }
    this.dropShadow.x = this.x + 6;
    this.dropShadow.y = this.y + 8;
  }

  /** Create the pulsing lock-on reticle graphic */
  private createReticle(): void {
    // Removed per user request
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

  /** Override setDepth to sync child elements like the shadow and text label */
  public override setDepth(value: number): this {
    super.setDepth(value);
    if (this.dropShadow) {
      this.dropShadow.setDepth(value - 1);
    }
    if (this.labelText) {
      this.labelText.setDepth(value + 2);
    }
    return this;
  }

  /** Clean up event listeners and graphics when this item is destroyed */
  destroy(fromScene?: boolean): void {
    this.destroyReticle();
    if (this.labelText) this.labelText.destroy();
    if (this.dropShadow) this.dropShadow.destroy();
    super.destroy(fromScene);
  }
}
