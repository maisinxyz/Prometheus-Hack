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

  // Box minigame state
  private boxFoodItems: Phaser.GameObjects.Sprite[] = [];
  private boxFoodIndex: number = 0;
  private readonly boxFoodSequence = [
    { spriteKey: 'chicken', boxAfter: 'foodbox2' },
    { spriteKey: 'watermelon', boxAfter: 'foodbox1' },
    { spriteKey: 'fries', boxAfter: 'foodboxplastic' }
  ];

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
    this.boxFoodItems = [];
    this.boxFoodIndex = 0;
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

    // (No counter drawn — bins are placed directly on the dark overlay)

    const binDefs = binsData as BinDef[];
    const binCount = binDefs.length;
    
    const isCafe = this.venueId === 'mackenzie_cafe';
    
    let binY = 0;
    let binScale = 1;
    let spacing = 280;

    if (!isCafe) {
      const counterY = height - 150;
      const counterHeight = 300;
      binY = counterY - counterHeight/2 + 60;
    } else {
      binY = 400;
      binScale = 0.5;
      spacing = 250;
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
    } else if (this.targetItem.itemDef.id === 'foodbox_full' || this.targetItem.itemDef.id === 'foodbox_empty') {
      this.setupBoxMinigame(width, height);
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

  private setupBoxMinigame(width: number, height: number) {
    this.isInitiallyFull = this.targetItem.itemDef.id === 'foodbox_full';

    // Center the main box sprite
    this.mainItemSprite = this.add.sprite(width / 2, height / 2 + 100, this.targetItem.itemDef.spriteKey);
    this.mainItemSprite.setDepth(100);
    this.updateSpriteScale();

    this.checkText = this.add.text(width / 2, height - 50, 'Press food box to check inside', {
      fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // If it's empty, clicking once reveals the empty box and the user can drag it to plastic
    if (!this.isInitiallyFull) {
      this.mainItemSprite.setInteractive({ draggable: true });

      this.mainItemSprite.on('pointerdown', () => {
        if (!this.isChecked) {
          this.isChecked = true;
          this.checkText.setVisible(false);
          this.mainItemSprite.setTexture('emptyfoodbox');
          this.updateSpriteScale();
          // Instructional text
          this.add.text(width / 2, height - 50, 'Box is empty! Drag to the Recycling bin.', {
            fontFamily: 'Arial', fontSize: '22px', color: '#22c55e', fontStyle: 'bold'
          }).setOrigin(0.5);
        }
      });

      // Drag the box sprite
      this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
        if (gameObject === this.mainItemSprite) {
          gameObject.x = dragX;
          gameObject.y = dragY;
          // Revert to foodbox texture while dragging away
          const startX = width / 2;
          const startY = height / 2 + 100;
          const dist = Phaser.Math.Distance.Between(startX, startY, dragX, dragY);
          if (this.isChecked && dist > 15) {
            const texKey = gameObject.texture.key;
            if (texKey === 'emptyfoodbox') {
              gameObject.setTexture('foodbox');
              this.updateSpriteScale();
            }
          }
        }
      });

      this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
        if (gameObject !== this.mainItemSprite) return;
        const itemBounds = gameObject.getBounds();
        let droppedBin: Bin | null = null;
        for (const bin of this.bins) {
          if (Phaser.Geom.Rectangle.Overlaps(itemBounds, bin.getBounds())) {
            droppedBin = bin;
            break;
          }
        }
        if (droppedBin) {
          if (!this.isChecked) {
            this.complete(false);
          } else if (droppedBin.binDef.id === 'plastic') {
            this.complete(true);
          } else {
            this.complete(false);
          }
        } else {
          this.tweens.add({ targets: gameObject, x: width / 2, y: height / 2 + 100, duration: 200 });
        }
      });
      return;
    }

    // ---- FULL BOX FLOW ----
    // The box is not draggable yet; user must first click to reveal contents
    this.mainItemSprite.setInteractive();

    // Click to open and reveal foodboxfull
    this.mainItemSprite.on('pointerdown', () => {
      if (!this.isChecked) {
        this.isChecked = true;
        this.checkText.setVisible(false);
        this.mainItemSprite.setTexture('foodboxfull');
        this.updateSpriteScale();

        this.boxFoodIndex = 0;
        this.boxFoodItems = [];

        // Show instruction
        this.add.text(width / 2, 130, 'Drag food items out of the box into the Compost bin!', {
          fontFamily: 'Arial', fontSize: '22px', color: '#aaaaaa'
        }).setOrigin(0.5);

        // Spawn the first food item
        this.spawnNextFoodItem(width, height);
      }
    });

    // Drag handler
    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
      // Food item dragging
      if (gameObject.getData('isBoxFood')) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
      // Main box dragging (final plastic stage)
      if (gameObject === this.mainItemSprite) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    });

    // Drop handler
    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
      if (gameObject.getData('isBoxFood')) {
        // Food sprite being dropped
        const itemBounds = gameObject.getBounds();
        const compostBin = this.bins.find(b => b.binDef.id === 'compost');
        if (compostBin && Phaser.Geom.Rectangle.Overlaps(itemBounds, compostBin.getBounds())) {
          // Correct! Destroy the food sprite and advance
          gameObject.destroy();
          if (this.onScore) {
            this.onScore(100, true);
          }

          // Update the box texture to the next stage
          const seq = this.boxFoodSequence[this.boxFoodIndex]!;
          this.mainItemSprite.setTexture(seq.boxAfter);
          this.updateSpriteScale();

          this.boxFoodIndex++;

          if (this.boxFoodIndex < this.boxFoodSequence.length) {
            // Spawn the next food item
            this.spawnNextFoodItem(width, height);
          } else {
            // All food removed! Box is now foodboxplastic, make it draggable
            this.mainItemSprite.setInteractive({ useHandCursor: true });
            this.input.setDraggable(this.mainItemSprite, true);
            this.add.text(width / 2, height - 50, 'Now drag the plastic container to the Recycling bin!', {
              fontFamily: 'Arial', fontSize: '22px', color: '#3b82f6', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(200);
          }
        } else {
          // Snap the food item back
          const sX = gameObject.getData('startX') as number;
          const sY = gameObject.getData('startY') as number;
          this.tweens.add({
            targets: gameObject,
            x: sX,
            y: sY,
            duration: 200
          });
        }
      } else if (gameObject === this.mainItemSprite) {
        // Main box being dropped (only valid in the final plastic stage)
        const itemBounds = gameObject.getBounds();
        let droppedBin: Bin | null = null;
        for (const bin of this.bins) {
          if (Phaser.Geom.Rectangle.Overlaps(itemBounds, bin.getBounds())) {
            droppedBin = bin;
            break;
          }
        }

        if (droppedBin) {
          if (this.boxFoodIndex < this.boxFoodSequence.length) {
            // Tried to recycle before removing all food
            this.complete(false);
          } else if (droppedBin.binDef.id === 'plastic') {
            // Successfully completed!
            if (this.onScore) {
              this.onScore(500, true);
            }
            this.complete(true);
          } else {
            this.complete(false);
          }
        } else {
          this.tweens.add({
            targets: gameObject,
            x: width / 2,
            y: height / 2 + 100,
            duration: 200
          });
        }
      }
    });
  }

  private spawnNextFoodItem(width: number, height: number) {
    if (this.boxFoodIndex >= this.boxFoodSequence.length) return;

    const seq = this.boxFoodSequence[this.boxFoodIndex]!;
    const foodSprite = this.add.sprite(
      width / 2,
      height / 2 + 100,
      seq.spriteKey
    );
    foodSprite.setDepth(150);
    foodSprite.setInteractive({ draggable: true });
    // Scale to a reasonable size
    const origH = foodSprite.height;
    if (origH > 0) foodSprite.setScale(180 / origH);
    foodSprite.setData('isBoxFood', true);
    foodSprite.setData('startX', foodSprite.x);
    foodSprite.setData('startY', foodSprite.y);
    this.boxFoodItems.push(foodSprite);
  }

  private complete(success: boolean) {
    this.onComplete(success);
    this.scene.stop();
  }
}
