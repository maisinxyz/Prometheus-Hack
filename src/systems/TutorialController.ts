import { TrashItem } from '../entities/TrashItem';
import { Bin } from '../entities/Bin';

export class TutorialController {
  private scene: Phaser.Scene;
  private overlay!: Phaser.GameObjects.Rectangle;
  private handIcon!: Phaser.GameObjects.Graphics;
  private textCallout!: Phaser.GameObjects.Text;
  private reticle!: Phaser.GameObjects.Graphics;
  private handTween!: Phaser.Tweens.Tween;
  private reticleTween!: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public startTutorial(targetItem: TrashItem, targetBin: Bin): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 1. Dim the background
    // Oversize the overlay to guarantee it covers any letterboxing margins from Phaser.Scale.FIT
    this.overlay = this.scene.add.rectangle(-width, -height, width * 3, height * 3, 0x000000, 0.7);
    this.overlay.setOrigin(0, 0);
    this.overlay.setDepth(100); // Behind the item, in front of everything else

    // Ensure the target item and bin render above the overlay
    targetItem.setDepth(101);
    targetBin.setDepth(101);

    // Spotlight ring (reusing lock-on reticle style)
    this.reticle = this.scene.add.graphics();
    this.reticle.lineStyle(4, 0x00ff00, 1);
    const radius = Math.min((targetItem.displayWidth || targetItem.width) * 0.5, 60);
    this.reticle.strokeCircle(0, 0, radius);
    this.reticle.setPosition(targetItem.x, targetItem.y);
    this.reticle.setDepth(101);

    this.reticleTween = this.scene.tweens.add({
      targets: this.reticle,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.5,
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    // 2. Animated hand/cursor icon
    // Using simple graphics to draw a stylized cursor/hand for now
    this.handIcon = this.scene.add.graphics();
    this.handIcon.fillStyle(0xffffff, 1);
    this.handIcon.lineStyle(2, 0x000000, 1);
    this.handIcon.beginPath();
    this.handIcon.moveTo(0, 0);
    this.handIcon.lineTo(20, 20);
    this.handIcon.lineTo(10, 25);
    this.handIcon.lineTo(5, 40);
    this.handIcon.lineTo(-5, 40);
    this.handIcon.lineTo(0, 25);
    this.handIcon.lineTo(-10, 20);
    this.handIcon.closePath();
    this.handIcon.fillPath();
    this.handIcon.strokePath();
    this.handIcon.setDepth(102);

    // Tween the hand tracing a path from the item to the correct bin
    this.handIcon.setPosition(targetItem.x + 20, targetItem.y + 20);
    this.handTween = this.scene.tweens.add({
      targets: this.handIcon,
      x: targetBin.x,
      y: targetBin.y,
      duration: 1500,
      repeat: -1,
      ease: 'Sine.easeInOut',
      hold: 500, // pause at the bin before restarting
    });

    // 3. Text callout
    this.textCallout = this.scene.add.text(width / 2, height / 2 - 150, "Drag trash to the matching bin!", {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.textCallout.setOrigin(0.5, 0.5);
    this.textCallout.setDepth(102);
  }

  public completeTutorial(): void {
    if (this.handTween) this.handTween.stop();
    if (this.reticleTween) this.reticleTween.stop();

    if (this.handIcon) this.handIcon.destroy();
    if (this.reticle) this.reticle.destroy();
    if (this.textCallout) {
      this.textCallout.setText("Nice!");
      this.textCallout.setColor('#00ff00');
      
      // Fade out overlay and text
      this.scene.tweens.add({
        targets: [this.overlay, this.textCallout],
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          if (this.overlay) this.overlay.destroy();
          if (this.textCallout) this.textCallout.destroy();
        }
      });
    }
  }
}
