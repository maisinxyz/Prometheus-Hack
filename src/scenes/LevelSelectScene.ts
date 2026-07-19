import Phaser from 'phaser';
import { ChiSystem } from '../systems/ChiSystem';
import venuesData from '../data/venues.json';

/**
 * LevelSelectScene — Interactive Map UI.
 * Features a draggable 2.5D map with level nodes.
 * Per PRD Track D, steps D.3 and D.6.
 */
export class LevelSelectScene extends Phaser.Scene {
  private mapWidth = 2000; // Use a generous size for the square map image
  private mapHeight = 2000;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private chiSystem!: ChiSystem;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    this.chiSystem = new ChiSystem();

    // 1. Setup Map Background
    const mapImage = this.add.image(0, 0, 'nyc_map_bg');
    mapImage.setOrigin(0, 0);
    // Scale to fit the map area while preserving the image's native aspect ratio
    const scaleX = this.mapWidth / mapImage.width;
    const scaleY = this.mapHeight / mapImage.height;
    const scale = Math.max(scaleX, scaleY);
    mapImage.setScale(scale);

    // 2. Setup Camera Bounds
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // 3. Level Nodes (Grey Circles)
    // Map venue data to map coordinates (mapped to the user's custom image circles)
    // Map dimensions: 2000 x 2000 (square, matching the aerial image)
    // Nodes spread across the image in recognizable NYC landmarks
    const mapCoords: Record<string, { x: number, y: number }> = {
      'mackenzie_cafe': { x: 1500, y: 1600 }, // Bottom right area
      'financial_district_office': { x: 600, y: 1400 }, // Left mid-low
      'times_square': { x: 1000, y: 1100 }, // Center
      'broadway_theater': { x: 1200, y: 1000 }, // Right of TS
      'hot_dog_stand': { x: 1400, y: 800 }, // Right mid-high
      'subway_station': { x: 800, y: 900 }, // Left of TS
      'chelsea_office': { x: 500, y: 700 }, // Left mid-high
      'gym': { x: 800, y: 500 }, // Below CP
      'central_park': { x: 1000, y: 300 }, // Top center
      'public_library': { x: 1200, y: 500 }, // Mid-top right
      'art_studio': { x: 300, y: 1300 }, // Mid-low left
      'construction_site': { x: 1700, y: 1400 }, // Mid-low right
      'tech_startup': { x: 400, y: 1700 }, // Bottom left
      'nyc_hospital': { x: 1500, y: 1200 }, // Mid-right side on land
      'ferry_docks': { x: 350, y: 500 } // Directly on the pier on the left
    };

    let previousVenueChi = 0; // First level assumes 0 threshold needed

    venuesData.forEach((venue, index) => {
      const coords = mapCoords[venue.id] || { x: 500, y: 500 };
      
      // Determine if unlocked
      // Level 1 is always unlocked. Others check if previous venue's CHI meets threshold.
      const isUnlocked = index === 0 || previousVenueChi >= venue.unlockChiThreshold;
      const currentChi = this.chiSystem.getChi(venue.id);

      this.createLevelNode(
        coords.x, 
        coords.y, 
        venue.id, 
        venue.displayName, 
        currentChi, 
        isUnlocked,
        venue.unlockChiThreshold
      );

      // Store this venue's CHI to check for the next venue
      previousVenueChi = currentChi;
    });

    // Enable multi-touch for pinch zooming
    this.input.addPointer(1);

    // 4. Drag-to-Scroll Logic
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        // Adjust delta by camera zoom so dragging feels consistent at all zoom levels
        const deltaX = (pointer.x - this.dragStartX) / this.cameras.main.zoom;
        const deltaY = (pointer.y - this.dragStartY) / this.cameras.main.zoom;

        this.cameras.main.scrollX -= deltaX;
        this.cameras.main.scrollY -= deltaY;

        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    // 4b. Zoom Logic (Mouse Wheel)
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number, _deltaZ: number) => {
      const zoomFactor = 0.001;
      let newZoom = this.cameras.main.zoom - (deltaY * zoomFactor);
      
      // Clamp zoom between 1.0x (no zoom out past map) and 2.5x (zoomed in)
      newZoom = Phaser.Math.Clamp(newZoom, 1.0, 2.5);
      this.cameras.main.setZoom(newZoom);
    });

    // 4c. Zoom Logic (Pinch to zoom for touch screens)
    // Phaser supports multi-touch. We need to check if two pointers are active.
    let initialDistance = 0;
    let initialZoom = 1;

    this.input.on('pointermove', () => {
      const p1 = this.input.pointer1;
      const p2 = this.input.pointer2;

      if (p1.isDown && p2.isDown) {
        // Two fingers are down
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        
        if (initialDistance === 0) {
          // First frame of pinch
          initialDistance = dist;
          initialZoom = this.cameras.main.zoom;
        } else {
          // Continuing pinch
          const scaleFactor = dist / initialDistance;
          let newZoom = initialZoom * scaleFactor;
          newZoom = Phaser.Math.Clamp(newZoom, 1.0, 2.5);
          this.cameras.main.setZoom(newZoom);
        }
      } else {
        // Reset when fingers are lifted
        initialDistance = 0;
      }
    });

    // 5. Initial Camera Position
    const firstLevel = mapCoords['mackenzie_cafe'];
    if (firstLevel) {
      this.cameras.main.centerOn(firstLevel.x, firstLevel.y);
    }

    // Add UI overlay text
    const title = this.add.text(960, 50, 'Select a Level', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
  }

  private createLevelNode(
    x: number, 
    y: number, 
    venueId: string, 
    label: string, 
    currentChi: number, 
    isUnlocked: boolean,
    unlockThreshold: number
  ) {
    // Load the realistic 3D venue icon
    const logoKey = `venue_icon_${venueId}`;
    const logo = this.add.image(0, 0, logoKey).setDisplaySize(70, 70);

    // If locked, make it gray and slightly transparent
    if (!isUnlocked) {
      logo.setTint(0x555555);
      logo.setAlpha(0.6);
    }

    // Venue Label
    const text = this.add.text(0, 55, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    text.setOrigin(0.5);

    // CHI Readout
    let chiTextStr = `CHI: ${Math.floor(currentChi)}`;
    if (!isUnlocked) {
      chiTextStr = `Needs ${unlockThreshold} CHI in previous`;
    }

    const chiText = this.add.text(0, 85, chiTextStr, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: isUnlocked ? '#facc15' : '#ef4444', // Yellow if unlocked, red if locked
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    chiText.setOrigin(0.5);

    // CHI Bar (Simple horizontal fill)
    const barWidth = 100;
    const barHeight = 10;
    const barBg = this.add.rectangle(0, 110, barWidth, barHeight, 0x000000, 0.5);
    barBg.setStrokeStyle(2, 0xffffff);
    
    const fillWidth = (currentChi / 100) * barWidth;
    // We use setOrigin(0, 0.5) to grow from left to right
    const barFill = this.add.rectangle(-barWidth / 2, 110, fillWidth, barHeight, 0xfacc15, 1);
    barFill.setOrigin(0, 0.5);

    const nodeElements: Phaser.GameObjects.GameObject[] = [logo, text, chiText];
    if (isUnlocked) {
      nodeElements.push(barBg, barFill);
    }

    const nodeContainer = this.add.container(x, y, nodeElements);
    nodeContainer.setSize(80, 80);

    if (isUnlocked) {
      nodeContainer.setInteractive({ useHandCursor: true });

      nodeContainer.on('pointerover', () => {
        this.tweens.add({
          targets: nodeContainer,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100
        });
        // Could tint the logo to show hover state
        logo.setTint(0xd1fae5); // light green tint
      });

      nodeContainer.on('pointerout', () => {
        this.tweens.add({
          targets: nodeContainer,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 100
        });
        logo.clearTint();
      });

      nodeContainer.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        const distance = Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.upX, pointer.upY);
        if (distance < 10) {
          this.scene.start('TrayScene', { venueId });
        }
      });
    } else {
      // Locked effect
      nodeContainer.setAlpha(0.7);
    }
  }
}
