import Phaser from 'phaser';

export class GardenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GardenScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background sky / nature color
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue

    // Title
    const title = this.add.text(width / 2, 80, 'Community Garden', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // Empty Plot Area (Dirt / Soil)
    const plotWidth = Math.min(width * 0.8, 800);
    const plotHeight = Math.min(height * 0.6, 600);
    
    const plotGraphics = this.add.graphics();
    // Dark brown soil color
    plotGraphics.fillStyle(0x5c4033, 1);
    plotGraphics.fillRoundedRect(width / 2 - plotWidth / 2, height / 2 - plotHeight / 2 + 50, plotWidth, plotHeight, 32);
    // Stroke for plot border
    plotGraphics.lineStyle(8, 0x3e2723, 1);
    plotGraphics.strokeRoundedRect(width / 2 - plotWidth / 2, height / 2 - plotHeight / 2 + 50, plotWidth, plotHeight, 32);

    // Placeholder text in the plot
    const emptyText = this.add.text(width / 2, height / 2 + 50, 'Empty Plot\nNothing planted here yet...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#a38a7a',
      align: 'center',
      fontStyle: 'bold'
    });
    emptyText.setOrigin(0.5);

    // Back to Map Button
    const backBtnWidth = 200;
    const backBtnHeight = 60;
    const btnBg = this.add.rectangle(width / 2, height - 100, backBtnWidth, backBtnHeight, 0xffffff, 1);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.setStrokeStyle(4, 0x000000);
    
    const btnText = this.add.text(width / 2, height - 100, 'Back to Map', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#000000',
      fontStyle: 'bold'
    });
    btnText.setOrigin(0.5);

    // Button interactions
    btnBg.on('pointerover', () => {
      btnBg.fillColor = 0xe5e7eb;
    });
    btnBg.on('pointerout', () => {
      btnBg.fillColor = 0xffffff;
    });
    btnBg.on('pointerup', () => {
      this.scene.start('LevelSelectScene');
    });
  }
}
