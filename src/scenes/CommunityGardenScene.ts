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
    // Plastic upgrades (Level 1 pond is replaced by Level 9 sparkly pond)
    for (let i = 1; i <= plasticLvl; i++) {
       if (i === 1 && plasticLvl >= 9) continue; // Skip basic pond if sparkly pond unlocked
       pushSpriteVariations('plastic', i);
    }
    // Landfill upgrades
    for (let i = 1; i <= landfillLvl; i++) pushSpriteVariations('landfill', i);

    ThreeJSService.showVenue(venueId, { sprites });
    MapLibreService.hideMap();

    // Helper for perspective scaling. Horizon is roughly y=450
    const getPerspectiveScale = (y: number) => Math.max(0, (y - 450) / (1080 - 450));

    // 2D Overlays have been removed so the 360 panoramas can be seen unobstructed.

    // ===== WEATHER OVERLAY =====
    const totalChi = this.chiSystem.getTotalChi(venuesData.map(v => v.id));
    const maxChi = venuesData.length * 100;
    if (totalChi <= maxChi * 0.25) {
      this.add.text(960, 100, 'Warning: Severe Smog in the City', { fontSize: '32px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
    } else if (totalChi > maxChi * 0.75) {
      this.add.text(960, 100, 'Eco-Festival Active! The garden is thriving.', { fontSize: '32px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    }

    // ===== HTML DOM UI (Aligns perfectly to the window edge) =====
    const uiContainer = document.createElement('div');
    uiContainer.id = 'garden-scene-ui';
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '20px';
    uiContainer.style.left = '20px';
    uiContainer.style.zIndex = '100';
    uiContainer.style.pointerEvents = 'none';
    this.sys.game.canvas.style.display = 'block';

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
    panel.style.width = '280px';
    panel.style.color = '#fff';
    panel.style.fontFamily = '"Nunito", sans-serif';
    
    panel.innerHTML = `
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Garden Levels</div>
      <div style="font-size: 20px; color: #22c55e; margin-bottom: 8px;">🍎 Compost: Lvl ${compostLvl}</div>
      <div style="font-size: 20px; color: ${compostLvl < 5 ? '#555' : '#3b82f6'}; margin-bottom: 8px;">♻️ Recycling: ${compostLvl < 5 ? '🔒' : 'Lvl ' + recyclingLvl}</div>
      <div style="font-size: 20px; color: ${compostLvl < 5 ? '#555' : '#6b7280'}; margin-bottom: 8px;">🧴 Plastic: ${compostLvl < 5 ? '🔒' : 'Lvl ' + plasticLvl}</div>
      <div style="font-size: 20px; color: ${compostLvl < 5 ? '#555' : '#a8a29e'};">🗑️ Landfill: ${compostLvl < 5 ? '🔒' : 'Lvl ' + landfillLvl}</div>
    `;
    uiContainer.appendChild(panel);
    document.body.appendChild(uiContainer);
      
    // --- Developer Mode HUD ---
    if (localStorage.getItem('trashdash_dev_mode') === 'true') {
      const devPanel = document.createElement('div');
      devPanel.id = 'garden-dev-panel';
      devPanel.style.position = 'absolute';
      devPanel.style.top = '20px';
      devPanel.style.left = '320px'; // Next to the Levels panel
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
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">DEV MODE (Garden)</div>
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
