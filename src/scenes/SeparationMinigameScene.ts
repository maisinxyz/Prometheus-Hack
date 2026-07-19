import Phaser from 'phaser';
import { TrashItem } from '../entities/TrashItem';
import { Bin } from '../entities/Bin';
import binsData from '../data/bins.json';
import { BinDef } from '../data/schemas/binSchema';
import itemsData from '../data/items.json';
import { TrashItemDef } from '../data/schemas/itemSchema';

export class SeparationMinigameScene extends Phaser.Scene {
  private targetItem!: TrashItem;
  private onComplete!: (success: boolean) => void;
  private onScore?: (points: number, isCorrect: boolean) => void;
  private venueId?: string;
  private bins: Bin[] = [];
  
  // Shared state
  private mainItemSprite!: Phaser.GameObjects.Sprite;
  private isChecked: boolean = false;
  
  // Soda state
  private pourProgress = 0;
  private progressBar!: Phaser.GameObjects.Graphics;
  private sodaEmptied = false;
  private isInitiallyFull = false;
  private isFanta = false;
  private isHoveringLandfill = false;
  private checkText!: Phaser.GameObjects.Text;
  
  // Food state
  private activeChildren: TrashItem[] = [];
  private foodStage: 'closed' | 'food' | 'lining' | 'done' = 'closed';

  constructor() {
    super({ key: 'SeparationMinigameScene' });
  }

  init(data: { item: TrashItem; onComplete: (success: boolean) => void; onScore?: (points: number, isCorrect: boolean) => void; venueId?: string }) {
    this.targetItem = data.item;
    this.onComplete = data.onComplete;
    this.onScore = data.onScore;
    this.venueId = data.venueId;
    this.bins = [];
    this.activeChildren = [];
    this.pourProgress = 0;
    this.isChecked = false;
    this.sodaEmptied = false;
    this.isInitiallyFull = false;
    this.isHoveringLandfill = false;
    this.foodStage = 'closed';
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Dark overlay
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    bg.setOrigin(0, 0);
    bg.setInteractive(); // Block clicks

    this.add.text(width / 2, 80, 'Separation Mode', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Draw a built-in counter to completely cover the foreground tables on the left
    const counterWidth = 900;
    const counterHeight = 450;
    const counterX = counterWidth / 2;
    const counterY = 1080 - counterHeight / 2;
    
    // Wood body
    this.add.rectangle(counterX, counterY, counterWidth, counterHeight, 0x2d1a11);
    
    // White top
    this.add.rectangle(counterX, counterY - counterHeight/2 + 60, counterWidth, 120, 0xeeeeee);

    // Front lip
    this.add.rectangle(counterX, counterY - counterHeight/2 + 120, counterWidth, 10, 0xcccccc);

    const binDefs = binsData as BinDef[];
    const binCount = binDefs.length;
    
    const isCafe = this.venueId === 'mackenzie_cafe';
    
    let binY = 0;
    let binScale = 1;
    let spacing = 200;

    if (!isCafe) {
      const counterY = height - 150;
      const counterHeight = 300;
      binY = counterY - counterHeight/2 + 60;
    } else {
      binY = 400;
      binScale = 0.5;
      spacing = 180;
    }

    const startX = (width / 2) - (spacing * (binCount - 1)) / 2;

    for (let i = 0; i < binCount; i++) {
      const binDef = binDefs[i]!;
      const x = startX + i * spacing;
      const bin = new Bin(this, x, binY, binDef);
      if (isCafe) {
        bin.setScale(binScale);
        bin.setDepth(1);
      }
      this.bins.push(bin);
    }

    const isSoda = ['soda_fanta_full', 'soda_pepsi_full', 'soda_fanta_empty', 'soda_pepsi_empty'].includes(this.targetItem.itemDef.id);
    if (isSoda) {
      this.isFanta = this.targetItem.itemDef.id.includes('fanta');
      this.isInitiallyFull = this.targetItem.itemDef.id.includes('full');
      this.setupSodaMinigame(width, height);
    } else if (this.targetItem.itemDef.id === 'takeout_box_with_food') {
      this.setupFoodMinigame(width, height);
    } else {
      // Fallback
      this.complete(false);
    }
  }

  private setupSodaMinigame(width: number, height: number) {
    this.add.text(width / 2, 130, 'Click to check if full. Empty it in Landfill, then recycle the can.', {
      fontFamily: 'Arial', fontSize: '24px', color: '#aaaaaa'
    }).setOrigin(0.5);

    // Center sprite
    this.mainItemSprite = this.add.sprite(width / 2, height / 2 + 100, this.targetItem.itemDef.spriteKey);
    this.mainItemSprite.setDepth(100);
    this.updateSpriteScale();
    // Allow dragging from the start so they can fail if they don't check
    this.mainItemSprite.setInteractive({ draggable: true });
    
    // Instructional text at the bottom
    this.checkText = this.add.text(width / 2, height - 50, 'Press soda can to check if soda is empty', {
      fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // If it's already empty, we consider it emptied
    this.sodaEmptied = !this.isInitiallyFull;

    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(100);

    // Click to check
    this.mainItemSprite.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
      // Phaser drag also triggers pointerdown, so we use a small delay or flag
      if (!this.isChecked) {
        this.isChecked = true;
        this.checkText.setVisible(false); // Hide instructional text after press
        if (this.isInitiallyFull) {
          this.mainItemSprite.setTexture(this.isFanta ? 'item_fanta_full' : 'item_pepsi_full');
        } else {
          this.mainItemSprite.setTexture('item_can_empty');
        }
        this.updateSpriteScale();
      }
    });

    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
      gameObject.x = dragX;
      gameObject.y = dragY;

      if (this.isChecked) {
        if (!this.sodaEmptied) {
          const itemBounds = gameObject.getBounds();
          const landfillBin = this.bins.find(b => b.binDef.id === 'landfill');
          if (landfillBin && Phaser.Geom.Rectangle.Overlaps(itemBounds, landfillBin.getBounds())) {
            if (!this.isHoveringLandfill) {
              this.isHoveringLandfill = true;
              this.mainItemSprite.setTexture(this.isFanta ? 'item_fanta_pour' : 'item_pepsi_pour');
              this.updateSpriteScale();
            }
          } else {
            if (this.isHoveringLandfill) {
              this.isHoveringLandfill = false;
              this.mainItemSprite.setTexture(this.isFanta ? 'item_fanta_can' : 'item_pepsi_can');
              this.updateSpriteScale();
            } else {
              // Revert sprite to the normal can when dragging around, 
              // but ONLY if actually dragged away from center to prevent click jitter instantly hiding the 'Full' sprite.
              const startX = width / 2;
              const startY = height / 2 + 100;
              const dist = Phaser.Math.Distance.Between(startX, startY, dragX, dragY);
              
              const texKey = this.mainItemSprite.texture.key;
              if (texKey.includes('full') && dist > 15) {
                this.mainItemSprite.setTexture(this.isFanta ? 'item_fanta_can' : 'item_pepsi_can');
                this.updateSpriteScale();
              }
            }
          }
        } else {
          // It's empty, but if dragged away, revert to the normal uncrushed SodaCan
          const startX = width / 2;
          const startY = height / 2 + 100;
          const dist = Phaser.Math.Distance.Between(startX, startY, dragX, dragY);
          
          const texKey = this.mainItemSprite.texture.key;
          if (texKey === 'item_can_empty' && dist > 15) {
            this.mainItemSprite.setTexture(this.isFanta ? 'item_fanta_can' : 'item_pepsi_can');
            this.updateSpriteScale();
          }
        }
      }
    });

    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
      this.isHoveringLandfill = false;
      if (!this.sodaEmptied && this.isInitiallyFull) {
        // Revert sprite if we were pouring
        const texKey = this.mainItemSprite.texture.key;
        if (texKey.includes('pour')) {
          this.mainItemSprite.setTexture(this.isFanta ? 'item_fanta_can' : 'item_pepsi_can');
          this.updateSpriteScale();
        }
      }
      
      const itemBounds = gameObject.getBounds();
      let droppedBin: Bin | null = null;
      for (const bin of this.bins) {
        if (Phaser.Geom.Rectangle.Overlaps(itemBounds, bin.getBounds())) {
          droppedBin = bin;
          break;
        }
      }
      
      if (droppedBin) {
        if (!this.isChecked || !this.sodaEmptied) {
          // Disposed before doing extra stuff -> fail
          this.complete(false);
        } else if (droppedBin.binDef.id === 'plastic') {
          // Emptied and placed in recycling (plastic bin acts as recycling here)
          this.complete(true);
        } else {
          // Wrong bin after emptying!
          this.complete(false);
        }
      } else {
        // Snap back
        this.tweens.add({
          targets: gameObject,
          x: width / 2,
          y: height / 2 + 100,
          duration: 200
        });
      }
    });

    // Update loop for pouring
    this.events.on('update', (_time: number, delta: number) => {
      if (this.isHoveringLandfill && !this.sodaEmptied) {
        this.pourProgress += delta / 3000; // 3 seconds to pour
        this.drawProgress(this.mainItemSprite);
        
        if (this.pourProgress >= 1.0) {
          this.sodaEmptied = true;
          this.isHoveringLandfill = false;
          this.progressBar.clear();
          
          if (this.onScore) {
            this.onScore(200, true);
          }
          
          // Change to empty can
          this.mainItemSprite.setTexture('item_can_empty');
          this.updateSpriteScale();
        }
      } else if (!this.sodaEmptied && this.pourProgress > 0) {
        this.pourProgress = Math.max(0, this.pourProgress - delta / 500); // drain fast
        this.drawProgress(this.mainItemSprite);
      }
    });
  }

  private updateSpriteScale() {
    if (!this.mainItemSprite || !this.mainItemSprite.texture) return;
    // Reset to scale 1 to measure original height correctly
    this.mainItemSprite.setScale(1);
    const originalHeight = this.mainItemSprite.height;
    if (originalHeight > 0) {
      // Force all items to have the exact same height on screen (e.g. 350px)
      const targetHeight = 350;
      this.mainItemSprite.setScale(targetHeight / originalHeight);
    }
  }

  private drawProgress(sprite: Phaser.GameObjects.Sprite) {
    this.progressBar.clear();
    if (this.pourProgress > 0) {
      const x = sprite.x - 50;
      const y = sprite.y - 100;
      this.progressBar.fillStyle(0x000000, 0.5);
      this.progressBar.fillRect(x, y, 100, 10);
      this.progressBar.fillStyle(0x3b82f6, 1);
      this.progressBar.fillRect(x, y, 100 * this.pourProgress, 10);
    }
  }

  private setupFoodMinigame(width: number, height: number) {
    this.add.text(width / 2, 130, 'Click container to open. Sort contents, then sort container.', {
      fontFamily: 'Arial', fontSize: '24px', color: '#aaaaaa'
    }).setOrigin(0.5);

    // Big container
    this.mainItemSprite = this.add.sprite(width / 2, height / 2 + 100, this.targetItem.itemDef.spriteKey);
    this.mainItemSprite.setScale(0.7);
    // Draggable initially so they fail if they throw it away early
    this.mainItemSprite.setInteractive({ draggable: true });

    // Click to open container
    this.mainItemSprite.on('pointerdown', () => {
      if (this.foodStage === 'closed') {
        this.foodStage = 'food';
        this.isChecked = true;
        
        // Prevent dragging the container while sorting contents
        this.input.setDraggable(this.mainItemSprite, false);

        const allItems = this.registry.get('itemsData') as TrashItemDef[] || itemsData as TrashItemDef[];
        const foodDef = allItems.find(d => d.id === 'food_scraps');
        
        // Spawn 1-4 food scraps
        const amount = Phaser.Math.Between(1, 4);
        if (foodDef) {
          for (let i = 0; i < amount; i++) {
            const fx = width / 2 + Phaser.Math.Between(-60, 60);
            const fy = height / 2 + 100 + Phaser.Math.Between(-60, 60);
            const scrap = new TrashItem(this, fx, fy, foodDef);
            // Disable shadow and cues for minigame children to look cleaner
            this.activeChildren.push(scrap);
          }
        }
      }
    });
    
    // Setup drop detection for ALL items
    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof TrashItem) {
        // Child item drop
        const itemBounds = gameObject.getBounds();
        let targetBin: Bin | null = null;
        for (const bin of this.bins) {
          if (Phaser.Geom.Rectangle.Overlaps(itemBounds, bin.getBounds())) {
            targetBin = bin;
            break;
          }
        }
        
        if (targetBin) {
          if (targetBin.binDef.id === gameObject.itemDef.correctBinId) {
            // Correct drop
            const idx = this.activeChildren.indexOf(gameObject);
            if (idx > -1) this.activeChildren.splice(idx, 1);
            gameObject.destroy();
            this.checkFoodMinigameProgress(width, height);
          } else {
            // Wrong drop penalty
            this.complete(false); // Instantly fail the mini-game
          }
        } else {
          // Snap back
          this.tweens.add({
            targets: gameObject,
            x: gameObject.startX,
            y: gameObject.startY,
            duration: 200,
            onUpdate: () => gameObject.syncAttachments()
          });
        }
      } else if (gameObject === this.mainItemSprite) {
        // Container drop
        const sprite = gameObject as Phaser.GameObjects.Sprite;
        const itemBounds = sprite.getBounds();
        let targetBin: Bin | null = null;
        for (const bin of this.bins) {
          if (Phaser.Geom.Rectangle.Overlaps(itemBounds, bin.getBounds())) {
            targetBin = bin;
            break;
          }
        }
        
        if (targetBin) {
          if (this.foodStage !== 'done') {
            // Container dropped before fully emptied/sorted
            this.complete(false);
          } else {
            // Only valid if foodStage == 'done' and correct bin (paper)
            if (targetBin.binDef.id === 'paper') {
              this.complete(true);
            } else {
              this.complete(false);
            }
          }
        } else {
          // Snap back
          this.tweens.add({
            targets: gameObject,
            x: width / 2,
            y: height / 2 + 100,
            duration: 200
          });
        }
      }
    });

    // Handle drag for main container
    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
      if (gameObject === this.mainItemSprite) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    });
  }

  private checkFoodMinigameProgress(width: number, height: number) {
    if (this.activeChildren.length === 0) {
      if (this.foodStage === 'food') {
        // Food sorted, now spawn plastic lining
        this.foodStage = 'lining';
        const allItems = this.registry.get('itemsData') as TrashItemDef[] || itemsData as TrashItemDef[];
        const liningDef = allItems.find(d => d.id === 'plastic_lining');
        if (liningDef) {
          const lx = width / 2;
          const ly = height / 2 + 100;
          const lining = new TrashItem(this, lx, ly, liningDef);
          this.activeChildren.push(lining);
        }
      } else if (this.foodStage === 'lining') {
        // Lining sorted, now container is ready
        this.foodStage = 'done';
        this.input.setDraggable(this.mainItemSprite, true);
        
        const allItems = this.registry.get('itemsData') as TrashItemDef[] || itemsData as TrashItemDef[];
        const paperDef = allItems.find(d => d.id === 'paper_container');
        if (paperDef) {
          this.mainItemSprite.setTexture(paperDef.spriteKey);
        }
      }
    }
  }

  private complete(success: boolean) {
    this.onComplete(success);
    this.scene.stop();
  }
}
