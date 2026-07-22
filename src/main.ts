import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { TrayScene } from './scenes/TrayScene';
import { HUDScene } from './scenes/HUDScene';
import { CorrectionOverlayScene } from './scenes/CorrectionOverlayScene';
import { SeparationMinigameScene } from './scenes/SeparationMinigameScene';
import { GardenScene } from './scenes/GardenScene';
import { CommunityGardenScene } from './scenes/CommunityGardenScene';

import { TitleScene } from './scenes/TitleScene';

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
    TitleScene,
    LevelSelectScene,
    TrayScene,
    HUDScene,
    CorrectionOverlayScene,
    SeparationMinigameScene,
    GardenScene,
    CommunityGardenScene
  ],
};

new Phaser.Game(config);
