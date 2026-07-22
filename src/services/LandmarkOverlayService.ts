import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LandmarkConfig {
  id: string;
  name: string;
  lng: number;
  lat: number;
  /** Real-world height of the landmark in meters */
  heightMeters: number;
  /** Y-axis rotation in radians (bearing alignment) */
  rotationY: number;
  /** Path to .glb model file (relative to /public). Null = use procedural placeholder */
  modelPath: string | null;
  /** Accent color for procedural placeholder geometry */
  color: string;
  /** Type of procedural geometry to generate when no model is provided */
  placeholderType: 'cylinder' | 'tower' | 'box' | 'cart' | 'storefront';
}

// ─────────────────────────────────────────────────────────────────────────────
// Landmark Registry — 6 target locations
// ─────────────────────────────────────────────────────────────────────────────

const LANDMARKS: LandmarkConfig[] = [
  {
    id: 'madison_square_garden',
    name: 'Madison Square Garden',
    lng: -73.9934,
    lat: 40.7505,
    heightMeters: 45,
    rotationY: 0,
    modelPath: null,
    color: '#FFD700',       // Gold
    placeholderType: 'cylinder',
  },
  {
    id: 'empire_state_building',
    name: 'Empire State Building',
    lng: -73.9857,
    lat: 40.7484,
    heightMeters: 443,
    rotationY: 0,
    modelPath: null,
    color: '#C0C0C0',       // Silver
    placeholderType: 'tower',
  },
  {
    id: 'one_times_square',
    name: 'One Times Square',
    lng: -73.9855,
    lat: 40.7580,
    heightMeters: 111,
    rotationY: Math.PI * 0.12,
    modelPath: null,
    color: '#FF69B4',       // Hot Pink / Neon
    placeholderType: 'box',
  },
  {
    id: 'rockefeller_center',
    name: 'Rockefeller Center',
    lng: -73.9787,
    lat: 40.7587,
    heightMeters: 259,
    rotationY: 0,
    modelPath: null,
    color: '#87CEEB',       // Ice Blue
    placeholderType: 'tower',
  },
  {
    id: 'hot_dog_stand',
    name: 'Hot Dog Stand',
    lng: -73.9973,
    lat: 40.7308,
    heightMeters: 3,
    rotationY: Math.PI * 0.25,
    modelPath: null,
    color: '#FF4500',       // Red-Orange
    placeholderType: 'cart',
  },
  {
    id: 'five_guys',
    name: 'Five Guys',
    lng: -74.0028,
    lat: 40.7314,
    heightMeters: 5,
    rotationY: 0,
    modelPath: null,
    color: '#DC143C',       // Crimson Red
    placeholderType: 'storefront',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Procedural Placeholder Geometry Builders
// ─────────────────────────────────────────────────────────────────────────────

function createEmissiveMaterial(color: string, emissiveIntensity = 0.4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity,
    metalness: 0.3,
    roughness: 0.5,
  });
}

function buildCylinder(config: LandmarkConfig): THREE.Group {
  // Madison Square Garden — a squat gold cylinder (arena shape)
  const group = new THREE.Group();
  const radius = config.heightMeters * 0.8; // wider than tall
  const geo = new THREE.CylinderGeometry(radius, radius, config.heightMeters, 32);
  const mat = createEmissiveMaterial(config.color, 0.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = config.heightMeters / 2;

  // Ring accent on top
  const ringGeo = new THREE.TorusGeometry(radius * 0.9, radius * 0.05, 8, 32);
  const ringMat = createEmissiveMaterial('#FFFFFF', 0.8);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = config.heightMeters;

  group.add(mesh, ring);
  return group;
}

function buildTower(config: LandmarkConfig): THREE.Group {
  // Empire State / Rockefeller — a stepped tower
  const group = new THREE.Group();
  const mat = createEmissiveMaterial(config.color, 0.35);
  const accentMat = createEmissiveMaterial('#FFFFFF', 0.6);

  // Base section (60% of height, wider)
  const baseH = config.heightMeters * 0.6;
  const baseW = config.heightMeters * 0.12;
  const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseW);
  const base = new THREE.Mesh(baseGeo, mat);
  base.position.y = baseH / 2;
  group.add(base);

  // Mid section (25% of height, narrower)
  const midH = config.heightMeters * 0.25;
  const midW = baseW * 0.7;
  const midGeo = new THREE.BoxGeometry(midW, midH, midW);
  const mid = new THREE.Mesh(midGeo, mat);
  mid.position.y = baseH + midH / 2;
  group.add(mid);

  // Top spire (15% of height)
  const spireH = config.heightMeters * 0.15;
  const spireGeo = new THREE.CylinderGeometry(0, midW * 0.15, spireH, 8);
  const spire = new THREE.Mesh(spireGeo, accentMat);
  spire.position.y = baseH + midH + spireH / 2;
  group.add(spire);

  return group;
}

function buildBox(config: LandmarkConfig): THREE.Group {
  // One Times Square — neon-lit rectangular slab
  const group = new THREE.Group();
  const w = config.heightMeters * 0.18;
  const d = config.heightMeters * 0.14;

  const geo = new THREE.BoxGeometry(w, config.heightMeters, d);
  const mat = createEmissiveMaterial(config.color, 0.7);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = config.heightMeters / 2;
  group.add(mesh);

  // Neon stripe accents
  for (let i = 0; i < 5; i++) {
    const stripeGeo = new THREE.BoxGeometry(w * 1.02, config.heightMeters * 0.015, d * 1.02);
    const stripeMat = createEmissiveMaterial(i % 2 === 0 ? '#00FF88' : '#FF00FF', 1.2);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = config.heightMeters * (0.2 + i * 0.15);
    group.add(stripe);
  }

  return group;
}

function buildCart(config: LandmarkConfig): THREE.Group {
  // Hot Dog Stand — a small wheeled cart
  const group = new THREE.Group();

  // Cart body
  const bodyGeo = new THREE.BoxGeometry(3, 1.5, 1.8);
  const bodyMat = createEmissiveMaterial(config.color, 0.6);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.2;
  group.add(body);

  // Umbrella
  const umbrellaGeo = new THREE.ConeGeometry(2.2, 0.6, 8);
  const umbrellaMat = createEmissiveMaterial('#FFFF00', 0.8);
  const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat);
  umbrella.position.y = 3.2;
  group.add(umbrella);

  // Umbrella pole
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
  const poleMat = createEmissiveMaterial('#888888', 0.2);
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2.5;
  group.add(pole);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12);
  const wheelMat = createEmissiveMaterial('#333333', 0.1);
  for (const xOff of [-1.1, 1.1]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(xOff, 0.3, 1.0);
    group.add(wheel);
  }

  return group;
}

function buildStorefront(config: LandmarkConfig): THREE.Group {
  // Five Guys — small building facade with sign
  const group = new THREE.Group();

  // Building body
  const bodyGeo = new THREE.BoxGeometry(8, config.heightMeters, 6);
  const bodyMat = createEmissiveMaterial('#8B0000', 0.3);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = config.heightMeters / 2;
  group.add(body);

  // Sign on front
  const signGeo = new THREE.BoxGeometry(6, 1.2, 0.2);
  const signMat = createEmissiveMaterial(config.color, 0.9);
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, config.heightMeters * 0.75, 3.1);
  group.add(sign);

  // Awning
  const awningGeo = new THREE.BoxGeometry(8.4, 0.15, 1.5);
  const awningMat = createEmissiveMaterial('#FFFFFF', 0.5);
  const awning = new THREE.Mesh(awningGeo, awningMat);
  awning.position.set(0, config.heightMeters * 0.55, 3.5);
  group.add(awning);

  return group;
}

function buildPlaceholder(config: LandmarkConfig): THREE.Group {
  switch (config.placeholderType) {
    case 'cylinder':   return buildCylinder(config);
    case 'tower':      return buildTower(config);
    case 'box':        return buildBox(config);
    case 'cart':       return buildCart(config);
    case 'storefront': return buildStorefront(config);
    default: {
      // Absolute fallback: simple box
      const group = new THREE.Group();
      const geo = new THREE.BoxGeometry(10, config.heightMeters, 10);
      const mat = createEmissiveMaterial(config.color);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = config.heightMeters / 2;
      group.add(mesh);
      return group;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LandmarkOverlayService — Singleton
// ─────────────────────────────────────────────────────────────────────────────

class LandmarkOverlayServiceSingleton {
  private map: any = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private gltfLoader: GLTFLoader | null = null;
  private layerId = 'threejs-landmark-overlay';
  private isAdded = false;

  /**
   * Register the Three.js custom layer with a MapLibre map instance.
   * Call this AFTER the map's `style.load` event has fired.
   */
  addToMap(map: any): void {
    if (this.isAdded) return;
    this.map = map;

    const ml = (window as any).maplibregl;
    if (!ml) {
      console.error('LandmarkOverlayService: maplibregl not on window');
      return;
    }

    // Pre-compute Mercator transforms for each landmark.
    // Each landmark gets its own model transform matrix that converts from
    // Three.js local meter-space into MapLibre's Mercator clip space.
    const landmarkTransforms = LANDMARKS.map((lm) => {
      const mc = ml.MercatorCoordinate.fromLngLat([lm.lng, lm.lat], 0);
      const scale = mc.meterInMercatorCoordinateUnits();
      return { config: lm, mc, scale };
    });

    const self = this;

    const customLayer = {
      id: this.layerId,
      type: 'custom' as const,
      renderingMode: '3d' as const,

      onAdd(map: any, gl: WebGLRenderingContext) {
        self.camera = new THREE.Camera();
        self.scene = new THREE.Scene();

        // ── Lighting ───────────────────────────────────────
        // Strong ambient to make colors pop against the dark map
        const ambient = new THREE.AmbientLight(0xffffff, 2.0);
        self.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 3.0);
        directional.position.set(1, 0.5, 1).normalize();
        self.scene.add(directional);

        const directional2 = new THREE.DirectionalLight(0xffffff, 1.5);
        directional2.position.set(-1, 0.5, -1).normalize();
        self.scene.add(directional2);

        // Hemisphere light for ground-sky contrast
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        self.scene.add(hemi);

        // ── GLTF Loader (for future real assets) ───────────
        self.gltfLoader = new GLTFLoader();

        // ── Place each landmark ────────────────────────────
        for (const { config, mc, scale } of landmarkTransforms) {
          if (config.modelPath) {
            // Load real .glb model
            self.gltfLoader.load(
              config.modelPath,
              (gltf) => {
                const model = gltf.scene;
                const bbox = new THREE.Box3().setFromObject(model);
                const modelHeight = bbox.max.y - bbox.min.y;
                const desiredScale = (config.heightMeters * scale) / modelHeight;
                model.scale.set(desiredScale, desiredScale, desiredScale);
                model.position.set(mc.x, mc.y, mc.z);
                model.rotation.x = Math.PI / 2;
                model.rotation.y = config.rotationY;
                self.scene!.add(model);
                console.log(`LandmarkOverlay: Loaded GLTF for ${config.name}`);
              },
              undefined,
              (error) => {
                console.warn(`LandmarkOverlay: Failed to load ${config.modelPath}`, error);
              }
            );
          } else {
            // Placeholder placement removed as per user request
          }
        }

        // ── Renderer (reuse MapLibre's GL context) ─────────
        self.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });
        self.renderer.autoClear = false;
      },

      // MapLibre GL JS v3.x passes (gl, matrix) where matrix is a Float64Array
      render(_gl: WebGLRenderingContext, matrix: number[] | Float32Array | Float64Array) {
        if (!self.camera || !self.scene || !self.renderer) return;

        // Handle both MapLibre v3 (positional matrix) and v4 (object with matrix)
        let matrixData: ArrayLike<number>;
        if (ArrayBuffer.isView(matrix) || Array.isArray(matrix)) {
          matrixData = matrix;
        } else {
          // v4 style: might be an object with defaultProjectionData or matrix property
          const obj = matrix as any;
          matrixData = obj?.defaultProjectionData?.mainMatrix ?? obj?.matrix;
          if (!matrixData) {
            console.warn('LandmarkOverlay: No matrix data in render callback');
            return;
          }
        }

        const m = new THREE.Matrix4().fromArray(matrixData as number[]);
        self.camera.projectionMatrix = m;

        self.renderer.resetState();
        self.renderer.render(self.scene, self.camera);
      },
    };

    map.addLayer(customLayer);
    this.isAdded = true;
    console.log('LandmarkOverlayService: Custom 3D layer added with', LANDMARKS.length, 'landmarks');
  }

  /**
   * Place a procedural placeholder landmark at its Mercator position.
   */
  private placeLandmark(config: LandmarkConfig, mc: any, scale: number): void {
    if (!this.scene) return;

    const group = buildPlaceholder(config);

    // Build a model matrix that:
    // 1. Scales from meters to Mercator units
    // 2. Flips Y (MapLibre Y increases downward in Mercator space)
    // 3. Rotates from Three.js Y-up to MapLibre's coordinate system
    const modelTransform = new THREE.Matrix4();

    // Translation to the Mercator position
    const translation = new THREE.Matrix4().makeTranslation(mc.x, mc.y, mc.z);

    // Scale: meters → Mercator units.
    const scaleMatrix = new THREE.Matrix4().makeScale(scale, scale, scale);

    // Rotation: align Three.js Y-up with MapLibre's expected orientation.
    // In MapLibre's custom layer space after the projection matrix is applied,
    // we need to rotate 90° around X to go from Y-up to Z-up.
    const rotX = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    const rotY = new THREE.Matrix4().makeRotationY(config.rotationY);

    // Compose: T * Rx * Ry * S
    modelTransform.multiply(translation);
    modelTransform.multiply(rotX);
    modelTransform.multiply(rotY);
    modelTransform.multiply(scaleMatrix);

    group.applyMatrix4(modelTransform);

    group.userData = { landmarkId: config.id, landmarkName: config.name };

    this.scene.add(group);
    console.log(`LandmarkOverlay: Placed ${config.name} at [${config.lng}, ${config.lat}]`);
  }

  /**
   * Remove the overlay layer from the map and dispose of Three.js resources.
   */
  removeFromMap(): void {
    if (!this.isAdded || !this.map) return;

    try {
      if (this.map.getLayer(this.layerId)) {
        this.map.removeLayer(this.layerId);
      }
    } catch (e) {
      console.warn('LandmarkOverlayService: Error removing layer', e);
    }

    // Dispose Three.js resources
    if (this.scene) {
      this.scene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: THREE.Material) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      this.scene = null;
    }

    if (this.renderer) {
      // Don't dispose the renderer since it shares MapLibre's context
      this.renderer = null;
    }

    this.camera = null;
    this.gltfLoader = null;
    this.isAdded = false;
    console.log('LandmarkOverlayService: Removed and cleaned up');
  }

  /** Get the list of landmark configurations */
  getLandmarks(): readonly LandmarkConfig[] {
    return LANDMARKS;
  }
}

/** Singleton export */
export const LandmarkOverlayService = new LandmarkOverlayServiceSingleton();
