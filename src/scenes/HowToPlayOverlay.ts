import { UI_THEME } from '../config/UITheme';
import { GlossyButton } from '../entities/GlossyButton';

export class HowToPlayOverlay extends Phaser.Scene {
  constructor() {
    super({ key: 'HowToPlayOverlay' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Dark semi-transparent background
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);
    bg.setInteractive(); // Block clicks to underlying scene

    // Main panel
    const panelW = 1000;
    const panelH = 700;
    const panelX = width / 2;
    const panelY = height / 2;

    // Shadow
    this.add.graphics()
      .fillStyle(0x000000, 0.5)
      .fillRoundedRect(panelX - panelW / 2 + 10, panelY - panelH / 2 + 15, panelW, panelH, UI_THEME.cornerRadius);

    // Panel Background
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(
      parseInt(UI_THEME.primaryGradient[0].replace('#', '0x'), 16),
      parseInt(UI_THEME.primaryGradient[0].replace('#', '0x'), 16),
      parseInt(UI_THEME.primaryGradient[1].replace('#', '0x'), 16),
      parseInt(UI_THEME.primaryGradient[1].replace('#', '0x'), 16),
      1
    );
    panelBg.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, UI_THEME.cornerRadius);

    // Gloss highlight
    const gloss = this.add.graphics();
    gloss.fillStyle(0xffffff, UI_THEME.glossHighlightAlpha);
    const r = UI_THEME.cornerRadius;
    gloss.beginPath();
    gloss.moveTo(panelX - panelW / 2 + r, panelY - panelH / 2);
    gloss.lineTo(panelX + panelW / 2 - r, panelY - panelH / 2);
    gloss.arc(panelX + panelW / 2 - r, panelY - panelH / 2 + r, r, 1.5 * Math.PI, 2 * Math.PI, false);
    gloss.lineTo(panelX + panelW / 2, panelY);
    gloss.lineTo(panelX - panelW / 2, panelY);
    gloss.lineTo(panelX - panelW / 2, panelY - panelH / 2 + r);
    gloss.arc(panelX - panelW / 2 + r, panelY - panelH / 2 + r, r, Math.PI, 1.5 * Math.PI, false);
    gloss.closePath();
    gloss.fillPath();

    // Title
    this.add.text(panelX, panelY - 300, 'HOW TO PLAY', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5);

    const textStyle = {
      fontSize: '24px',
      color: '#ffffff',
      wordWrap: { width: panelW - 100 },
      lineSpacing: 10,
    };

    // A) Drag and drop basics
    this.add.text(panelX - 450, panelY - 220, 
      "👉 BASICS: Drag the trash items dropping onto the screen into the correct bins before the timer runs out! " +
      "If you drop them in the wrong bin or run out of time, you lose CHI.", textStyle);

    // B) Bin legend
    this.add.text(panelX - 450, panelY - 120, "🗑️ THE BINS:", { ...textStyle, fontStyle: 'bold' });
    this.add.text(panelX - 400, panelY - 80, 
      "• Recycle (Blue): Glass, Plastic, Cans, Clean Paper\n" +
      "• Compost (Green): Food Scraps, Yard Waste, Soiled Paper\n" +
      "• Landfill (Black): Wrappers, Styrofoam, Non-recyclables\n" +
      "• Hazardous (Red): Batteries, E-Waste, Chemicals", textStyle);

    // C) CHI and Unlocking
    this.add.text(panelX - 450, panelY + 60, "✨ CHI (CITY HEALTH INDEX):", { ...textStyle, fontStyle: 'bold' });
    this.add.text(panelX - 400, panelY + 100, 
      "Correct drops increase the city's CHI. Incorrect drops decrease it. " +
      "Earning enough CHI will unlock new venues and trigger special Eco-Festivals! " +
      "Watch out: if CHI drops too low, bad weather will strike.", textStyle);

    // D) Perfect Streak Flair
    this.add.text(panelX - 450, panelY + 220, "🔥 PERFECT STREAK:", { ...textStyle, fontStyle: 'bold' });
    this.add.text(panelX - 400, panelY + 260, 
      "Score consecutive perfect rounds (100% accuracy) to build your Perfect Streak! " +
      "Your streak adds flashy visual flair and fanfare to your game, proving your mastery.", textStyle);

    // Close Button
    new GlossyButton(this, panelX, panelY + panelH / 2 + 50, 'CLOSE', () => {
      // Resume the TrayScene timer if it exists and was paused
      const trayScene = this.scene.get('TrayScene') as any;
      if (trayScene && trayScene.sys.isActive() && trayScene.resumeTimer) {
        trayScene.resumeTimer();
      }
      this.scene.stop();
    });
  }
}
