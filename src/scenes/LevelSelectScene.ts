import Phaser from 'phaser';
import { ChiSystem } from '../systems/ChiSystem';
import venuesData from '../data/venues.json';
import { MapLibreService } from '../services/MapLibreService';

/**
 * LevelSelectScene — Interactive 3D Map UI using MapLibre GL JS.
 * The Phaser canvas acts as a transparent HUD overlay.
 */
export class LevelSelectScene extends Phaser.Scene {
  private chiSystem!: ChiSystem;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  async create(): Promise<void> {
    this.chiSystem = new ChiSystem();

    // 1. Initialize and show the 3D Apple MapKit view behind the canvas
    await MapLibreService.createMap();
    MapLibreService.showMap();

    // 2. Setup HUD Overlay (Transparent Phaser Canvas)
    const title = this.add.text(960, 80, 'Select a Level', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setShadow(0, 4, 'rgba(0,0,0,0.5)', 8);

    // 3. Process venues and create HTML annotations
    let previousVenueChi = 0; // First level assumes 0 threshold needed
    const annotationsData = [];

    for (let i = 0; i < venuesData.length; i++) {
      const venue = venuesData[i];
      const isUnlocked = i === 0 || previousVenueChi >= venue.unlockChiThreshold;
      const currentChi = this.chiSystem.getChi(venue.id);

      // Default Times Square fallback if coordinates are missing
      const lat = (venue as any).latitude || 40.7580;
      const lng = (venue as any).longitude || -73.9855;

      annotationsData.push({
        venueId: venue.id,
        displayName: venue.displayName,
        latitude: lat,
        longitude: lng,
        currentChi: currentChi,
        isUnlocked: isUnlocked,
        unlockThreshold: venue.unlockChiThreshold,
        iconUrl: `/assets/sprites/ui/venues/${venue.id}.png`,
        onSelect: (id: string) => {
          this.scene.start('TrayScene', { venueId: id });
        }
      });

      previousVenueChi = currentChi;
    }

    MapLibreService.addVenueAnnotations(annotationsData);

    // 4. Cleanup MapKit UI when leaving this scene
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      MapLibreService.hideMap();
      MapLibreService.removeAllAnnotations();
    });
  }
}
