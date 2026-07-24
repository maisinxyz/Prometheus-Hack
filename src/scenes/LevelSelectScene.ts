import Phaser from 'phaser';
import { ChiSystem } from '../systems/ChiSystem';
import { GardenSystem } from '../systems/GardenSystem';
import venuesData from '../data/venues.json';
import codexData from '../data/codex.json';
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
      fontFamily: '"Nunito", sans-serif',
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
        banner.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #FBBF24, #F59E0B)';
        banner.style.color = '#fff';
        banner.style.padding = '15px 40px';
        banner.style.borderRadius = '30px';
        banner.style.fontWeight = 'bold';
        banner.style.fontSize = '24px';
        banner.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
        banner.style.boxShadow = 'inset 0 4px 0 rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.5)';
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

    const renderBar = (name: string, lvl: number, prog: number, locked: boolean, color: string) => `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #f8fafc; font-weight: 700; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; box-shadow: 0 0 6px ${color};"></div>
            <span>${name}</span>
          </div>
          <span style="color: #cbd5e1;">${locked ? '🔒 Needs Lvl 5' : `Lvl ${lvl}`}</span>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.4); border-radius: 4px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);">
          <div style="width: ${prog}%; height: 100%; background: ${locked ? '#475569' : color}; border-radius: 4px;"></div>
        </div>
      </div>
    `;

    uiContainer.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95)); backdrop-filter: blur(8px); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: inset 0 2px 4px rgba(255,255,255,0.05), 0 10px 25px rgba(0,0,0,0.4); width: 320px; box-sizing: border-box; position: relative;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="color: #f1f5f9; font-weight: 800; font-size: 18px; letter-spacing: 0.5px;">COMMUNITY GARDEN</div>
          <div id="stats-toggle-btn" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 4px 8px; font-size: 12px; border-radius: 5px; cursor: pointer; font-family: 'Nunito', sans-serif;">Hide</div>
        </div>

        <div id="stats-content-area" style="transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 800px; opacity: 1; overflow: hidden;">
          <div style="color: #facc15; font-family: 'Nunito', sans-serif; font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.8); margin-bottom: 16px;">
            Total CHI: ${Math.floor(totalChi)} / ${maxChi}
          </div>
          
          ${renderBar('Compost', compostLvl, compostProg, false, '#34D399')}
          ${renderBar('Recycling', this.gardenSystem.getRecyclingLevel(), recyclingProg, isLocked, '#3b82f6')}
          ${renderBar('Plastic', this.gardenSystem.getPlasticLevel(), plasticProg, isLocked, '#FBBF24')}
          ${renderBar('Landfill', this.gardenSystem.getLandfillLevel(), landfillProg, isLocked, '#9ca3af')}

          <div style="display: flex; gap: 8px; width: 100%; box-sizing: border-box; margin-top: 16px;">
            <button id="future-btn" style="flex: 1; background: linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #3b82f6, #2563eb); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); padding: 12px 4px; font-size: 13px; border-radius: 10px; cursor: pointer; font-weight: bold; box-shadow: inset 0 2px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(37,99,235,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.3); transition: transform 0.1s ease;">
              Future Vision
            </button>
            <button id="garden-btn" style="flex: 1; background: linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #0F9D74, #34D399); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); padding: 12px 4px; font-size: 13px; border-radius: 10px; cursor: pointer; font-weight: bold; box-shadow: inset 0 2px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(15,157,116,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.3); transition: transform 0.1s ease;">
              Community Park
            </button>
            <button id="codex-btn" style="flex: 1; background: linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #9333ea, #a855f7); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); padding: 12px 4px; font-size: 13px; border-radius: 10px; cursor: pointer; font-weight: bold; box-shadow: inset 0 2px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(168,85,247,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.3); transition: transform 0.1s ease;">
              Historical Snapshots
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(uiContainer);

    // 4.5 Task 2.5/2.6: Current CHI HUD & Recenter Button
    const currentChiHud = document.createElement('div');
    currentChiHud.id = 'current-chi-hud';
    currentChiHud.style.position = 'absolute';
    currentChiHud.style.bottom = '20px'; // very bottom
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
      <div style="color: #fff; font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 8px;">
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
    recenterBtn.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #0F9D74, #34D399)';
    recenterBtn.style.color = '#fff';
    recenterBtn.style.border = 'none';
    recenterBtn.style.fontSize = '24px';
    recenterBtn.style.cursor = 'pointer';
    recenterBtn.style.boxShadow = 'inset 0 4px 0 rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.3)';
    recenterBtn.style.zIndex = '20';
    recenterBtn.style.transition = 'transform 0.1s ease';
    recenterBtn.addEventListener('mousedown', () => recenterBtn.style.transform = 'scale(0.95)');
    recenterBtn.addEventListener('mouseup', () => recenterBtn.style.transform = 'scale(1)');
    recenterBtn.addEventListener('mouseleave', () => recenterBtn.style.transform = 'scale(1)');
    recenterBtn.style.display = 'flex';
    recenterBtn.style.alignItems = 'center';
    recenterBtn.style.justifyContent = 'center';
    recenterBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
      </svg>
    `;
    recenterBtn.title = 'Recenter Camera';
    recenterBtn.addEventListener('click', () => {
      MapCameraController.lockOnNode(currentLng, currentLat);
    });
    document.body.appendChild(recenterBtn);
    
    
    // Logic to toggle stats visibility
    let statsVisible = true;
    document.getElementById('stats-toggle-btn')?.addEventListener('click', () => {
      const content = document.getElementById('stats-content-area');
      const btn = document.getElementById('stats-toggle-btn');
      if (content && btn) {
        if (content.style.opacity !== '0') {
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
          content.style.pointerEvents = 'none';
          btn.innerText = 'Show';
        } else {
          content.style.maxHeight = '800px';
          content.style.opacity = '1';
          content.style.pointerEvents = 'auto';
          btn.innerText = 'Hide';
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
    weatherEventContainer.style.pointerEvents = 'auto'; // allow clicking close button
    weatherEventContainer.innerHTML = `
      <div id="close-weather-btn" style="position: absolute; top: 10px; right: 15px; color: #fff; cursor: pointer; font-size: 20px; font-family: 'Nunito', sans-serif; font-weight: bold;">&times;</div>
      <div style="font-family: Arial, sans-serif; font-size: 28px; color: ${weatherColor}; font-weight: bold; margin-bottom: 5px;">${weatherName}</div>
      <div style="font-family: Arial, sans-serif; font-size: 18px; color: #aaaaaa; margin-bottom: 5px;">${weatherDesc}</div>
      <div style="font-family: Arial, sans-serif; font-size: 18px; color: #ffffff; font-style: italic;">Effect: ${weatherEffect}</div>
    `;
    document.body.appendChild(weatherEventContainer);

    // Weather pull-out tab
    const weatherTab = document.createElement('div');
    weatherTab.id = 'weather-tab';
    weatherTab.style.position = 'absolute';
    weatherTab.style.bottom = '40px';
    weatherTab.style.right = '0px';
    weatherTab.style.background = 'rgba(220, 38, 38, 0.9)';
    weatherTab.style.color = '#fff';
    weatherTab.style.padding = '8px 12px';
    weatherTab.style.borderTopLeftRadius = '8px';
    weatherTab.style.borderBottomLeftRadius = '8px';
    weatherTab.style.cursor = 'pointer';
    weatherTab.style.display = 'none';
    weatherTab.style.zIndex = '20';
    weatherTab.style.fontFamily = "'Nunito', sans-serif";
    weatherTab.style.fontWeight = 'bold';
    weatherTab.style.fontSize = '14px';
    weatherTab.innerText = '◀ Weather';
    document.body.appendChild(weatherTab);

    // Make weather warning hideable
    setTimeout(() => {
      document.getElementById('close-weather-btn')?.addEventListener('click', () => {
        weatherEventContainer.style.display = 'none';
        weatherTab.style.display = 'block';
      });
      weatherTab.addEventListener('click', () => {
        weatherEventContainer.style.display = 'block';
        weatherTab.style.display = 'none';
      });
    }, 0);

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

    // --- Time Machine Codex UI ---
    const codexOverlay = document.createElement('div');
    codexOverlay.id = 'codex-overlay';
    codexOverlay.style.position = 'absolute';
    codexOverlay.style.top = '0';
    codexOverlay.style.left = '0';
    codexOverlay.style.width = '100vw';
    codexOverlay.style.height = '100vh';
    codexOverlay.style.background = 'rgba(15, 23, 42, 0.95)';
    codexOverlay.style.backdropFilter = 'blur(10px)';
    codexOverlay.style.zIndex = '100'; // Above everything
    codexOverlay.style.display = 'none';
    codexOverlay.style.alignItems = 'center';
    codexOverlay.style.justifyContent = 'center';

    const codexContainer = document.createElement('div');
    codexContainer.style.width = '90%';
    codexContainer.style.maxWidth = '1200px';
    codexContainer.style.height = '80%';
    codexContainer.style.display = 'flex';
    codexContainer.style.background = '#1e293b';
    codexContainer.style.borderRadius = '16px';
    codexContainer.style.border = '2px solid #a855f7';
    codexContainer.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)';
    codexContainer.style.overflow = 'hidden';

    // Left Panel: List of venues
    const codexList = document.createElement('div');
    codexList.style.width = '350px';
    codexList.style.background = '#0f172a';
    codexList.style.borderRight = '1px solid #334155';
    codexList.style.padding = '20px';
    codexList.style.overflowY = 'auto';
    
    const listHeader = document.createElement('div');
    listHeader.innerHTML = '<div style="color: #a855f7; font-size: 24px; font-weight: 900; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">Historical Snapshots</div><div style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">100% complete an area to unlock its historical snapshot.</div>';
    codexList.appendChild(listHeader);

    // Right Panel: Details
    const codexDetails = document.createElement('div');
    codexDetails.style.flex = '1';
    codexDetails.style.padding = '40px';
    codexDetails.style.display = 'flex';
    codexDetails.style.flexDirection = 'column';
    codexDetails.style.position = 'relative';

    const closeCodexBtn = document.createElement('button');
    closeCodexBtn.innerHTML = '&times;';
    closeCodexBtn.style.position = 'absolute';
    closeCodexBtn.style.top = '20px';
    closeCodexBtn.style.right = '20px';
    closeCodexBtn.style.background = 'transparent';
    closeCodexBtn.style.border = 'none';
    closeCodexBtn.style.color = '#94a3b8';
    closeCodexBtn.style.fontSize = '36px';
    closeCodexBtn.style.cursor = 'pointer';
    closeCodexBtn.onclick = () => {
      codexOverlay.style.display = 'none';
    };
    codexDetails.appendChild(closeCodexBtn);

    const detailsContent = document.createElement('div');
    detailsContent.style.flex = '1';
    detailsContent.style.display = 'flex';
    detailsContent.style.flexDirection = 'column';
    detailsContent.style.alignItems = 'center';
    detailsContent.style.justifyContent = 'center';
    detailsContent.innerHTML = '<div style="color: #64748b; font-size: 24px; font-style: italic;">Select an unlocked entry from the list to view its historical snapshot.</div>';
    codexDetails.appendChild(detailsContent);

    codexContainer.appendChild(codexList);
    codexContainer.appendChild(codexDetails);
    codexOverlay.appendChild(codexContainer);
    document.body.appendChild(codexOverlay);

    // Build the list
    const populateCodex = () => {
      // Clear existing list except header
      while (codexList.children.length > 1) {
        codexList.removeChild(codexList.lastChild!);
      }

      let unlockedEntries = 0;
      venuesData.forEach((venue: any) => {
        const venueChi = this.chiSystem.getChi(venue.id);
        const isMaxed = venueChi >= 100;
        
        const entry = document.createElement('div');
        entry.style.padding = '15px';
        entry.style.marginBottom = '10px';
        entry.style.borderRadius = '8px';
        entry.style.display = 'flex';
        entry.style.alignItems = 'center';
        entry.style.gap = '15px';
        entry.style.transition = 'all 0.2s';
        
        if (isMaxed) {
          unlockedEntries++;
          const codexEntry = codexData.find(c => c.venueId === venue.id);
          entry.style.background = 'rgba(168, 85, 247, 0.1)';
          entry.style.border = '1px solid rgba(168, 85, 247, 0.3)';
          entry.style.cursor = 'pointer';
          entry.innerHTML = `
            <div style="font-size: 24px;">🕰️</div>
            <div>
              <div style="color: #f1f5f9; font-weight: bold; font-size: 16px;">${venue.displayName}</div>
              <div style="color: #a855f7; font-size: 12px; margin-top: 4px;">UNLOCKED</div>
            </div>
          `;
          entry.onmouseenter = () => entry.style.background = 'rgba(168, 85, 247, 0.2)';
          entry.onmouseleave = () => entry.style.background = 'rgba(168, 85, 247, 0.1)';
          
          entry.onclick = () => {
            // Update right panel
            if (codexEntry) {
              const hasAfter = codexEntry.afterImageUrl && codexEntry.afterDescription;
              
              detailsContent.innerHTML = `
                <div style="width: 100%; height: 100%; overflow-y: auto; padding-right: 20px;">
                  <h2 style="color: #f1f5f9; font-size: 32px; margin-bottom: 10px; font-family: 'Nunito', sans-serif;">${codexEntry.title}</h2>
                  <div style="color: #a855f7; font-size: 18px; margin-bottom: 30px; font-weight: bold;">Location: ${venue.displayName}</div>
                  
                  ${hasAfter ? (
                    codexEntry.isHypotheticalFuture ? `
                    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                      <!-- CURRENT -->
                      <div style="flex: 1;">
                        <div style="color: #10b981; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">Current (Eco-Restored)</div>
                        <div style="width: 100%; height: 250px; background: #000; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border: 2px solid #334155;">
                          <img src="${codexEntry.afterImageUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: saturate(1.2) contrast(1.1);" onerror="this.style.display='none';" />
                        </div>
                        <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #10b981;">
                          ${codexEntry.afterDescription}
                        </div>
                      </div>
                      
                      <!-- FUTURE -->
                      <div style="flex: 1;">
                        <div style="color: #ef4444; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">Future (If we do nothing)</div>
                        <div style="width: 100%; height: 250px; background: #000; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border: 2px solid #334155;">
                          <img src="${codexEntry.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" onerror="this.style.display='none';" />
                        </div>
                        <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #ef4444;">
                          ${codexEntry.description}
                        </div>
                      </div>
                    </div>
                    ` : `
                    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                      <!-- BEFORE -->
                      <div style="flex: 1;">
                        <div style="color: #ef4444; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">Before (Historical)</div>
                        <div style="width: 100%; height: 250px; background: #000; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border: 2px solid #334155;">
                          <img src="${codexEntry.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; filter: sepia(0.4) contrast(1.1);" onerror="this.style.display='none';" />
                        </div>
                        <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #ef4444;">
                          ${codexEntry.description}
                        </div>
                      </div>
                      
                      <!-- AFTER -->
                      <div style="flex: 1;">
                        <div style="color: #10b981; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">After (Eco-Restored)</div>
                        <div style="width: 100%; height: 250px; background: #000; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border: 2px solid #334155;">
                          <img src="${codexEntry.afterImageUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: saturate(1.2) contrast(1.1);" onerror="this.style.display='none';" />
                        </div>
                        <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #10b981;">
                          ${codexEntry.afterDescription}
                        </div>
                      </div>
                    </div>
                  `
                  ) : `
                    <div style="width: 100%; max-width: 700px; height: 400px; background: #000; border-radius: 12px; margin-bottom: 30px; overflow: hidden; border: 2px solid #334155; position: relative;">
                      <img src="${codexEntry.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; filter: sepia(0.4) contrast(1.1);" onerror="this.style.display='none';" />
                    </div>
                    <div style="color: #cbd5e1; font-size: 18px; line-height: 1.6; max-width: 800px; text-align: left; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #a855f7;">
                      ${codexEntry.description}
                    </div>
                  `}
                </div>
              `;
            }
          };
        } else {
          entry.style.background = 'rgba(255,255,255,0.05)';
          entry.style.border = '1px solid rgba(255,255,255,0.1)';
          entry.innerHTML = `
            <div style="font-size: 24px; filter: grayscale(1); opacity: 0.5;">🔒</div>
            <div>
              <div style="color: #64748b; font-weight: bold; font-size: 16px;">${venue.displayName}</div>
              <div style="color: #475569; font-size: 12px; margin-top: 4px;">Reach 100 CHI to unlock</div>
            </div>
          `;
        }
        codexList.appendChild(entry);
      });
    };

    document.getElementById('codex-btn')?.addEventListener('click', () => {
      populateCodex();
      codexOverlay.style.display = 'flex';
    });

    // 5. Cleanup MapKit UI when leaving this scene
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.getElementById('level-select-ui')?.remove();
      document.getElementById('smog-overlay')?.remove();
      document.getElementById('future-desc-box')?.remove();
      document.getElementById('map-weather-event')?.remove();
      document.getElementById('weather-tab')?.remove();
      document.getElementById('current-chi-hud')?.remove();
      document.getElementById('recenter-btn')?.remove();
      document.getElementById('codex-overlay')?.remove();
      levelNodes.forEach(n => n.remove());
      PathOverlayService.removeFromMap();
      MapLibreService.toggleFutureVision(false, 0, 0); // Reset map style
      MapLibreService.hideMap();
    });
  }
}
