import Phaser from 'phaser';
import venuesData from '../data/venues.json';
import { metaGameController } from '../systems/MetaGameController';

export interface Venue {
  id: string;
  displayName: string;
  unlockChiThreshold: number;
  itemPoolIds: string[];
  backgroundKeys: {
    clean: string;
    grimy: string;
    ruined: string;
  };
}

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const title = this.add.text(960, 100, 'TrashDash: NYC Echo', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(960, 180, 'Select a Venue', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#aaaaaa',
    });
    subtitle.setOrigin(0.5);

    const venues = venuesData as Venue[];
    
    // Layout cards horizontally
    const cardWidth = 400;
    const cardHeight = 300;
    const spacing = 100;
    const totalWidth = venues.length * cardWidth + (venues.length - 1) * spacing;
    const startX = 960 - totalWidth / 2 + cardWidth / 2;
    const y = 540;

    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i]!;
      const x = startX + i * (cardWidth + spacing);
      
      // Determine if unlocked
      let unlocked = true;
      if (i > 0) {
        const previousVenueId = venues[i - 1]!.id;
        const prevChi = metaGameController.chiSystem.getChi(previousVenueId);
        unlocked = prevChi >= venue.unlockChiThreshold;
      }

      this.createVenueCard(x, y, cardWidth, cardHeight, venue, unlocked);
    }
  }

  private createVenueCard(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    venue: Venue, 
    unlocked: boolean
  ): void {
    const cardColor = unlocked ? 0x333333 : 0x111111;
    const textColor = unlocked ? '#ffffff' : '#555555';
    const currentChi = metaGameController.chiSystem.getChi(venue.id);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(cardColor, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    
    if (unlocked) {
      bg.lineStyle(4, 0x66ff66, 1);
    } else {
      bg.lineStyle(2, 0x333333, 1);
    }
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    // Venue name
    const nameText = this.add.text(x, y - 80, venue.displayName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: textColor,
      align: 'center',
      wordWrap: { width: width - 40 }
    });
    nameText.setOrigin(0.5);

    if (unlocked) {
      // CHI readout
      const chiText = this.add.text(x, y + 20, `CHI: ${Math.floor(currentChi)}/100`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#aaaaaa'
      });
      chiText.setOrigin(0.5);

      // CHI Bar
      const barWidth = width - 80;
      const barHeight = 20;
      const barY = y + 60;
      
      const barBg = this.add.graphics();
      barBg.fillStyle(0x000000, 1);
      barBg.fillRoundedRect(x - barWidth / 2, barY - barHeight / 2, barWidth, barHeight, 10);
      
      if (currentChi > 0) {
        const fillWidth = (currentChi / 100) * barWidth;
        const barFill = this.add.graphics();
        barFill.fillStyle(0x66ff66, 1);
        barFill.fillRoundedRect(x - barWidth / 2, barY - barHeight / 2, fillWidth, barHeight, 10);
      }

      // Interactive Zone
      const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.scene.start('TrayScene', { venueId: venue.id });
      });
      
      zone.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x444444, 1);
        bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
        bg.lineStyle(4, 0x66ff66, 1);
        bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
      });
      
      zone.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(cardColor, 1);
        bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
        bg.lineStyle(4, 0x66ff66, 1);
        bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
      });
    } else {
      // Locked text
      const lockedText = this.add.text(x, y + 40, `LOCKED\nRequires ${venue.unlockChiThreshold} CHI\nin previous venue`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ff4444',
        align: 'center'
      });
      lockedText.setOrigin(0.5);
    }
  }
}
