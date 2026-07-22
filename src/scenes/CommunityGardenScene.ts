import Phaser from 'phaser';
import { GardenSystem } from '../systems/GardenSystem';
import { ChiSystem } from '../systems/ChiSystem';
import venuesData from '../data/venues.json';

export class CommunityGardenScene extends Phaser.Scene {
  private gardenSystem!: GardenSystem;
  private chiSystem!: ChiSystem;

  private compostText!: Phaser.GameObjects.Text;
  private treeSprite!: Phaser.GameObjects.Text;
  private habitatsGroup!: Phaser.GameObjects.Group;
  private upgradeTreeBtn!: Phaser.GameObjects.Text;
  private buildPollinatorBtn!: Phaser.GameObjects.Text;
  private buildBirdhouseBtn!: Phaser.GameObjects.Text;
  private npcSprite?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CommunityGardenScene' });
  }

  create() {
    this.gardenSystem = new GardenSystem();
    this.chiSystem = new ChiSystem();

    // 1. Weather/Climate Sync
    const totalChi = this.chiSystem.getTotalChi(venuesData.map(v => v.id));
    const maxChi = venuesData.length * 100;
    
    // Default pleasant background
    this.cameras.main.setBackgroundColor('#87CEEB'); 

    let isSmog = false;
    let isEco = false;
    if (totalChi <= maxChi * 0.25) {
      isSmog = true;
      this.cameras.main.setBackgroundColor('#555555');
    } else if (totalChi > maxChi * 0.75) {
      isEco = true;
      this.cameras.main.setBackgroundColor('#00BFFF');
    }

    // Ground
    const groundColor = isSmog ? 0x4a4036 : (isEco ? 0x22c55e : 0x8B4513);
    this.add.rectangle(0, 800, 1920, 280, groundColor).setOrigin(0);

    // Weather overlay
    if (isSmog) {
      this.add.rectangle(0, 0, 1920, 1080, 0x1a1a1a, 0.4).setOrigin(0);
      this.add.text(960, 100, 'Warning: Severe Smog in the City', { fontSize: '32px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
    } else if (isEco) {
      this.add.rectangle(0, 0, 1920, 1080, 0xffffff, 0.1).setOrigin(0);
      this.add.text(960, 100, 'Eco-Festival Active! The garden is thriving.', { fontSize: '32px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
    }

    // Title
    this.add.text(960, 40, 'Community Garden', { fontSize: '64px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    // Compost Display
    this.compostText = this.add.text(40, 40, '', { fontSize: '48px', color: '#facc15', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 });
    this.updateCompostUI();

    // Back Button
    const backBtn = this.add.text(40, 1000, '⬅ Back to Map', { fontSize: '32px', color: '#ffffff', backgroundColor: '#333', padding: { x: 20, y: 10 } })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('LevelSelectScene');
      });

    this.habitatsGroup = this.add.group();

    // Draw Tree
    this.treeSprite = this.add.text(960, 750, '', { fontSize: '200px' }).setOrigin(0.5, 1);
    this.updateTreeVisuals();

    // Draw Habitats
    this.drawHabitats();

    // UI Buttons for Upgrades
    this.createUpgradeUI();
  }

  private updateCompostUI() {
    this.compostText.setText(`Compost: ${this.gardenSystem.getCompost()}`);
  }

  private updateTreeVisuals() {
    const phase = this.gardenSystem.getTreePhase();
    if (phase === 1) this.treeSprite.setText('🌱');
    else if (phase === 2) this.treeSprite.setText('🌳');
    else if (phase === 3) this.treeSprite.setText('🌸🌳🌸');
  }

  private drawHabitats() {
    this.habitatsGroup.clear(true, true);
    
    if (this.gardenSystem.isHabitatUnlocked('pollinator')) {
      this.habitatsGroup.add(this.add.text(1300, 800, '🦋🌻', { fontSize: '80px' }).setOrigin(0.5, 1));
    }
    if (this.gardenSystem.isHabitatUnlocked('birdhouse')) {
      this.habitatsGroup.add(this.add.text(600, 700, '🏠🐦', { fontSize: '80px' }).setOrigin(0.5, 1));
    }

    // If any habitat is unlocked, spawn a community NPC who walks around
    if (this.gardenSystem.getUnlockedHabitats().length > 0 && !this.npcSprite) {
      this.npcSprite = this.add.text(400, 780, '🧑‍🌾', { fontSize: '100px' }).setOrigin(0.5, 1);
      this.tweens.add({
        targets: this.npcSprite,
        x: 1500,
        duration: 8000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onYoyo: () => { this.npcSprite?.setScale(-1, 1); },
        onRepeat: () => { this.npcSprite?.setScale(1, 1); }
      });
    }
  }

  private createUpgradeUI() {
    const startX = 960;
    
    // Tree Upgrade
    this.upgradeTreeBtn = this.add.text(startX, 900, '', { fontSize: '24px', backgroundColor: '#2563eb', padding: { x: 15, y: 10 }, color: '#fff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const phase = this.gardenSystem.getTreePhase();
        if (phase === 1 && this.gardenSystem.spendCompost(10)) {
          this.gardenSystem.upgradeTree();
          this.refreshAll();
        } else if (phase === 2 && this.gardenSystem.spendCompost(25)) {
          this.gardenSystem.upgradeTree();
          this.refreshAll();
        }
      });

    // Pollinator Patch
    this.buildPollinatorBtn = this.add.text(startX - 300, 900, 'Build Pollinator Patch (15 Compost)', { fontSize: '24px', backgroundColor: '#16a34a', padding: { x: 15, y: 10 }, color: '#fff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (!this.gardenSystem.isHabitatUnlocked('pollinator') && this.gardenSystem.getTreePhase() >= 2) {
          if (this.gardenSystem.spendCompost(15)) {
            this.gardenSystem.unlockHabitat('pollinator');
            this.refreshAll();
          }
        }
      });

    // Birdhouse
    this.buildBirdhouseBtn = this.add.text(startX + 300, 900, 'Build Birdhouse (20 Compost)', { fontSize: '24px', backgroundColor: '#ea580c', padding: { x: 15, y: 10 }, color: '#fff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (!this.gardenSystem.isHabitatUnlocked('birdhouse') && this.gardenSystem.getTreePhase() >= 3) {
          if (this.gardenSystem.spendCompost(20)) {
            this.gardenSystem.unlockHabitat('birdhouse');
            this.refreshAll();
          }
        }
      });

    this.updateButtons();
  }

  private refreshAll() {
    this.updateCompostUI();
    this.updateTreeVisuals();
    this.drawHabitats();
    this.updateButtons();
  }

  private updateButtons() {
    const phase = this.gardenSystem.getTreePhase();
    const compost = this.gardenSystem.getCompost();

    // Tree btn
    if (phase === 1) {
      this.upgradeTreeBtn.setText('Upgrade Tree to Phase 2 (10 Compost)');
      this.upgradeTreeBtn.setAlpha(compost >= 10 ? 1 : 0.5);
    } else if (phase === 2) {
      this.upgradeTreeBtn.setText('Upgrade Tree to Phase 3 (25 Compost)');
      this.upgradeTreeBtn.setAlpha(compost >= 25 ? 1 : 0.5);
    } else {
      this.upgradeTreeBtn.setText('Tree Fully Upgraded!').setAlpha(0.5).disableInteractive();
    }

    // Pollinator btn
    if (this.gardenSystem.isHabitatUnlocked('pollinator')) {
      this.buildPollinatorBtn.setText('Pollinator Patch Built!').setAlpha(0.5).disableInteractive();
    } else if (phase < 2) {
      this.buildPollinatorBtn.setText('Requires Tree Phase 2').setAlpha(0.5).disableInteractive();
    } else {
      this.buildPollinatorBtn.setText('Build Pollinator Patch (15 Compost)').setInteractive();
      this.buildPollinatorBtn.setAlpha(compost >= 15 ? 1 : 0.5);
    }

    // Birdhouse btn
    if (this.gardenSystem.isHabitatUnlocked('birdhouse')) {
      this.buildBirdhouseBtn.setText('Birdhouse Built!').setAlpha(0.5).disableInteractive();
    } else if (phase < 3) {
      this.buildBirdhouseBtn.setText('Requires Tree Phase 3').setAlpha(0.5).disableInteractive();
    } else {
      this.buildBirdhouseBtn.setText('Build Birdhouse (20 Compost)').setInteractive();
      this.buildBirdhouseBtn.setAlpha(compost >= 20 ? 1 : 0.5);
    }
  }
}
