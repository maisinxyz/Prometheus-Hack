import Phaser from 'phaser';
import binsData from '../data/bins.json';
import itemsData from '../data/items.json';
import { metaGameController } from '../systems/MetaGameController';

export class SpritesScene extends Phaser.Scene {
  private currentBinIndex: number = 0;
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
    const prevBtnText = this.add.text(0, 0, '◄ PREV CATEGORY', { fontFamily: '"Nunito", sans-serif', fontSize: '20px', color: '#94a3b8', fontStyle: 'bold' }).setOrigin(0.5);
    const prevBtn = this.add.container(width / 2 - 500, 220, [prevBtnBg, prevBtnText]);
    prevBtn.setSize(240, 60).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerover', () => prevBtnBg.setFillStyle(0x334155));
    prevBtn.on('pointerout', () => prevBtnBg.setFillStyle(0x1e293b));
    prevBtn.on('pointerdown', () => this.changePage(-1));

    const nextBtnBg = this.add.rectangle(0, 0, 240, 60, 0x1e293b, 1).setStrokeStyle(2, 0x334155);
    const nextBtnText = this.add.text(0, 0, 'NEXT CATEGORY ►', { fontFamily: '"Nunito", sans-serif', fontSize: '20px', color: '#94a3b8', fontStyle: 'bold' }).setOrigin(0.5);
    const nextBtn = this.add.container(width / 2 + 500, 220, [nextBtnBg, nextBtnText]);
    nextBtn.setSize(240, 60).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerover', () => nextBtnBg.setFillStyle(0x334155));
    nextBtn.on('pointerout', () => nextBtnBg.setFillStyle(0x1e293b));
    nextBtn.on('pointerdown', () => this.changePage(1));

    this.containerGroup = this.add.group();
    
    this.renderCurrentBin();
  }

  private changePage(delta: number) {
    this.currentBinIndex += delta;
    if (this.currentBinIndex < 0) {
      this.currentBinIndex = binsData.length - 1;
    } else if (this.currentBinIndex >= binsData.length) {
      this.currentBinIndex = 0;
    }
    this.renderCurrentBin();
  }

  private renderCurrentBin() {
    this.containerGroup?.clear(true, true);
    const { width } = this.scale;

    const bin = binsData[this.currentBinIndex]!;
    const binColorNum = parseInt(bin.color.replace('#', '0x'), 16);

    // Dynamic Header for Bin
    const binHeaderBg = this.add.rectangle(width / 2, 220, 600, 80, binColorNum, 0.15).setStrokeStyle(2, binColorNum, 0.5);
    this.containerGroup?.add(binHeaderBg);

    const subtitle = this.add.text(width / 2, 220, `${bin.logo} ${bin.displayName} BIN`, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '36px',
      color: bin.color,
      fontStyle: '900'
    }).setOrigin(0.5);
    subtitle.setLetterSpacing(4);
    this.containerGroup?.add(subtitle);

    // Filter items by this bin
    const binItems = itemsData.filter((i: any) => i.correctBinId === bin.id);

    const cols = 6;
    const spacingX = 240;
    const spacingY = 260;
    const startX = (width - ((cols - 1) * spacingX)) / 2;
    const startY = 380;

    let row = 0;
    let col = 0;

    binItems.forEach((itemDef: any) => {
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      // Item Card Background
      const card = this.add.rectangle(x, y + 20, 200, 220, 0x1e293b, 1).setStrokeStyle(1, 0x334155);
      this.containerGroup?.add(card);

      const hasEncountered = metaGameController.encounteredItemsSystem.hasEncountered(itemDef.id);

      const sprite = this.add.sprite(x, y - 20, itemDef.spriteKey);
      // Scale sprite down if it's too big
      const maxDim = Math.max(sprite.width, sprite.height);
      if (maxDim > 120) {
        sprite.setScale(120 / maxDim);
      }
      
      if (!hasEncountered) {
        // Obscure as silhouette
        sprite.setTintFill(binColorNum);
        sprite.setAlpha(0.6);
        card.setStrokeStyle(1, binColorNum, 0.3); // Glow the card subtly with bin color
      }

      const labelText = hasEncountered ? itemDef.displayName : '???';
      const labelColor = hasEncountered ? '#f8fafc' : '#64748b';

      const label = this.add.text(x, y + 80, labelText, {
        fontFamily: '"Nunito", sans-serif',
        fontSize: hasEncountered ? '16px' : '24px',
        color: labelColor,
        wordWrap: { width: 180, useAdvancedWrap: true },
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      this.containerGroup?.add(sprite);
      this.containerGroup?.add(label);

      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    });
  }
}
