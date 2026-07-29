import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { TrayScene } from './scenes/TrayScene';
import { HUDScene } from './scenes/HUDScene';
import { CorrectionOverlayScene } from './scenes/CorrectionOverlayScene';
import { GardenScene } from './scenes/GardenScene';
import { CommunityGardenScene } from './scenes/CommunityGardenScene';
import { LoadingScene } from './scenes/LoadingScene';
import { CursorManager } from './systems/CursorManager';

import { TitleScene } from './scenes/TitleScene';
import { SpritesScene } from './scenes/SpritesScene';
import { HowToPlayOverlay } from './scenes/HowToPlayOverlay';
import { InteractiveTutorialOverlay } from './scenes/InteractiveTutorialOverlay';
import { ObjectiveOverlay } from './scenes/ObjectiveOverlay';

/**
 * TrashDash: NYC Echo — Main entry point.
 * Bootstraps the Phaser game with all registered scenes.
 *
 * Per PRD Track 0, step 0.5.
 */

// Initialize Global Custom Cursor
const cursorManager = new CursorManager();
cursorManager.init();

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [
    BootScene,
    TitleScene,
    LevelSelectScene,
    TrayScene,
    HUDScene,
    CorrectionOverlayScene,
    GardenScene,
    CommunityGardenScene,
    LoadingScene,
    SpritesScene,
    HowToPlayOverlay,
    InteractiveTutorialOverlay,
    ObjectiveOverlay
  ],
};

new Phaser.Game(config);
