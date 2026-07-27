import Phaser from 'phaser';

export class LoadingScene extends Phaser.Scene {
  private targetScene!: string;
  private targetData: any;

  constructor() {
    super({ key: 'LoadingScene' });
  }

  init(data: { target: string; targetData?: any }) {
    this.targetScene = data.target;
    this.targetData = data.targetData;
  }

  preload() {
    this.load.image('nyc_loading_bg', '/assets/sprites/items/main_menu_bg.png');
  }

  create() {
    const { width, height } = this.scale;

    // Solid Black Background to block MapLibre
    this.add.rectangle(0, 0, width, height, 0x000000, 1.0).setOrigin(0);

    // High quality NYC image
    const bg = this.add.image(width / 2, height / 2, 'nyc_loading_bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.6); // Dimmed slightly for text readability

    // Simple loading text
    this.add.text(width / 2, height / 2 - 50, "TRAVELING...", {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      letterSpacing: '4px'
    }).setOrigin(0.5);

    // Progress Bar Container
    const barWidth = 800;
    const barHeight = 20;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 + 50;

    const bgBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0x334155).setOrigin(0);
    bgBar.setStrokeStyle(2, 0xffffff, 0.5);
    
    const fillBar = this.add.rectangle(barX, barY, 0, barHeight, 0x10b981).setOrigin(0);



    // Fake loading delay (1.5 - 2.5 seconds)
    const duration = Phaser.Math.Between(1500, 2500);
    
    this.tweens.add({
      targets: fillBar,
      width: barWidth,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        // Transition to target scene
        this.scene.start(this.targetScene, this.targetData);
      }
    });
  }
}
