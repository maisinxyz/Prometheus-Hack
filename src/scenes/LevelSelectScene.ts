import Phaser from 'phaser';
import { ChiSystem } from '../systems/ChiSystem';
import { GardenSystem } from '../systems/GardenSystem';
import venuesData from '../data/venues.json';
import { MapLibreService } from '../services/MapLibreService';
import { LevelNode, NodeState } from '../entities/LevelNode';
import { PathOverlayService } from '../services/PathOverlayService';
import { MapCameraController } from '../services/MapCameraController';

/**
 * LevelSelectScene — Interactive 3D Map UI using MapLibre GL JS.
 * The Phaser canvas acts as a transparent HUD overlay.
 */
export class LevelSelectScene extends Phaser.Scene {
  private chiSystem!: ChiSystem;
  private gardenSystem!: GardenSystem;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  async create(): Promise<void> {
    this.chiSystem = new ChiSystem();
    this.gardenSystem = new GardenSystem();

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

    // 3. Process progression synchronously
    let unlockedCount = 0;
    let currentVenueChi = 0;
    let nextUnlockThreshold = 100;
    let currentLng = -73.9855;
    let currentLat = 40.7580;
    let currentName = '';
    const levelNodes: LevelNode[] = [];
    
    const map = MapLibreService.getMap();
    MapCameraController.setMap(map);

    for (let i = 0; i < venuesData.length; i++) {
      const venue = venuesData[i] as any;
      let isUnlocked = false;
      if (i === 0) {
        isUnlocked = true;
      } else {
        const previousVenueChi = this.chiSystem.getChi((venuesData[i - 1] as any).id);
        isUnlocked = previousVenueChi >= venue.unlockChiThreshold;
      }

      if (isUnlocked) {
        unlockedCount++;
        currentVenueChi = this.chiSystem.getChi(venue.id);
        currentLng = (venue as any).longitude || -73.9855;
        currentLat = (venue as any).latitude || 40.7580;
        currentName = venue.displayName;
        if (i + 1 < venuesData.length) {
          nextUnlockThreshold = (venuesData[i + 1] as any).unlockChiThreshold;
        } else {
          nextUnlockThreshold = currentVenueChi; // Maxed out
        }
      }
    }

    const setupMapLayers = () => {
      PathOverlayService.addToMap(map, unlockedCount);

      for (let i = 0; i < venuesData.length; i++) {
        const venue = venuesData[i] as any;
        let isUnlocked = i < unlockedCount;
        let state = NodeState.LOCKED;
        if (isUnlocked) {
          state = (i === unlockedCount - 1) ? NodeState.CURRENT : NodeState.UNLOCKED;
        }

        const lat = (venue as any).latitude || 40.7580;
        const lng = (venue as any).longitude || -73.9855;

        const node = new LevelNode(map, {
          venueId: venue.id,
          displayName: venue.displayName,
          latitude: lat,
          longitude: lng,
          index: i,
          state,
          onClick: (id: string) => {
            this.scene.start('TrayScene', { venueId: id });
          }
        });
        levelNodes.push(node);
      }

      // Check Unlock Sequence
      const lastSeenCountStr = localStorage.getItem('trashdash_last_unlocked_count');
      const lastSeenCount = lastSeenCountStr ? parseInt(lastSeenCountStr, 10) : 1;
      
      if (unlockedCount > lastSeenCount) {
        try { this.sound.play('chime'); } catch (e) {} // best effort
        
        const banner = document.createElement('div');
        banner.style.position = 'absolute';
        banner.style.top = '140px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.background = 'linear-gradient(90deg, #F59E0B, #FCD34D)';
        banner.style.color = '#000';
        banner.style.padding = '15px 40px';
        banner.style.borderRadius = '30px';
        banner.style.fontWeight = 'bold';
        banner.style.fontSize = '24px';
        banner.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
        banner.style.zIndex = '100';
        banner.textContent = `New Level Unlocked: ${currentName}!`;
        document.body.appendChild(banner);
        
        setTimeout(() => {
          banner.style.transition = 'opacity 0.5s ease';
          banner.style.opacity = '0';
          setTimeout(() => banner.remove(), 500);
        }, 2500);

        MapCameraController.driftToNode(currentLng, currentLat, 2000);
        localStorage.setItem('trashdash_last_unlocked_count', unlockedCount.toString());
      } else {
        MapCameraController.lockOnNode(currentLng, currentLat);
      }
    };

    if (map.isStyleLoaded()) {
      setupMapLayers();
    } else {
      map.once('style.load', setupMapLayers);
    }

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
    const compostLvl = this.gardenSystem.getCompostLevel();
    const isLocked = compostLvl < 5;
    const compostProg = (this.gardenSystem.getRawCount('compost') % 30) / 30 * 100;
    const recyclingProg = (this.gardenSystem.getRawCount('recycling') % 30) / 30 * 100;
    const plasticProg = (this.gardenSystem.getRawCount('plastic') % 30) / 30 * 100;
    const landfillProg = (this.gardenSystem.getRawCount('landfill') % 50) / 50 * 100;

    const renderBar = (name: string, lvl: number, prog: number, locked: boolean, color: string, icon: string) => `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #fff; text-shadow: 0 1px 2px #000;">
          <span>${icon} ${name} ${locked ? '🔒 (Needs Compost Lvl 5)' : `Lvl ${lvl}`}</span>
        </div>
        <div style="width: 100%; height: 12px; background: rgba(0,0,0,0.5); border-radius: 6px; overflow: hidden; border: 1px solid #444;">
          <div style="width: ${prog}%; height: 100%; background: ${locked ? '#555' : color};"></div>
        </div>
      </div>
    `;

    uiContainer.innerHTML = `
      <div id="stats-toggle-btn" style="background: rgba(40,40,40,0.9); color: white; border: 1px solid #555; padding: 5px 10px; font-size: 12px; border-radius: 5px; cursor: pointer; font-family: sans-serif; margin-bottom: 10px; display: inline-block;">
        ◀ Hide Stats
      </div>
      <div id="stats-content-area" style="transition: transform 0.3s ease, opacity 0.3s ease; transform-origin: top left;">
        <div style="color: #facc15; font-family: sans-serif; font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.8); margin-bottom: 10px;">
          Total CHI: ${Math.floor(totalChi)} / ${maxChi}
        </div>
        
        <div style="background: rgba(20,20,20,0.85); padding: 15px; border-radius: 10px; border: 1px solid #444; margin-bottom: 10px; width: 300px; font-family: sans-serif;">
          <div style="color: #fff; font-weight: bold; font-size: 16px; margin-bottom: 10px; text-transform: uppercase;">Garden Progress</div>
          ${renderBar('Compost', compostLvl, compostProg, false, '#22c55e', '🍎')}
          ${renderBar('Recycling', this.gardenSystem.getRecyclingLevel(), recyclingProg, isLocked, '#3b82f6', '♻️')}
          ${renderBar('Plastic', this.gardenSystem.getPlasticLevel(), plasticProg, isLocked, '#6b7280', '🧴')}
          ${renderBar('Landfill', this.gardenSystem.getLandfillLevel(), landfillProg, isLocked, '#a8a29e', '🗑️')}
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="future-btn" style="background: #2563eb; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            Toggle Future Vision
          </button>
          <button id="garden-btn" style="background: #16a34a; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            Visit Community Park
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(uiContainer);

    // 4.5 Task 2.5/2.6: Current CHI HUD & Recenter Button
    const currentChiHud = document.createElement('div');
    currentChiHud.id = 'current-chi-hud';
    currentChiHud.style.position = 'absolute';
    currentChiHud.style.bottom = '120px'; // bottom middle
    currentChiHud.style.left = '50%';
    currentChiHud.style.transform = 'translateX(-50%)';
    currentChiHud.style.width = '400px';
    currentChiHud.style.background = 'rgba(0,0,0,0.85)';
    currentChiHud.style.padding = '10px 20px';
    currentChiHud.style.borderRadius = '20px';
    currentChiHud.style.border = '2px solid #3b82f6';
    currentChiHud.style.zIndex = '20';
    
    // Handle math safely
    const safeThreshold = nextUnlockThreshold > 0 ? nextUnlockThreshold : 100;
    const fillPercent = Math.min(100, Math.max(0, (currentVenueChi / safeThreshold) * 100));
    
    currentChiHud.innerHTML = `
      <div style="color: #fff; font-family: sans-serif; font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 8px;">
        ${currentName} CHI Progress (${Math.floor(currentVenueChi)} / ${nextUnlockThreshold})
      </div>
      <div style="width: 100%; height: 12px; background: #222; border-radius: 6px; overflow: hidden;">
        <div style="width: ${fillPercent}%; height: 100%; background: #FCD34D; box-shadow: 0 0 12px #FCD34D;"></div>
      </div>
    `;
    document.body.appendChild(currentChiHud);

    const recenterBtn = document.createElement('button');
    recenterBtn.id = 'recenter-btn';
    recenterBtn.style.position = 'absolute';
    recenterBtn.style.bottom = '40px';
    recenterBtn.style.left = '20px';
    recenterBtn.style.width = '60px';
    recenterBtn.style.height = '60px';
    recenterBtn.style.borderRadius = '30px';
    recenterBtn.style.background = '#3b82f6';
    recenterBtn.style.color = '#fff';
    recenterBtn.style.border = '2px solid #fff';
    recenterBtn.style.fontSize = '24px';
    recenterBtn.style.cursor = 'pointer';
    recenterBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    recenterBtn.style.zIndex = '20';
    recenterBtn.innerHTML = '🎯';
    recenterBtn.title = 'Recenter Camera';
    recenterBtn.addEventListener('click', () => {
      MapCameraController.lockOnNode(currentLng, currentLat);
    });
    document.body.appendChild(recenterBtn);
    
    
    // Logic to toggle stats visibility
    let statsVisible = true;
    document.getElementById('stats-toggle-btn')?.addEventListener('click', (e) => {
      statsVisible = !statsVisible;
      const content = document.getElementById('stats-content-area');
      const btn = e.target as HTMLElement;
      if (content) {
        if (statsVisible) {
          content.style.transform = 'translateX(0)';
          content.style.opacity = '1';
          content.style.pointerEvents = 'auto';
          btn.innerText = '◀ Hide Stats';
        } else {
          content.style.transform = 'translateX(-120%)';
          content.style.opacity = '0';
          content.style.pointerEvents = 'none';
          btn.innerText = '▶ Show Stats';
        }
      }
    });

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
    smogOverlay.style.transition = 'all 1s ease';
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
        const percent = maxChi > 0 ? (totalChi / maxChi) : 0;
        descBox.style.display = 'block';

        if (percent <= 0.25) {
          btn.style.background = '#dc2626'; // red
          smogOverlay.style.background = 'linear-gradient(to bottom, rgba(50, 40, 30, 0.4) 0%, rgba(30, 25, 20, 0.2) 100%)';
          smogOverlay.style.backdropFilter = 'grayscale(0.5) contrast(1.1)';
          smogOverlay.style.opacity = '1';
          descBox.style.border = '2px solid #dc2626';
          descBox.innerHTML = '<strong style="color:#dc2626; font-size: 24px;">Year 2076: The Drowned City</strong><br/><br/>Decades of unchecked waste, overflowing landfills, and polluted waterways have decimated New York City. A thick, toxic gray-brown smog chokes the air permanently. Even worse, the rising global temperatures have triggered a catastrophic sea level rise! Watch as a sludge of toxic ocean water rises up to swallow the streets. This is the bleak future of inaction.';
        } else if (percent <= 0.50) {
          btn.style.background = '#ea580c'; // orange
          smogOverlay.style.background = 'linear-gradient(to bottom, rgba(255, 200, 100, 0.15) 0%, rgba(255, 150, 50, 0.1) 100%)';
          smogOverlay.style.backdropFilter = 'saturate(1.2)';
          smogOverlay.style.opacity = '1';
          descBox.style.border = '2px solid #ea580c';
          descBox.innerHTML = '<strong style="color:#ea580c; font-size: 24px;">Year 2076: The Scorched Earth</strong><br/><br/>You stopped the oceans from rising, but failed to stop global warming. The rivers ran completely dry, leaving cracked dirt in their wake. An unrelenting heatwave bakes the city under a blinding, scorching sun. The city has become an uninhabitable concrete desert.';
        } else if (percent <= 0.74) {
          btn.style.background = '#4b5563'; // gray
          smogOverlay.style.background = 'linear-gradient(to bottom, rgba(100, 100, 80, 0.5) 0%, rgba(80, 80, 60, 0.3) 100%)';
          smogOverlay.style.backdropFilter = 'blur(1px) sepia(0.3)';
          smogOverlay.style.opacity = '1';
          descBox.style.border = '2px solid #9ca3af';
          descBox.innerHTML = `<strong style="color:#9ca3af; font-size: 24px;">Year 2076: The Great Smog</strong><br/><br/>The oceans didn't rise, and the rivers didn't dry up, but the air is barely breathable. Decades of industrial waste have choked the sky in a thick, yellowish-gray fog. The city is sterile, dull, and lifeless. Humanity survives, but at a miserable, suffocating cost.`;
        } else if (percent < 1.0) {
          btn.style.background = '#16a34a'; // green
          smogOverlay.style.background = 'linear-gradient(to bottom, rgba(150, 255, 200, 0.2) 0%, rgba(100, 200, 255, 0.1) 100%)';
          smogOverlay.style.backdropFilter = 'saturate(1.2)';
          smogOverlay.style.opacity = '1';
          descBox.style.border = '2px solid #16a34a';
          descBox.innerHTML = '<strong style="color:#16a34a; font-size: 24px;">Year 2076: Eco-Utopia</strong><br/><br/>Your incredible dedication to recycling and zero-waste initiatives has transformed New York City. The air is pristine, urban forests thrive among the skyscrapers, and the rivers are crystal clear. You have saved the city from environmental collapse.';
        } else {
          btn.style.background = '#ca8a04'; // gold
          smogOverlay.style.background = 'linear-gradient(to bottom, rgba(255, 215, 0, 0.1) 0%, rgba(255, 150, 0, 0.05) 100%)';
          smogOverlay.style.backdropFilter = 'saturate(1.3) contrast(1.1)';
          smogOverlay.style.opacity = '1';
          descBox.style.border = '2px solid #facc15';
          descBox.innerHTML = `<strong style="color:#facc15; font-size: 24px; text-shadow: 0 0 5px rgba(250,204,21,0.5);">Year 2076: The Golden Age</strong><br/><br/>A flawless, perfect equilibrium. You didn't just save the city—you elevated it into a beacon of environmental perfection for the rest of the world to follow. The air is perfectly pure, the water sparkles, and humanity thrives in perfect harmony with nature.`;
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
      document.getElementById('current-chi-hud')?.remove();
      document.getElementById('recenter-btn')?.remove();
      levelNodes.forEach(n => n.remove());
      PathOverlayService.removeFromMap();
      MapLibreService.toggleFutureVision(false, 0, 0); // Reset map style
      MapLibreService.hideMap();
    });
  }
}
