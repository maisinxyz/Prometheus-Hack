import Phaser from 'phaser';
import { GardenSystem } from '../systems/GardenSystem';
import { ChiSystem } from '../systems/ChiSystem';
import venuesData from '../data/venues.json';

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

    // Background (pure dirt, NO trees or roads on the sides)
    const bg = this.add.image(960, 540, 'pure_park_dirt');
    bg.setDisplaySize(1920, 1080);

    // Helper for perspective scaling. Horizon is roughly y=450
    const getPerspectiveScale = (y: number) => Math.max(0, (y - 450) / (1080 - 450));

    // ===== COMPOST: Grass, Flowers, Bushes, Bugs =====
    // Grass
    // We use 'rolling_grass', which is a high-resolution, vibrant bright green wavy grass texture.
    // We use a GeometryMask so it perfectly stops at the y=410 skyline and doesn't cover the city.
    const maskGraphics = this.make.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(0, 410, 1920, 1080 - 410);
    const grassMask = maskGraphics.createGeometryMask();

    // We shift the image UP to y=-58 so the sky is hidden, and the beautiful wavy midground
    // starts exactly at y=410. Then we mask it so it perfectly covers the dirt!
    const parkGrass = this.add.image(960, -58, 'rolling_grass').setOrigin(0.5, 0);
    parkGrass.setDisplaySize(1920, 1920);
    parkGrass.setMask(grassMask);
    
    // We leave alpha at 1.0 (fully opaque) so it is extremely vibrant and no dirt specks bleed through!
    
    if (compostLvl >= 1) {
      parkGrass.setVisible(true);
      const maskGraphics = this.make.graphics();
      maskGraphics.fillStyle(0xffffff, 1);
      
      let grassSeed = 999;
      const nextGrassRnd = () => { grassSeed = (grassSeed * 9301 + 49297) % 233280; return grassSeed / 233280; };
      const grassRndRange = (min: number, max: number) => min + nextGrassRnd() * (max - min);

      // We draw enough patches at Level 5 to fully cover the ground organically
      const targetPatches = compostLvl >= 5 ? 15000 : compostLvl * 600; 
      
      for (let i = 0; i < targetPatches; i++) {
        // Use quadratic bias (r*r) to spawn MORE patches in the back (y=410) 
        // to compensate for perspective!
        const rY = nextGrassRnd();
        // Horizon line moved up to 410 to cover the final sliver of dirt!
        const y = 410 + (rY * rY) * (1080 - 410);
        const x = grassRndRange(0, 1920);
        
        const scale = getPerspectiveScale(y);
        const widthMult = compostLvl >= 5 ? 150 : 120;
        const heightMult = compostLvl >= 5 ? 50 : 30;
        
        const width = 20 + scale * widthMult;
        const height = 10 + scale * heightMult;
        maskGraphics.fillEllipse(x, y, width, height);
      }
      parkGrass.setMask(maskGraphics.createGeometryMask());
    } else {
      parkGrass.setVisible(false);
    }

    // Flowers (Start at Lvl 6)
    if (compostLvl >= 6) {
      let flowerSeed = 111;
      const nextFlowerRnd = () => { flowerSeed = (flowerSeed * 9301 + 49297) % 233280; return flowerSeed / 233280; };
      const flowerRndRange = (min: number, max: number) => min + nextFlowerRnd() * (max - min);

      const clusters = (compostLvl - 5) * 8; 
      const flowerEmojis = ['🌷', '🌻', '🌺', '🌼', '🌸'];
      
      for (let i = 0; i < clusters; i++) {
        const rY = nextFlowerRnd();
        const cy = 410 + (rY * rY) * (1080 - 410);
        const cx = flowerRndRange(0, 1920);
        
        const scale = getPerspectiveScale(cy);
        const fontSize = 12 + scale * 30; 
        
        const flowersInCluster = Math.floor(flowerRndRange(3, 6));
        for (let j = 0; j < flowersInCluster; j++) {
          const fx = cx + flowerRndRange(-20, 20) * scale;
          const fy = cy + flowerRndRange(-10, 10) * scale;
          const emoji = flowerEmojis[Math.floor(flowerRndRange(0, flowerEmojis.length))];
          this.add.text(fx, fy, emoji, { fontSize: `${Math.floor(fontSize)}px` }).setOrigin(0.5, 1);
        }
      }
    }

    // Bushes (Start at Lvl 7)
    if (compostLvl >= 7) {
      let bushSeed = 222;
      const nextBushRnd = () => { bushSeed = (bushSeed * 9301 + 49297) % 233280; return bushSeed / 233280; };
      const bushRndRange = (min: number, max: number) => min + nextBushRnd() * (max - min);

      const bushesCount = (compostLvl - 6) * 6; 
      
      for (let i = 0; i < bushesCount; i++) {
        const rY = nextBushRnd();
        const y = 410 + (rY * rY) * (1000 - 410);
        const x = bushRndRange(0, 1920);
        
        const scale = getPerspectiveScale(y);
        const fontSize = 20 + scale * 70;
        this.add.text(x, y, '🪴', { fontSize: `${Math.floor(fontSize)}px` }).setOrigin(0.5, 1);
      }
    }

    // Bugs (Start at Lvl 8+)
    if (compostLvl >= 8) {
      this.createFlyingEmoji('🦋', (compostLvl - 7) * 2);
    }
    if (compostLvl >= 9) {
      this.createFlyingEmoji('🐝', (compostLvl - 8) * 2);
    }

    // ===== LANDFILL: Park Sign and Animals =====
    if (landfillLvl >= 1) {
      this.add.text(960, 500, 'JAONG PARK', {
        fontSize: '48px', color: '#fff', fontStyle: 'bold', stroke: '#000',
        strokeThickness: 4, backgroundColor: '#8b4513', padding: { x: 20, y: 10 }
      }).setOrigin(0.5);
    }
    if (landfillLvl >= 2) {
      const rabbitsToDraw = (landfillLvl - 1) * 2;
      for (let i = 0; i < rabbitsToDraw; i++) {
        const y = Phaser.Math.Between(600, 1000);
        const x = Phaser.Math.Between(0, 1920);
        const scale = getPerspectiveScale(y);
        this.add.text(x, y, '🐇', { fontSize: `${Math.floor(15 + scale*40)}px` }).setOrigin(0.5, 1);
      }
    }
    if (landfillLvl >= 3) {
      const squirrelsToDraw = (landfillLvl - 2) * 3;
      for (let i = 0; i < squirrelsToDraw; i++) {
        const y = Phaser.Math.Between(580, 950);
        const x = Phaser.Math.Between(0, 1920);
        const scale = getPerspectiveScale(y);
        this.add.text(x, y, '🐿️', { fontSize: `${Math.floor(12 + scale*35)}px` }).setOrigin(0.5, 1);
      }
    }

    // ===== RECYCLING: Trees, Benches, Lamps, People =====
    if (recyclingLvl >= 1) {
      let treeSeed = 333;
      const nextTreeRnd = () => { treeSeed = (treeSeed * 9301 + 49297) % 233280; return treeSeed / 233280; };
      const treeRndRange = (min: number, max: number) => min + nextTreeRnd() * (max - min);

      const treesToDraw = recyclingLvl * 2; 
      for (let i = 0; i < treesToDraw; i++) {
        const y = treeRndRange(550, 900); // keep trees somewhat far back
        const x = treeRndRange(0, 1920);
        const scale = getPerspectiveScale(y);
        const fontSize = 40 + scale * 120;
        this.add.text(x, y, '🌳', { fontSize: `${Math.floor(fontSize)}px` }).setOrigin(0.5, 1);
      }
    }
    if (recyclingLvl >= 4) {
      let benchSeed = 444;
      const nextBenchRnd = () => { benchSeed = (benchSeed * 9301 + 49297) % 233280; return benchSeed / 233280; };
      const benchRndRange = (min: number, max: number) => min + nextBenchRnd() * (max - min);

      const benchesToDraw = Math.floor((recyclingLvl - 3) / 2) + 1;
      for (let i = 0; i < benchesToDraw; i++) {
        const y = benchRndRange(600, 1000);
        const x = benchRndRange(0, 1920);
        const scale = getPerspectiveScale(y);
        this.add.text(x, y, '🪑', { fontSize: `${Math.floor(20 + scale*50)}px` }).setOrigin(0.5, 1);
      }
    }
    if (recyclingLvl >= 5) {
      let lampSeed = 555;
      const nextLampRnd = () => { lampSeed = (lampSeed * 9301 + 49297) % 233280; return lampSeed / 233280; };
      const lampRndRange = (min: number, max: number) => min + nextLampRnd() * (max - min);

      const lampsToDraw = Math.floor((recyclingLvl - 4) / 2) + 1;
      for (let i = 0; i < lampsToDraw; i++) {
        const y = lampRndRange(580, 950);
        const x = lampRndRange(0, 1920);
        const scale = getPerspectiveScale(y);
        this.add.text(x, y, '🏮', { fontSize: `${Math.floor(25 + scale*60)}px` }).setOrigin(0.5, 1);
      }
    }
    if (recyclingLvl >= 8) {
      const peopleToDraw = recyclingLvl - 7;
      const peopleEmojis = ['🧑‍🤝‍🧑', '🎸👨‍🎤', '🍱🪑', '👨‍👩‍👧‍👦'];
      for (let i = 0; i < peopleToDraw; i++) {
        const y = Phaser.Math.Between(600, 1050);
        const x = Phaser.Math.Between(0, 1920);
        const scale = getPerspectiveScale(y);
        this.add.text(x, y, peopleEmojis[Phaser.Math.Between(0, peopleEmojis.length - 1)], { fontSize: `${Math.floor(20 + scale*50)}px` }).setOrigin(0.5, 1);
      }
    }

    // ===== PLASTIC: Pond, Ducks, Turtles, Fountain =====
    if (plasticLvl >= 1) {
      const pondY = 870;
      const scale = getPerspectiveScale(pondY);
      const pondWidth = (300 + (plasticLvl * 20)) * scale;
      const pondHeight = (100 + (plasticLvl * 10)) * scale;
      
      const pond = this.add.graphics();
      pond.fillStyle(0x0ea5e9, 0.8);
      pond.fillEllipse(960, pondY, pondWidth, pondHeight);
      
      if (plasticLvl >= 9) {
        // Sparkles
        for (let i = 0; i < 15; i++) {
          const sp = this.add.text(Phaser.Math.Between(960 - pondWidth/2, 960 + pondWidth/2), Phaser.Math.Between(pondY - pondHeight/2, pondY + pondHeight/2), '✨', { fontSize: `${Math.floor(10 + scale*15)}px` });
          this.tweens.add({ targets: sp, alpha: 0, yoyo: true, repeat: -1, duration: 800 + Math.random() * 1000, delay: Math.random() * 1000 });
        }
      }

      const ducksToDraw = Math.floor(plasticLvl / 3);
      for (let i = 0; i < ducksToDraw; i++) {
        const x = 960 + Phaser.Math.Between(-pondWidth/2, pondWidth/2);
        const y = pondY + Phaser.Math.Between(-pondHeight/2, pondHeight/2);
        this.add.text(x, y, '🦆', { fontSize: `${Math.floor(15 + getPerspectiveScale(y)*30)}px` }).setOrigin(0.5, 1);
      }

      if (plasticLvl >= 5) {
        const turtlesToDraw = Math.floor((plasticLvl - 4) / 2);
        for (let i = 0; i < turtlesToDraw; i++) {
          const x = 960 + Phaser.Math.Between(-pondWidth/2 - 50, pondWidth/2 + 50);
          const y = pondY + Phaser.Math.Between(10, 80);
          this.add.text(x, y, '🐢', { fontSize: `${Math.floor(12 + getPerspectiveScale(y)*25)}px` }).setOrigin(0.5, 1);
        }
      }

      if (plasticLvl >= 10) {
        this.add.text(960, pondY, '⛲', { fontSize: `${Math.floor(30 + scale*70)}px` }).setOrigin(0.5, 1);
      }
    }

    // ===== WEATHER OVERLAY =====
    const totalChi = this.chiSystem.getTotalChi(venuesData.map(v => v.id));
    const maxChi = venuesData.length * 100;
    if (totalChi <= maxChi * 0.25) {
      this.add.rectangle(0, 0, 1920, 1080, 0x1a1a1a, 0.4).setOrigin(0);
      this.add.text(960, 100, 'Warning: Severe Smog in the City', { fontSize: '32px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
    } else if (totalChi > maxChi * 0.75) {
      this.add.rectangle(0, 0, 1920, 1080, 0xffffff, 0.1).setOrigin(0);
      this.add.text(960, 100, 'Eco-Festival Active! The garden is thriving.', { fontSize: '32px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    }

    // ===== LEVEL SUMMARY UI =====
    const summaryUi = this.add.container(40, 120);
    const bgRect = this.add.rectangle(0, 0, 320, 200, 0x000000, 0.8).setOrigin(0);
    bgRect.setStrokeStyle(2, 0x444444);
    summaryUi.add(bgRect);

    summaryUi.add(this.add.text(10, 10, 'Garden Levels', { fontSize: '24px', color: '#fff', fontStyle: 'bold' }));
    summaryUi.add(this.add.text(10, 50, `🍎 Compost: Lvl ${compostLvl}`, { fontSize: '20px', color: '#22c55e' }));
    summaryUi.add(this.add.text(10, 80, `♻️ Recycling: ${compostLvl < 5 ? '🔒' : 'Lvl ' + recyclingLvl}`, { fontSize: '20px', color: compostLvl < 5 ? '#555' : '#3b82f6' }));
    summaryUi.add(this.add.text(10, 110, `🧴 Plastic: ${compostLvl < 5 ? '🔒' : 'Lvl ' + plasticLvl}`, { fontSize: '20px', color: compostLvl < 5 ? '#555' : '#6b7280' }));
    summaryUi.add(this.add.text(10, 140, `🗑️ Landfill: ${compostLvl < 5 ? '🔒' : 'Lvl ' + landfillLvl}`, { fontSize: '20px', color: compostLvl < 5 ? '#555' : '#a8a29e' }));

    // ===== BACK BUTTON =====
    this.add.text(40, 40, '⬅ Back to Map', { fontSize: '32px', color: '#ffffff', backgroundColor: '#333', padding: { x: 20, y: 10 } })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('LevelSelectScene');
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
