import Phaser from 'phaser';
import venuesData from '../data/venues.json';
import itemsData from '../data/items.json';

export class SpritesScene extends Phaser.Scene {
  private currentVenueIndex: number = 0;
  private containerGroup?: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'SpritesScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    
    // Background
    this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);

    // Title
    const title = this.add.text(width / 2, 80, 'SPRITES GALLERY', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    // Back Button
    const backBtnBg = this.add.rectangle(0, 0, 200, 60, 0xef4444, 1);
    backBtnBg.setStrokeStyle(4, 0xffffff);
    const backBtnText = this.add.text(0, 0, 'BACK', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const backBtn = this.add.container(150, 80, [backBtnBg, backBtnText]);
    backBtn.setSize(200, 60);
    backBtn.setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerover', () => backBtnBg.setFillStyle(0xdc2626));
    backBtn.on('pointerout', () => backBtnBg.setFillStyle(0xef4444));
    backBtn.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });

    // Navigation buttons
    const prevBtnBg = this.add.rectangle(0, 0, 200, 60, 0x3b82f6, 1).setStrokeStyle(4, 0xffffff);
    const prevBtnText = this.add.text(0, 0, '< PREV LEVEL', { fontFamily: '"Nunito", sans-serif', fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const prevBtn = this.add.container(width / 2 - 300, 180, [prevBtnBg, prevBtnText]);
    prevBtn.setSize(200, 60).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerdown', () => this.changePage(-1));

    const nextBtnBg = this.add.rectangle(0, 0, 200, 60, 0x3b82f6, 1).setStrokeStyle(4, 0xffffff);
    const nextBtnText = this.add.text(0, 0, 'NEXT LEVEL >', { fontFamily: '"Nunito", sans-serif', fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const nextBtn = this.add.container(width / 2 + 300, 180, [nextBtnBg, nextBtnText]);
    nextBtn.setSize(200, 60).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.changePage(1));

    this.containerGroup = this.add.group();
    
    this.renderCurrentVenue();
  }

  private changePage(delta: number) {
    this.currentVenueIndex += delta;
    if (this.currentVenueIndex < 0) {
      this.currentVenueIndex = venuesData.length - 1;
    } else if (this.currentVenueIndex >= venuesData.length) {
      this.currentVenueIndex = 0;
    }
    this.renderCurrentVenue();
  }

  private renderCurrentVenue() {
    this.containerGroup?.clear(true, true);
    const { width, height } = this.scale;

    const venue = venuesData[this.currentVenueIndex];

    const subtitle = this.add.text(width / 2, 180, venue.displayName, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '48px',
      color: '#facc15',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.containerGroup?.add(subtitle);

    const startX = 400;
    const startY = 350;
    const cols = 5;
    const spacingX = 280;
    const spacingY = 280;

    let row = 0;
    let col = 0;

    venue.itemPoolIds.forEach((itemId: string) => {
      const itemDef = itemsData.find((i: any) => i.id === itemId);
      if (itemDef) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;

        const sprite = this.add.sprite(x, y, itemDef.spriteKey);
        // Scale sprite down if it's too big
        const maxDim = Math.max(sprite.width, sprite.height);
        if (maxDim > 150) {
          sprite.setScale(150 / maxDim);
        }
        
        const label = this.add.text(x, y + 100, itemDef.displayName, {
          fontFamily: '"Nunito", sans-serif',
          fontSize: '18px',
          color: '#ffffff',
          wordWrap: { width: 220, useAdvancedWrap: true },
          align: 'center'
        }).setOrigin(0.5, 0);

        this.containerGroup?.add(sprite);
        this.containerGroup?.add(label);

        col++;
        if (col >= cols) {
          col = 0;
          row++;
        }
      }
    });
  }
}
