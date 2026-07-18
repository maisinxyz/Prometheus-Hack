import Phaser from 'phaser';

/**
 * LevelSelectScene — Venue picker UI.
 * Stub for Track D (step D.6) to build upon.
 */
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    // Placeholder: display a title and basic instruction
    const title = this.add.text(960, 400, 'TrashDash: NYC Echo', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(960, 500, 'Level Select (Coming in Track D)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#aaaaaa',
    });
    subtitle.setOrigin(0.5);

    const instruction = this.add.text(960, 600, 'Click anywhere to start a test round', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#66ff66',
    });
    instruction.setOrigin(0.5);

    // Temporary: click to start TrayScene with default venue
    this.input.on('pointerdown', () => {
      this.scene.start('TrayScene', { venueId: 'mackenzie_cafe' });
    });
  }
}
