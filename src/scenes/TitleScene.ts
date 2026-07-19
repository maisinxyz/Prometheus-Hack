import Phaser from 'phaser';

/**
 * TitleScene — Landing Page with Play Button.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const bg = this.add.image(width / 2, height / 2, 'main_menu_bg');
    
    // Scale image to cover the screen
    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    // Title Text
    const title = this.add.text(960, 300, 'TrashDash: NYC Echo', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '96px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    });
    title.setOrigin(0.5);

    // Play Button Container
    const playBtnBg = this.add.rectangle(0, 0, 300, 100, 0x22C55E, 1);
    playBtnBg.setStrokeStyle(4, 0xffffff);
    
    const playBtnText = this.add.text(0, 0, 'PLAY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    playBtnText.setOrigin(0.5);

    const playBtn = this.add.container(960, 600, [playBtnBg, playBtnText]);
    playBtn.setSize(300, 100);
    playBtn.setInteractive({ useHandCursor: true });

    // Hover effects
    playBtn.on('pointerover', () => {
      playBtnBg.setFillStyle(0x16a34a, 1); // Darker green
      this.tweens.add({
        targets: playBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    playBtn.on('pointerout', () => {
      playBtnBg.setFillStyle(0x22C55E, 1); // Original green
      this.tweens.add({
        targets: playBtn,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 100,
      });
    });

    // Click effect and transition
    playBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: playBtn,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.scene.start('LevelSelectScene');
        }
      });
    });
  }
}
