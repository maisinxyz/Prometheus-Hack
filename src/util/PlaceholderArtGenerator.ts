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

/**
 * Generates a colorful, emoji-based placeholder sprite for items.
 */
export function generateEmojiItemSprite(
  scene: Phaser.Scene,
  key: string,
  emoji: string,
  colorHex: number,
  size: number = 128
): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d') as any;
  if (ctx) {
    // Draw Emoji only, removing the weird rounded rectangle background
    // Draw Emoji
    ctx.font = `${size * 0.45}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
  }
  scene.textures.addCanvas(key, canvas);
}

export function generateBinPlaceholder(
  scene: Phaser.Scene,
  key: string,
  color: number,
  label: string,
  logo: string,
  width: number = 220,
  height: number = 320
): void {
  const backKey = `${key}_back`;
  const frontKey = `${key}_front`;

  if (scene.textures.exists(backKey) && scene.textures.exists(frontKey)) return;

  const cx = width / 2;
  const cy = 60; // Top opening center
  const by = height - 40; // Bottom base line

  // --- Back Texture ---
  if (!scene.textures.exists(backKey)) {
    const canvasBack = document.createElement('canvas');
    canvasBack.width = width;
    canvasBack.height = height;
    const ctxB = canvasBack.getContext('2d');

    if (ctxB) {
      const baseColor = Phaser.Display.Color.IntegerToColor(color);
      
      // Hinged Lid at the back
      ctxB.fillStyle = baseColor.clone().darken(30).rgba;
      ctxB.beginPath();
      if (ctxB.roundRect) ctxB.roundRect(cx - 90, cy - 55, 180, 20, 5);
      else ctxB.fillRect(cx - 90, cy - 55, 180, 20);
      ctxB.fill();

      // Outer Rim (Back half)
      ctxB.fillStyle = baseColor.clone().darken(10).rgba;
      ctxB.beginPath();
      if (ctxB.roundRect) ctxB.roundRect(cx - 100, cy - 40, 200, 80, 15);
      else ctxB.fillRect(cx - 100, cy - 40, 200, 80);
      ctxB.fill();

      // Deep black hole for trash (rectangular opening)
      ctxB.fillStyle = '#111111';
      ctxB.beginPath();
      if (ctxB.roundRect) ctxB.roundRect(cx - 90, cy - 30, 180, 60, 10);
      else ctxB.fillRect(cx - 90, cy - 30, 180, 60);
      ctxB.fill();
    }
    scene.textures.addCanvas(backKey, canvasBack);
  }

  // --- Front Texture ---
  if (!scene.textures.exists(frontKey)) {
    const canvasFront = document.createElement('canvas');
    canvasFront.width = width;
    canvasFront.height = height;
    const ctxF = canvasFront.getContext('2d');

    if (ctxF) {
      // Drop shadow underneath the bin
      ctxF.fillStyle = 'rgba(0,0,0,0.3)';
      ctxF.beginPath();
      ctxF.ellipse(cx, by + 10, 100, 20, 0, 0, 2 * Math.PI);
      ctxF.fill();

      // Wheels (Back-bottom corners)
      ctxF.fillStyle = '#222222';
      ctxF.beginPath();
      if (ctxF.roundRect) {
        ctxF.roundRect(cx - 85, by - 15, 20, 30, 5);
        ctxF.roundRect(cx + 65, by - 15, 20, 30, 5);
      } else {
        ctxF.fillRect(cx - 85, by - 15, 20, 30);
        ctxF.fillRect(cx + 65, by - 15, 20, 30);
      }
      ctxF.fill();

      // Main Body Gradient (adds depth/shading to the flat front)
      const baseColor = Phaser.Display.Color.IntegerToColor(color);
      const darkColor = baseColor.clone().darken(30);
      const grad = ctxF.createLinearGradient(cx - 95, 0, cx + 95, 0);
      grad.addColorStop(0, darkColor.rgba);
      grad.addColorStop(0.3, baseColor.rgba);
      grad.addColorStop(0.7, baseColor.rgba);
      grad.addColorStop(1, darkColor.rgba);

      // Tapering rectangular body
      ctxF.fillStyle = grad;
      ctxF.beginPath();
      ctxF.moveTo(cx - 92, cy + 20); // starts under the front rim
      ctxF.lineTo(cx + 92, cy + 20);
      ctxF.lineTo(cx + 80, by - 10);
      ctxF.quadraticCurveTo(cx + 80, by, cx + 70, by);
      ctxF.lineTo(cx - 70, by);
      ctxF.quadraticCurveTo(cx - 80, by, cx - 80, by - 10);
      ctxF.closePath();
      ctxF.fill();

      // Front rim (rendered using clipping and destination-out to preserve the hole)
      ctxF.save();
      ctxF.beginPath();
      ctxF.rect(0, cy, width, height); // Clip everything below cy
      ctxF.clip();

      ctxF.fillStyle = baseColor.clone().lighten(15).rgba; // Lighter front rim
      ctxF.beginPath();
      if (ctxF.roundRect) ctxF.roundRect(cx - 100, cy - 40, 200, 80, 15);
      else ctxF.rect(cx - 100, cy - 40, 200, 80);
      ctxF.fill();

      // Erase the hole area so trash can be seen falling behind the front rim
      ctxF.globalCompositeOperation = 'destination-out';
      ctxF.beginPath();
      if (ctxF.roundRect) ctxF.roundRect(cx - 90, cy - 30, 180, 60, 10);
      else ctxF.rect(cx - 90, cy - 30, 180, 60);
      ctxF.fill();
      ctxF.restore();

      // --- UI Stack ---
      // 1. Logo Symbol (Solid White Silhouette)
      const logoSize = 55;
      const logoCenterY = cy + 120;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = logoSize * 2;
      tempCanvas.height = logoSize * 2;
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        // Draw the native emoji
        tCtx.font = `${logoSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        tCtx.fillText(logo, logoSize, logoSize);
        
        // Use source-in to replace all non-transparent pixels with solid white
        tCtx.globalCompositeOperation = 'source-in';
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, logoSize * 2, logoSize * 2);
        
        // Draw the resulting white silhouette onto the main bin texture
        ctxF.drawImage(tempCanvas, cx - logoSize, logoCenterY - logoSize);
      }

      // 2. Sleek Name Text (Dark text inside a white sticker box)
      const textCenterY = cy + 200;
      ctxF.font = `bold 16px "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif`;
      const labelText = label.toUpperCase();
      const textWidth = Math.max(ctxF.measureText(labelText).width + 32, 90); // 16px padding on sides
      
      // Draw white sticker background
      ctxF.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctxF.beginPath();
      if (ctxF.roundRect) {
        ctxF.roundRect(cx - textWidth / 2, textCenterY - 16, textWidth, 32, 6);
      } else {
        ctxF.fillRect(cx - textWidth / 2, textCenterY - 16, textWidth, 32);
      }
      ctxF.fill();

      // Draw text in a dark version of the bin's base color
      ctxF.fillStyle = baseColor.clone().darken(40).rgba;
      ctxF.textAlign = 'center';
      ctxF.textBaseline = 'middle';
      ctxF.fillText(labelText, cx, textCenterY);
      
      // Reset shadows just in case
      ctxF.shadowBlur = 0;
      ctxF.shadowOffsetY = 0;
    }

    scene.textures.addCanvas(frontKey, canvasFront);
  }
}
