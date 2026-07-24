import venuesData from '../data/venues.json';

class PathOverlayServiceSingleton {
  private map: any = null;
  private animationId: number = 0;

  /**
   * Generates a continuous Catmull-Rom spline through a set of points
   */
  private generateCatmullRomSpline(points: number[][], pointsPerSegment: number = 20): number[][] {
    const curve: number[][] = [];
    if (points.length < 2) return points;
    
    // Duplicate start and end points to handle boundaries
    const pts = [points[0], ...points, points[points.length - 1]];
    
    for (let i = 1; i < pts.length - 2; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2];

      for (let t = 0; t <= 1; t += 1 / pointsPerSegment) {
        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * (
          (2 * p1[0]) +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
        );
        
        const y = 0.5 * (
          (2 * p1[1]) +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
        );

        curve.push([x, y]);
      }
    }
    return curve;
  }

  public addToMap(map: any) {
    this.map = map;

    // Build the raw venue coordinates
    const rawPoints: number[][] = [];
    for (let i = 0; i < venuesData.length; i++) {
      const v = venuesData[i] as any;
      rawPoints.push([v.longitude, v.latitude]);
    }
    
    // Insert sweeping intermediate points to force a continuous meandering loop
    const curvedPoints: number[][] = [rawPoints[0]];
    for (let i = 0; i < rawPoints.length - 1; i++) {
      const p1 = rawPoints[i];
      const p2 = rawPoints[i + 1];
      
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      
      // Make it alternate sides smoothly.
      const side = (i % 2 === 0) ? 1 : -1;
      
      // We push the control point out by roughly 40% of the distance
      // to create dramatic, loopy 'S' shapes between nodes
      const nx = -dy * 0.4 * side;
      const ny = dx * 0.4 * side;
      
      const cx = p1[0] + dx / 2 + nx;
      const cy = p1[1] + dy / 2 + ny;
      
      curvedPoints.push([cx, cy]);
      curvedPoints.push(p2);
    }

    // Generate the final smooth spline
    const pathCoordinates = this.generateCatmullRomSpline(curvedPoints, 15);

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
        'line-width': 24,
        'line-blur': 12,
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
        'line-width': 8,
        'line-dasharray': [1.5, 1.5]
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
