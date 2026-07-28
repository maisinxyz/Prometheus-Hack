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
    ThreeJSService.showVenue(venueId);
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
