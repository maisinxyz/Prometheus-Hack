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
      const trayScene = this.scene.get('TrayScene') as any;
      
      const camTut = document.createElement('div');
      camTut.style.position = 'absolute';
      camTut.style.top = '50%';
      camTut.style.left = '50%';
      camTut.style.transform = 'translate(-50%, -50%)';
      camTut.style.background = 'rgba(20,30,40,0.95)';
      camTut.style.border = '2px solid #3b82f6';
      camTut.style.color = '#fff';
      camTut.style.padding = '20px 40px';
      camTut.style.borderRadius = '16px';
      camTut.style.fontSize = '24px';
      camTut.style.fontFamily = '"Nunito", sans-serif';
      camTut.style.fontWeight = 'bold';
      camTut.style.zIndex = '9999';
      camTut.style.textAlign = 'center';
      camTut.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(59, 130, 246, 0.4)';
      camTut.innerHTML = 'Hint: You can <b>Right-Click, Hold, and Drag</b> to rotate the camera around the location!<br/><br/><button id="cam-tut-ok" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 20px; outline: none; transition: transform 0.1s ease;">GOT IT!</button>';
      document.body.appendChild(camTut);
      
      const okBtn = document.getElementById('cam-tut-ok');
      if (okBtn) {
         okBtn.addEventListener('mouseover', () => okBtn.style.transform = 'scale(1.05)');
         okBtn.addEventListener('mouseout', () => okBtn.style.transform = 'scale(1)');
         okBtn.addEventListener('click', () => {
            camTut.remove();
            if (trayScene) {
              if (trayScene.sys.isPaused()) {
                this.scene.resume('TrayScene');
              }
              if (trayScene.startTimer) trayScene.startTimer();
            }
         });
      }
      this.scene.stop();
    });
  }
}
