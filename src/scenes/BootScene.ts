import Phaser from 'phaser';
import { generatePlaceholderTexture } from '../util/PlaceholderArtGenerator';

/**
 * BootScene — Preloads assets and transitions to LevelSelectScene.
 * Falls back to PlaceholderArtGenerator for any missing sprites.
 *
 * Per PRD Track 0, step 0.6.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Placeholder asset keys for initial development
    // These will be replaced by the data-driven manifest loader in Track F (step F.2)
    const placeholderItems = [
      { key: 'item_paper_plate', color: 0x3B82F6, label: 'PAPER PLATE' },
      { key: 'item_plastic_fork', color: 0xEAB308, label: 'PLASTIC FORK' },
      { key: 'item_food_scraps', color: 0x22C55E, label: 'FOOD SCRAPS' },
      { key: 'item_coffee_cup', color: 0x8B4513, label: 'COFFEE CUP' },
      { key: 'item_coffee_cup_lid', color: 0xEAB308, label: 'CUP LID' },
      { key: 'item_napkin_clean', color: 0x3B82F6, label: 'NAPKIN' },
      { key: 'item_napkin_greasy', color: 0x6B7280, label: 'GREASY NAP' },
      { key: 'item_apple_core', color: 0x22C55E, label: 'APPLE' },
      { key: 'item_plastic_water_bottle', color: 0xEAB308, label: 'BOTTLE' },
      { key: 'item_aluminum_can', color: 0xEAB308, label: 'CAN' },
      { key: 'item_paper_straw_wrapper', color: 0x3B82F6, label: 'WRAPPER' },
      { key: 'item_plastic_straw', color: 0xEAB308, label: 'STRAW' },
    ];

    const placeholderBins = [
      { key: 'bin_paper', color: 0x3B82F6, label: 'PAPER' },
      { key: 'bin_compost', color: 0x22C55E, label: 'COMPOST' },
      { key: 'bin_plastic', color: 0xEAB308, label: 'PLASTIC' },
      { key: 'bin_landfill', color: 0x6B7280, label: 'LANDFILL' },
    ];

    // Generate placeholder textures for items (128×128 display size)
    for (const item of placeholderItems) {
      generatePlaceholderTexture(this, item.key, item.color, item.label, 128, 128);
    }

    // Generate placeholder textures for bins (384×512 per Section 1.2)
    for (const bin of placeholderBins) {
      generatePlaceholderTexture(this, bin.key, bin.color, bin.label, 384, 512);
    }
  }

  create(): void {
    console.log('BootScene: assets loaded');
    this.scene.start('LevelSelectScene');
  }
}
