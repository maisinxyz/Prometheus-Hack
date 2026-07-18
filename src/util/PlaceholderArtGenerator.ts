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
  height: number
): void {
  // Skip if this texture key already exists (real art was loaded)
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.add.graphics();

  // Draw a colored rounded rectangle
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(0, 0, width, height, 12);

  // Draw a subtle border for visibility
  graphics.lineStyle(2, 0xffffff, 0.3);
  graphics.strokeRoundedRect(0, 0, width, height, 12);

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
    canvasTexture.refresh();
  }
}
