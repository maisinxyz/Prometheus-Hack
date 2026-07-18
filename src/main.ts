import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { TrayScene } from './scenes/TrayScene';
import { HUDScene } from './scenes/HUDScene';
import { CorrectionOverlayScene } from './scenes/CorrectionOverlayScene';

/**
 * TrashDash: NYC Echo — Main entry point.
 * Bootstraps the Phaser game with all registered scenes.
 *
 * Per PRD Track 0, step 0.5.
 */
const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [
    BootScene,
    LevelSelectScene,
    TrayScene,
    HUDScene,
    CorrectionOverlayScene,
  ],
};

new Phaser.Game(config);
