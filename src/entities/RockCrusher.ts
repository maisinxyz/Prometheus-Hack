import Phaser from 'phaser';
import { TrashItem } from './TrashItem';
import { TrashItemDef } from '../data/schemas/itemSchema';
import { gameEvents, GAME_EVENTS } from '../systems/GameEvents';
import itemsData from '../data/items.json';

export class RockCrusher extends Phaser.GameObjects.Sprite {
  // Define input and output zones relative to the crusher's center
  public inputZone: Phaser.Geom.Rectangle;
  public outputOffset: { x: number; y: number };
  
  private isCrushing: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Generate a procedural texture if the image isn't available
    if (!scene.textures.exists('machine_rock_crusher')) {
      const gfx = scene.make.graphics({ x: 0, y: 0, add: false });
      // Machine body
      gfx.fillStyle(0x2563eb, 1); // Blue
      gfx.fillRect(0, 40, 200, 180);
      // Funnel (red trapezoid)
      gfx.fillStyle(0xdc2626, 1);
      gfx.fillRect(20, 0, 160, 50);
      gfx.fillRect(40, 0, 120, 10);
      // Base (black)
      gfx.fillStyle(0x1a1a1a, 1);
      gfx.fillRect(0, 220, 200, 30);
      // Wheel (gray circle)
      gfx.fillStyle(0x6b7280, 1);
      gfx.fillCircle(160, 130, 40);
      gfx.fillStyle(0x374151, 1);
      gfx.fillCircle(160, 130, 15);
      // Label
      gfx.generateTexture('machine_rock_crusher', 200, 250);
      gfx.destroy();
    }

    super(scene, x, y, 'machine_rock_crusher');
    scene.add.existing(this);
    
    // Scale it to fit well on screen (MacBook Air M2: 2560x1664 native, 1920x1080 game canvas)
    this.setScale(0.4);
    this.setDepth(50);
    
    // Calculate the input zone (top funnel area)
    const width = this.displayWidth;
    const height = this.displayHeight;
    
    // Funnel is the top area
    this.inputZone = new Phaser.Geom.Rectangle(
      this.x - width * 0.4, 
      this.y - height * 0.5, 
      width * 0.8, 
      height * 0.35
    );

    // Output zone is at the bottom-left
    this.outputOffset = {
      x: -width * 0.2,
      y: height * 0.4
    };
  }

  /** Update the input zone if the crusher moves */
  public updateZone(): void {
    const width = this.displayWidth;
    const height = this.displayHeight;
    
    this.inputZone.setTo(
      this.x - width * 0.4, 
      this.y - height * 0.5, 
      width * 0.5, 
      height * 0.3
    );
  }

  /** Check if the item intersects with the input zone */
  public intersectsInput(x: number, y: number): boolean {
    return Phaser.Geom.Rectangle.Contains(this.inputZone, x, y);
  }

  /** Check if this machine accepts this item */
  public acceptsItem(item: TrashItem): boolean {
    return item.itemDef.spriteKey === 'brick' || item.itemDef.spriteKey === 'rock';
  }

  /** Crush the item and spawn the shattered version */
  public crushItem(
    item: TrashItem, 
    onComplete: (newItemDef: TrashItemDef, spawnX: number, spawnY: number) => void
  ): void {
    if (this.isCrushing) return;
    this.isCrushing = true;

    // Visual feedback: shake the machine
    this.scene.tweens.add({
      targets: this,
      x: this.x + 5,
      y: this.y + 5,
      yoyo: true,
      repeat: 5,
      duration: 50,
      onComplete: () => {
        this.x -= 5; // Reset position
        this.y -= 5;
        this.isCrushing = false;
        
        // Find the rockshattered item definition
        // In the data, rockshattered is mapped to 'concrete_chunk' which uses 'rockshattered' spriteKey
        const shatteredDef = itemsData.find(d => d.id === 'concrete_chunk');
        
        if (shatteredDef) {
          onComplete(shatteredDef, this.x + this.outputOffset.x, this.y + this.outputOffset.y);
        }
      }
    });
    
    // Destroy the original item visually immediately
    item.destroy();
  }
}
