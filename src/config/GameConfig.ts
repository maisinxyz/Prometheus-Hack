import Phaser from 'phaser';

/**
 * GameConfig — Phaser configuration object.
 * Canvas: 1920×1080 logical resolution, scaled via FIT mode.
 * Per PRD Section 1.2.
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  transparent: true,
  parent: 'game-container',
  scene: [], // Scenes added in main.ts
};
