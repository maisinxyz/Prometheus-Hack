import Phaser from 'phaser';
import { TrashItem } from './TrashItem';
import { TrashItemDef } from '../data/schemas/itemSchema';
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
      
      // Main Chassis (Yellow)
      gfx.fillStyle(0xfacc15, 1); // Bright industrial yellow
      gfx.fillRoundedRect(30, 80, 180, 130, 10);
      
      // Base / Treads (Dark Grey/Black)
      gfx.fillStyle(0x1f2937, 1);
      gfx.fillRoundedRect(10, 210, 220, 40, 5);
      
      // Treads inner wheels
      gfx.fillStyle(0x4b5563, 1);
      for (let i = 0; i < 5; i++) {
        gfx.fillCircle(40 + i * 40, 230, 12);
      }
      
      // Hopper (Dark Grey/Yellow)
      gfx.fillStyle(0xeab308, 1); // Slightly darker yellow
      gfx.beginPath();
      gfx.moveTo(20, 20);
      gfx.lineTo(200, 20);
      gfx.lineTo(150, 80);
      gfx.lineTo(60, 80);
      gfx.closePath();
      gfx.fillPath();
      
      // Hopper inner shadow
      gfx.fillStyle(0x374151, 1);
      gfx.beginPath();
      gfx.moveTo(35, 25);
      gfx.lineTo(185, 25);
      gfx.lineTo(145, 75);
      gfx.lineTo(65, 75);
      gfx.closePath();
      gfx.fillPath();

      // Conveyor Belt Output
      gfx.fillStyle(0x374151, 1); // Dark metal frame
      gfx.fillRect(170, 150, 70, 20);
      
      gfx.fillStyle(0x111827, 1); // Rubber belt
      gfx.fillRect(175, 145, 65, 30);
      
      // Crusher drum / gears exposed
      gfx.fillStyle(0x111827, 1); // Hole background
      gfx.fillCircle(110, 140, 40);
      
      // Gear / drum teeth
      gfx.fillStyle(0x9ca3af, 1); // Metal drum
      gfx.fillCircle(110, 140, 30);
      gfx.fillStyle(0x4b5563, 1); // Center axis
      gfx.fillCircle(110, 140, 10);
      
      // Hazard Stripes on Chassis
      gfx.fillStyle(0x000000, 1);
      for (let i = 0; i < 4; i++) {
        gfx.beginPath();
        gfx.moveTo(30 + i*40, 190);
        gfx.lineTo(50 + i*40, 190);
        gfx.lineTo(40 + i*40, 210);
        gfx.lineTo(20 + i*40, 210);
        gfx.closePath();
        gfx.fillPath();
      }
      
      // Generate the texture (Width 250, Height 260)
      gfx.generateTexture('machine_rock_crusher', 250, 260);
      gfx.destroy();
    }

    super(scene, x, y, 'machine_rock_crusher');
    scene.add.existing(this);
    
    // Scale it to fit well on screen 
    this.setScale(1.1); // Made larger per user request
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

    // Output zone is at the bottom-left, made it push out further to the left
    this.outputOffset = {
      x: -width * 0.8,
      y: height * 0.3
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
