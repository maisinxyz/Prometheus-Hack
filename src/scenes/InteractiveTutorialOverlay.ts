import Phaser from 'phaser';

export class InteractiveTutorialOverlay extends Phaser.Scene {
  constructor() {
    super({ key: 'InteractiveTutorialOverlay' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Dark transparent overlay (oversized to bypass safe area/letterboxing)
    const bg = this.add.rectangle(-width, -height, width * 3, height * 3, 0x000000, 0.75).setOrigin(0, 0);
    bg.setInteractive();

    const panelW = 700;
    const panelH = 350;
    const centerX = width / 2;
    const centerY = height / 2;

    // Blueprint Panel Background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e3a8a, 1); // Dark blueprint blue
    panelBg.fillRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH);

    // Draw Blueprint Grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x3b82f6, 0.3); // Faint light blue grid lines
    const startX = centerX - panelW/2;
    const startY = centerY - panelH/2;
    const gridSize = 25;
    
    // Vertical lines
    for (let x = 0; x <= panelW; x += gridSize) {
      grid.moveTo(startX + x, startY);
      grid.lineTo(startX + x, startY + panelH);
    }
    // Horizontal lines
    for (let y = 0; y <= panelH; y += gridSize) {
      grid.moveTo(startX, startY + y);
      grid.lineTo(startX + panelW, startY + y);
    }
    grid.strokePath();

    // Blueprint Border
    const border = this.add.graphics();
    border.lineStyle(4, 0xffffff, 0.8);
    border.strokeRect(startX + 8, startY + 8, panelW - 16, panelH - 16);
    
    // Corner accents
    border.fillStyle(0xffffff, 1);
    const cornerSize = 12;
    border.fillRect(startX, startY, cornerSize, cornerSize);
    border.fillRect(startX + panelW - cornerSize, startY, cornerSize, cornerSize);
    border.fillRect(startX, startY + panelH - cornerSize, cornerSize, cornerSize);
    border.fillRect(startX + panelW - cornerSize, startY + panelH - cornerSize, cornerSize, cornerSize);

    // Title
    this.add.text(centerX, centerY - 100, 'BLUEPRINT: HEAVY ITEMS', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 2
    }).setOrigin(0.5, 0.5);

    // Clean, technical instruction text
    this.add.text(centerX, centerY - 20, 
      "You don't HAVE to put these in the Rock Crusher,\nbut if you do, you get a 250 point bonus!", 
      {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '20px',
        color: '#93c5fd', // Light blueprint blue
        align: 'center',
        lineSpacing: 12,
      }).setOrigin(0.5, 0.5);

    // Visual examples of what to put in the crusher
    this.add.image(centerX - 120, centerY + 65, 'brick').setDisplaySize(60, 60);
    this.add.image(centerX - 40, centerY + 65, 'rock').setDisplaySize(60, 60);
    this.add.text(centerX + 30, centerY + 65, '➡️', { fontSize: '32px' }).setOrigin(0.5);
    this.add.image(centerX + 110, centerY + 65, 'machine_rock_crusher').setDisplaySize(90, 90);

    // Blueprint style button
    const btnWidth = 160;
    const btnHeight = 40;
    const btnY = centerY + 130;
    
    const btnBg = this.add.graphics();
    btnBg.lineStyle(2, 0xffffff, 1);
    btnBg.strokeRect(centerX - btnWidth/2, btnY - btnHeight/2, btnWidth, btnHeight);
    
    const btnFill = this.add.graphics();
    btnFill.fillStyle(0xffffff, 0.2);
    btnFill.fillRect(centerX - btnWidth/2, btnY - btnHeight/2, btnWidth, btnHeight);
    btnFill.setAlpha(0);

    const btnText = this.add.text(centerX, btnY, 'ACKNOWLEDGE', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    // Interaction zone
    const hitZone = this.add.zone(centerX, btnY, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      this.tweens.add({ targets: btnFill, alpha: 1, duration: 150 });
    });

    hitZone.on('pointerout', () => {
      this.tweens.add({ targets: btnFill, alpha: 0, duration: 150 });
    });

    hitZone.on('pointerdown', () => {
      // Resume the TrayScene (properly checks for existence since isActive() is false when paused)
      const trayScene = this.scene.get('TrayScene') as any;
      if (trayScene) {
        if (trayScene.sys.isPaused()) {
          this.scene.resume('TrayScene');
        }
        if (trayScene.startTimer) trayScene.startTimer();
      }
      this.scene.stop();
    });
  }
}
