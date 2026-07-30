import Phaser from 'phaser';
import { ChiSystem } from '../systems/ChiSystem';
import { GardenSystem } from '../systems/GardenSystem';
import { UI_THEME } from '../config/UITheme';
import venuesData from '../data/venues.json';
import codexData from '../data/codex.json';
import { MapLibreService } from '../services/MapLibreService';
import { LevelNode, NodeState } from '../entities/LevelNode';
import { PathOverlayService } from '../services/PathOverlayService';
import { MapCameraController } from '../services/MapCameraController';
import { GlossyButton } from '../entities/GlossyButton';

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
    const playlist = [
      { key: 'map_music', title: 'Spring In My Step', artist: 'Silent Partner' },
      { key: 'summer_smile', title: 'Summer Smile', artist: 'Silent Partner' },
      { key: 'blue_skies', title: 'Blue Skies', artist: 'Silent Partner' },
      { key: 'candyland', title: 'Candyland', artist: 'Tobu' },
      { key: 'hope', title: 'Hope', artist: 'Tobu' },
      { key: 'ukelele', title: 'Ukelele', artist: 'Bensound' },
      { key: 'carefree', title: 'Carefree', artist: 'Kevin MacLeod' }
    ];
    // Attach playlist to scene so we can access it from the UI later
    (this as any).playlist = playlist;

    let trackIndex = parseInt(localStorage.getItem('currentTrackIndex') || '0', 10);
    if (isNaN(trackIndex) || trackIndex < 0 || trackIndex >= playlist.length) {
      trackIndex = 0;
    }
    (this as any).currentTrackIndex = trackIndex;

    const currentTrackKey = playlist[trackIndex].key;
    const initVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');

    // Stop any other currently playing tracks if we came from another scene
    playlist.forEach(track => {
      if (track.key !== currentTrackKey) {
        this.sound.stopByKey(track.key);
      }
    });

    let music = this.sound.get(currentTrackKey) as Phaser.Sound.WebAudioSound;
    if (!music) {
      music = this.sound.add(currentTrackKey) as Phaser.Sound.WebAudioSound;
    }
    
    // Clean up old listeners just in case
    music.removeAllListeners('complete');
    music.on('complete', () => {
      const rep = localStorage.getItem('musicRepeat') === 'true';
      if (!rep) {
        (this as any).changeTrackRef?.(1);
      } else {
        music.play({ volume: parseFloat(localStorage.getItem('musicVolume') ?? '0.5') });
      }
    });

    if (music.isPaused) {
      music.resume();
    } else if (!music.isPlaying) {
      const savedSeek = localStorage.getItem('musicSeek');
      if (savedSeek) {
        music.play({ seek: parseFloat(savedSeek), volume: initVolume });
      } else {
        music.play({ volume: initVolume });
      }
    }

    // Save seek position periodically so music resumes from the same spot
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        // Redefine music in case it changed via changeTrack
        const curKey = playlist[(this as any).currentTrackIndex].key;
        const curMusic = this.sound.get(curKey) as Phaser.Sound.WebAudioSound;
        if (curMusic && curMusic.isPlaying) {
          const seek = curMusic.seek;
          localStorage.setItem('musicSeek', seek.toString());
          (this as any).updateSeekUIRef?.(seek, curMusic.duration);
        }
      }
    });

    // Explicitly enforce volume
    music.setVolume(initVolume);

    this.chiSystem = new ChiSystem();
    this.gardenSystem = new GardenSystem();

    // 1. Initialize and show the 3D Apple MapKit view behind the canvas
    const isNewMap = !MapLibreService.getMap();
    try {
      await MapLibreService.createMap();
      MapLibreService.showMap();
      if (isNewMap) {
        MapLibreService.flyToGlobal();
      }
    } catch (e) {
      console.error("MapLibreService failed to initialize:", e);
    }



    // 2. Setup HUD Overlay (Transparent Phaser Canvas)
    // Title text removed per request

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
            if (isUnlocked) {
              const pList = (this as any).playlist;
              const tIdx = (this as any).currentTrackIndex;
              if (pList && pList[tIdx]) {
                const music = this.sound.get(pList[tIdx].key) as Phaser.Sound.WebAudioSound;
                if (music && music.isPlaying) {
                  localStorage.setItem('musicSeek', music.seek.toString());
                  music.pause();
                }
              }
              this.scene.start('LoadingScene', { target: 'TrayScene', targetData: { venueId: id } });
            }
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
        banner.style.top = '50%';
        banner.style.left = '50%';
        banner.style.transform = 'translate(-50%, -50%)';
        banner.style.background = 'linear-gradient(to bottom, rgba(20,30,40,0.95), rgba(10,15,20,0.98))';
        banner.style.border = '2px solid #FCD34D';
        banner.style.color = '#fff';
        banner.style.padding = '30px 50px';
        banner.style.borderRadius = '20px';
        banner.style.textAlign = 'center';
        banner.style.boxShadow = '0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(252, 211, 77, 0.4)';
        banner.style.zIndex = '9999';
        
        banner.innerHTML = `
          <div style="font-size: 18px; color: #FCD34D; margin-bottom: 10px; font-weight: bold; font-family: 'Nunito', sans-serif;">NEW LOCATION UNLOCKED</div>
          <div style="font-size: 40px; font-weight: 900; margin-bottom: 25px; font-family: 'Nunito', sans-serif; text-transform: uppercase;">${currentName}!</div>
          <button id="banner-ok-btn" style="background: linear-gradient(90deg, #FBBF24, #F59E0B); color: #000; font-weight: 900; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-size: 20px; transition: transform 0.1s ease; outline: none;">AWESOME!</button>
        `;
        document.body.appendChild(banner);
        
        const okBtn = document.getElementById('banner-ok-btn');
        if (okBtn) {
          okBtn.addEventListener('mouseover', () => okBtn.style.transform = 'scale(1.05)');
          okBtn.addEventListener('mouseout', () => okBtn.style.transform = 'scale(1)');
          okBtn.addEventListener('click', () => {
            banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            banner.style.opacity = '0';
            banner.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
              banner.remove();
              
              if (unlockedCount === 2 && !localStorage.getItem('trashdash_snapshots_tutorial_done')) {
                const tutOverlay = document.createElement('div');
                tutOverlay.id = 'snapshots-tutorial-overlay';
                tutOverlay.style.position = 'fixed';
                tutOverlay.style.top = '250px';
                tutOverlay.style.left = '50%';
                tutOverlay.style.transform = 'translateX(-50%)';
                tutOverlay.style.background = 'rgba(20,30,40,0.95)';
                tutOverlay.style.border = '2px solid #a855f7';
                tutOverlay.style.color = '#fff';
                tutOverlay.style.padding = '20px 40px';
                tutOverlay.style.borderRadius = '16px';
                tutOverlay.style.fontSize = '24px';
                tutOverlay.style.fontFamily = '"Nunito", sans-serif';
                tutOverlay.style.fontWeight = 'bold';
                tutOverlay.style.zIndex = '9999';
                tutOverlay.style.textAlign = 'center';
                tutOverlay.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(168, 85, 247, 0.4)';
                tutOverlay.innerHTML = '🎉 Congratulations on unlocking your first new location!<br/><br/>Check out <span style="color: #a855f7">Snapshots</span> (the purple button) and see where it is!';
                document.body.appendChild(tutOverlay);
                
                (window as any)._snapshotsTutorialStep = 1;
              }
            }, 300);
          });
        }

        MapCameraController.driftToNode(currentLng, currentLat, 2000);
        localStorage.setItem('trashdash_last_unlocked_count', unlockedCount.toString());
      } else {
        MapCameraController.lockOnNode(currentLng, currentLat);
      }
    };

    if (map) {
      if (map.isStyleLoaded()) {
        setupMapLayers();
      } else {
        map.once('style.load', setupMapLayers);
      }

      // --- Map Controls Tutorial for New Games ---
      if (!localStorage.getItem('trashdash_map_tutorial_done')) {
        const tutOverlay = document.createElement('div');
        tutOverlay.id = 'map-tutorial-overlay';
        tutOverlay.style.position = 'fixed';
        tutOverlay.style.top = '250px';
        tutOverlay.style.left = '50%';
        tutOverlay.style.transform = 'translateX(-50%)';
        tutOverlay.style.background = 'rgba(20,30,40,0.95)';
        tutOverlay.style.border = '2px solid #3b82f6';
        tutOverlay.style.color = '#fff';
        tutOverlay.style.padding = '20px 40px';
        tutOverlay.style.borderRadius = '16px';
        tutOverlay.style.fontSize = '24px';
        tutOverlay.style.fontFamily = '"Nunito", sans-serif';
        tutOverlay.style.fontWeight = 'bold';
        tutOverlay.style.pointerEvents = 'none';
        tutOverlay.style.zIndex = '9999';
        tutOverlay.style.textAlign = 'center';
        tutOverlay.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(59, 130, 246, 0.4)';
        tutOverlay.innerHTML = '🖱️ Hold <span style="color: #4ade80">Left-Click</span> and drag to move around the map!';
        document.body.appendChild(tutOverlay);

        let step = 1;
        const onLeftDrag = () => {
          if (step !== 1) return;
          step = 2;
          tutOverlay.innerHTML = '🖱️ Hold <span style="color: #60a5fa">Right-Click</span> and drag to change perspectives!';
          map.off('dragstart', onLeftDrag);
        };

        const onRightDrag = () => {
          if (step !== 2) return;
          step = 3;
          tutOverlay.innerHTML = '🖱️ Use your <span style="color: #f472b6">Scroll Wheel</span> to zoom in and out!';
          map.off('pitchstart', onRightDrag);
          map.off('rotatestart', onRightDrag);
          map.off('contextmenu', onRightDrag);
        };

        const onScrollZoom = () => {
          if (step !== 3) return;
          step = 4;
          tutOverlay.innerHTML = '🖱️ Click on <span style="color: #fcd34d">Construction Zone</span> to begin your first cleanup!';
          localStorage.setItem('trashdash_map_tutorial_done', 'true');
          map.off('zoomstart', onScrollZoom);
        };

        map.on('dragstart', onLeftDrag);
        map.on('pitchstart', onRightDrag);
        map.on('rotatestart', onRightDrag);
        map.on('contextmenu', onRightDrag);
        map.on('zoomstart', onScrollZoom);
      } else if (localStorage.getItem('trashdash_interactive_tutorial_complete') === 'true' && !localStorage.getItem('trashdash_map_return_tutorial_done')) {
        const returnTut = document.createElement('div');
        returnTut.id = 'map-return-tutorial';
        returnTut.style.position = 'fixed';
        returnTut.style.top = '150px';
        returnTut.style.left = '50%';
        returnTut.style.transform = 'translateX(-50%)';
        returnTut.style.background = 'rgba(20,30,40,0.95)';
        returnTut.style.border = '2px solid #facc15';
        returnTut.style.color = '#fff';
        returnTut.style.padding = '20px 40px';
        returnTut.style.borderRadius = '16px';
        returnTut.style.fontSize = '20px';
        returnTut.style.fontFamily = '"Nunito", sans-serif';
        returnTut.style.zIndex = '9999';
        returnTut.style.textAlign = 'center';
        returnTut.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8)';
        returnTut.style.maxWidth = '600px';

        const showStep1 = () => {
          returnTut.innerHTML = `
            <h2 style="margin:0 0 15px 0; color:#facc15;">Great Job on your first cleanup!</h2>
            <p style="margin:0 0 20px 0; line-height: 1.5;">You need to gain enough <span style="color:#60a5fa; font-weight:bold;">CHI</span> to unlock the next level! Your CHI progress is shown at the bottom of the screen.</p>
            <button id="tut-ok-1" style="background:#facc15; color:#000; font-weight:bold; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-size:18px; outline:none;">OK</button>
          `;
          document.getElementById('tut-ok-1')?.addEventListener('click', showStep2);
        };

        const showStep2 = () => {
          returnTut.innerHTML = `
            <h2 style="margin:0 0 15px 0; color:#4ade80;">Community Garden Levels</h2>
            <p style="margin:0 0 20px 0; line-height: 1.5; font-size:18px;">
              For every correct item you place in the trash, it is converted into the UI! 
              <br><br>
              As you sort items into <span style="color:#34D399;">Compost</span>, <span style="color:#3b82f6;">Recycling</span>, <span style="color:#9ca3af;">Landfill</span>, and <span style="color:#FBBF24;">Plastic</span>, your Community Park levels up!
              <br><br>
              Check out the Community Park now by clicking the "Park" button on the left!
            </p>
          `;
          
          const checkPark = setInterval(() => {
            if (localStorage.getItem('trashdash_visited_park') === 'true') {
              clearInterval(checkPark);
              returnTut.remove();
              localStorage.setItem('trashdash_map_return_tutorial_done', 'true');
            }
          }, 500);
          
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => clearInterval(checkPark));
        };

        if (localStorage.getItem('trashdash_visited_park') === 'true') {
          // If they already visited the park somehow, skip the tutorial entirely
          localStorage.setItem('trashdash_map_return_tutorial_done', 'true');
        } else {
          document.body.appendChild(returnTut);
          showStep1();
        }
      }
    } else {
      console.warn("MapLibre map is not available. Skipping map layers and building fallback UI.");
      this.buildFallbackLevelUI(unlockedCount);
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
    uiContainer.style.right = 'auto'; 
    uiContainer.style.zIndex = '20';
    uiContainer.style.pointerEvents = 'auto';
    uiContainer.style.transition = 'opacity 0.3s ease';

    const styleEl = document.createElement('style');
    styleEl.id = 'level-select-styles';
    styleEl.innerHTML = `
      #future-btn, #garden-btn, #codex-btn,
      #recenter-btn, #help-btn, #objective-btn, #map-help-btn {
        transition: transform 0.2s ease, filter 0.2s ease, opacity 0.3s ease !important;
      }
      #future-btn:hover, #garden-btn:hover, #codex-btn:hover,
      #recenter-btn:hover, #help-btn:hover, #objective-btn:hover, #map-help-btn:hover {
        transform: scale(1.15) !important;
        filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 5px rgba(255, 255, 255, 0.8)) !important;
        z-index: 100 !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    
    const compostLvl = this.gardenSystem.getCompostLevel();
    const isLocked = compostLvl < 5;
    const compostProg = (this.gardenSystem.getRawCount('compost') % 30) / 30 * 100;
    const recyclingProg = (this.gardenSystem.getRawCount('recycling') % 30) / 30 * 100;
    const plasticProg = (this.gardenSystem.getRawCount('plastic') % 30) / 30 * 100;
    const landfillProg = (this.gardenSystem.getRawCount('landfill') % 50) / 50 * 100;

    const renderBar = (name: string, lvl: number, prog: number, locked: boolean, color: string, rawCount: number, increment: number, maxLvl: number) => {
      let progText = "";
      if (!locked) {
        if (lvl >= maxLvl) progText = ` <span style="font-size: 9px; opacity: 0.7; margin-left: 4px;">(MAX)</span>`;
        else progText = ` <span style="font-size: 9px; opacity: 0.7; margin-left: 4px;">(${rawCount % increment}/${increment})</span>`;
      }
      return `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #f8fafc; font-weight: 700; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; box-shadow: 0 0 4px ${color};"></div>
            <span>${name}</span>
          </div>
          <div style="display: flex; align-items: center;">
             <span style="color: #cbd5e1;">${locked ? '🔒 Needs Lvl 5' : `Lvl ${lvl}`}</span>
             ${progText}
          </div>
        </div>
        <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.4); border-radius: 2px; overflow: hidden;">
          <div style="width: ${prog}%; height: 100%; background: ${locked ? '#475569' : color}; border-radius: 2px;"></div>
        </div>
      </div>
    `};

    uiContainer.innerHTML = `
      <div id="stats-wrapper" style="background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 220px; box-sizing: border-box; position: relative; transition: all 0.3s ease;">
        
        <div id="stats-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; transition: margin 0.3s ease;">
          <div id="stats-title" style="color: #f1f5f9; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; transition: opacity 0.2s ease;">COMMUNITY GARDEN</div>
          <div id="stats-toggle-btn" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 2px 6px; font-size: 10px; border-radius: 4px; cursor: pointer; font-family: 'Nunito', sans-serif;">Hide</div>
        </div>

        <div id="stats-content-area" style="transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 800px; opacity: 1; overflow: hidden;">
          <div style="color: #facc15; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.8); margin-bottom: 10px;">
            Total CHI: ${Math.floor(totalChi)} / ${maxChi}
          </div>
          
          ${renderBar('Compost', compostLvl, compostProg, false, '#34D399', this.gardenSystem.getRawCount('compost'), 30, 10)}
          ${renderBar('Recycling', this.gardenSystem.getRecyclingLevel(), recyclingProg, isLocked, '#3b82f6', this.gardenSystem.getRawCount('recycling'), 30, 10)}
          ${renderBar('Plastic', this.gardenSystem.getPlasticLevel(), plasticProg, isLocked, '#FBBF24', this.gardenSystem.getRawCount('plastic'), 30, 10)}
          ${renderBar('Landfill', this.gardenSystem.getLandfillLevel(), landfillProg, isLocked, '#9ca3af', this.gardenSystem.getRawCount('landfill'), 50, 5)}

          <div style="display: flex; gap: 4px; width: 100%; box-sizing: border-box; margin-top: 10px; flex-direction: column;">
            <div style="display: flex; gap: 4px; width: 100%;">
              <button id="future-btn" style="flex: 1; background: rgba(37,99,235,0.8); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); padding: 6px 2px; font-size: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: transform 0.1s ease;">
                Vision
              </button>
              <button id="garden-btn" style="flex: 1; background: rgba(15,157,116,0.8); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); padding: 6px 2px; font-size: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: transform 0.1s ease;">
                Park
              </button>
            </div>
            <button id="codex-btn" style="width: 100%; background: rgba(147,51,234,0.8); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); padding: 6px 2px; font-size: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: transform 0.1s ease;">
              Snapshots
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
    currentChiHud.style.transition = 'opacity 0.3s ease';
    
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
    recenterBtn.style.transition = 'transform 0.1s ease, opacity 0.3s ease';
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

    const helpBtn = document.createElement('button');
    helpBtn.id = 'help-btn';
    helpBtn.style.position = 'absolute';
    helpBtn.style.bottom = '40px';
    helpBtn.style.left = '90px'; // 20px (recenter left) + 60px (recenter width) + 10px spacing
    helpBtn.style.width = '60px';
    helpBtn.style.height = '60px';
    helpBtn.style.borderRadius = '30px';
    helpBtn.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #0F9D74, #34D399)';
    helpBtn.style.color = '#fff';
    helpBtn.style.border = 'none';
    helpBtn.style.fontSize = '14px';
    helpBtn.style.fontWeight = 'bold';
    helpBtn.style.fontFamily = "'Nunito', sans-serif";
    helpBtn.style.cursor = 'pointer';
    helpBtn.style.boxShadow = 'inset 0 4px 0 rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.3)';
    helpBtn.style.zIndex = '20';
    helpBtn.style.transition = 'transform 0.1s ease, opacity 0.3s ease';
    helpBtn.addEventListener('mousedown', () => helpBtn.style.transform = 'scale(0.95)');
    helpBtn.addEventListener('mouseup', () => helpBtn.style.transform = 'scale(1)');
    helpBtn.addEventListener('mouseleave', () => helpBtn.style.transform = 'scale(1)');
    helpBtn.id = 'map-help-btn';
    helpBtn.style.display = 'flex';
    helpBtn.style.alignItems = 'center';
    helpBtn.style.justifyContent = 'center';
    helpBtn.innerText = 'HELP';
    helpBtn.title = 'How To Play';
    helpBtn.addEventListener('click', () => {
      this.scene.launch('HowToPlayOverlay');
    });
    document.body.appendChild(helpBtn);
      
    const objectiveBtn = document.createElement('button');
    objectiveBtn.id = 'objective-btn';
    objectiveBtn.style.position = 'absolute';
    objectiveBtn.style.bottom = '40px';
    objectiveBtn.style.left = '160px'; // 90px (help btn left) + 60px (help btn width) + 10px spacing
    objectiveBtn.style.width = '60px';
    objectiveBtn.style.height = '60px';
    objectiveBtn.style.borderRadius = '30px';
    objectiveBtn.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #047857, #10b981)';
    objectiveBtn.style.color = '#fff';
    objectiveBtn.style.border = 'none';
    objectiveBtn.style.fontSize = '12px';
    objectiveBtn.style.fontWeight = 'bold';
    objectiveBtn.style.fontFamily = "'Nunito', sans-serif";
    objectiveBtn.style.cursor = 'pointer';
    objectiveBtn.style.boxShadow = 'inset 0 4px 0 rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.3)';
    objectiveBtn.style.zIndex = '20';
    objectiveBtn.style.transition = 'transform 0.1s ease, opacity 0.3s ease';
    objectiveBtn.addEventListener('mousedown', () => objectiveBtn.style.transform = 'scale(0.95)');
    objectiveBtn.addEventListener('mouseup', () => objectiveBtn.style.transform = 'scale(1)');
    objectiveBtn.addEventListener('mouseleave', () => objectiveBtn.style.transform = 'scale(1)');
    objectiveBtn.style.display = 'flex';
    objectiveBtn.style.alignItems = 'center';
    objectiveBtn.style.justifyContent = 'center';
    objectiveBtn.style.textAlign = 'center';
    objectiveBtn.style.lineHeight = '1.2';
    objectiveBtn.innerHTML = 'WHY IT<br>MATTERS';
    objectiveBtn.title = 'Environmental Impact Objective';
    objectiveBtn.addEventListener('click', () => {
      this.scene.launch('ObjectiveOverlay');
    });
    document.body.appendChild(objectiveBtn);
    // Add Music Player UI
    const playerContainer = document.createElement('div');
    playerContainer.id = 'music-player-container';
    playerContainer.style.position = 'absolute';
    playerContainer.style.bottom = '110px';
    playerContainer.style.left = '20px';
    playerContainer.style.background = 'rgba(15, 23, 42, 0.85)';
    playerContainer.style.padding = '12px';
    playerContainer.style.borderRadius = '12px';
    playerContainer.style.display = 'flex';
    playerContainer.style.flexDirection = 'column';
    playerContainer.style.gap = '8px';
    playerContainer.style.backdropFilter = 'blur(6px)';
    playerContainer.style.border = '1px solid rgba(255, 255, 255, 0.15)';
    playerContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
    playerContainer.style.color = '#f1f5f9';
    playerContainer.style.fontFamily = "'Nunito', sans-serif";
    playerContainer.style.zIndex = '20';
    playerContainer.style.width = '200px';

    // Track Info Row
    const trackInfoRow = document.createElement('div');
    trackInfoRow.style.display = 'flex';
    trackInfoRow.style.justifyContent = 'space-between';
    trackInfoRow.style.alignItems = 'center';

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&#9664;&#9664;'; // ⏮
    prevBtn.style.background = 'none';
    prevBtn.style.border = 'none';
    prevBtn.style.color = '#94a3b8';
    prevBtn.style.cursor = 'pointer';
    prevBtn.style.fontSize = '14px';

    const trackDetails = document.createElement('div');
    trackDetails.style.display = 'flex';
    trackDetails.style.flexDirection = 'column';
    trackDetails.style.alignItems = 'center';
    trackDetails.style.textAlign = 'center';
    trackDetails.style.flex = '1';
    trackDetails.style.overflow = 'hidden';

    const trackTitle = document.createElement('div');
    trackTitle.style.fontWeight = 'bold';
    trackTitle.style.fontSize = '12px';
    trackTitle.style.whiteSpace = 'nowrap';
    trackTitle.style.overflow = 'hidden';
    trackTitle.style.textOverflow = 'ellipsis';
    trackTitle.style.width = '120px';
    
    const trackArtist = document.createElement('div');
    trackArtist.style.fontSize = '10px';
    trackArtist.style.color = '#94a3b8';
    trackArtist.style.whiteSpace = 'nowrap';
    trackArtist.style.overflow = 'hidden';
    trackArtist.style.textOverflow = 'ellipsis';
    trackArtist.style.width = '120px';

    trackDetails.appendChild(trackTitle);
    trackDetails.appendChild(trackArtist);

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&#9654;&#9654;'; // ⏭
    nextBtn.style.background = 'none';
    nextBtn.style.border = 'none';
    nextBtn.style.color = '#94a3b8';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.fontSize = '14px';

    trackInfoRow.appendChild(prevBtn);
    trackInfoRow.appendChild(trackDetails);
    trackInfoRow.appendChild(nextBtn);

    const repeatBtn = document.createElement('button');
    repeatBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="17 1 21 5 17 9"></polyline>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
        <polyline points="7 23 3 19 7 15"></polyline>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
      </svg>
    `;
    repeatBtn.style.background = 'none';
    repeatBtn.style.border = 'none';
    const isRepeating = localStorage.getItem('musicRepeat') === 'true';
    repeatBtn.style.color = isRepeating ? '#10b981' : '#94a3b8';
    repeatBtn.style.filter = isRepeating ? 'drop-shadow(0 0 4px #10b981)' : 'none';
    repeatBtn.style.cursor = 'pointer';
    repeatBtn.style.display = 'flex';
    repeatBtn.style.alignItems = 'center';
    repeatBtn.style.justifyContent = 'center';
    repeatBtn.style.marginLeft = '8px';

    // Seek Row
    const seekRow = document.createElement('div');
    seekRow.style.display = 'flex';
    seekRow.style.alignItems = 'center';
    seekRow.style.gap = '8px';
    seekRow.style.justifyContent = 'center';
    seekRow.style.marginTop = '4px';
    seekRow.style.marginBottom = '4px';

    const timeDisplayLeft = document.createElement('div');
    timeDisplayLeft.style.fontSize = '10px';
    timeDisplayLeft.style.color = '#94a3b8';
    timeDisplayLeft.style.minWidth = '30px';
    timeDisplayLeft.style.textAlign = 'right';
    timeDisplayLeft.innerText = '0:00';
    timeDisplayLeft.style.fontVariantNumeric = 'tabular-nums';
    
    const timeDisplayRight = document.createElement('div');
    timeDisplayRight.style.fontSize = '10px';
    timeDisplayRight.style.color = '#94a3b8';
    timeDisplayRight.style.minWidth = '30px';
    timeDisplayRight.style.textAlign = 'left';
    timeDisplayRight.innerText = '-0:00';
    timeDisplayRight.style.fontVariantNumeric = 'tabular-nums';

    const seekSlider = document.createElement('input');
    seekSlider.type = 'range';
    seekSlider.min = '0';
    seekSlider.max = '100';
    seekSlider.value = '0';
    seekSlider.style.flex = '1';
    
    seekRow.appendChild(timeDisplayLeft);
    seekRow.appendChild(seekSlider);
    seekRow.appendChild(timeDisplayRight);

    // Volume Row
    const volumeRow = document.createElement('div');
    volumeRow.style.display = 'flex';
    volumeRow.style.alignItems = 'center';
    volumeRow.style.gap = '8px';
    volumeRow.style.justifyContent = 'center';

    const volIcon = document.createElement('span');
    volIcon.innerHTML = '&#128266;'; // 🔊
    volIcon.style.fontSize = '12px';

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.01';
    const savedVolume = localStorage.getItem('musicVolume') ?? '0.5';
    volumeSlider.value = savedVolume;
    volumeSlider.style.width = '120px';
    
    volumeRow.appendChild(volIcon);
    volumeRow.appendChild(volumeSlider);
    volumeRow.appendChild(repeatBtn);

    playerContainer.appendChild(trackInfoRow);
    playerContainer.appendChild(seekRow);
    playerContainer.appendChild(volumeRow);
    document.body.appendChild(playerContainer);

    // Playback Logic
    const activePlaylist = (this as any).playlist;
    
    const updatePlayerUI = () => {
      const idx = (this as any).currentTrackIndex;
      trackTitle.innerText = activePlaylist[idx].title;
      trackArtist.innerText = activePlaylist[idx].artist;
    };
    
    updatePlayerUI(); // Init

    let isDraggingSeek = false;
    (this as any).updateSeekUIRef = (seek: number, duration: number) => {
      if (isDraggingSeek || isNaN(duration)) return;
      seekSlider.max = duration.toString();
      seekSlider.value = seek.toString();
      
      const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };
      const timeLeft = duration - seek;
      timeDisplayLeft.innerText = `${formatTime(seek)}`;
      timeDisplayRight.innerText = `-${formatTime(timeLeft)}`;
    };

    const changeTrack = (dir) => {
      // Stop current
      const oldIdx = (this as any).currentTrackIndex;
      this.sound.stopByKey(activePlaylist[oldIdx].key);
      
      // Update index
      let newIdx = oldIdx + dir;
      if (newIdx < 0) newIdx = activePlaylist.length - 1;
      if (newIdx >= activePlaylist.length) newIdx = 0;
      (this as any).currentTrackIndex = newIdx;
      localStorage.setItem('currentTrackIndex', newIdx.toString());
      
      // Play new
      const vol = parseFloat(volumeSlider.value);
      const curKey = activePlaylist[newIdx].key;
      let newMusic = this.sound.get(curKey);
      if (!newMusic) newMusic = this.sound.add(curKey);
      
      newMusic.removeAllListeners('complete');
      newMusic.on('complete', () => {
        const rep = localStorage.getItem('musicRepeat') === 'true';
        if (!rep) changeTrack(1);
        else newMusic.play({ volume: parseFloat(volumeSlider.value) });
      });
      newMusic.play({ volume: vol });
      
      updatePlayerUI();
    };
    (this as any).changeTrackRef = changeTrack;

    repeatBtn.addEventListener('click', () => {
      const currentRep = localStorage.getItem('musicRepeat') === 'true';
      const newRep = !currentRep;
      localStorage.setItem('musicRepeat', newRep.toString());
      repeatBtn.style.color = newRep ? '#10b981' : '#94a3b8';
      repeatBtn.style.filter = newRep ? 'drop-shadow(0 0 4px #10b981)' : 'none';
    });

    seekSlider.addEventListener('mousedown', () => isDraggingSeek = true);
    seekSlider.addEventListener('touchstart', () => isDraggingSeek = true);
    
    const applySeek = () => {
      isDraggingSeek = false;
      const curKey = activePlaylist[(this as any).currentTrackIndex].key;
      const music = this.sound.get(curKey);
      if (music && music.isPlaying) {
        const vol = parseFloat(volumeSlider.value);
        const seekVal = parseFloat(seekSlider.value);
        music.play({ seek: seekVal, volume: vol });
        localStorage.setItem('musicSeek', seekVal.toString());
      }
    };
    
    seekSlider.addEventListener('mouseup', applySeek);
    seekSlider.addEventListener('touchend', applySeek);
    seekSlider.addEventListener('change', applySeek);

    prevBtn.addEventListener('click', () => changeTrack(-1));
    nextBtn.addEventListener('click', () => changeTrack(1));

    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      localStorage.setItem('musicVolume', vol.toString());
      
      const curKey = activePlaylist[(this as any).currentTrackIndex].key;
      const music = this.sound.get(curKey);
      if (music) {
        music.setVolume(vol);
      }
    });

    
    // Logic to toggle stats visibility
    document.getElementById('stats-toggle-btn')?.addEventListener('click', () => {
      const content = document.getElementById('stats-content-area');
      const btn = document.getElementById('stats-toggle-btn');
      const wrapper = document.getElementById('stats-wrapper');
      const header = document.getElementById('stats-header');
      const title = document.getElementById('stats-title');
      
      if (content && btn && wrapper && header && title) {
        if (content.style.opacity !== '0') {
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
          content.style.pointerEvents = 'none';
          
          wrapper.style.padding = '8px 12px';
          wrapper.style.width = 'auto';
          header.style.marginBottom = '0px';
          title.style.opacity = '0';
          title.style.width = '0px';
          title.style.overflow = 'hidden';
          
          btn.innerText = 'Show Stats';
        } else {
          content.style.maxHeight = '800px';
          content.style.opacity = '1';
          content.style.pointerEvents = 'auto';
          
          wrapper.style.padding = '12px';
          wrapper.style.width = '220px';
          header.style.marginBottom = '10px';
          title.style.opacity = '1';
          title.style.width = 'auto';
          
          btn.innerText = 'Hide';
        }
      }
    });

    document.getElementById('garden-btn')?.addEventListener('click', () => {
      const pList = (this as any).playlist;
      const tIdx = (this as any).currentTrackIndex;
      if (pList && pList[tIdx]) {
        const music = this.sound.get(pList[tIdx].key) as Phaser.Sound.WebAudioSound;
        if (music && music.isPlaying) {
          localStorage.setItem('musicSeek', music.seek.toString());
          music.pause();
        }
      }
      this.scene.start('LoadingScene', { target: 'CommunityGardenScene', targetData: {} });
    });

    const weatherEventContainer = document.createElement('div');
    weatherEventContainer.id = 'map-weather-event';
    weatherEventContainer.style.position = 'absolute';
    weatherEventContainer.style.top = 'auto';
    weatherEventContainer.style.bottom = '20px';
    weatherEventContainer.style.left = 'auto';
    weatherEventContainer.style.right = '20px';
    weatherEventContainer.style.width = '240px';
    weatherEventContainer.style.background = `linear-gradient(135deg, ${UI_THEME.primaryGradient[0]}33, ${UI_THEME.primaryGradient[1]}66)`; // semi-transparent theme colors
    weatherEventContainer.style.backdropFilter = 'blur(12px)';
    weatherEventContainer.style.borderRadius = `${UI_THEME.cornerRadius}px`;
    weatherEventContainer.style.border = `2px solid ${weatherColor}`;
    weatherEventContainer.style.boxShadow = `inset 0 4px 6px rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.5), 0 0 15px ${weatherColor}80`;
    weatherEventContainer.style.padding = '16px';
    weatherEventContainer.style.zIndex = '20';
    weatherEventContainer.style.pointerEvents = 'auto'; // allow clicking close button
    weatherEventContainer.style.transition = 'opacity 0.3s ease';
    weatherEventContainer.innerHTML = `
      <div id="close-weather-btn" style="position: absolute; top: 8px; right: 12px; color: #94a3b8; cursor: pointer; font-size: 18px; font-family: 'Nunito', sans-serif; font-weight: bold; line-height: 1; transition: color 0.2s;">&times;</div>
      <div style="font-family: 'Nunito', sans-serif; font-size: 14px; color: ${weatherColor}; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase; padding-right: 16px;">${weatherName}</div>
      <div style="font-family: 'Nunito', sans-serif; font-size: 12px; color: #cbd5e1; margin-bottom: 8px; line-height: 1.2;">${weatherDesc}</div>
      <div style="font-family: 'Nunito', sans-serif; font-size: 11px; color: #f8fafc; font-weight: bold; background: rgba(0,0,0,0.3); padding: 6px 8px; border-radius: 6px; border-left: 2px solid ${weatherColor};">Effect: ${weatherEffect}</div>
    `;
    document.body.appendChild(weatherEventContainer);

    // Weather pull-out tab
    const weatherTab = document.createElement('div');
    weatherTab.id = 'weather-tab';
    weatherTab.style.position = 'absolute';
    weatherTab.style.top = 'auto';
    weatherTab.style.bottom = '20px';
    weatherTab.style.left = 'auto';
    weatherTab.style.right = '0px';
    weatherTab.style.background = 'rgba(220, 38, 38, 0.9)';
    weatherTab.style.color = '#fff';
    weatherTab.style.padding = '6px 10px';
    weatherTab.style.borderTopLeftRadius = '8px';
    weatherTab.style.borderBottomLeftRadius = '8px';
    weatherTab.style.cursor = 'pointer';
    weatherTab.style.display = 'none';
    weatherTab.style.zIndex = '20';
    weatherTab.style.fontFamily = "'Nunito', sans-serif";
    weatherTab.style.fontWeight = 'bold';
    weatherTab.style.fontSize = '12px';
    weatherTab.style.transition = 'opacity 0.3s ease';
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

    // Map movement translucency logic
    let moveTimeout: any;
    const setHudOpacity = (opacity: string) => {
      uiContainer.style.opacity = opacity;
      currentChiHud.style.opacity = opacity;
      recenterBtn.style.opacity = opacity;
      helpBtn.style.opacity = opacity;
      objectiveBtn.style.opacity = opacity;
      playerContainer.style.opacity = opacity;
      weatherEventContainer.style.opacity = opacity;
      weatherTab.style.opacity = opacity;
    };

    map?.on('movestart', () => {
      clearTimeout(moveTimeout);
      setHudOpacity('0.25');
    });
    
    map?.on('moveend', () => {
      clearTimeout(moveTimeout);
      setHudOpacity('1');
    });

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
      
      if ((window as any)._snapshotsTutorialStep === 3 && isFutureVisionActive) {
         const tutOverlay = document.getElementById('snapshots-tutorial-overlay');
         if (tutOverlay) {
           tutOverlay.innerHTML = 'This is <span style="color: #3b82f6">Future Vision</span>!<br/><br/>It shows 5 possible futures based on your Total CHI. Improve your future by cleaning up more areas!<br/><br/><span style="color: #dc2626">0-25% CHI</span>: The Drowned City<br/><span style="color: #ea580c">26-50% CHI</span>: The Scorched Earth<br/><span style="color: #9ca3af">51-74% CHI</span>: The Great Smog<br/><span style="color: #16a34a">75-99% CHI</span>: Eco-Utopia<br/><span style="color: #facc15">100% CHI</span>: The Golden Age<br/><br/>To leave Vision, click the Vision button again.<br/><br/><button id="tut-ok-2" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 20px; outline: none; transition: transform 0.1s ease;">OK</button>';
           tutOverlay.style.top = '50%';
           tutOverlay.style.transform = 'translate(-50%, -50%)';
           
           const okBtn2 = document.getElementById('tut-ok-2');
           if (okBtn2) {
             okBtn2.addEventListener('mouseover', () => okBtn2.style.transform = 'scale(1.05)');
             okBtn2.addEventListener('mouseout', () => okBtn2.style.transform = 'scale(1)');
             okBtn2.addEventListener('click', () => {
                tutOverlay.remove();
                (window as any)._snapshotsTutorialStep = 0;
                localStorage.setItem('trashdash_snapshots_tutorial_done', 'true');
             });
           }
         }
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
      
      if ((window as any)._snapshotsTutorialStep === 2) {
        const tutOverlay = document.getElementById('snapshots-tutorial-overlay');
        if (tutOverlay) {
          tutOverlay.style.display = 'block';
          tutOverlay.style.top = '250px';
          tutOverlay.style.transform = 'translateX(-50%)';
          tutOverlay.style.border = '2px solid #3b82f6';
          tutOverlay.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(59, 130, 246, 0.4)';
          tutOverlay.innerHTML = 'Now, check out <span style="color: #3b82f6">Vision</span> (the blue button) and see what it is!';
          (window as any)._snapshotsTutorialStep = 3;
        }
      }
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
                        <div style="color: #ef4444; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">${(codexEntry as any).customBeforeLabel || 'Before (Historical)'}</div>
                        <div style="width: 100%; height: 250px; background: #000; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border: 2px solid #334155;">
                          <img src="${codexEntry.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; filter: sepia(0.4) contrast(1.1);" onerror="this.style.display='none';" />
                        </div>
                        <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #ef4444;">
                          ${codexEntry.description}
                        </div>
                      </div>
                      
                      <!-- AFTER -->
                      <div style="flex: 1;">
                        <div style="color: #10b981; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">${(codexEntry as any).customAfterLabel || 'After (Eco-Restored)'}</div>
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
      
      if ((window as any)._snapshotsTutorialStep === 1) {
        const tutOverlay = document.getElementById('snapshots-tutorial-overlay');
        if (tutOverlay) {
          tutOverlay.innerHTML = 'Snapshots show the real-world history of these locations!<br/><br/>To unlock a snapshot, you must fulfill the <span style="color: #FCD34D">Total CHI requirements</span> (100% completion) for that area.<br/><br/><button id="tut-ok-1" style="background: #a855f7; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 20px; outline: none; transition: transform 0.1s ease;">OK</button>';
          tutOverlay.style.top = '50%';
          tutOverlay.style.transform = 'translate(-50%, -50%)';
          tutOverlay.style.zIndex = '10000'; // Above codex
          
          const okBtn1 = document.getElementById('tut-ok-1');
          if (okBtn1) {
            okBtn1.addEventListener('mouseover', () => okBtn1.style.transform = 'scale(1.05)');
            okBtn1.addEventListener('mouseout', () => okBtn1.style.transform = 'scale(1)');
            okBtn1.addEventListener('click', () => {
               tutOverlay.style.display = 'none';
               (window as any)._snapshotsTutorialStep = 2;
            });
          }
        }
      }
    });

    // --- Developer Mode HUD ---
    if (localStorage.getItem('trashdash_dev_mode') === 'true') {
      const devPanel = document.createElement('div');
      devPanel.id = 'dev-panel';
      devPanel.style.position = 'absolute';
      devPanel.style.bottom = '120px';
      devPanel.style.right = '20px';
      devPanel.style.background = 'rgba(220, 38, 38, 0.9)';
      devPanel.style.padding = '15px';
      devPanel.style.borderRadius = '8px';
      devPanel.style.zIndex = '999';
      devPanel.style.color = 'white';
      devPanel.style.fontFamily = '"Nunito", sans-serif';
      devPanel.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
      devPanel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">DEV MODE</div>
        <div style="font-size: 12px; margin-bottom: 2px;">Total CHI: <span id="dev-chi-val">${Math.floor(totalChi)}</span> / ${maxChi}</div>
        <input type="range" id="dev-chi-slider" min="0" max="${maxChi}" value="${Math.floor(totalChi)}" style="width: 100%; margin-bottom: 10px;" />
        <div style="font-size: 12px; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 4px;">Garden Levels</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Compost</span>
          <div><button id="dev-compost-down" style="color:black;">-</button> <button id="dev-compost-up" style="color:black;">+</button></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Recycling</span>
          <div><button id="dev-recycling-down" style="color:black;">-</button> <button id="dev-recycling-up" style="color:black;">+</button></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Plastic</span>
          <div><button id="dev-plastic-down" style="color:black;">-</button> <button id="dev-plastic-up" style="color:black;">+</button></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Landfill</span>
          <div><button id="dev-landfill-down" style="color:black;">-</button> <button id="dev-landfill-up" style="color:black;">+</button></div>
        </div>
      `;
      document.body.appendChild(devPanel);

      const slider = document.getElementById('dev-chi-slider') as HTMLInputElement;
      const valLabel = document.getElementById('dev-chi-val');
      
      slider?.addEventListener('input', (e) => {
        if (valLabel) valLabel.textContent = (e.target as HTMLInputElement).value;
      });

      slider?.addEventListener('change', (e) => {
        let remainingChi = parseInt((e.target as HTMLInputElement).value, 10);
        venuesData.forEach(v => {
          const venueChi = Math.max(0, Math.min(100, remainingChi));
          localStorage.setItem('trashdash_chi_' + v.id, venueChi.toString());
          remainingChi -= venueChi;
        });
        this.scene.restart();
      });

      const setupDevBtn = (id: string, bin: string, isUp: boolean, increment: number) => {
        document.getElementById(id)?.addEventListener('click', () => {
          let current = this.gardenSystem.getRawCount(bin);
          const maxLevel = bin === 'landfill' ? 5 : 10;
          const currentLevel = Math.floor(current / increment);
          let newLevel = currentLevel + (isUp ? 1 : -1);
          newLevel = Math.max(0, Math.min(maxLevel, newLevel));
          this.gardenSystem.setProgress(bin, newLevel * increment);
          this.scene.restart();
        });
      };

      setupDevBtn('dev-compost-down', 'compost', false, 30);
      setupDevBtn('dev-compost-up', 'compost', true, 30);
      setupDevBtn('dev-recycling-down', 'recycling', false, 30);
      setupDevBtn('dev-recycling-up', 'recycling', true, 30);
      setupDevBtn('dev-plastic-down', 'plastic', false, 30);
      setupDevBtn('dev-plastic-up', 'plastic', true, 30);
      setupDevBtn('dev-landfill-down', 'landfill', false, 50);
      setupDevBtn('dev-landfill-up', 'landfill', true, 50);
    }

    // ESC to return to Title Scene (Main Menu)
    this.input.keyboard?.on('keydown-ESC', () => {
      MapLibreService.hideMap();
      this.scene.start('TitleScene');
    });

    // 5. Cleanup MapKit UI when leaving this scene
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.getElementById('level-select-styles')?.remove();
      document.getElementById('level-select-ui')?.remove();
      document.getElementById('map-tutorial-overlay')?.remove();
      document.getElementById('map-return-tutorial')?.remove();
      document.getElementById('smog-overlay')?.remove();
      document.getElementById('future-desc-box')?.remove();
      document.getElementById('map-weather-event')?.remove();
      document.getElementById('weather-tab')?.remove();
      document.getElementById('current-chi-hud')?.remove();
      document.getElementById('recenter-btn')?.remove();
      document.getElementById('help-btn')?.remove();
      document.getElementById('objective-btn')?.remove();
      document.getElementById('map-help-btn')?.remove();
      document.getElementById('volume-container')?.remove();
      document.getElementById('music-player-container')?.remove();
      document.getElementById('codex-overlay')?.remove();
      document.getElementById('dev-panel')?.remove();
      levelNodes.forEach(n => n.remove());
      PathOverlayService.removeFromMap();
      MapLibreService.toggleFutureVision(false, 0, 0); // Reset map style
    });
  }

  private buildFallbackLevelUI(unlockedCount: number) {
    const fallbackContainer = document.createElement('div');
    fallbackContainer.id = 'fallback-level-ui';
    fallbackContainer.style.position = 'absolute';
    fallbackContainer.style.top = '50%';
    fallbackContainer.style.left = '50%';
    fallbackContainer.style.transform = 'translate(-50%, -50%)';
    fallbackContainer.style.display = 'flex';
    fallbackContainer.style.flexDirection = 'column';
    fallbackContainer.style.gap = '10px';
    fallbackContainer.style.zIndex = '100';
    fallbackContainer.style.maxHeight = '80vh';
    fallbackContainer.style.overflowY = 'auto';
    fallbackContainer.style.background = 'rgba(0,0,0,0.85)';
    fallbackContainer.style.padding = '24px';
    fallbackContainer.style.borderRadius = '16px';
    fallbackContainer.style.border = '2px solid #4ade80';
    fallbackContainer.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';

    const title = document.createElement('h2');
    title.innerText = 'Map Offline - Level Select';
    title.style.color = '#fff';
    title.style.textAlign = 'center';
    title.style.margin = '0 0 16px 0';
    title.style.fontFamily = "'Nunito', sans-serif";
    fallbackContainer.appendChild(title);

    venuesData.forEach((venue: any, i: number) => {
      let isUnlocked = false;
      if (i === 0) {
        isUnlocked = true;
      } else {
        const previousVenueChi = this.chiSystem.getChi((venuesData[i - 1] as any).id);
        isUnlocked = previousVenueChi >= venue.unlockChiThreshold;
      }

      const btn = document.createElement('button');
      btn.innerText = `${i + 1}. ${venue.displayName}` + (!isUnlocked ? ` (Needs ${venue.unlockChiThreshold} CHI)` : '');
      btn.style.padding = '12px 20px';
      btn.style.fontSize = '16px';
      btn.style.borderRadius = '8px';
      btn.style.border = 'none';
      btn.style.cursor = isUnlocked ? 'pointer' : 'not-allowed';
      btn.style.background = isUnlocked ? '#22c55e' : '#4b5563';
      btn.style.color = '#fff';
      btn.style.fontFamily = "'Nunito', sans-serif";
      btn.style.fontWeight = 'bold';
      btn.style.transition = 'transform 0.2s, background 0.2s';

      if (isUnlocked) {
        btn.onmouseover = () => { btn.style.background = '#16a34a'; btn.style.transform = 'scale(1.02)'; };
        btn.onmouseout = () => { btn.style.background = '#22c55e'; btn.style.transform = 'scale(1)'; };
        btn.addEventListener('click', () => {
          this.scene.start('LoadingScene', { target: 'SpritesScene', targetData: { venueId: venue.id } });
        });
      }

      fallbackContainer.appendChild(btn);
    });

    document.body.appendChild(fallbackContainer);
    
    // Add cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      fallbackContainer.remove();
    });
  }
}
