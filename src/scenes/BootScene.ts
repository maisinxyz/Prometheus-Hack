import Phaser from 'phaser';
import { generatePlaceholderTexture, generateEmojiItemSprite, generateEmojiLogo, generateBinPlaceholder } from '../util/PlaceholderArtGenerator';
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

    // Load audio tracks
    this.load.audio('map_music', 'assets/audio/map_music.webm');
    this.load.audio('summer_smile', 'assets/audio/summer_smile.webm');
    this.load.audio('blue_skies', 'assets/audio/blue_skies.webm');
    this.load.audio('candyland', 'assets/audio/candyland.webm');
    this.load.audio('hope', 'assets/audio/hope.webm');
    this.load.audio('ukelele', 'assets/audio/ukelele.webm');
    this.load.audio('carefree', 'assets/audio/carefree.webm');

    // List of spriteKeys that use SVG instead of PNG
    const svgSpriteKeys = [
      'sawdust',
      'brick',
      'cautiontape',
      'emptycementbag',
      'rustynails',
      'hardhat',
      'wood',
      'rock',
      'item_ferry_ticket',
      'item_barnacle_cup',
      'item_tourist_map',
      'item_soggy_fries',
      'item_pill_foil',
      'item_boat_cleat',
      'item_life_preserver_piece',
      'item_fishing_line',
      'item_fishing_hook',
      'item_barnacle',
      'item_ethernet_cable',
      'item_vr_foam',
      'item_keycap',
      'item_sticky_note',
      'item_yerba_mate_can',
      'item_energy_drink_can',
      'item_soylent_bottle',
      'item_vr_strap',
      'item_usb_drive',
      'item_protein_wrapper',
      'item_chewed_gum',
      'item_chip_bag',
      'item_cigarette_butt',
      'item_newspaper',
      'item_face_mask',
      'item_glass_bottle',
      'item_gum_wrapper',
      'item_metro_card',
      'item_pizza_box_greasy',
      'item_banana_peel',
      'item_broken_jump_rope',
      'item_preworkout',
      'item_energy_bar_wrapper',
      'item_protein_shake_bottle',
      'item_shoe_box',
      'item_sports_drink_can',
      'item_sweat_towel',
      'item_towel_scrap',
      'item_yoga_mat_piece',
      'item_book_dust_jacket',
      'item_broken_reading_glasses',
      'item_cd_jewel_case',
      'item_chewed_pencil',
      'item_ink_cartridge',
      'item_encyclopedia_page',
      'item_laminated_bookmark',
      'item_overdue_notice',
      'item_book_page',
      'item_used_teabag',
      'item_canvas_scrap',
      'item_dirty_paint_brush',
      'item_dried_clay',
      'item_turpentine_bottle',
      'item_eraser_shavings',
      'item_orange_peel',
      'item_sketchbook_scrap',
      'item_paint_tube',
      'item_paint_palette',
      'item_aluminum_soda_can',
      'applecore',
      'coffecup',
      'coffeelid',
      'item_food_scraps',
      'tissues',
      'item_paper_plate',
      'item_paper_straw_wrapper',
      'item_plastic_fork',
      'item_plastic_straw',
      'item_plastic_water_bottle',
      'item_cotton_swabs',
      'item_pill_bottle',
      'item_gauze_bandage',
      'item_iv_saline_bag',
      'item_latex_gloves',
      'item_medicine_box',
      'item_paper_prescription',
      'item_pill_blister_pack',
      'item_syringe_cap',
      'item_used_tissue_box',
      'foodbox',
      'item_half_eaten_hot_dog',
      'item_hot_dog_bun_scraps',
      'item_fanta_can',
      'item_pepsi_can',
      'item_used_mustard_packet'
];

    // 1. Load Items
    for (const item of itemsData) {
      const key = item.spriteKey;
      if (svgSpriteKeys.includes(key)) {
        this.load.svg(key, `assets/sprites/items/${key}.svg`);
      } else {
        this.load.image(key, `assets/sprites/items/${key}.png`);
      }
    }

    // Additional textures not bound to a specific item's spriteKey
    this.load.image('item_fanta_full', 'assets/sprites/items/item_fanta_full.png');
    this.load.image('item_pepsi_full', 'assets/sprites/items/item_pepsi_full.png');
    // Food box contents
    this.load.image('chicken', 'assets/sprites/items/chicken.png');
    this.load.image('watermelon', 'assets/sprites/items/watermelon.png');
    this.load.image('fries', 'assets/sprites/items/fries.png');

    // 2. Load Bins and Machines

    for (const bin of binsData) {
      const key = `bin_${bin.id}`;
      this.load.image(key, `assets/sprites/bins/${key}.png`);
    }

    // 3. Load UI & Backgrounds
    this.load.image('title_bg', 'assets/sprites/ui/title_bg.png');
    this.load.image('nyc_map_bg', 'assets/sprites/ui/custom_map.jpg');
    this.load.image('bg_construction_site', 'assets/sprites/items/construction_bg.png');
    this.load.image('park_dirt', 'assets/images/park_dirt.png');
    this.load.image('pure_park_dirt', 'assets/images/pure_park_dirt.png');
    this.load.image('real_grass', 'assets/images/real_grass.png');
    this.load.image('perspective_grass', 'assets/images/perspective_grass.png');
    this.load.image('aerial_grass', 'assets/images/aerial_grass.png');
    this.load.image('park_grass', 'assets/images/park_grass.png');
    this.load.image('drone_grass', 'assets/images/drone_grass.png');
    this.load.image('sweeping_grass', 'assets/images/sweeping_grass.png');
    this.load.image('rolling_grass', 'assets/images/rolling_grass.png');
    this.load.image('macro_wavy_grass', 'assets/images/macro_wavy_grass.png');
    this.load.image('garden_grass', 'assets/images/garden_grass.png');
    this.load.image('perfect_wavy_grass', 'assets/images/perfect_wavy_grass.png');
    this.load.image('sharp_flat_grass', 'assets/images/sharp_flat_grass.png');
    this.load.image('far_view_grass', 'assets/images/far_view_grass.png');
    this.load.image('natural_lawn', 'assets/images/natural_lawn.png');
    this.load.image('user_reference', 'assets/images/user_reference.jpg');
    this.load.image('perfect_lawn', 'assets/images/perfect_lawn.png');
    this.load.image('perfect_crop', 'assets/images/perfect_crop.png');
    
    // Proper textures
    this.load.image('bg_dirt', 'assets/garden/bg_dirt.png');
    this.load.image('bg_grass', 'assets/garden/bg_grass.png');
    this.load.image('flower_patch', 'assets/garden/flower_patch.png');
    this.load.image('bush', 'assets/garden/bush.png');

    // Garden assets (photorealistic AI-generated, transparent PNGs)
    this.load.image('garden_dirt', 'assets/garden/garden_dirt.png');
    this.load.image('garden_grass', 'assets/garden/garden_grass.png');
    this.load.image('garden_tree', 'assets/garden/garden_tree.png');
    this.load.image('garden_pond', 'assets/garden/garden_pond.png');
    this.load.image('garden_flower', 'assets/garden/garden_flower.png');
    this.load.image('garden_bush', 'assets/garden/garden_bush.png');
    this.load.image('garden_bench', 'assets/garden/garden_bench.png');
    this.load.image('garden_fountain', 'assets/garden/garden_fountain.png');
    this.load.image('garden_lamp', 'assets/garden/garden_lamp.png');
    this.load.image('garden_duck', 'assets/garden/garden_duck.png');
    this.load.image('garden_turtle', 'assets/garden/garden_turtle.png');
    this.load.image('garden_rabbit', 'assets/garden/garden_rabbit.png');

    // Load venue icons
    const venueIds = [
      'mackenzie_cafe', 'financial_district_office', 'times_square', 
      'hot_dog_stand', 'subway_station', 'gym', 'central_park',
      'public_library', 'art_studio', 'construction_site', 'tech_startup', 'ferry_docks',
      'nyc_hospital' // Wait, I didn't download one for nyc_hospital!
    ];
    for (const vid of venueIds) {
      this.load.image(`venue_icon_${vid}`, `assets/sprites/ui/venues/${vid}.png`);
    }
    this.load.image('main_menu_bg', 'assets/sprites/items/main_menu_bg.png');
    for (const venue of venuesData) {
      this.load.image(venue.backgroundKeys.clean, `assets/sprites/items/${venue.backgroundKeys.clean}.png`);
    }
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
        let colorHex = 0x888888;
        if (item.correctBinId === 'compost') colorHex = 0x22c55e;
        else if (item.correctBinId === 'recycling') colorHex = 0x3b82f6;
        else if (item.correctBinId === 'plastic') colorHex = 0x6b7280;
        else if (item.correctBinId === 'landfill') colorHex = 0x111111;
        else if (item.correctBinId === 'none') colorHex = 0xef4444; // Composites

        // Ensure the Emoji generator is imported from PlaceholderArtGenerator.ts
        const emoji = item.emoji || '❓';
        generateEmojiItemSprite(this, key, emoji, colorHex, 128);
      }
    }

    for (const bin of binsData) {
      const key = `bin_${bin.id}`;
      if (this.failedLoads.has(key) || !this.textures.exists(`${key}_front`)) {
        const logo = (bin as any).logo as string | undefined;
        if (logo) {
          generateBinPlaceholder(this, key, Phaser.Display.Color.HexStringToColor(bin.color).color, bin.displayName, logo, 220, 320);
        } else {
          generateBinPlaceholder(this, key, Phaser.Display.Color.HexStringToColor(bin.color).color, bin.displayName, '🗑️', 220, 320);
        }
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
      'subway_station': 0x57534e,
      'gym': 0xf97316,
      'central_park': 0x228b22,
      'public_library': 0x8b4513,
      'art_studio': 0xdb2777,
      'construction_site': 0xeab308,
      'tech_startup': 0x0ea5e9,
      'ferry_docks': 0x0369a1,
      'nyc_hospital': 0x38bdf8,
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

    // Generate garden widget icon
    generateEmojiLogo(this, 'garden_icon', '🌱', true, 80);

    console.log('BootScene: assets loaded (with fallbacks if needed)');
    this.scene.start('TitleScene');
  }
}
