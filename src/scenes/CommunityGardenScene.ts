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

    // 1. Background (Base dirt)
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue
    this.add.rectangle(0, 540, 1920, 540, 0x654321).setOrigin(0, 0); // Dirt ground

    // Landfill: Park Sign and Animals
    if (landfillLvl >= 1) {
      this.add.text(960, 450, 'JAONG PARK', { 
        fontSize: '48px', color: '#fff', fontStyle: 'bold', stroke: '#000', 
        strokeThickness: 4, backgroundColor: '#8b4513', padding: { x: 20, y: 10 } 
      }).setOrigin(0.5);
    }
    
    // Compost: Grass, Flowers, Bushes, Bugs
    // Grass
    if (compostLvl >= 1) {
      const grassPercent = compostLvl >= 5 ? 100 : (compostLvl >= 4 ? 75 : (compostLvl >= 3 ? 50 : (compostLvl >= 2 ? 30 : 10)));
      this.add.rectangle(0, 540, 1920 * (grassPercent / 100), 540, 0x22c55e).setOrigin(0, 0);
    }
    if (compostLvl >= 6) {
      // Wildflowers
      for (let i=0; i<15; i++) this.add.text(Phaser.Math.Between(100, 1800), Phaser.Math.Between(550, 1000), '🌸', { fontSize: '40px' });
    }
    if (compostLvl >= 7) {
      // Bushes
      for (let i=0; i<8; i++) this.add.text(Phaser.Math.Between(100, 1800), Phaser.Math.Between(550, 1000), '🌿', { fontSize: '60px' });
    }
    if (compostLvl >= 8) {
      // Dragonflies
      this.createFlyingEmoji('🦗', 4); 
    }
    if (compostLvl >= 9) {
      // Butterflies
      this.createFlyingEmoji('🦋', 5);
    }
    if (compostLvl >= 10) {
      // Bees
      this.createFlyingEmoji('🐝', 6);
    }

    // Recycling: Trees, Benches, Humans
    if (recyclingLvl >= 1) {
      const treeScale = recyclingLvl >= 5 ? 1 : (recyclingLvl >= 4 ? 0.75 : (recyclingLvl >= 3 ? 0.5 : 0.33));
      const tree = this.add.text(400, 700, '🌳', { fontSize: '200px' }).setOrigin(0.5, 1);
      tree.setScale(treeScale);
      
      const tree2 = this.add.text(1500, 800, '🌳', { fontSize: '200px' }).setOrigin(0.5, 1);
      tree2.setScale(treeScale);
    }
    if (recyclingLvl >= 6) {
      this.add.text(300, 750, '🪑', { fontSize: '80px' }).setOrigin(0.5, 1); // Bench
      this.add.text(1400, 850, '🪑', { fontSize: '80px' }).setOrigin(0.5, 1);
    }
    if (recyclingLvl >= 7) {
      this.add.text(200, 700, '🏮', { fontSize: '100px' }).setOrigin(0.5, 1); // Lamp
      this.add.text(1300, 800, '🏮', { fontSize: '100px' }).setOrigin(0.5, 1);
    }
    if (recyclingLvl >= 8) {
      this.add.text(300, 730, '🧑‍🤝‍🧑', { fontSize: '50px' }).setOrigin(0.5, 1); // People on bench
      this.add.text(1400, 830, '🎸👨‍🎤', { fontSize: '50px' }).setOrigin(0.5, 1); // Guitar person
    }
    if (recyclingLvl >= 9) {
      this.add.text(700, 900, '🍱🪑', { fontSize: '80px' }).setOrigin(0.5, 1); // Picnic table
    }
    if (recyclingLvl >= 10) {
      this.add.text(700, 870, '👨‍👩‍👧‍👦', { fontSize: '60px' }).setOrigin(0.5, 1); // People at table
    }

    // Plastic: Pond
    if (plasticLvl >= 1) {
      const pondColor = plasticLvl >= 9 ? 0x00ffff : 0x0ea5e9; // Sparkly vibrant blue vs normal
      this.add.ellipse(960, 850, 600, 200, pondColor);
      
      if (plasticLvl >= 2) {
        this.add.text(800, 850, '🐟', { fontSize: '40px' }).setOrigin(0.5);
        this.add.text(1050, 820, '🐟', { fontSize: '30px' }).setOrigin(0.5);
      }
      if (plasticLvl >= 3) {
        this.add.text(700, 800, '🌾', { fontSize: '60px' }).setOrigin(0.5, 1); // Cattails
        this.add.text(1200, 900, '🌾', { fontSize: '60px' }).setOrigin(0.5, 1);
      }
      if (plasticLvl >= 4) {
        this.add.text(900, 830, '🦆', { fontSize: '50px' }).setOrigin(0.5);
        this.add.text(960, 870, '🦆', { fontSize: '40px' }).setOrigin(0.5);
      }
      if (plasticLvl >= 5) {
        this.add.text(850, 800, '🍃', { fontSize: '40px' }).setOrigin(0.5); // Lilypad
        this.add.text(1050, 900, '🍃', { fontSize: '40px' }).setOrigin(0.5);
      }
      if (plasticLvl >= 6) this.add.text(850, 790, '🐸', { fontSize: '30px' }).setOrigin(0.5);
      if (plasticLvl >= 7) this.createFlyingEmoji('🕊️', 3);
      if (plasticLvl >= 8) this.add.text(1100, 930, '🐢', { fontSize: '40px' }).setOrigin(0.5);
      if (plasticLvl >= 9) {
        // Sparkles
        for (let i=0; i<10; i++) {
          const sp = this.add.text(Phaser.Math.Between(700, 1200), Phaser.Math.Between(750, 950), '✨', { fontSize: '20px' });
          this.tweens.add({ targets: sp, alpha: 0, yoyo: true, repeat: -1, duration: 800 + Math.random()*1000, delay: Math.random()*1000 });
        }
      }
      if (plasticLvl >= 10) this.add.text(960, 820, '⛲', { fontSize: '150px' }).setOrigin(0.5, 1);
    }

    // Landfill animals
    if (landfillLvl >= 2) {
      this.add.text(1200, 700, '🐇', { fontSize: '40px' }).setOrigin(0.5, 1);
      this.add.text(1250, 720, '🐇', { fontSize: '30px' }).setOrigin(0.5, 1);
    }
    if (landfillLvl >= 3) {
      this.add.text(450, 750, '🐿️', { fontSize: '30px' }).setOrigin(0.5, 1);
      this.add.text(400, 680, '🐿️', { fontSize: '30px' }).setOrigin(0.5, 1); // on tree
    }
    if (landfillLvl >= 4) {
      this.add.text(1600, 900, '🐈', { fontSize: '50px' }).setOrigin(0.5, 1);
    }
    if (landfillLvl >= 5) {
      this.add.text(600, 950, '🐕', { fontSize: '60px' }).setOrigin(0.5, 1);
    }

    // Weather overlay (smog)
    const totalChi = this.chiSystem.getTotalChi(venuesData.map(v => v.id));
    const maxChi = venuesData.length * 100;
    if (totalChi <= maxChi * 0.25) {
      this.add.rectangle(0, 0, 1920, 1080, 0x1a1a1a, 0.4).setOrigin(0);
      this.add.text(960, 100, 'Warning: Severe Smog in the City', { fontSize: '32px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
    } else if (totalChi > maxChi * 0.75) {
      this.add.rectangle(0, 0, 1920, 1080, 0xffffff, 0.1).setOrigin(0);
      this.add.text(960, 100, 'Eco-Festival Active! The garden is thriving.', { fontSize: '32px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    }

    // Level Summary UI overlay
    const summaryUi = this.add.container(40, 120);
    const bgRect = this.add.rectangle(0, 0, 320, 200, 0x000000, 0.8).setOrigin(0);
    bgRect.setStrokeStyle(2, 0x444444);
    summaryUi.add(bgRect);
    
    summaryUi.add(this.add.text(10, 10, 'Garden Levels', { fontSize: '24px', color: '#fff', fontStyle: 'bold' }));
    summaryUi.add(this.add.text(10, 50, `🍎 Compost: Lvl ${compostLvl}`, { fontSize: '20px', color: '#22c55e' }));
    summaryUi.add(this.add.text(10, 80, `♻️ Recycling: ${compostLvl < 5 ? '🔒' : 'Lvl ' + recyclingLvl}`, { fontSize: '20px', color: compostLvl < 5 ? '#555' : '#3b82f6' }));
    summaryUi.add(this.add.text(10, 110, `🧴 Plastic: ${compostLvl < 5 ? '🔒' : 'Lvl ' + plasticLvl}`, { fontSize: '20px', color: compostLvl < 5 ? '#555' : '#6b7280' }));
    summaryUi.add(this.add.text(10, 140, `🗑️ Landfill: ${compostLvl < 5 ? '🔒' : 'Lvl ' + landfillLvl}`, { fontSize: '20px', color: compostLvl < 5 ? '#555' : '#a8a29e' }));

    // Back Button
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
