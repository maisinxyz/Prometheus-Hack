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

    // 1. Base ground — dirt (Aerial view of the park, fills the entire screen)
    const dirt = this.add.image(960, 540, 'park_dirt').setOrigin(0.5, 0.5);
    dirt.setDisplaySize(1920, 1080);

    // ===== COMPOST: Grass, Flowers, Bushes, Bugs =====
    if (compostLvl >= 1) {
      const grassAlpha = compostLvl >= 5 ? 1.0 : (compostLvl >= 4 ? 0.75 : (compostLvl >= 3 ? 0.5 : (compostLvl >= 2 ? 0.3 : 0.1)));
      const grass = this.add.image(960, 540, 'park_grass').setOrigin(0.5, 0.5);
      grass.setDisplaySize(1920, 1080);
      grass.setAlpha(grassAlpha);
    }
    if (compostLvl >= 6) {
      // Wildflowers — scattered photorealistic flower patches
      const flowerPositions = [
        { x: 200, y: 750 }, { x: 450, y: 850 }, { x: 700, y: 780 },
        { x: 1100, y: 900 }, { x: 1400, y: 750 }, { x: 1650, y: 830 },
        { x: 300, y: 920 }, { x: 1250, y: 820 }
      ];
      for (const pos of flowerPositions) {
        const f = this.add.image(pos.x, pos.y, 'garden_flower').setOrigin(0.5, 1);
        f.setScale(Phaser.Math.FloatBetween(0.08, 0.14));
      }
    }
    if (compostLvl >= 7) {
      // Bushes — photorealistic
      const bushPositions = [
        { x: 150, y: 780 }, { x: 550, y: 850 }, { x: 1350, y: 780 },
        { x: 1700, y: 870 }, { x: 900, y: 920 }
      ];
      for (const pos of bushPositions) {
        const b = this.add.image(pos.x, pos.y, 'garden_bush').setOrigin(0.5, 1);
        b.setScale(Phaser.Math.FloatBetween(0.12, 0.2));
      }
    }
    if (compostLvl >= 8) {
      this.createFlyingEmoji('🦗', 4); // Dragonflies
    }
    if (compostLvl >= 9) {
      this.createFlyingEmoji('🦋', 5); // Butterflies
    }
    if (compostLvl >= 10) {
      this.createFlyingEmoji('🐝', 6); // Bees
    }

    // ===== LANDFILL: Park Sign and Animals =====
    if (landfillLvl >= 1) {
      this.add.text(960, 500, 'JAONG PARK', {
        fontSize: '48px', color: '#fff', fontStyle: 'bold', stroke: '#000',
        strokeThickness: 4, backgroundColor: '#8b4513', padding: { x: 20, y: 10 }
      }).setOrigin(0.5);
    }
    if (landfillLvl >= 2) {
      // Rabbits
      const r1 = this.add.image(1200, 730, 'garden_rabbit').setOrigin(0.5, 1);
      r1.setScale(0.08);
      const r2 = this.add.image(1260, 750, 'garden_rabbit').setOrigin(0.5, 1);
      r2.setScale(0.06);
      r2.setFlipX(true);
    }
    if (landfillLvl >= 3) {
      this.add.text(450, 750, '🐿️', { fontSize: '30px' }).setOrigin(0.5, 1);
      this.add.text(400, 680, '🐿️', { fontSize: '30px' }).setOrigin(0.5, 1);
    }
    if (landfillLvl >= 4) {
      this.add.text(1600, 900, '🐈', { fontSize: '50px' }).setOrigin(0.5, 1);
    }
    if (landfillLvl >= 5) {
      this.add.text(600, 950, '🐕', { fontSize: '60px' }).setOrigin(0.5, 1);
    }

    // ===== RECYCLING: Trees, Benches, Lamps, People =====
    if (recyclingLvl >= 1) {
      const treeScale = recyclingLvl >= 5 ? 0.45 : (recyclingLvl >= 4 ? 0.35 : (recyclingLvl >= 3 ? 0.25 : 0.15));

      const tree1 = this.add.image(300, 780, 'garden_tree').setOrigin(0.5, 1);
      tree1.setScale(treeScale);

      const tree2 = this.add.image(1600, 800, 'garden_tree').setOrigin(0.5, 1);
      tree2.setScale(treeScale * 0.9);
      tree2.setFlipX(true);
    }
    if (recyclingLvl >= 6) {
      // Benches
      const bench1 = this.add.image(400, 860, 'garden_bench').setOrigin(0.5, 1);
      bench1.setScale(0.15);
      const bench2 = this.add.image(1400, 880, 'garden_bench').setOrigin(0.5, 1);
      bench2.setScale(0.13);
    }
    if (recyclingLvl >= 7) {
      // Lamps
      const lamp1 = this.add.image(250, 760, 'garden_lamp').setOrigin(0.5, 1);
      lamp1.setScale(0.2);
      const lamp2 = this.add.image(1500, 790, 'garden_lamp').setOrigin(0.5, 1);
      lamp2.setScale(0.18);
    }
    if (recyclingLvl >= 8) {
      this.add.text(420, 840, '🧑‍🤝‍🧑', { fontSize: '35px' }).setOrigin(0.5, 1);
      this.add.text(1420, 860, '🎸👨‍🎤', { fontSize: '35px' }).setOrigin(0.5, 1);
    }
    if (recyclingLvl >= 9) {
      this.add.text(700, 900, '🍱🪑', { fontSize: '60px' }).setOrigin(0.5, 1);
    }
    if (recyclingLvl >= 10) {
      this.add.text(700, 870, '👨‍👩‍👧‍👦', { fontSize: '45px' }).setOrigin(0.5, 1);
    }

    // ===== PLASTIC: Pond, Ducks, Turtles, Fountain =====
    if (plasticLvl >= 1) {
      const pond = this.add.image(960, 870, 'garden_pond').setOrigin(0.5, 0.5);
      pond.setScale(0.5);
      if (plasticLvl >= 9) {
        pond.setTint(0x88ffff);
      }

      if (plasticLvl >= 2) {
        this.add.text(880, 860, '🐟', { fontSize: '30px' }).setOrigin(0.5);
        this.add.text(1040, 850, '🐟', { fontSize: '22px' }).setOrigin(0.5);
      }
      if (plasticLvl >= 3) {
        this.add.text(780, 830, '🌾', { fontSize: '50px' }).setOrigin(0.5, 1);
        this.add.text(1150, 900, '🌾', { fontSize: '50px' }).setOrigin(0.5, 1);
      }
      if (plasticLvl >= 4) {
        // Ducks — photorealistic
        const duck1 = this.add.image(900, 870, 'garden_duck').setOrigin(0.5, 1);
        duck1.setScale(0.06);
        const duck2 = this.add.image(1020, 890, 'garden_duck').setOrigin(0.5, 1);
        duck2.setScale(0.05);
        duck2.setFlipX(true);
      }
      if (plasticLvl >= 5) {
        this.add.text(850, 840, '🍃', { fontSize: '30px' }).setOrigin(0.5);
        this.add.text(1060, 895, '🍃', { fontSize: '30px' }).setOrigin(0.5);
      }
      if (plasticLvl >= 6) {
        this.add.text(850, 825, '🐸', { fontSize: '25px' }).setOrigin(0.5);
      }
      if (plasticLvl >= 7) {
        this.createFlyingEmoji('🕊️', 3);
      }
      if (plasticLvl >= 8) {
        // Turtle — photorealistic
        const turtle = this.add.image(1100, 920, 'garden_turtle').setOrigin(0.5, 1);
        turtle.setScale(0.06);
      }
      if (plasticLvl >= 9) {
        // Sparkles around pond
        for (let i = 0; i < 10; i++) {
          const sp = this.add.text(Phaser.Math.Between(750, 1170), Phaser.Math.Between(800, 940), '✨', { fontSize: '16px' });
          this.tweens.add({ targets: sp, alpha: 0, yoyo: true, repeat: -1, duration: 800 + Math.random() * 1000, delay: Math.random() * 1000 });
        }
      }
      if (plasticLvl >= 10) {
        // Fountain — photorealistic
        const fountain = this.add.image(960, 850, 'garden_fountain').setOrigin(0.5, 1);
        fountain.setScale(0.3);
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
