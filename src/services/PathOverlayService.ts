import venuesData from '../data/venues.json';

class PathOverlayServiceSingleton {
  private map: any = null;
  private animationId: number = 0;

  /**
   * Generates a Catmull-Rom spline chunked into per-venue segments
   */
  private generateCatmullRomSplineSegments(points: number[][], pointsPerSegment: number = 20): number[][][] {
    const segments: number[][][] = [];
    if (points.length < 2) return segments;
    
    // Duplicate start and end points to handle boundaries
    const pts = [points[0] as [number, number], ...(points as [number, number][]), points[points.length - 1] as [number, number]];
    
    // Step by 2 because we inserted 1 intermediate point between every 2 venues.
    for (let i = 1; i < pts.length - 2; i += 2) {
      const segmentCoords: number[][] = [];
      // Sub-segment 1 & 2
      for (let j = 0; j <= 1; j++) {
        const idx = i + j;
        const p0 = pts[idx - 1] as [number, number];
        const p1 = pts[idx] as [number, number];
        const p2 = pts[idx + 1] as [number, number];
        const p3 = pts[idx + 2] as [number, number];

        // Avoid duplicate points at the connection
        const startT = (j === 1) ? (1 / pointsPerSegment) : 0;

        for (let t = startT; t <= 1; t += 1 / pointsPerSegment) {
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

          segmentCoords.push([x, y]);
        }
      }
      segments.push(segmentCoords);
    }
    return segments;
  }

  public addToMap(map: any, unlockedCount: number = 1) {
    this.map = map;

    // Build the raw venue coordinates
    const rawPoints: number[][] = [];
    for (let i = 0; i < venuesData.length; i++) {
      const v = venuesData[i] as any;
      rawPoints.push([v.longitude, v.latitude]);
    }
    
    // Insert sweeping intermediate points to force a continuous meandering loop
    const curvedPoints: [number, number][] = [rawPoints[0] as [number, number]];
    for (let i = 0; i < rawPoints.length - 1; i++) {
      const p1 = rawPoints[i] as [number, number];
      const p2 = rawPoints[i + 1] as [number, number];
      
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

    // Generate the segmented spline
    const segments = this.generateCatmullRomSplineSegments(curvedPoints, 15);

    const features: any[] = [];
    // Only generate roads up to the currently active venue (which is at unlockedCount)
    const maxSegment = Math.min(segments.length, unlockedCount);

    for (let i = 0; i < maxSegment; i++) {
      const isUnlocked = i < unlockedCount - 1; // Both ends are unlocked
      features.push({
        type: 'Feature',
        properties: { isUnlocked },
        geometry: {
          type: 'LineString',
          coordinates: segments[i]
        }
      });
    }

    const geojson = {
      type: 'FeatureCollection',
      features
    };

    this.map.addSource('candy-crush-path', {
      type: 'geojson',
      data: geojson,
      lineMetrics: true
    });

    // 1. Glow Layer (Only for lit up unlocked segments)
    this.map.addLayer({
      id: 'real-path-glow',
      type: 'line',
      source: 'candy-crush-path',
      filter: ['==', ['get', 'isUnlocked'], true],
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#60a5fa', // Blue neon glow
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          13, 16,
          16, 32,
          19, 80
        ],
        'line-blur': 12,
        'line-opacity': 0.8
      }
    });

    // 2. Asphalt Base
    this.map.addLayer({
      id: 'real-path-outline',
      type: 'line',
      source: 'candy-crush-path',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['case', ['==', ['get', 'isUnlocked'], true], '#1f2937', '#374151'],
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          13, 12, // slightly thicker than core when zoomed out
          16, 24, // wider at medium zoom
          19, 60  // very wide when fully zoomed in
        ],
        'line-opacity': ['case', ['==', ['get', 'isUnlocked'], true], 1.0, 0.4]
      }
    });

    // 3. Dashed Yellow Line
    this.map.addLayer({
      id: 'real-path-core',
      type: 'line',
      source: 'candy-crush-path',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['case', ['==', ['get', 'isUnlocked'], true], '#facc15', '#9ca3af'],
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          13, 2,
          16, 4,
          19, 10
        ],
        'line-dasharray': [2, 2],
        'line-opacity': ['case', ['==', ['get', 'isUnlocked'], true], 1.0, 0.4]
      }
    });

    // No JS animation loop needed for now to preserve 60fps panning
  }

  public removeFromMap() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    
    if (this.map) {
      if (this.map.getLayer('real-path-glow')) this.map.removeLayer('real-path-glow');
      if (this.map.getLayer('real-path-core')) this.map.removeLayer('real-path-core');
      if (this.map.getLayer('real-path-outline')) this.map.removeLayer('real-path-outline');
      if (this.map.getSource('candy-crush-path')) this.map.removeSource('candy-crush-path');
    }
    this.map = null;
  }
}

export const PathOverlayService = new PathOverlayServiceSingleton();
