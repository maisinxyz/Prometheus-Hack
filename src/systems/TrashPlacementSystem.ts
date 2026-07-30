import Phaser from 'phaser';
import { TrashItemDef } from '../data/schemas/itemSchema';

export interface PlacementTransform {
  x: number;
  y: number;
  depth: number;
  rotation: number;
  zone: string;
}

export interface ZoneConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Reusable system for context-aware trash placement.
 * Allows items to be naturally scattered across valid contextual zones,
 * preventing clipping and visually stacking them.
 */
export class TrashPlacementSystem {
  /**
   * Generates a list of valid placement transforms for a given set of items.
   * 
   * @param items Array of item definitions to place
   * @param venueZones Available zones in the venue
   * @param existingObstacles Any existing obstacles (e.g. bins or crushers) to avoid overlapping
   * @returns Array of calculated placement transforms corresponding to the items
   */
  public static generatePlacements(
    items: TrashItemDef[],
    venueZones: Record<string, ZoneConfig>,
    existingObstacles: Phaser.Geom.Rectangle[] = []
  ): PlacementTransform[] {
    const placements: PlacementTransform[] = [];
    // Keep track of placed bounds to prevent item overlap
    const placedBounds: Phaser.Geom.Rectangle[] = [...existingObstacles];
    
    // Assume an approximate size for collision checking before rendering (e.g., 100x100 max)
    // We can randomize it slightly to mimic the bounds
    const ITEM_WIDTH = 80;
    const ITEM_HEIGHT = 80;

    for (const item of items) {
      // Find valid zones for this item
      const validZones = (item.allowedZones ?? [])
        .filter(zoneName => venueZones[zoneName] !== undefined)
        .map(zoneName => ({ name: zoneName, config: venueZones[zoneName] }));
        
      let targetZoneName = 'GroundZone';
      let targetZone = venueZones['GroundZone'];

      if (validZones.length > 0) {
        // Pick a random valid zone
        const chosen = validZones[Phaser.Math.Between(0, validZones.length - 1)];
        targetZoneName = chosen.name;
        targetZone = chosen.config;
      }

      if (!targetZone) {
        // Fallback scatter area
        targetZone = { x: 150, y: 730, width: 1620, height: 150 };
      }

      let maxAttempts = 30;
      let safeSpawnFound = false;
      let finalX = 0;
      let finalY = 0;
      let bounds = new Phaser.Geom.Rectangle();

      while (maxAttempts > 0 && !safeSpawnFound) {
        // Generate random position within zone boundaries
        finalX = Phaser.Math.Between(targetZone.x + ITEM_WIDTH/2, targetZone.x + targetZone.width - ITEM_WIDTH/2);
        
        // For stacks and fences, we want to snap to the top/edge of the zone and jitter slightly,
        // rather than full scatter.
        if (targetZoneName.includes('Stack') || targetZoneName.includes('Pile') || targetZoneName.includes('Sawhorse') || targetZoneName.includes('Table') || targetZoneName.includes('Bench') || targetZoneName.includes('Counter') || targetZoneName.includes('Desk')) {
          // Snap near the top of the stack surface
          finalY = targetZone.y + Phaser.Math.Between(0, Math.min(40, targetZone.height / 2));
        } else {
          // Normal scatter over the full zone (e.g., GroundZone)
          finalY = Phaser.Math.Between(targetZone.y + ITEM_HEIGHT/2, targetZone.y + targetZone.height - ITEM_HEIGHT/2);
        }
        
        bounds.setTo(finalX - ITEM_WIDTH/2, finalY - ITEM_HEIGHT/2, ITEM_WIDTH, ITEM_HEIGHT);

        let overlapping = false;
        for (const existingBounds of placedBounds) {
          if (Phaser.Geom.Rectangle.Overlaps(bounds, existingBounds)) {
            overlapping = true;
            break;
          }
        }

        if (!overlapping) {
          safeSpawnFound = true;
          placedBounds.push(new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height));
        }
        
        maxAttempts--;
      }

      // If we couldn't find a safe spot after 30 attempts, just place it anyway
      if (!safeSpawnFound) {
        // Optionally fallback to ground zone if stack was too crowded
        if (targetZoneName !== 'GroundZone' && venueZones['GroundZone']) {
           const gz = venueZones['GroundZone'];
           finalX = Phaser.Math.Between(gz.x + ITEM_WIDTH/2, gz.x + gz.width - ITEM_WIDTH/2);
           finalY = Phaser.Math.Between(gz.y + ITEM_HEIGHT/2, gz.y + gz.height - ITEM_HEIGHT/2);
           targetZoneName = 'GroundZone';
        }
      }

      // Depth is based on Y to ensure proper rendering order (items lower on screen render in front)
      // Cap max depth to 99 so it doesn't render over UI or bins (if bins are 100)
      const depth = Math.min(99, Math.floor(finalY / 10));
      
      // Random rotation jitter (-15 to 15 degrees)
      const rotation = Phaser.Math.DegToRad(Phaser.Math.Between(-15, 15));

      placements.push({
        x: finalX,
        y: finalY,
        depth: depth,
        rotation: rotation,
        zone: targetZoneName
      });
    }

    return placements;
  }
}
