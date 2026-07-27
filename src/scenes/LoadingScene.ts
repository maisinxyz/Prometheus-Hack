import Phaser from 'phaser';
import { MapLibreService } from '../services/MapLibreService';
import { ThreeJSService } from '../services/ThreeJSService';
import newsData from '../data/news.json';

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
    this.load.image('nyc_loading_bg', '/assets/nyc_loading_screen.png');
  }

  create() {
    // Hide the map and 3D background during loading
    MapLibreService.hideMap();
    ThreeJSService.hide();

    // Fill letterboxed edges with the same image and a 40% black overlay to match the Phaser canvas
    document.body.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/assets/nyc_loading_screen.png')";
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '#222';
    });

    const { width, height } = this.scale;

    // Simple loading text
    this.add.text(width / 2, height / 2 - 50, "TRAVELING...", {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      letterSpacing: '4px'
    }).setOrigin(0.5);

    // Newsletter Box
    const newsBoxWidth = 600;
    const newsBoxHeight = 150;
    const newsX = width / 2;
    const newsY = height / 2 - 100;

    const newsBg = this.add.rectangle(newsX, newsY, newsBoxWidth, newsBoxHeight, 0x000000, 0.7);
    newsBg.setStrokeStyle(2, 0x10b981);

    const tips: string[] = newsData;
    const randomTip = Phaser.Math.RND.pick(tips);

    this.add.text(newsX, newsY, randomTip, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: newsBoxWidth - 40 }
    }).setOrigin(0.5);

    // Progress Bar Container (Moved Below Newsletter)
    const barWidth = 800;
    const barHeight = 20;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 + 150;

    const bgBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0x334155).setOrigin(0);
    bgBar.setStrokeStyle(2, 0xffffff, 0.5);
    
    const fillBar = this.add.rectangle(barX, barY, 0, barHeight, 0x10b981).setOrigin(0);

    // Smooth loading transition
    const duration = Phaser.Math.Between(1200, 1800);
    
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
