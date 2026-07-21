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
      // MapTiler Basic V2 Dark includes the necessary 3D building vector data
      style: `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=${mapTilerKey}`,
      center: [this.CENTER_LNG, this.CENTER_LAT],
      zoom: 15.5,
      minZoom: 14.5,   // Prevent zooming out too far
      maxZoom: 19,     // Prevent zooming in too close
      pitch: 60,       // 3D perspective
      bearing: -17.6,  // Angled view
      antialias: true, // Required for 3D building edges
      
      // Explicitly enable all perspective/camera gestures
      dragPan: true,         // One-finger click & drag to pan
      dragRotate: true,      // Two-finger click & drag (Right-click) to pitch and rotate
      touchPitch: true,      // Two-finger swipe on touchscreens to pitch
      touchZoomRotate: true, // Two-finger pinch to zoom/rotate
      
      // Restrict panning to a ~1km radius around Times Square
      // Format: [ [west, south], [east, north] ]
      maxBounds: [
        [-73.9973, 40.7490], // Southwest coordinate
        [-73.9737, 40.7670]  // Northeast coordinate
      ]
    });

    // Add a Scale Control to the top-right corner
    const scaleControl = new ml.ScaleControl({
      maxWidth: 200,
      unit: 'metric'
    });
    this.map.addControl(scaleControl, 'top-right');

    // Add Navigation Controls (Compass and Zoom) so the user visually knows they can pitch/rotate
    const navControl = new ml.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true
    });
    this.map.addControl(navControl, 'top-right');

    this.map.on('error', (e: any) => {
      console.error('MapLibre Map Error:', e);
      if (e && e.error && (e.error.status === 401 || e.error.status === 403)) {
        const warning = document.createElement('div');
        warning.style.position = 'absolute';
        warning.style.top = '10px';
        warning.style.left = '50%';
        warning.style.transform = 'translateX(-50%)';
        warning.style.background = 'rgba(255,0,0,0.8)';
        warning.style.color = '#fff';
        warning.style.padding = '10px 20px';
        warning.style.borderRadius = '5px';
        warning.style.zIndex = '9999';
        warning.innerHTML = `<strong>Missing MapTiler Key!</strong><br/>Please paste your free MapTiler key into MapLibreService.ts line 47.`;
        document.body.appendChild(warning);
      }
    });

    // Wait for the style to load to add 3D buildings layer
    this.map.on('style.load', () => {
      // Find a label layer to insert the 3D buildings beneath so text isn't obscured
      const layers = this.map.getStyle().layers;
      let labelLayerId;
      for (const layer of layers) {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          labelLayerId = layer.id;
          break;
        }
      }

      // MapTiler's vector schema uses 'maptiler_planet' as the source
      this.map.addLayer(
        {
          'id': '3d-buildings',
          'source': 'maptiler_planet',
          'source-layer': 'building',
          'filter': ['has', 'render_height'],
          'type': 'fill-extrusion',
          'minzoom': 14.5,
          'paint': {
            'fill-extrusion-color': '#4a4a4a', // Dark grey buildings
            
            // MapTiler uses render_height and render_min_height directly.
            // Using direct values stops the buildings from dynamically scaling (growing) on zoom.
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.8
          }
        },
        labelLayerId
      );
    });
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
      el.addEventListener('click', (e) => {
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
}

/** Singleton export */
export const MapLibreService = new MapLibreServiceSingleton();
