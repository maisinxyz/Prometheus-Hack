import { LandmarkOverlayService } from './LandmarkOverlayService';

declare global {
  interface Window {
    maplibregl: any;
  }
}

export interface VenueAnnotationData {
  venueId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  currentChi: number;
  isUnlocked: boolean;
  unlockThreshold: number;
  iconUrl?: string;
  onSelect: (venueId: string) => void;
}

class MapLibreServiceSingleton {
  private map: any = null;
  private markers: any[] = [];
  private mapContainer: HTMLElement | null = null;

  /** Center coordinates: Times Square, NYC */
  private readonly CENTER_LNG = -73.9855;
  private readonly CENTER_LAT = 40.7580;

  /**
   * Create the 3D MapLibre GL JS map instance.
   */
  async createMap(): Promise<void> {
    this.mapContainer = document.getElementById('mapkit-container');
    if (!this.mapContainer) {
      console.error('MapLibreService: #mapkit-container not found in DOM');
      return;
    }

    // Show container immediately so MapLibre can calculate dimensions
    this.mapContainer.style.display = 'block';

    // Don't recreate if already exists
    if (this.map) {
      this.showMap();
      return;
    }

    const ml = window.maplibregl;
    if (!ml) {
      console.error('MapLibreService: maplibregl not available on window');
      return;
    }

    // ────────────────────────────────────────────────────────
    // MAPTILER FREE DEMO KEY
    // No credit card required. Works out of the box with a small watermark.
    // ────────────────────────────────────────────────────────
    const mapTilerKey = 'IPnR16aVKYKYoBZYo6BF';

    this.map = new ml.Map({
      container: this.mapContainer,
      // Task 2.1: Use a brighter base style for the "toy city" look
      style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${mapTilerKey}`,
      center: [this.CENTER_LNG, this.CENTER_LAT],
      zoom: 15.5,
      minZoom: 13,
      maxZoom: 19,
      pitch: 60,       // 3D perspective
      bearing: -17.6,  // Angled view
      antialias: true, // Required for 3D building edges
      
      // We re-enable native gestures per Task 2.5 ("standard MapLibre pan/zoom/rotate gestures stay enabled")
      dragPan: true,
      dragRotate: true,
      touchPitch: true,
      touchZoomRotate: true,
      scrollZoom: true,
      doubleClickZoom: true,
      keyboard: true,
      
      // Restrict panning
      maxBounds: [
        [-74.0479, 40.6829], // Southwest coordinate
        [-73.9067, 40.8790]  // Northeast coordinate
      ]
    });

    // Add a Scale Control to the top-right corner
    const scaleControl = new ml.ScaleControl({
      maxWidth: 200,
      unit: 'metric'
    });
    this.map.addControl(scaleControl, 'top-right');

    // Add Navigation Controls
    const navControl = new ml.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true
    });
    this.map.addControl(navControl, 'top-right');

    this.map.on('error', (e: any) => {
      console.error('MapLibre Map Error:', e);
    });

    // Wait for the style to load to add 3D buildings layer
    this.map.on('style.load', () => {
      const layers = this.map.getStyle().layers;
      let labelLayerId;
      for (const layer of layers) {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          labelLayerId = layer.id;
          break;
        }
      }

      this.map.addLayer(
        {
          'id': '3d-buildings',
          'source': 'maptiler_planet',
          'source-layer': 'building',
          'filter': ['has', 'render_height'],
          'type': 'fill-extrusion',
          'minzoom': 13,
          'paint': {
            // Task 2.1: Toy-city style brighter building colors
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              0, '#faf0e6',   // Linen / warm white
              40, '#ffe4c4',  // Bisque / light beige
              120, '#b0e0e6', // Powder blue for skyscrapers
              300, '#87cefa'  // Light sky blue for super-slenders
            ],
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.95 // Higher opacity for more solid toy look
          }
        },
        labelLayerId
      );
    });

    // We no longer need custom input handlers since native is enabled
    // this.setupCustomInputHandlers();
  }

  private customCursor: HTMLElement | null = null;
  private activePointers: Map<number, {x: number, y: number}> = new Map();
  private isOrbiting: boolean = false;
  private lastOrbitX: number = 0;
  private lastOrbitY: number = 0;
  private initialPinchDistance: number = 0;
  private initialZoom: number = 0;
  private lastPanCenterX: number = 0;
  private lastPanCenterY: number = 0;

  private setupCustomInputHandlers() {
    if (!this.mapContainer || !this.map) return;



    const container = this.mapContainer;
    
    // Prevent context menu to allow smooth right-click (2-finger) dragging
    container.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
    });

    // 1. Wheel events for Trackpad scroll (Pan) and Pinch (Zoom)
    container.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault(); // Prevent standard page scroll
      
      if (e.ctrlKey) {
        // Pinch to zoom (trackpad pinch sends wheel with ctrlKey)
        const zoomDelta = e.deltaY * -0.01;
        const currentZoom = this.map.getZoom();
        this.map.setZoom(currentZoom + zoomDelta);
      } else {
        // 2-Finger scroll to Pan
        this.map.panBy([e.deltaX, e.deltaY], { animate: false });
      }
    }, { passive: false });

    // 2. Pointer events for Touch & Mouse dragging
    container.addEventListener('pointerdown', (e: PointerEvent) => {
      // If clicking on a MapLibre control (like zoom buttons), let it handle the event natively
      if ((e.target as HTMLElement).closest('.maplibregl-ctrl')) return;

      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      container.setPointerCapture(e.pointerId);
      
      const pts = Array.from(this.activePointers.values());
      
      // Right-click or 2-finger touch -> Orbit
      if (e.button === 2 || this.activePointers.size === 2) {
        this.isOrbiting = true;
        
        if (pts.length === 2) {
          this.lastOrbitX = (pts[0].x + pts[1].x) / 2;
          this.lastOrbitY = (pts[0].y + pts[1].y) / 2;
          this.initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          this.initialZoom = this.map.getZoom();
        } else {
          this.lastOrbitX = e.clientX;
          this.lastOrbitY = e.clientY;
        }
      } 
      // Left-click / 1-finger touch -> Pan
      else if (e.button === 0 && this.activePointers.size === 1) {
        this.isOrbiting = false;
        this.lastPanCenterX = e.clientX;
        this.lastPanCenterY = e.clientY;
      }
    });

    container.addEventListener('pointermove', (e: PointerEvent) => {
      // Update custom UI cursor position (1-Finger Scroll/Drag - No Press)


      if (this.activePointers.has(e.pointerId)) {
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      const pts = Array.from(this.activePointers.values());

      if (this.isOrbiting) {
        // Orbit (Update Pitch and Bearing)
        let cx = e.clientX;
        let cy = e.clientY;
        
        if (pts.length === 2) {
          cx = (pts[0].x + pts[1].x) / 2;
          cy = (pts[0].y + pts[1].y) / 2;
          
          // Also handle Pinch Zoom if 2 fingers are touching
          const currentDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const distanceDelta = currentDistance - this.initialPinchDistance;
          const zoomDelta = distanceDelta * 0.01;
          this.map.setZoom(this.initialZoom + zoomDelta);
        }

        const deltaX = cx - this.lastOrbitX;
        const deltaY = cy - this.lastOrbitY;
        
        this.lastOrbitX = cx;
        this.lastOrbitY = cy;
        
        const currentBearing = this.map.getBearing();
        const currentPitch = this.map.getPitch();
        
        // Reduced sensitivity to make the camera movement slower
        const bearingSensitivity = 0.15;
        const pitchSensitivity = 0.15;
        
        this.map.setBearing(currentBearing - deltaX * bearingSensitivity);
        
        let newPitch = currentPitch - deltaY * pitchSensitivity;
        if (newPitch < 0) newPitch = 0;
        if (newPitch > 85) newPitch = 85; // MapLibre max pitch
        this.map.setPitch(newPitch);
      } 
      else if (!this.isOrbiting && this.activePointers.size === 1 && (e.buttons & 1)) {
        // 1-Finger Left-Click Drag -> Pan
        const panDeltaX = this.lastPanCenterX - e.clientX;
        const panDeltaY = this.lastPanCenterY - e.clientY;
        this.lastPanCenterX = e.clientX;
        this.lastPanCenterY = e.clientY;
        
        this.map.panBy([panDeltaX, panDeltaY], { animate: false });
      }
    });

    const removePointer = (e: PointerEvent) => {
      this.activePointers.delete(e.pointerId);
      container.releasePointerCapture(e.pointerId);
      
      if (this.activePointers.size === 0) {
        this.isOrbiting = false;
      } else if (this.activePointers.size === 1) {
        // Re-initialize orbit for remaining finger
        this.isOrbiting = true;
        const pt = Array.from(this.activePointers.values())[0];
        this.lastOrbitX = pt.x;
        this.lastOrbitY = pt.y;
      }
    };

    container.addEventListener('pointerup', removePointer);
    container.addEventListener('pointercancel', removePointer);
  }

  /**
   * Add venue annotations to the map as HTML markers.
   */
  addVenueAnnotations(venues: VenueAnnotationData[]): void {
    if (!this.map) return;

    for (const venue of venues) {
      const el = this.createVenueDOMElement(venue);
      
      // We want the marker to anchor at the bottom so it points to the exact coordinate
      const marker = new window.maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(this.map);
        
      this.markers.push(marker);
    }
  }

  private createVenueDOMElement(venue: VenueAnnotationData): HTMLElement {
    const el = document.createElement('div');
    el.className = `venue-annotation${venue.isUnlocked ? '' : ' locked'}`;
    el.setAttribute('data-venue-id', venue.venueId);

    // Ensure they sit above map layers
    el.style.zIndex = '5';

    // Icon container
    const iconDiv = document.createElement('div');
    iconDiv.className = 'venue-icon';
    if (venue.iconUrl) {
      const img = document.createElement('img');
      img.src = venue.iconUrl;
      img.alt = venue.displayName;
      iconDiv.appendChild(img);
    } else {
      // Fallback: use first letter
      iconDiv.textContent = venue.displayName.charAt(0);
      iconDiv.style.color = '#fff';
      iconDiv.style.fontSize = '24px';
      iconDiv.style.fontWeight = 'bold';
    }
    el.appendChild(iconDiv);

    // Label
    const label = document.createElement('div');
    label.className = 'venue-label';
    label.textContent = venue.displayName;
    el.appendChild(label);

    // CHI readout
    const chi = document.createElement('div');
    chi.className = `venue-chi${venue.isUnlocked ? '' : ' locked'}`;
    chi.textContent = venue.isUnlocked
      ? `CHI: ${Math.floor(venue.currentChi)}`
      : `Needs ${venue.unlockThreshold} CHI`;
    el.appendChild(chi);

    // CHI bar (only for unlocked)
    if (venue.isUnlocked) {
      const barContainer = document.createElement('div');
      barContainer.className = 'venue-chi-bar';
      const barFill = document.createElement('div');
      barFill.className = 'venue-chi-bar-fill';
      barFill.style.width = `${Math.min(venue.currentChi, 100)}%`;
      barContainer.appendChild(barFill);
      el.appendChild(barContainer);
    }

    // Click handler
    if (venue.isUnlocked) {
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        venue.onSelect(venue.venueId);
      });
    }

    return el;
  }

  /** Remove all annotations from the map */
  removeAllAnnotations(): void {
    for (const marker of this.markers) {
      marker.remove();
    }
    this.markers = [];
  }

  /** Show the map container */
  showMap(): void {
    if (this.mapContainer) {
      this.mapContainer.style.display = 'block';
      // MapLibre sometimes needs a resize trigger if container changed display states
      if (this.map) {
        setTimeout(() => this.map!.resize(), 100);
      }
    }
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.classList.add('map-active');
    }
  }

  /** Hide the map container */
  hideMap(): void {
    // Clean up the 3D landmark overlay before hiding
    LandmarkOverlayService.removeFromMap();

    if (this.mapContainer) {
      this.mapContainer.style.display = 'none';
    }
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.classList.remove('map-active');
    }
  }

  /** Get the map instance (for advanced usage) */
  getMap(): any {
    return this.map;
  }

  /**
   * Toggles the Future Vision styling based on total CHI.
   */
  toggleFutureVision(isActive: boolean, totalChi: number, maxChi: number): void {
    if (!this.map || !this.map.getLayer('3d-buildings')) return;

    const trySetColor = (layerId: string, prop: string, val: any) => {
      if (this.map.getLayer(layerId)) {
        this.map.setPaintProperty(layerId, prop, val);
      }
    };

    if (!isActive) {
      // Revert to normal
      this.map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'interpolate',
        ['linear'],
        ['get', 'render_height'],
        0, '#8c7b6d',   // Brownstone / brick for low-rises
        40, '#9a948e',  // Grey concrete for mid-rises
        120, '#5a788c', // Light bluish glass for skyscrapers
        300, '#36536b'  // Deep blue glass for ultra-tall super-slenders
      ]);
      document.getElementById('mapkit-container')!.style.filter = '';
      
      // Try reverting to some typical dark map colors (or leave as overrides if they look fine in normal)
      // MapTiler basic-v2-dark water is usually dark blue/black.
      trySetColor('water', 'fill-color', '#1a232c'); 
      trySetColor('background', 'background-color', '#202020');
      trySetColor('landcover', 'fill-color', '#252525');
    } else {
      const isUtopia = totalChi >= (maxChi / 2);
      if (isUtopia) {
        // Eco-Utopia
        this.map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
          'interpolate',
          ['linear'],
          ['get', 'render_height'],
          0, '#b8e0d2',
          40, '#80cfa9',
          120, '#d1f2eb',
          300, '#aed6f1'
        ]);
        document.getElementById('mapkit-container')!.style.filter = 'hue-rotate(-10deg) saturate(1.5)';
        
        trySetColor('water', 'fill-color', '#0077be'); // Crisp blue water
        trySetColor('background', 'background-color', '#1b3f2b'); // Deep green land
        trySetColor('landcover', 'fill-color', '#1b3f2b');
      } else {
        // Bleak Future
        this.map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
          'interpolate',
          ['linear'],
          ['get', 'render_height'],
          0, '#4a3d31', // Rust
          40, '#3a3e3d', // Dark soot
          120, '#2e3a2d', // Toxic green
          300, '#1d1d1d' // Smog black
        ]);
        document.getElementById('mapkit-container')!.style.filter = 'sepia(0.6) hue-rotate(50deg) saturate(1.2)';
        
        trySetColor('water', 'fill-color', '#4a3c31'); // Muddy brown sludge ocean
        trySetColor('background', 'background-color', '#2d2a28'); // Dirty gray-brown land
        trySetColor('landcover', 'fill-color', '#2d2a28');
      }
    }
  }
}

/** Singleton export */
export const MapLibreService = new MapLibreServiceSingleton();
