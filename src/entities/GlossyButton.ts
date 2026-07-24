import Phaser from 'phaser';
import { UI_THEME } from '../config/UITheme';

export class GlossyButton extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private glossGraphics: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  
  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    text: string, 
    onClick: () => void,
    colors: string[] = [...UI_THEME.primaryGradient]
  ) {
    super(scene, x, y);
    
    // Parse colors to numbers
    const colorTop = Phaser.Display.Color.HexStringToColor(colors[0]).color;
    const colorBottom = Phaser.Display.Color.HexStringToColor(colors[1]).color;
    
    // Create drop shadow
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(-width / 2 + 4, -height / 2 + 6, width, height, UI_THEME.cornerRadius);
    this.add(shadow);
    
    // Create background with gradient
    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.fillGradientStyle(colorTop, colorTop, colorBottom, colorBottom, 1);
    this.bgGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, UI_THEME.cornerRadius);
    this.add(this.bgGraphics);
    
    // Create gloss highlight (top third)
    this.glossGraphics = scene.add.graphics();
    this.glossGraphics.fillStyle(0xffffff, UI_THEME.glossHighlightAlpha);
    // Draw a custom path for the top half to respect top rounded corners, 
    // or simply draw a rounded rect and clip it, or draw a rounded rect with 0 bottom radius.
    // Easiest is to use fillRoundedRect with specific corner radii if Phaser 3.60 supports it,
    // otherwise draw a rounded rect slightly smaller and just cover the top.
    const r = UI_THEME.cornerRadius;
    this.glossGraphics.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height * 0.4, { tl: r-2, tr: r-2, bl: 0, br: 0 } as any);
    this.add(this.glossGraphics);
    
    // Create text
    this.labelText = scene.add.text(0, 0, text, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,0.5)', blur: 2, fill: true }
    }).setOrigin(0.5);
    this.add(this.labelText);
    
    // Hit area
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        scene.tweens.add({
          targets: this,
          scale: UI_THEME.pressedScale,
          duration: 60
        });
      })
      .on('pointerup', () => {
        scene.tweens.add({
          targets: this,
          scale: 1,
          duration: 150,
          ease: 'Back.easeOut'
        });
        onClick();
      })
      .on('pointerout', () => {
        scene.tweens.add({
          targets: this,
          scale: 1,
          duration: 150,
          ease: 'Back.easeOut'
        });
      });
      
    // Pop-in animation
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: UI_THEME.popInDuration,
      ease: 'Back.easeOut'
    });
    
    scene.add.existing(this);
  }
}
