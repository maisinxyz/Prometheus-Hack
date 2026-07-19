import Phaser from 'phaser';
import { generatePlaceholderTexture } from '../util/PlaceholderArtGenerator';
import itemsData from '../data/items.json';
import binsData from '../data/bins.json';
import venuesData from '../data/venues.json';
import { MunicipalPolicyService } from '../services/MunicipalPolicyService';
import { TrashItemDef } from '../data/schemas/itemSchema';

/**
 * BootScene — Preloads assets and transitions to LevelSelectScene.
 * Falls back to PlaceholderArtGenerator for any missing sprites.
 *
 * Per PRD Track F, step F.2.
 */
export class BootScene extends Phaser.Scene {
  private failedLoads: Set<string> = new Set();

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Listen for missing files
    this.load.on('loaderror', (fileObj: Phaser.Loader.File) => {
      this.failedLoads.add(fileObj.key);
    });

    // 1. Load Items
    for (const item of itemsData) {
      const key = item.spriteKey;
      this.load.image(key, `assets/sprites/items/${key}.png`);
    }

    // 2. Load Bins
    for (const bin of binsData) {
      const key = `bin_${bin.id}`;
      this.load.image(key, `assets/sprites/bins/${key}.png`);
    }

    // 3. Load UI & Backgrounds
    this.load.image('nyc_map_bg', 'assets/sprites/ui/custom_map.jpg');
    this.load.image('main_menu_bg', 'assets/main_menu_bg.png');
    this.load.image('venue_mackenzie_cafe_bg_clean', 'assets/venue_mackenzie_cafe_bg_clean.png');
    this.load.image('venue_financial_district_office_bg_clean', 'assets/venue_financial_district_office_bg_clean.png');
    this.load.image('venue_times_square_bg_clean', 'assets/venue_times_square_bg_clean.png');
  }

  async create(): Promise<void> {
    // Apply Municipal Policy Updates (Track H)
    const policyService = new MunicipalPolicyService();
    const updates = await policyService.fetchPolicyUpdates();
    const updatedItems = policyService.applyUpdates(itemsData as TrashItemDef[], updates);
    this.registry.set('itemsData', updatedItems);

    // Generate fallbacks for any textures that failed to load
    for (const item of updatedItems) {
      const key = item.spriteKey;
      if (this.failedLoads.has(key) || !this.textures.exists(key)) {
        // Use hash of item ID to generate a consistent placeholder color
        let color = 0x888888;
        if (item.correctBinId === 'compost') color = 0x22c55e;
        else if (item.correctBinId === 'plastic') color = 0x3b82f6;
        else if (item.correctBinId === 'paper') color = 0xeab308;
        else if (item.correctBinId === 'landfill') color = 0x4b5563;
        else if (item.correctBinId === 'none') color = 0xef4444; // Composites
        
        generatePlaceholderTexture(this, key, color, item.id.toUpperCase(), 128, 128, item.isComposite);
      }
    }

    for (const bin of binsData) {
      const key = `bin_${bin.id}`;
      if (this.failedLoads.has(key) || !this.textures.exists(key)) {
        generatePlaceholderTexture(this, key, Phaser.Display.Color.HexStringToColor(bin.color).color, bin.displayName, 384, 512, false, true);
      }
    }
    // 3. UI Fallback
    if (this.failedLoads.has('nyc_map_bg') || !this.textures.exists('nyc_map_bg')) {
      generatePlaceholderTexture(this, 'nyc_map_bg', 0x1E3A8A, 'NEW YORK CITY (3D MAP HERE)', 2500, 2500);
    }
    
    // 4. Venue Backgrounds Fallbacks
    const venueColors: Record<string, number> = {
      'mackenzie_cafe': 0x8b4513,
      'financial_district_office': 0x708090,
      'times_square': 0x4b0082,
      'hot_dog_stand': 0xff8c00,
      'chelsea_office': 0x4682b4,
      'central_park': 0x228b22,
    };
    for (const venue of venuesData) {
      const color = venueColors[venue.id] || 0x2c3e50;
      const keys = [venue.backgroundKeys.clean, venue.backgroundKeys.grimy, venue.backgroundKeys.ruined];
      for (const bgKey of keys) {
        if (this.failedLoads.has(bgKey) || !this.textures.exists(bgKey)) {
          generatePlaceholderTexture(this, bgKey, color, `${venue.displayName} Background`, 1920, 1080);
        }
      }
    }

    console.log('BootScene: assets loaded (with fallbacks if needed)');
    this.scene.start('TitleScene');
  }
}
