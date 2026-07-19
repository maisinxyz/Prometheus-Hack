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
  private bins: Bin[] = [];
  
  // Game state

  private pourProgress = 0;
  private progressBar!: Phaser.GameObjects.Graphics;
  private mainItemSprite!: Phaser.GameObjects.Sprite;
  
  private activeChildren: TrashItem[] = [];

  constructor() {
    super({ key: 'SeparationMinigameScene' });
  }

  init(data: { item: TrashItem; onComplete: (success: boolean) => void }) {
    this.targetItem = data.item;
    this.onComplete = data.onComplete;
    this.bins = [];
    this.activeChildren = [];
    this.pourProgress = 0;
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
    const spacing = 200;
    const startX = counterX - (spacing * (binCount - 1)) / 2;

    for (let i = 0; i < binCount; i++) {
      const binDef = binDefs[i]!;
      const x = startX + i * spacing;
      const y = counterY - counterHeight/2 + 60;
      const bin = new Bin(this, x, y, binDef);
      this.bins.push(bin);
    }

    if (this.targetItem.itemDef.id === 'soda_can_full') {
      this.setupSodaMinigame(width, height);
    } else if (this.targetItem.itemDef.id === 'takeout_box_with_food') {
      this.setupFoodMinigame(width, height);
    }
  }

  private setupSodaMinigame(width: number, height: number) {
    this.add.text(width / 2, 130, 'Drag and hold over Landfill to empty, then recycle the can.', {
      fontFamily: 'Arial', fontSize: '24px', color: '#aaaaaa'
    }).setOrigin(0.5);

    // Center sprite
    this.mainItemSprite = this.add.sprite(width / 2, height / 2 + 100, this.targetItem.itemDef.spriteKey);
    this.mainItemSprite.setScale(2.0);
    this.mainItemSprite.setInteractive({ draggable: true });

    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(100);

    let isHoveringLandfill = false;
    let sodaEmptied = false;

    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
      gameObject.x = dragX;
      gameObject.y = dragY;

      if (!sodaEmptied) {
        const itemBounds = gameObject.getBounds();
        const landfillBin = this.bins.find(b => b.binDef.id === 'landfill');
        if (landfillBin && Phaser.Geom.Rectangle.Overlaps(itemBounds, landfillBin.getBounds())) {
          isHoveringLandfill = true;
        } else {
          isHoveringLandfill = false;
        }
      }
    });

    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
      isHoveringLandfill = false;
      
      if (sodaEmptied) {
        const itemBounds = gameObject.getBounds();
        
        let droppedBin: Bin | null = null;
        for (const bin of this.bins) {
          if (Phaser.Geom.Rectangle.Overlaps(itemBounds, bin.getBounds())) {
            droppedBin = bin;
            break;
          }
        }
        
        if (droppedBin) {
          if (droppedBin.binDef.id === 'plastic') {
            // Success!
            this.complete(true);
          } else {
            // Wrong bin!
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
      } else {
        // Snap back if not emptied
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
      if (isHoveringLandfill && !sodaEmptied) {
        this.pourProgress += delta / 1000; // 1 second to pour
        this.drawProgress(this.mainItemSprite);
        
        if (this.pourProgress >= 1.0) {
          sodaEmptied = true;
          isHoveringLandfill = false;
          this.progressBar.clear();
          
          // Change to empty can (aluminum_can)
          const allItems = this.registry.get('itemsData') as TrashItemDef[] || itemsData as TrashItemDef[];
          const emptyDef = allItems.find(d => d.id === 'aluminum_can');
          if (emptyDef) {
            this.mainItemSprite.setTexture(emptyDef.spriteKey);
          }
          
          // Shake effect
          this.cameras.main.shake(100, 0.01);
        }
      } else if (!sodaEmptied && this.pourProgress > 0) {
        this.pourProgress = Math.max(0, this.pourProgress - delta / 500); // drain fast
        this.drawProgress(this.mainItemSprite);
      }
    });
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
    this.add.text(width / 2, 130, 'Drag contents to appropriate bins, then sort the container.', {
      fontFamily: 'Arial', fontSize: '24px', color: '#aaaaaa'
    }).setOrigin(0.5);

    // Big container (not draggable yet)
    this.mainItemSprite = this.add.sprite(width / 2, height / 2 + 100, this.targetItem.itemDef.spriteKey);
    this.mainItemSprite.setScale(2.0);

    const allItems = this.registry.get('itemsData') as TrashItemDef[] || itemsData as TrashItemDef[];
    
    // Spawn food scraps
    const foodDef = allItems.find(d => d.id === 'food_scraps');
    if (foodDef) {
      for (let i = 0; i < 2; i++) {
        const fx = width / 2 + Phaser.Math.Between(-40, 40);
        const fy = height / 2 + 100 + Phaser.Math.Between(-40, 40);
        const scrap = new TrashItem(this, fx, fy, foodDef);
        this.activeChildren.push(scrap);
      }
    }
    
    // Random plastic lining
    if (Math.random() > 0.5) {
      const liningDef = allItems.find(d => d.id === 'plastic_lining');
      if (liningDef) {
        const lx = width / 2 + Phaser.Math.Between(-20, 20);
        const ly = height / 2 + 100 + Phaser.Math.Between(-20, 20);
        const lining = new TrashItem(this, lx, ly, liningDef);
        this.activeChildren.push(lining);
      }
    }
    
    // Setup drop detection for children
    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof TrashItem) {
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
            this.checkFoodMinigameProgress();
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
        // Container drag
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
          // Container's correct bin depends on what it became
          const sprite = gameObject as Phaser.GameObjects.Sprite;
          const correctId = (sprite.texture.key === 'item_plastic_container') ? 'plastic' : 'paper';
          if (targetBin.binDef.id === correctId) {
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

  private checkFoodMinigameProgress() {
    if (this.activeChildren.length === 0) {
      // All children removed, container becomes draggable
      this.mainItemSprite.setInteractive({ draggable: true });
      
      // Randomly turn into paper or plastic
      const isPaper = Math.random() > 0.5;
      const allItems = this.registry.get('itemsData') as TrashItemDef[] || itemsData as TrashItemDef[];
      
      const newDefId = isPaper ? 'paper_container' : 'plastic_container';
      const def = allItems.find(d => d.id === newDefId);
      if (def) {
        this.mainItemSprite.setTexture(def.spriteKey);
      }
      
      this.cameras.main.shake(100, 0.01);
    }
  }

  private complete(success: boolean) {
    this.onComplete(success);
    this.scene.stop();
  }
}
