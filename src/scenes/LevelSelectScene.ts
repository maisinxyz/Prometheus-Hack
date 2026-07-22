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

    // 4. UI Overlay (HTML) for Total CHI and Future Vision
    const totalChi = this.chiSystem.getTotalChi(venuesData.map(v => v.id));
    const maxChi = venuesData.length * 100;

    let weatherName = '';
    let weatherDesc = '';
    let weatherEffect = '';
    let weatherColor = '#ffffff';
    
    if (totalChi <= maxChi * 0.25) {
      weatherName = 'Smog Day';
      weatherDesc = 'The city is choked with toxic smog.';
      weatherEffect = 'Visibility severely reduced.';
      weatherColor = '#dc2626'; // red
    } else if (totalChi <= maxChi * 0.5) {
      weatherName = 'Flash Flood';
      weatherDesc = 'Climate change has caused severe flooding.';
      weatherEffect = 'Trash bobs erratically in the water!';
      weatherColor = '#f59e0b'; // orange
    } else if (totalChi <= maxChi * 0.75) {
      weatherName = 'Clear Skies';
      weatherDesc = 'The environment is stabilizing.';
      weatherEffect = 'Normal conditions.';
      weatherColor = '#10b981'; // emerald
    } else {
      weatherName = 'Eco-Festival';
      weatherDesc = 'The city celebrates your zero-waste efforts!';
      weatherEffect = 'Score multiplier x2!';
      weatherColor = '#a855f7'; // purple
    }

    const uiContainer = document.createElement('div');
    uiContainer.id = 'level-select-ui';
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '20px';
    uiContainer.style.left = '20px';
    uiContainer.style.zIndex = '20';
    uiContainer.style.pointerEvents = 'auto';
    uiContainer.innerHTML = `
      <div style="color: #facc15; font-family: sans-serif; font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.8); margin-bottom: 10px;">
        Total CHI: ${Math.floor(totalChi)} / ${maxChi}
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="future-btn" style="background: #2563eb; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          Toggle Future Vision
        </button>
        <button id="garden-btn" style="background: #16a34a; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          Visit Community Garden
        </button>
      </div>
    `;
    document.body.appendChild(uiContainer);
    
    document.getElementById('garden-btn')?.addEventListener('click', () => {
      this.scene.start('CommunityGardenScene');
    });

    const weatherEventContainer = document.createElement('div');
    weatherEventContainer.id = 'map-weather-event';
    weatherEventContainer.style.position = 'absolute';
    weatherEventContainer.style.bottom = '20px';
    weatherEventContainer.style.right = '20px';
    weatherEventContainer.style.width = '450px';
    weatherEventContainer.style.background = 'rgba(0,0,0,0.7)';
    weatherEventContainer.style.border = `2px solid ${weatherColor}`;
    weatherEventContainer.style.padding = '15px';
    weatherEventContainer.style.zIndex = '20';
    weatherEventContainer.style.pointerEvents = 'none';
    weatherEventContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; font-size: 28px; color: ${weatherColor}; font-weight: bold; margin-bottom: 5px;">${weatherName}</div>
      <div style="font-family: Arial, sans-serif; font-size: 18px; color: #aaaaaa; margin-bottom: 5px;">${weatherDesc}</div>
      <div style="font-family: Arial, sans-serif; font-size: 18px; color: #ffffff; font-style: italic;">Effect: ${weatherEffect}</div>
    `;
    document.body.appendChild(weatherEventContainer);

    const smogOverlay = document.createElement('div');
    smogOverlay.id = 'smog-overlay';
    smogOverlay.style.position = 'absolute';
    smogOverlay.style.top = '0';
    smogOverlay.style.left = '0';
    smogOverlay.style.width = '100vw';
    smogOverlay.style.height = '100vh';
    smogOverlay.style.pointerEvents = 'none';
    smogOverlay.style.zIndex = '5'; // Below UI (which is 20) but above map
    smogOverlay.style.opacity = '0';
    smogOverlay.style.transition = 'opacity 1s ease';
    document.body.appendChild(smogOverlay);

    const descBox = document.createElement('div');
    descBox.id = 'future-desc-box';
    descBox.style.position = 'absolute';
    descBox.style.bottom = '40px';
    descBox.style.left = '50%';
    descBox.style.transform = 'translateX(-50%)';
    descBox.style.width = '800px';
    descBox.style.background = 'rgba(0,0,0,0.85)';
    descBox.style.color = '#fff';
    descBox.style.padding = '20px';
    descBox.style.borderRadius = '12px';
    descBox.style.zIndex = '20';
    descBox.style.fontFamily = 'sans-serif';
    descBox.style.fontSize = '18px';
    descBox.style.lineHeight = '1.5';
    descBox.style.display = 'none';
    descBox.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    document.body.appendChild(descBox);

    let isFutureVisionActive = false;
    document.getElementById('future-btn')!.addEventListener('click', () => {
      isFutureVisionActive = !isFutureVisionActive;
      MapLibreService.toggleFutureVision(isFutureVisionActive, totalChi, maxChi);
      const btn = document.getElementById('future-btn')!;
      if (isFutureVisionActive) {
        const isUtopia = totalChi >= maxChi / 2;
        btn.style.background = isUtopia ? '#16a34a' : '#dc2626';
        
        if (isUtopia) {
          smogOverlay.style.background = 'linear-gradient(to bottom, rgba(150, 255, 200, 0.2) 0%, rgba(100, 200, 255, 0.1) 100%)';
          smogOverlay.style.backdropFilter = 'saturate(1.2)';
          smogOverlay.style.opacity = '1';

          descBox.style.display = 'block';
          descBox.style.border = '2px solid #16a34a';
          descBox.innerHTML = '<strong style="color:#16a34a; font-size: 24px;">Year 2076: Eco-Utopia</strong><br/><br/>Your incredible dedication to recycling and zero-waste initiatives has transformed New York City. The air is pristine, urban forests thrive among the skyscrapers, and the rivers are crystal clear. You have saved the city from environmental collapse.';
        } else {
          smogOverlay.style.background = 'linear-gradient(to bottom, rgba(100, 80, 60, 0.7) 0%, rgba(80, 70, 60, 0.4) 100%)';
          smogOverlay.style.backdropFilter = 'sepia(0.5) blur(1px)';
          smogOverlay.style.opacity = '1';

          descBox.style.display = 'block';
          descBox.style.border = '2px solid #dc2626';
          descBox.innerHTML = '<strong style="color:#dc2626; font-size: 24px;">Year 2076: Environmental Collapse</strong><br/><br/>Decades of unchecked waste, overflowing landfills, and polluted waterways have decimated New York City. A thick, toxic gray-brown smog chokes the air permanently. The Hudson River is a sludge of toxic waste, and the streets are stained with decades of grime. This is the bleak future of inaction.';
        }
      } else {
        btn.style.background = '#2563eb';
        smogOverlay.style.opacity = '0';
        descBox.style.display = 'none';
      }
    });

    // 5. Cleanup MapKit UI when leaving this scene
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.getElementById('level-select-ui')?.remove();
      document.getElementById('smog-overlay')?.remove();
      document.getElementById('future-desc-box')?.remove();
      document.getElementById('map-weather-event')?.remove();
      MapLibreService.toggleFutureVision(false, 0, 0); // Reset map style
      MapLibreService.hideMap();
      MapLibreService.removeAllAnnotations();
    });
  }
}
