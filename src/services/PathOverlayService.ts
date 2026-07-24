import venuesData from '../data/venues.json';

class PathOverlayServiceSingleton {
  private map: any = null;
  private animationId: number = 0;

  /**
   * Calculates a smooth bezier curve between two points
   */
  private generateCurve(p1: number[], p2: number[], segments: number = 10): number[][] {
    const curvePoints: number[][] = [];
    const dx = (p2[0] || 0) - (p1[0] || 0);
    const dy = (p2[1] || 0) - (p1[1] || 0);
    
    // Perpendicular vector for the curve "belly"
    const nx = -dy;
    const ny = dx;
    
    // Control point offset - alternate sides for a zig-zag path
    const side = (((p1[0] || 0) + (p1[1] || 0)) * 1000 % 2) > 1 ? 1 : -1;
    const cx = (p1[0] || 0) + dx / 2 + (nx * 0.15 * side);
    const cy = (p1[1] || 0) + dy / 2 + (ny * 0.15 * side);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Quadratic bezier
      const x = Math.pow(1 - t, 2) * (p1[0] || 0) + 2 * (1 - t) * t * cx + Math.pow(t, 2) * (p2[0] || 0);
      const y = Math.pow(1 - t, 2) * (p1[1] || 0) + 2 * (1 - t) * t * cy + Math.pow(t, 2) * (p2[1] || 0);
      curvePoints.push([x, y]);
    }

    return curvePoints;
  }

  public addToMap(map: any) {
    this.map = map;

    // Build the path coordinates
    const pathCoordinates: number[][] = [];
    for (let i = 0; i < venuesData.length - 1; i++) {
      const v1 = venuesData[i] as any;
      const v2 = venuesData[i + 1] as any;
      
      const p1 = [v1.longitude, v1.latitude];
      const p2 = [v2.longitude, v2.latitude];
      
      const curve = this.generateCurve(p1, p2, 15);
      
      if (i > 0) {
        curve.shift(); // Prevent duplicate shared points
      }
      pathCoordinates.push(...curve);
    }

    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: pathCoordinates
          }
        }
      ]
    };

    this.map.addSource('candy-crush-path', {
      type: 'geojson',
      data: geojson,
      lineMetrics: true
    });

    // 1. Glow Layer (wider, softer, underneath)
    this.map.addLayer({
      id: 'candy-crush-path-glow',
      type: 'line',
      source: 'candy-crush-path',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#34D399',
        'line-width': 12,
        'line-blur': 8,
        'line-opacity': 0.6
      }
    });

    // 2. Core Line (solid with dashed overlay)
    this.map.addLayer({
      id: 'candy-crush-path-core',
      type: 'line',
      source: 'candy-crush-path',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 4,
        'line-dasharray': [2, 2]
      }
    });

    // No JS animation loop needed for now to preserve 60fps panning
  }

  public removeFromMap() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    
    if (this.map) {
      if (this.map.getLayer('candy-crush-path-core')) this.map.removeLayer('candy-crush-path-core');
      if (this.map.getLayer('candy-crush-path-glow')) this.map.removeLayer('candy-crush-path-glow');
      if (this.map.getSource('candy-crush-path')) this.map.removeSource('candy-crush-path');
    }
    this.map = null;
  }
}

export const PathOverlayService = new PathOverlayServiceSingleton();
