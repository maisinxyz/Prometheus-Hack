import Phaser from 'phaser';

/**
 * PlaceholderArtGenerator — Generates colored rectangle textures with labels
 * so that Tracks B/C/D/E are never blocked waiting on final art from Track F.
 *
 * Usage:
 *   generatePlaceholderTexture(scene, 'item_apple_core', 0x8B4513, 'APPLE', 128, 128);
 *   // Then use: scene.add.sprite(400, 400, 'item_apple_core');
 *
 * Per PRD Track 0, step 0.7.
 */
export function generatePlaceholderTexture(
  scene: Phaser.Scene,
  key: string,
  color: number,
  label: string,
  width: number,
  height: number,
  isCircle: boolean = false,
  isBin: boolean = false
): void {
  // Skip if this texture key already exists (real art was loaded)
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.add.graphics();

  if (isBin) {
    const cx = width / 2;
    const cy = height / 2;
    const holeW = width * 0.9;
    const holeH = height * 0.5;

    // Outer plastic rim colored by bin type
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(cx - holeW/2, cy - holeH/2, holeW, holeH, 12);
    
    // Deep black hole for trash
    graphics.fillStyle(0x111111, 1);
    graphics.fillRoundedRect(cx - holeW/2 + 15, cy - holeH/2 + 15, holeW - 30, holeH - 30, 8);
  } else if (isCircle) {
    const radius = Math.min(width, height) / 2;
    graphics.fillStyle(color, 1);
    graphics.fillCircle(width / 2, height / 2, radius);
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeCircle(width / 2, height / 2, radius);
  } else {
    // Draw a colored rounded rectangle
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(0, 0, width, height, 12);
    // Draw a subtle border for visibility
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeRoundedRect(0, 0, width, height, 12);
  }

  // Generate the texture from the graphics
  graphics.generateTexture(key, width, height);
  graphics.destroy();

  // Now add the label text on top by drawing to the canvas texture directly
  const canvasTexture = scene.textures.get(key);
  const source = canvasTexture.getSourceImage() as HTMLCanvasElement;
  const ctx = source.getContext('2d');

  if (ctx) {
    // Calculate font size relative to the rectangle dimensions
    const fontSize = Math.max(10, Math.min(width, height) / 6);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, width / 2, height / 2, width - 16);

    // Refresh the texture so Phaser picks up the canvas changes
    if ('refresh' in canvasTexture) {
      (canvasTexture as any).refresh();
    }
  }
}

/**
 * Generates an emoji-based circular logo texture for venues.
 */
export function generateEmojiLogo(scene: Phaser.Scene, key: string, emoji: string, isUnlocked: boolean, size: number = 80): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Circle background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, 2 * Math.PI);
    ctx.fillStyle = isUnlocked ? '#ffffff' : '#374151'; // White vs Dark grey
    ctx.fill();
    
    // Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = isUnlocked ? '#22c55e' : '#9ca3af'; // Green vs Light grey
    ctx.stroke();

    // Draw Emoji
    ctx.font = `${size * 0.55}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (!isUnlocked) {
      // Grayed out for locked
      ctx.filter = 'grayscale(100%) opacity(40%)';
    }
    
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
  }
  scene.textures.addCanvas(key, canvas);
}
