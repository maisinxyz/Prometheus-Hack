import Phaser from 'phaser';

/**
 * TitleScene — Landing Page with Play Button.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    
    // We don't draw the image inside Phaser because it causes a seam with the letterboxing.
    // Instead, the canvas is transparent, and we let the CSS body background show through!

    // Apply the image to the HTML body as well to fill any letterboxed black bars
    document.body.style.backgroundImage = "url('/assets/sprites/items/main_menu_bg.png')";
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '#222';
    });

    // Title Text
    const title = this.add.text(960, 300, 'TrashDash: NYC Echo', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '96px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    });
    title.setOrigin(0.5);

    // --- CONTINUE BUTTON ---
    const playBtnBg = this.add.rectangle(0, 0, 400, 100, 0x22C55E, 1);
    playBtnBg.setStrokeStyle(4, 0xffffff);
    
    const playBtnText = this.add.text(0, 0, 'CONTINUE', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    playBtnText.setOrigin(0.5);

    const playBtn = this.add.container(960, 420, [playBtnBg, playBtnText]);
    playBtn.setSize(400, 100);
    playBtn.setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => {
      playBtnBg.setFillStyle(0x16a34a, 1);
      this.tweens.add({ targets: playBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });

    playBtn.on('pointerout', () => {
      playBtnBg.setFillStyle(0x22C55E, 1);
      this.tweens.add({ targets: playBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 });
    });

    playBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: playBtn, scaleX: 0.95, scaleY: 0.95, duration: 100, yoyo: true,
        onComplete: () => {
          localStorage.removeItem('trashdash_dev_mode');
          this.scene.start('LevelSelectScene');
        }
      });
    });

    // --- NEW GAME BUTTON (Wipes Save) ---
    const newBtnBg = this.add.rectangle(0, 0, 400, 100, 0xef4444, 1); // Red
    newBtnBg.setStrokeStyle(4, 0xffffff);
    
    const newBtnText = this.add.text(0, 0, 'NEW GAME', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    newBtnText.setOrigin(0.5);

    const newBtn = this.add.container(960, 550, [newBtnBg, newBtnText]);
    newBtn.setSize(400, 100);
    newBtn.setInteractive({ useHandCursor: true });

    newBtn.on('pointerover', () => {
      newBtnBg.setFillStyle(0xdc2626, 1);
      this.tweens.add({ targets: newBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });

    newBtn.on('pointerout', () => {
      newBtnBg.setFillStyle(0xef4444, 1);
      this.tweens.add({ targets: newBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 });
    });

    newBtn.on('pointerdown', () => {
      if (confirm("Are you sure you want to start a new game? This will erase all your Chi and garden progress!")) {
        this.tweens.add({
          targets: newBtn, scaleX: 0.95, scaleY: 0.95, duration: 100, yoyo: true,
          onComplete: () => {
            // Delete all save keys
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
               const key = localStorage.key(i);
               if (key && key.startsWith('trashdash_')) {
                  keysToRemove.push(key);
               }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            const sessionKeysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
               const key = sessionStorage.key(i);
               if (key && key.startsWith('trashdash_')) {
                  sessionKeysToRemove.push(key);
               }
            }
            sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
            
            this.scene.start('LevelSelectScene');
          }
        });
      }
    });

    // --- SPRITES BUTTON ---
    const spritesBtnBg = this.add.rectangle(0, 0, 400, 100, 0x8b5cf6, 1); // Purple
    spritesBtnBg.setStrokeStyle(4, 0xffffff);
    
    const spritesBtnText = this.add.text(0, 0, 'WASTE ENCYCLOPEDIA', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    spritesBtnText.setOrigin(0.5);

    const spritesBtn = this.add.container(960, 680, [spritesBtnBg, spritesBtnText]);
    spritesBtn.setSize(400, 100);
    spritesBtn.setInteractive({ useHandCursor: true });

    spritesBtn.on('pointerover', () => {
      spritesBtnBg.setFillStyle(0x7c3aed, 1);
      this.tweens.add({ targets: spritesBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });

    spritesBtn.on('pointerout', () => {
      spritesBtnBg.setFillStyle(0x8b5cf6, 1);
      this.tweens.add({ targets: spritesBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 });
    });

    spritesBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: spritesBtn, scaleX: 0.95, scaleY: 0.95, duration: 100, yoyo: true,
        onComplete: () => {
          this.scene.start('SpritesScene');
        }
      });
    });

    // --- DEVELOPER MODE BUTTON (Unlock All) ---
    const devBtnBg = this.add.rectangle(0, 0, 400, 100, 0x3b82f6, 1); // Blue
    devBtnBg.setStrokeStyle(4, 0xffffff);
    
    const devBtnText = this.add.text(0, 0, 'DEVELOPER MODE', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    devBtnText.setOrigin(0.5);

    const devBtn = this.add.container(960, 810, [devBtnBg, devBtnText]);
    devBtn.setSize(400, 100);
    devBtn.setInteractive({ useHandCursor: true });

    devBtn.on('pointerover', () => {
      devBtnBg.setFillStyle(0x2563eb, 1);
      this.tweens.add({ targets: devBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });

    devBtn.on('pointerout', () => {
      devBtnBg.setFillStyle(0x3b82f6, 1);
      this.tweens.add({ targets: devBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 });
    });

    devBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: devBtn, scaleX: 0.95, scaleY: 0.95, duration: 100, yoyo: true,
        onComplete: () => {
          // Unlock all venues by setting high CHI for them
          const venueIds = [
            'construction_site', 'ferry_docks', 'tech_startup',
            'subway_station', 'gym', 'public_library',
            'art_studio', 'financial_district_office', 'central_park', 'times_square',
            'nyc_hospital', 'hot_dog_stand', 'mackenzie_cafe'
          ];
          venueIds.forEach(id => {
            sessionStorage.setItem('trashdash_chi_' + id, '100');
          });
          sessionStorage.setItem('trashdash_tutorial_complete', 'true');
          localStorage.setItem('trashdash_dev_mode', 'true');
          
          this.scene.start('LevelSelectScene');
        }
      });
    });
  }
}
