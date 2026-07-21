import Phaser from 'phaser';
import { TrashItem } from '../entities/TrashItem';
import { Bin } from '../entities/Bin';
import binsData from '../data/bins.json';
import { BinDef } from '../data/schemas/binSchema';

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
    this.pourProgress = 0;
    this.isChecked = false;
    this.sodaEmptied = false;
    this.isInitiallyFull = false;
    this.isHoveringLandfill = false;
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
    const genericComposites = [
      'salad_in_plastic_bowl', 'soup_in_paper_cup', 'sandwich_in_wrapper', 
      'muffin_in_paper_liner', 'yogurt_with_granola', 'coffee_with_sleeve_lid', 
      'smoothie_cup_with_straw', 'bagel_in_paper_bag', 'pasta_in_takeout_box', 
      'tea_bag_in_cup', 'iced_tea_with_lemon',
      'paint_can_with_brush', 'nails_in_cardboard', 'insulation_in_plastic_wrap',
      'tile_in_paper_packaging', 'screws_in_plastic_bag', 'wood_with_nails',
      'caulk_tube_with_cap', 'pipe_in_styrofoam', 'lumber_in_shrink_wrap',
      'window_frame_with_glass',
      'hot_dog_in_foil', 'nachos_in_tray', 'soda_cup_with_straw',
      'fries_in_paper_cone', 'pretzel_in_bag', 'kebab_on_skewer_in_wrapper',
      'ice_cream_in_cup', 'water_bottle_with_label', 'cotton_candy_on_stick',
      'loaded_dog_in_box', 'popcorn_in_box', 'champagne_in_plastic', 'pill_bottle_with_cotton', 'syringe_in_wrapper', 'iv_bag_with_tube', 'bandaid_with_wrapper', 'thermometer_in_case', 'paint_tube_with_cap', 'sketchbook_with_spiral', 'easel_with_canvas', 'brush_in_jar', 'laptop_with_battery', 'takeout_sushi_container', 'boba_tea_cup', 'poke_bowl_container', 'takeout_salad_bowl', 'file_folder_with_cd', 'briefcase_with_lunch', 'business_card_holder', 'subway_sandwich_wrapper', 'pizza_slice_on_plate', 'deli_coffee_cup', 'headphones_in_case', 'halal_cart_platter', 'shopping_bag_with_receipt', 'disposable_camera_used', 'oversized_soda_cup', 'library_coffee_cup', 'magazine_in_plastic_sleeve', 'snack_box_with_crumbs', 'cd_audiobook', 'protein_shake_in_cup', 'gym_membership_packet', 'banana_with_peel', 'smoothie_cup_with_straw'
    ];

    if (isSoda) {
      this.isFanta = this.targetItem.itemDef.id.includes('fanta');
      this.isInitiallyFull = this.targetItem.itemDef.id.includes('full');
      this.setupSodaMinigame(width, height);
    } else if (this.targetItem.itemDef.id === 'foodbox_full' || this.targetItem.itemDef.id === 'foodbox_empty') {
      this.setupBoxMinigame(width, height);
    } else if (genericComposites.includes(this.targetItem.itemDef.id)) {
      this.setupGenericSeparationMinigame(width, height);
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

  private setupGenericSeparationMinigame(width: number, height: number) {
    const configMap: Record<string, {
      coreSpriteKey: string;
      coreTargetBin: string;
      components: { spriteKey: string; targetBin: string }[];
    }> = {
      'salad_in_plastic_bowl': {
        coreSpriteKey: 'item_salad_plastic_bowl', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_salad_scraps', targetBin: 'compost' }]
      },
      'soup_in_paper_cup': {
        coreSpriteKey: 'item_soup_paper_cup', coreTargetBin: 'compost',
        components: [{ spriteKey: 'item_soup_liquid', targetBin: 'compost' }]
      },
      'sandwich_in_wrapper': {
        coreSpriteKey: 'item_wax_wrapper', coreTargetBin: 'landfill',
        components: [{ spriteKey: 'item_sandwich_scraps', targetBin: 'compost' }]
      },
      'muffin_in_paper_liner': {
        coreSpriteKey: 'item_paper_liner', coreTargetBin: 'compost',
        components: [{ spriteKey: 'item_muffin_crumbs', targetBin: 'compost' }]
      },
      'yogurt_with_granola': {
        coreSpriteKey: 'item_yogurt_cup', coreTargetBin: 'plastic',
        components: [
          { spriteKey: 'item_granola', targetBin: 'compost' },
          { spriteKey: 'item_plastic_spoon', targetBin: 'plastic' }
        ]
      },
      'coffee_with_sleeve_lid': {
        coreSpriteKey: 'item_coffee_cup', coreTargetBin: 'compost',
        components: [
          { spriteKey: 'item_coffee_sleeve', targetBin: 'paper' },
          { spriteKey: 'item_coffee_cup_lid', targetBin: 'plastic' }
        ]
      },
      'smoothie_cup_with_straw': {
        coreSpriteKey: 'item_smoothie_cup', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_smoothie_straw', targetBin: 'landfill' }]
      },
      'bagel_in_paper_bag': {
        coreSpriteKey: 'item_bagel_paper_bag', coreTargetBin: 'paper',
        components: [{ spriteKey: 'item_bagel_scraps', targetBin: 'compost' }]
      },
      'pasta_in_takeout_box': {
        coreSpriteKey: 'item_takeout_container', coreTargetBin: 'plastic',
        components: [
          { spriteKey: 'item_pasta_scraps', targetBin: 'compost' },
          { spriteKey: 'item_takeout_fork', targetBin: 'plastic' }
        ]
      },
      'tea_bag_in_cup': {
        coreSpriteKey: 'item_tea_paper_cup', coreTargetBin: 'compost',
        components: [
          { spriteKey: 'item_used_tea_bag', targetBin: 'compost' },
          { spriteKey: 'item_tea_plastic_lid', targetBin: 'plastic' }
        ]
      },
      'iced_tea_with_lemon': {
        coreSpriteKey: 'item_iced_tea_cup', coreTargetBin: 'compost',
        components: [{ spriteKey: 'item_lemon_wedge', targetBin: 'compost' }]
      },
      'paint_can_with_brush': {
        coreSpriteKey: 'item_empty_paint_can', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_dried_paint_brush', targetBin: 'landfill' }]
      },
      'nails_in_cardboard': {
        coreSpriteKey: 'item_nail_box_cardboard', coreTargetBin: 'paper',
        components: [{ spriteKey: 'item_loose_nails', targetBin: 'plastic' }]
      },
      'insulation_in_plastic_wrap': {
        coreSpriteKey: 'item_insulation_piece', coreTargetBin: 'landfill',
        components: [{ spriteKey: 'item_insulation_plastic_wrap', targetBin: 'plastic' }]
      },
      'tile_in_paper_packaging': {
        coreSpriteKey: 'item_tile_piece', coreTargetBin: 'landfill',
        components: [{ spriteKey: 'item_tile_paper_wrap', targetBin: 'paper' }]
      },
      'screws_in_plastic_bag': {
        coreSpriteKey: 'item_metal_screws', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_screw_plastic_bag', targetBin: 'plastic' }]
      },
      'wood_with_nails': {
        coreSpriteKey: 'item_wood_plank', coreTargetBin: 'compost',
        components: [{ spriteKey: 'item_embedded_nails', targetBin: 'plastic' }]
      },
      'caulk_tube_with_cap': {
        coreSpriteKey: 'item_caulk_tube_body', coreTargetBin: 'landfill',
        components: [{ spriteKey: 'item_caulk_cap', targetBin: 'plastic' }]
      },
      'pipe_in_styrofoam': {
        coreSpriteKey: 'item_metal_pipe', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_pipe_styrofoam', targetBin: 'landfill' }]
      },
      'lumber_in_shrink_wrap': {
        coreSpriteKey: 'item_shrink_wrap_lumber', coreTargetBin: 'compost',
        components: [{ spriteKey: 'item_shrink_wrap_plastic', targetBin: 'plastic' }]
      },
      'window_frame_with_glass': {
        coreSpriteKey: 'item_window_frame_wood', coreTargetBin: 'compost',
        components: [{ spriteKey: 'item_window_glass', targetBin: 'landfill' }]
      },
      'hot_dog_in_foil': {
        coreSpriteKey: 'item_hot_dog_foil', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_hot_dog_scraps', targetBin: 'compost' }]
      },
      'nachos_in_tray': {
        coreSpriteKey: 'item_nacho_tray', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_nacho_scraps', targetBin: 'compost' }]
      },
      'soda_cup_with_straw': {
        coreSpriteKey: 'item_soda_paper_cup', coreTargetBin: 'compost',
        components: [{ spriteKey: 'item_soda_plastic_straw', targetBin: 'landfill' }]
      },
      'fries_in_paper_cone': {
        coreSpriteKey: 'item_paper_cone', coreTargetBin: 'compost',
        components: [{ spriteKey: 'item_fry_scraps', targetBin: 'compost' }]
      },
      'pretzel_in_bag': {
        coreSpriteKey: 'item_pretzel_plastic_bag', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_pretzel_leftover', targetBin: 'compost' }]
      },
      'kebab_on_skewer_in_wrapper': {
        coreSpriteKey: 'item_kebab_foil_wrapper', coreTargetBin: 'plastic',
        components: [
          { spriteKey: 'item_kebab_scraps', targetBin: 'compost' },
          { spriteKey: 'item_kebab_skewer', targetBin: 'compost' }
        ]
      },
      'ice_cream_in_cup': {
        coreSpriteKey: 'item_ice_cream_cup', coreTargetBin: 'plastic',
        components: [
          { spriteKey: 'item_melted_ice_cream', targetBin: 'compost' },
          { spriteKey: 'item_ice_cream_spoon', targetBin: 'plastic' }
        ]
      },
      'water_bottle_with_label': {
        coreSpriteKey: 'item_water_bottle_body', coreTargetBin: 'plastic',
        components: [{ spriteKey: 'item_bottle_paper_label', targetBin: 'paper' }]
      },
      'cotton_candy_on_stick': {
        coreSpriteKey: 'item_candy_stick', coreTargetBin: 'compost',
        components: [
          { spriteKey: 'item_cotton_candy_residue', targetBin: 'compost' },
          { spriteKey: 'item_candy_paper_cone', targetBin: 'compost' }
        ]
      },
      'loaded_dog_in_box': {
        coreSpriteKey: 'item_dog_cardboard_box', coreTargetBin: 'paper',
        components: [
          { spriteKey: 'item_loaded_dog_scraps', targetBin: 'compost' },
          { spriteKey: 'item_dog_wax_paper', targetBin: 'landfill' }
        ]
      }
    };

    const config = configMap[this.targetItem.itemDef.id];
    if (!config) {
      this.complete(false);
      return;
    }

    this.add.text(width / 2, 130, 'Tap to separate the items, then sort all pieces!', {
      fontFamily: 'Arial', fontSize: '24px', color: '#aaaaaa'
    }).setOrigin(0.5);

    this.mainItemSprite = this.add.sprite(width / 2, height / 2 + 100, this.targetItem.itemDef.spriteKey);
    this.mainItemSprite.setDepth(100);
    this.updateSpriteScale();
    this.mainItemSprite.setInteractive({ useHandCursor: true });

    this.checkText = this.add.text(width / 2, height - 50, 'Tap to separate components', {
      fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const activeComponentSprites: Phaser.GameObjects.Sprite[] = [];

    this.mainItemSprite.on('pointerdown', () => {
      if (!this.isChecked) {
        this.isChecked = true;
        this.checkText.setVisible(false);

        // Transform core sprite
        this.mainItemSprite.setTexture(config.coreSpriteKey);
        this.updateSpriteScale();

        // Spawn components
        config.components.forEach((comp, idx) => {
          const offsetX = (idx % 2 === 0 ? 1 : -1) * (150 + Math.floor(idx / 2) * 80);
          const offsetY = (idx % 2 === 0 ? 1 : -1) * 30;
          
          const s = this.add.sprite(width / 2 + offsetX, height / 2 + 100 + offsetY, comp.spriteKey);
          s.setDepth(150 + idx);
          s.setInteractive({ draggable: true });
          const origH = s.height;
          if (origH > 0) s.setScale(180 / origH);
          
          s.setData('isComponent', true);
          s.setData('targetBin', comp.targetBin);
          s.setData('startX', s.x);
          s.setData('startY', s.y);
          
          activeComponentSprites.push(s);
        });

        this.add.text(width / 2, height - 50, 'Drag all pieces to their correct bins!', {
          fontFamily: 'Arial', fontSize: '22px', color: '#22c55e', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(200);
      }
    });

    this.input.on('drag', (_p: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
      if (gameObject.getData('isComponent') || gameObject === this.mainItemSprite) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    });

    this.input.on('dragend', (_p: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
      const itemBounds = gameObject.getBounds();
      let droppedBin: Bin | null = null;
      for (const bin of this.bins) {
        if (Phaser.Geom.Rectangle.Overlaps(itemBounds, bin.getBounds())) {
          droppedBin = bin;
          break;
        }
      }

      if (gameObject.getData('isComponent')) {
        if (droppedBin) {
          if (droppedBin.binDef.id === gameObject.getData('targetBin')) {
            const idx = activeComponentSprites.indexOf(gameObject);
            if (idx > -1) activeComponentSprites.splice(idx, 1);
            gameObject.destroy();
            if (this.onScore) this.onScore(100, true);

            // If all components are cleared, make core sprite draggable
            if (activeComponentSprites.length === 0) {
              this.mainItemSprite.setInteractive({ useHandCursor: true });
              this.input.setDraggable(this.mainItemSprite, true);
            }
          } else {
            this.complete(false);
          }
        } else {
          this.tweens.add({ targets: gameObject, x: gameObject.getData('startX'), y: gameObject.getData('startY'), duration: 200 });
        }
      } else if (gameObject === this.mainItemSprite) {
        if (droppedBin) {
          if (activeComponentSprites.length > 0) {
            this.complete(false); // must clear components first
          } else if (droppedBin.binDef.id === config.coreTargetBin) {
            if (this.onScore) this.onScore(200, true);
            this.complete(true);
          } else {
            this.complete(false);
          }
        } else {
          this.tweens.add({ targets: gameObject, x: width / 2, y: height / 2 + 100, duration: 200 });
        }
      }
    });
  }

  private complete(success: boolean) {
    this.onComplete(success);
    this.scene.stop();
  }
}
