import Phaser from 'phaser';

/**
 * TrayScene — Core disposal loop (drag items into bins).
 * Stub for Track B to build upon.
 */
export class TrayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TrayScene' });
  }

  create(data: { venueId: string }): void {
    const venueId = data?.venueId ?? 'mackenzie_cafe';

    const text = this.add.text(960, 540, `TrayScene — Venue: ${venueId}\n(Track B will implement the disposal loop)`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#ffffff',
      align: 'center',
    });
    text.setOrigin(0.5);

    const backText = this.add.text(960, 700, 'Press ESC to return to Level Select', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#aaaaaa',
    });
    backText.setOrigin(0.5);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('LevelSelectScene');
    });
  }
}
