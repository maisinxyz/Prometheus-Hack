import Phaser from 'phaser';
import { GardenSystem } from '../systems/GardenSystem';
import { ChiSystem } from '../systems/ChiSystem';
import venuesData from '../data/venues.json';
import { UI_THEME } from '../config/UITheme';
import { GlossyButton } from '../entities/GlossyButton';
import { ThreeJSService } from '../services/ThreeJSService';
import { MapLibreService } from '../services/MapLibreService';

export class CommunityGardenScene extends Phaser.Scene {
  private gardenSystem!: GardenSystem;
  private chiSystem!: ChiSystem;

  constructor() {
    super({ key: 'CommunityGardenScene' });
  }

  create() {
    localStorage.setItem('trashdash_visited_park', 'true');
    this.gardenSystem = new GardenSystem();
    this.chiSystem = new ChiSystem();

    const compostLvl = this.gardenSystem.getCompostLevel();
    const recyclingLvl = this.gardenSystem.getRecyclingLevel();
    const plasticLvl = this.gardenSystem.getPlasticLevel();
    const landfillLvl = this.gardenSystem.getLandfillLevel();

    // Determine 3D Background based on compost level
    const maxPanoramaLevel = 5;
    const panoramaLevel = Math.min(compostLvl, maxPanoramaLevel);
    const venueId = panoramaLevel === 0 ? 'community_park' : `community_park_level_${panoramaLevel}`;
    console.log(`[DEBUG] compostLvl: ${compostLvl}, panoramaLevel: ${panoramaLevel}, venueId: ${venueId}`);
    
    // Compute the list of 2D Sprites to spawn based on upgrades!
    const sprites: string[] = [];
    
    // Helper to generate all possible filename permutations (unnumbered + 1 through 12)
    const pushSpriteVariations = (prefix: string, level: number) => {
      sprites.push(`/assets/${prefix}_sprite_lvl${level}.png`);
      for (let j = 1; j <= 12; j++) {
        sprites.push(`/assets/${j}${prefix}_sprite_lvl${level}.png`);
      }
    };
    
    // Compost upgrades > 5
    for (let i = 6; i <= compostLvl; i++) pushSpriteVariations('compost', i);
    // Recycling upgrades
    // Trees (Levels 1-5): Only push the highest unlocked level so they replace themselves
    const highestTree = Math.min(recyclingLvl, 5);
    if (highestTree > 0) {
      pushSpriteVariations('recycling', highestTree);
    }
    // Benches, humans, tables, etc. (Levels 6-10)
    for (let i = 6; i <= recyclingLvl; i++) pushSpriteVariations('recycling', i);
    
    // Landfill upgrades
    for (let i = 1; i <= landfillLvl; i++) pushSpriteVariations('landfill', i);

    ThreeJSService.showVenue(venueId, { sprites });
    MapLibreService.hideMap();

    // Helper for perspective scaling. Horizon is roughly y=450
    const getPerspectiveScale = (y: number) => Math.max(0, (y - 450) / (1080 - 450));

    // 2D Overlays have been removed so the 360 panoramas can be seen unobstructed.

    // ===== HTML DOM UI (Aligns perfectly to the window edge) =====
    const uiContainer = document.createElement('div');
    uiContainer.id = 'garden-scene-ui';
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '20px';
    uiContainer.style.left = '20px';
    uiContainer.style.zIndex = '100';
    uiContainer.style.pointerEvents = 'none';
    this.sys.game.canvas.style.display = 'block';

    // ===== PARK RADIO (Music Player) =====
    const radioContainer = document.createElement('div');
    radioContainer.id = 'park-radio-ui';
    radioContainer.style.position = 'fixed';
    radioContainer.style.bottom = '20px';
    radioContainer.style.left = '20px';
    radioContainer.style.zIndex = '100';
    radioContainer.style.backgroundColor = 'rgba(20, 30, 40, 0.8)';
    radioContainer.style.border = '1px solid rgba(74, 222, 128, 0.4)';
    radioContainer.style.borderRadius = '12px';
    radioContainer.style.padding = '15px';
    radioContainer.style.color = '#fff';
    radioContainer.style.fontFamily = 'Arial, sans-serif';
    radioContainer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
    radioContainer.style.backdropFilter = 'blur(8px)';
    radioContainer.style.display = 'flex';
    radioContainer.style.flexDirection = 'column';
    radioContainer.style.gap = '10px';
    radioContainer.style.pointerEvents = 'auto'; // allow clicks
    radioContainer.style.width = '320px';

    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.alignItems = 'center';

    const radioTitle = document.createElement('h3');
    radioTitle.innerText = '📻 Park Radio';
    radioTitle.style.margin = '0';
    radioTitle.style.color = '#4ade80';
    radioTitle.style.fontSize = '18px';
    titleRow.appendChild(radioTitle);

    let unlockedCount = Math.min(plasticLvl, 10);

    const playBtn = document.createElement('button');
    playBtn.innerText = '▶ Play';
    playBtn.style.padding = '4px 12px';
    playBtn.style.backgroundColor = '#10b981';
    playBtn.style.color = '#fff';
    playBtn.style.border = 'none';
    playBtn.style.borderRadius = '6px';
    playBtn.style.cursor = 'pointer';
    playBtn.style.fontWeight = 'bold';
    playBtn.disabled = (unlockedCount === 0);
    titleRow.appendChild(playBtn);

    radioContainer.appendChild(titleRow);

    const songSelect = document.createElement('select');
    songSelect.style.width = '100%';
    songSelect.style.padding = '8px';
    songSelect.style.borderRadius = '6px';
    songSelect.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    songSelect.style.color = '#fff';
    songSelect.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    songSelect.style.outline = 'none';
    songSelect.style.cursor = 'pointer';

    const songs = [
      { id: 'plastic_lvl_1', name: 'River Flows In You - Yiruma' },
      { id: 'plastic_lvl_2', name: 'Time To Love - October' },
      { id: 'plastic_lvl_3', name: 'Star Tea Party - Hui Che' },
      { id: 'plastic_lvl_4', name: 'Idea 22 - Gibran Alcocer' },
      { id: 'plastic_lvl_5', name: 'Kiss The Rain - Yiruma' },
      { id: 'plastic_lvl_6', name: 'Icarus - Tony Ann' },
      { id: 'plastic_lvl_7', name: 'Snowfall - Øneheart x reidenshi' },
      { id: 'plastic_lvl_8', name: 'Summer - Joe Hisaishi' },
      { id: 'plastic_lvl_9', name: 'Cherry Blossom - October' },
      { id: 'plastic_lvl_10', name: 'Canon in D - Pachelbel' }
    ];

    if (unlockedCount === 0) {
      const opt = document.createElement('option');
      opt.innerText = 'No songs unlocked yet...';
      opt.disabled = true;
      songSelect.appendChild(opt);
    } else {
      for (let i = 0; i < unlockedCount; i++) {
        const opt = document.createElement('option');
        opt.value = `/assets/audio/${songs[i].id}.m4a`;
        opt.innerText = `${i+1}. ${songs[i].name}`;
        songSelect.appendChild(opt);
      }
    }
    radioContainer.appendChild(songSelect);

    // Load persisted state
    const savedSong = sessionStorage.getItem('radio_song');
    const savedTime = parseFloat(sessionStorage.getItem('radio_time') || '0');
    const savedVol = parseFloat(sessionStorage.getItem('radio_vol') || '0.5');
    const savedLoop = sessionStorage.getItem('radio_loop') !== 'false';
    const savedPlaying = sessionStorage.getItem('radio_playing') === 'true';

    const controlRow = document.createElement('div');
    controlRow.style.display = 'flex';
    controlRow.style.gap = '10px';
    controlRow.style.alignItems = 'center';

    const repeatBtn = document.createElement('button');
    repeatBtn.innerText = '↻';
    repeatBtn.style.padding = '8px';
    repeatBtn.style.backgroundColor = 'transparent';
    repeatBtn.style.border = 'none';
    repeatBtn.style.cursor = 'pointer';
    repeatBtn.style.fontSize = '18px';
    repeatBtn.style.transition = 'text-shadow 0.2s';
    repeatBtn.style.outline = 'none'; // prevents blue focus ring on click
    
    // Add volume slider
    const volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.min = '0';
    volSlider.max = '1';
    volSlider.step = '0.05';
    volSlider.value = savedVol.toString();
    volSlider.style.flex = '1';

    controlRow.appendChild(volSlider);
    controlRow.appendChild(repeatBtn);

    radioContainer.appendChild(controlRow);

    const progressRow = document.createElement('div');
    progressRow.style.display = 'flex';
    progressRow.style.gap = '10px';
    progressRow.style.alignItems = 'center';
    progressRow.style.fontSize = '12px';
    progressRow.style.fontFamily = 'monospace';

    const timeElapsed = document.createElement('span');
    timeElapsed.innerText = '0:00';
    
    const seekBar = document.createElement('input');
    seekBar.type = 'range';
    seekBar.min = '0';
    seekBar.max = '100';
    seekBar.value = '0';
    seekBar.style.flex = '1';

    const timeRemaining = document.createElement('span');
    timeRemaining.innerText = '-:--';

    progressRow.appendChild(timeElapsed);
    progressRow.appendChild(seekBar);
    progressRow.appendChild(timeRemaining);

    radioContainer.appendChild(progressRow);

    const audioElement = document.createElement('audio');
    audioElement.id = 'park-radio-audio';
    audioElement.loop = savedLoop;
    audioElement.volume = savedVol;

    if (savedSong && unlockedCount > 0) {
      songSelect.value = savedSong;
      audioElement.src = savedSong;
    }

    const updateRepeatUI = () => {
      if (audioElement.loop) {
        repeatBtn.style.textShadow = '0 0 10px #4ade80';
        repeatBtn.style.color = '#4ade80';
      } else {
        repeatBtn.style.textShadow = 'none';
        repeatBtn.style.color = '#fff';
      }
    };
    updateRepeatUI();

    repeatBtn.onclick = () => {
      audioElement.loop = !audioElement.loop;
      updateRepeatUI();
    };

    volSlider.oninput = (e: any) => { audioElement.volume = parseFloat(e.target.value); };

    const updatePlayUI = () => {
      if (audioElement.paused) {
        playBtn.innerText = '▶ Play';
        playBtn.style.backgroundColor = '#10b981';
      } else {
        playBtn.innerText = '⏸ Pause';
        playBtn.style.backgroundColor = '#f59e0b';
      }
    };

    playBtn.onclick = () => {
      if (audioElement.paused) {
        if (!audioElement.src || !audioElement.src.includes(songSelect.value)) {
          audioElement.src = songSelect.value;
        }
        audioElement.play().catch(e => console.warn('Autoplay prevented:', e));
      } else {
        audioElement.pause();
      }
      updatePlayUI();
    };

    songSelect.onchange = () => {
      audioElement.src = songSelect.value;
      if (!audioElement.paused || savedPlaying) {
        audioElement.play().catch(e => console.warn('Autoplay prevented:', e));
      }
      updatePlayUI();
    };

    const formatTime = (secs: number) => {
      if (isNaN(secs) || secs < 0) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    let isSeeking = false;
    seekBar.onmousedown = () => isSeeking = true;
    seekBar.onmouseup = () => isSeeking = false;
    seekBar.oninput = (e: any) => {
      if (audioElement.duration) {
        audioElement.currentTime = (parseFloat(e.target.value) / 100) * audioElement.duration;
      }
    };

    audioElement.ontimeupdate = () => {
      if (!audioElement.duration) return;
      if (!isSeeking) {
        seekBar.value = ((audioElement.currentTime / audioElement.duration) * 100).toString();
      }
      timeElapsed.innerText = formatTime(audioElement.currentTime);
      timeRemaining.innerText = '-' + formatTime(audioElement.duration - audioElement.currentTime);
    };

    audioElement.onloadedmetadata = () => {
      if (audioElement.src.includes(savedSong || '') && savedTime > 0) {
        audioElement.currentTime = savedTime;
      }
    };

    if (savedPlaying && savedSong && unlockedCount > 0) {
      audioElement.play().catch(e => console.warn('Autoplay prevented:', e));
      updatePlayUI();
    }

    document.body.appendChild(radioContainer);
    document.body.appendChild(audioElement);

    // ===== SUMMARY MODAL =====
    let unseenUpgrades: string[] = [];
    try {
      unseenUpgrades = JSON.parse(localStorage.getItem(GardenSystem.UNSEEN_UPGRADES_KEY) || '[]');
    } catch(e) {}
    
    if (unseenUpgrades.length > 0) {
      const modalOverlay = document.createElement('div');
      modalOverlay.style.position = 'fixed';
      modalOverlay.style.top = '0';
      modalOverlay.style.left = '0';
      modalOverlay.style.width = '100vw';
      modalOverlay.style.height = '100vh';
      modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
      modalOverlay.style.backdropFilter = 'blur(4px)';
      modalOverlay.style.display = 'flex';
      modalOverlay.style.justifyContent = 'center';
      modalOverlay.style.alignItems = 'center';
      modalOverlay.style.pointerEvents = 'auto'; // allow clicks
      
      const modal = document.createElement('div');
      modal.style.backgroundColor = 'rgba(20, 30, 40, 0.95)';
      modal.style.border = '1px solid rgba(100, 200, 100, 0.5)';
      modal.style.borderRadius = '16px';
      modal.style.padding = '35px';
      modal.style.color = '#fff';
      modal.style.textAlign = 'center';
      modal.style.minWidth = '300px';
      modal.style.boxShadow = '0 15px 40px rgba(0,0,0,0.8), 0 0 30px rgba(74, 222, 128, 0.2)';
      modal.style.fontFamily = 'Arial, sans-serif';
      
      const title = document.createElement('h2');
      title.innerText = 'Welcome Back!';
      title.style.margin = '0 0 15px 0';
      title.style.color = '#4ade80';
      title.style.fontSize = '32px';
      
      const subtitle = document.createElement('p');
      subtitle.innerText = 'Here is what has grown since your last visit:';
      subtitle.style.fontSize = '18px';
      subtitle.style.marginBottom = '25px';
      subtitle.style.color = '#aaa';
      
      const list = document.createElement('ul');
      list.style.textAlign = 'left';
      list.style.fontSize = '20px';
      list.style.lineHeight = '1.8';
      list.style.margin = '0 0 30px 0';
      list.style.paddingLeft = '20px';
      
      // Remove duplicates just in case
      const uniqueUpgrades = [...new Set(unseenUpgrades)];
      uniqueUpgrades.forEach(u => {
        const li = document.createElement('li');
        li.innerText = u;
        list.appendChild(li);
      });
      
      const btn = document.createElement('button');
      btn.innerText = 'Awesome!';
      btn.style.padding = '14px 40px';
      btn.style.fontSize = '20px';
      btn.style.fontWeight = 'bold';
      btn.style.backgroundColor = '#10b981';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'transform 0.2s, background 0.2s';
      
      btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; btn.style.backgroundColor = '#059669'; };
      btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.backgroundColor = '#10b981'; };
      
      btn.onclick = () => {
        modalOverlay.style.transition = 'opacity 0.5s';
        modalOverlay.style.opacity = '0';
        setTimeout(() => modalOverlay.remove(), 500);
        localStorage.removeItem(GardenSystem.UNSEEN_UPGRADES_KEY);
      };
      
      // Also automatically dismiss after 5 seconds
      setTimeout(() => {
        if (document.body.contains(modalOverlay)) {
           btn.onclick(new MouseEvent('click'));
        }
      }, 5000);
      
      modal.appendChild(title);
      modal.appendChild(subtitle);
      modal.appendChild(list);
      modal.appendChild(btn);
      modalOverlay.appendChild(modal);
      uiContainer.appendChild(modalOverlay);
    }

    // Back Button
    const backBtn = document.createElement('button');
    backBtn.innerText = '⬅ Back to Map';
    backBtn.style.pointerEvents = 'auto';
    backBtn.style.background = 'linear-gradient(180deg, #10b981 0%, #059669 100%)';
    backBtn.style.color = '#fff';
    backBtn.style.border = '2px solid rgba(255,255,255,0.2)';
    backBtn.style.borderRadius = '24px';
    backBtn.style.padding = '12px 24px';
    backBtn.style.fontSize = '18px';
    backBtn.style.fontWeight = 'bold';
    backBtn.style.cursor = 'pointer';
    backBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    backBtn.style.transition = 'transform 0.2s, box-shadow 0.2s, filter 0.2s';
    
    backBtn.onmouseover = () => {
      backBtn.style.transform = 'scale(1.05)';
      backBtn.style.filter = 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))';
    };
    backBtn.onmouseout = () => {
      backBtn.style.transform = 'scale(1)';
      backBtn.style.filter = 'none';
    };
    backBtn.onclick = () => {
      this.scene.start('LevelSelectScene');
    };
    uiContainer.appendChild(backBtn);

    // Levels Panel
    const panel = document.createElement('div');
    panel.style.marginTop = '20px';
    panel.style.background = 'rgba(0,0,0,0.8)';
    panel.style.border = '2px solid #444';
    panel.style.borderRadius = '16px';
    panel.style.padding = '20px';
    panel.style.width = '340px';
    panel.style.color = '#fff';
    panel.style.fontFamily = '"Nunito", sans-serif';
    
    const compostRaw = this.gardenSystem.getRawCount('compost');
    const recyclingRaw = this.gardenSystem.getRawCount('recycling');
    const plasticRaw = this.gardenSystem.getRawCount('plastic');
    const landfillRaw = this.gardenSystem.getRawCount('landfill');

    const getProg = (raw: number, level: number, maxLvl: number, inc: number) => {
      if (level >= maxLvl) return `<span style="font-size: 16px; opacity: 0.8; margin-left: 8px;">(MAX)</span>`;
      return `<span style="font-size: 16px; opacity: 0.8; margin-left: 8px;">(${raw % inc}/${inc})</span>`;
    };
    
    panel.innerHTML = `
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Park Levels</div>
      <div style="font-size: 20px; color: #22c55e; margin-bottom: 8px; display: flex; justify-content: space-between;"><span>🍎 Compost: Lvl ${compostLvl}</span> ${getProg(compostRaw, compostLvl, 10, 30)}</div>
      <div style="font-size: 20px; color: ${compostLvl < 5 ? '#555' : '#3b82f6'}; margin-bottom: 8px; display: flex; justify-content: space-between;"><span>♻️ Recycling: ${compostLvl < 5 ? '🔒' : 'Lvl ' + recyclingLvl}</span> ${compostLvl < 5 ? '' : getProg(recyclingRaw, recyclingLvl, 10, 30)}</div>
      <div style="font-size: 20px; color: ${compostLvl < 5 ? '#555' : '#6b7280'}; margin-bottom: 8px; display: flex; justify-content: space-between;"><span>🧴 Plastic: ${compostLvl < 5 ? '🔒' : 'Lvl ' + plasticLvl}</span> ${compostLvl < 5 ? '' : getProg(plasticRaw, plasticLvl, 10, 30)}</div>
      <div style="font-size: 20px; color: ${compostLvl < 5 ? '#555' : '#a8a29e'}; display: flex; justify-content: space-between;"><span>🗑️ Landfill: ${compostLvl < 5 ? '🔒' : 'Lvl ' + landfillLvl}</span> ${compostLvl < 5 ? '' : getProg(landfillRaw, landfillLvl, 5, 50)}</div>
    `;
    uiContainer.appendChild(panel);
    document.body.appendChild(uiContainer);
      
    // --- Developer Mode HUD ---
    if (localStorage.getItem('trashdash_dev_mode') === 'true') {
      const devPanel = document.createElement('div');
      devPanel.id = 'garden-dev-panel';
      devPanel.style.position = 'absolute';
      devPanel.style.top = '20px';
      devPanel.style.left = '380px'; // Next to the widened Levels panel
      devPanel.style.background = 'rgba(220, 38, 38, 0.9)';
      devPanel.style.padding = '15px';
      devPanel.style.borderRadius = '8px';
      devPanel.style.zIndex = '999';
      devPanel.style.color = 'white';
      devPanel.style.fontFamily = '"Nunito", sans-serif';
      devPanel.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
      devPanel.style.pointerEvents = 'auto'; // allow clicks
      devPanel.style.width = '250px';
      
      devPanel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">DEV MODE (Park)</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Compost</span>
          <div><button id="dev-garden-compost-down" style="color:black; cursor: pointer; padding: 2px 8px;">-</button> <button id="dev-garden-compost-up" style="color:black; cursor: pointer; padding: 2px 8px;">+</button></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Recycling</span>
          <div><button id="dev-garden-recycling-down" style="color:black; cursor: pointer; padding: 2px 8px;">-</button> <button id="dev-garden-recycling-up" style="color:black; cursor: pointer; padding: 2px 8px;">+</button></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Plastic</span>
          <div><button id="dev-garden-plastic-down" style="color:black; cursor: pointer; padding: 2px 8px;">-</button> <button id="dev-garden-plastic-up" style="color:black; cursor: pointer; padding: 2px 8px;">+</button></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Landfill</span>
          <div><button id="dev-garden-landfill-down" style="color:black; cursor: pointer; padding: 2px 8px;">-</button> <button id="dev-garden-landfill-up" style="color:black; cursor: pointer; padding: 2px 8px;">+</button></div>
        </div>
      `;
      uiContainer.appendChild(devPanel);

      const setupDevBtn = (id: string, bin: string, isUp: boolean, increment: number) => {
        const btn = document.getElementById(id);
        if (btn) {
           btn.onclick = () => {
             let current = this.gardenSystem.getRawCount(bin);
             const maxLevel = bin === 'landfill' ? 5 : 10;
             const currentLevel = Math.floor(current / increment);
             let newLevel = currentLevel + (isUp ? 1 : -1);
             newLevel = Math.max(0, Math.min(maxLevel, newLevel));
             this.gardenSystem.setProgress(bin, newLevel * increment);
             this.scene.restart();
           };
        }
      };

      setupDevBtn('dev-garden-compost-down', 'compost', false, 30);
      setupDevBtn('dev-garden-compost-up', 'compost', true, 30);
      setupDevBtn('dev-garden-recycling-down', 'recycling', false, 30);
      setupDevBtn('dev-garden-recycling-up', 'recycling', true, 30);
      setupDevBtn('dev-garden-plastic-down', 'plastic', false, 30);
      setupDevBtn('dev-garden-plastic-up', 'plastic', true, 30);
      setupDevBtn('dev-garden-landfill-down', 'landfill', false, 50);
      setupDevBtn('dev-garden-landfill-up', 'landfill', true, 50);
    }
    
    // ESC to return to Map
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('LevelSelectScene');
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      const radio = document.getElementById('park-radio-ui');
      const audio = document.getElementById('park-radio-audio') as HTMLAudioElement;
      
      if (audio) {
         // Save state
         sessionStorage.setItem('radio_song', songSelect.value);
         sessionStorage.setItem('radio_time', audio.currentTime.toString());
         sessionStorage.setItem('radio_vol', audio.volume.toString());
         sessionStorage.setItem('radio_loop', audio.loop.toString());
         sessionStorage.setItem('radio_playing', (!audio.paused).toString());
         
         audio.pause();
         audio.remove();
      }
      if (radio) radio.remove();

      uiContainer.remove();
      ThreeJSService.hide();
    });
  }

  private createFlyingEmoji(emoji: string, count: number) {
    for (let i = 0; i < count; i++) {
      const bug = this.add.text(Phaser.Math.Between(100, 1800), Phaser.Math.Between(100, 800), emoji, { fontSize: '30px' });
      this.tweens.add({
        targets: bug,
        x: `+=${Phaser.Math.Between(-300, 300)}`,
        y: `+=${Phaser.Math.Between(-150, 150)}`,
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
}
