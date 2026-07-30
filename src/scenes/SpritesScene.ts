import Phaser from 'phaser';
import binsData from '../data/bins.json';
import itemsData from '../data/items.json';
import venuesData from '../data/venues.json';
import { metaGameController } from '../systems/MetaGameController';

export class SpritesScene extends Phaser.Scene {
  private currentVenueIndex: number = 0;
  private containerGroup?: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'SpritesScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    
    // Background - Deep Slate for a premium look
    this.add.rectangle(0, 0, width, height, 0x0f172a).setOrigin(0);

    // Subtle atmospheric gradient at the top
    const topGlow = this.add.graphics();
    topGlow.fillGradientStyle(0x1e293b, 0x1e293b, 0x0f172a, 0x0f172a, 1, 1, 1, 1);
    topGlow.fillRect(0, 0, width, 400);

    // Header Panel
    const headerPanel = this.add.graphics();
    headerPanel.fillStyle(0x1e293b, 0.8);
    headerPanel.fillRoundedRect(width / 2 - 400, 40, 800, 100, 16);

    // Title
    const title = this.add.text(width / 2, 90, 'WASTE ENCYCLOPEDIA', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '42px',
      color: '#f8fafc',
      fontStyle: '800'
    }).setOrigin(0.5);
    title.setLetterSpacing(2);

    // Back Button (Sleek minimalist style)
    const backBtnBg = this.add.rectangle(0, 0, 160, 50, 0x334155, 1);
    backBtnBg.setStrokeStyle(2, 0x475569);
    const backBtnText = this.add.text(0, 0, '← BACK', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '20px',
      color: '#cbd5e1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const backBtn = this.add.container(120, 90, [backBtnBg, backBtnText]);
    backBtn.setSize(160, 50);
    backBtn.setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerover', () => {
      backBtnBg.setFillStyle(0x475569);
      backBtnText.setColor('#ffffff');
    });
    backBtn.on('pointerout', () => {
      backBtnBg.setFillStyle(0x334155);
      backBtnText.setColor('#cbd5e1');
    });
    backBtn.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });

    // Navigation buttons
    const prevBtnBg = this.add.rectangle(0, 0, 240, 60, 0x1e293b, 1).setStrokeStyle(2, 0x334155);
    const prevBtnText = this.add.text(0, 0, '◄ PREV LEVEL', { fontFamily: '"Nunito", sans-serif', fontSize: '20px', color: '#94a3b8', fontStyle: 'bold' }).setOrigin(0.5);
    const prevBtn = this.add.container(width / 2 - 500, 220, [prevBtnBg, prevBtnText]);
    prevBtn.setSize(240, 60).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerover', () => prevBtnBg.setFillStyle(0x334155));
    prevBtn.on('pointerout', () => prevBtnBg.setFillStyle(0x1e293b));
    prevBtn.on('pointerdown', () => this.changePage(-1));

    const nextBtnBg = this.add.rectangle(0, 0, 240, 60, 0x1e293b, 1).setStrokeStyle(2, 0x334155);
    const nextBtnText = this.add.text(0, 0, 'NEXT LEVEL ►', { fontFamily: '"Nunito", sans-serif', fontSize: '20px', color: '#94a3b8', fontStyle: 'bold' }).setOrigin(0.5);
    const nextBtn = this.add.container(width / 2 + 500, 220, [nextBtnBg, nextBtnText]);
    nextBtn.setSize(240, 60).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerover', () => nextBtnBg.setFillStyle(0x334155));
    nextBtn.on('pointerout', () => nextBtnBg.setFillStyle(0x1e293b));
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
    const { width } = this.scale;

    const venue = venuesData[this.currentVenueIndex]!;
    
    // Create a map of bin colors
    const binColorMap: Record<string, number> = {};
    const binNameMap: Record<string, string> = {};
    for (const bin of binsData) {
      binColorMap[bin.id] = parseInt(bin.color.replace('#', '0x'), 16);
      binNameMap[bin.id] = bin.displayName;
    }

    // Dynamic Header for Venue
    const headerColor = 0x3b82f6; // Default to a nice blue for levels
    const venueHeaderBg = this.add.rectangle(width / 2, 220, 600, 80, headerColor, 0.15).setStrokeStyle(2, headerColor, 0.5);
    this.containerGroup?.add(venueHeaderBg);

    const subtitle = this.add.text(width / 2, 220, venue.displayName.toUpperCase(), {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '36px',
      color: '#60a5fa',
      fontStyle: '900'
    }).setOrigin(0.5);
    subtitle.setLetterSpacing(4);
    this.containerGroup?.add(subtitle);

    const cols = 5;
    const spacingX = 240;
    const spacingY = 260;
    
    // Need to center the items based on how many there are.
    const totalItems = venue.itemPoolIds.length;
    
    // We'll calculate the startX for each row later, just set startY
    const startY = 380;

    let row = 0;
    let col = 0;

    venue.itemPoolIds.forEach((itemId: string) => {
      const itemDef = itemsData.find((i: any) => i.id === itemId);
      if (!itemDef) return;

      const itemsInThisRow = Math.min(cols, totalItems - (row * cols));
      const startX = (width - ((itemsInThisRow - 1) * spacingX)) / 2;

      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      
      const binColorNum = binColorMap[itemDef.correctBinId] || 0xffffff;

      // Item Card Background
      const card = this.add.rectangle(x, y + 20, 200, 220, 0x1e293b, 1).setStrokeStyle(1, 0x334155);
      this.containerGroup?.add(card);

      const hasEncountered = metaGameController.encounteredItemsSystem.hasEncountered(itemDef.id);

      const sprite = this.add.sprite(x, y - 20, itemDef.spriteKey);
      // Scale sprite down if it's too big
      const maxDim = Math.max(sprite.width, sprite.height);
      if (maxDim > 100) {
        sprite.setScale(100 / maxDim);
      }
      
      if (!hasEncountered) {
        // Obscure as silhouette
        sprite.setTintFill(binColorNum);
        sprite.setAlpha(0.6);
        card.setStrokeStyle(2, binColorNum, 0.4); // Glow the card subtly with bin color
      } else {
        // Light up the card border for encountered items with their bin color
        card.setStrokeStyle(3, binColorNum, 0.8);
      }

      // We still want to use the bin color for the text if encountered
      const labelText = itemDef.displayName; // User requested to remove question marks
      const labelColor = hasEncountered ? binsData.find(b => b.id === itemDef.correctBinId)?.color || '#f8fafc' : '#64748b';

      const label = this.add.text(x, y + 70, labelText, {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '16px',
        color: labelColor,
        wordWrap: { width: 180, useAdvancedWrap: true },
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);
      
      const typeLabel = this.add.text(x, y + 105, binNameMap[itemDef.correctBinId] || 'UNKNOWN', {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '12px',
        color: hasEncountered ? labelColor : '#475569',
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      this.containerGroup?.add(sprite);
      this.containerGroup?.add(label);
      this.containerGroup?.add(typeLabel);

      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    });
  }
}
