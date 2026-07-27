import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  getVenueEnvironment,
  VenueEnvironmentDef,
  VenuePropDef,
  VenueMaterialDef,
} from '../config/venueEnvironments';

/**
 * Vignette shader for post-processing (darkens corners to draw eye center).
 */
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.0 },
    darkness: { value: 1.2 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vignette = 1.0 - dot(uv, uv);
      texel.rgb *= mix(1.0, vignette, darkness);
      gl_FragColor = texel;
    }
  `,
};

/** Texture-based (360°) venue IDs */
const TEXTURE_VENUE_IDS = [
  'construction_site',
  'art_studio',
  'ferry_docks',
  'tech_startup',
  'subway_station',
  'gym',
  'financial_district_office',
  'times_square',
  'hot_dog_stand',
  'public_library',
  'central_park',
  'nyc_hospital',
];

/** Procedural (Stylized PBR) venue IDs */
const PROCEDURAL_VENUE_IDS = [
  'mackenzie_cafe',
];

class ThreeJSServiceSingleton {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private canvasContainer!: HTMLElement;
  private isInitialized = false;
  private isActive = false;
  private animationFrameId: number | null = null;
  private mesh: THREE.Mesh | null = null;
  private currentVenueId: string | null = null;
  
  // Post-processing
  private composer: EffectComposer | null = null;
  private useComposer = false;
  
  // Procedural scene objects (for cleanup)
  private proceduralObjects: THREE.Object3D[] = [];
  private proceduralLights: THREE.Light[] = [];
  private godRayPlanes: THREE.Mesh[] = [];

  // Camera Orbit Variables
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraTheta = Math.PI / 4; // Horizontal angle
  private cameraPhi = Math.PI / 2;   // Vertical angle
  private cameraRadius = 0.1; // Orbit from the center of the sphere
  private target = new THREE.Vector3(0, 0, 0);
  
  // Flag for whether current venue is procedural
  private isProceduralVenue = false;

  init() {
    if (this.isInitialized) return;
    
    // Create canvas container if it doesn't exist
    let container = document.getElementById('three-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'three-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.zIndex = '-1'; 
      container.style.pointerEvents = 'none'; // Keep pointer events none so it doesn't block Phaser
      container.style.display = 'none';
      document.body.appendChild(container);
    }
    this.canvasContainer = container;

    // Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Important: Use basic sRGB output for a tonemapped JPG so colors look right
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvasContainer.appendChild(this.renderer.domElement);

    // Setup Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.updateCameraPosition();

    // Build the Photorealistic 360 Environment
    this.buildPhotorealisticEnvironment();

    // Handle Resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Handle Right-Click Drag globally across the document body
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    document.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      if (e.button === 2) { // Right click
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.isDragging) return;
      
      const deltaMove = {
        x: e.clientX - this.previousMousePosition.x,
        y: e.clientY - this.previousMousePosition.y
      };

      if (this.isProceduralVenue) {
        // Procedural venues: slight camera pan (limited)
        this.cameraTheta += deltaMove.x * 0.002;
        this.cameraPhi += deltaMove.y * 0.002;
        this.cameraPhi = Math.max(Math.PI / 3, Math.min(Math.PI * 2 / 3, this.cameraPhi));
        this.cameraTheta = Math.max(-0.3, Math.min(0.3, this.cameraTheta));
        this.updateProceduralCamera();
      } else {
        // Update Angles (Inverted x so dragging left looks left)
        this.cameraTheta += deltaMove.x * 0.005;
        this.cameraPhi += deltaMove.y * 0.005;

        // Clamp vertical angle so we don't flip upside down
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));

        this.updateCameraPosition();
      }

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isDragging = false;
      }
    });

    this.isInitialized = true;
  }

  private updateCameraPosition() {
    if (false) {
        // Clamp panning so they never see the edges of the 2.0 radian cylinder screen
        const initialTheta = Math.PI / 4;
        this.cameraTheta = Math.max(initialTheta - 0.22, Math.min(initialTheta + 0.22, this.cameraTheta));
    }

    this.camera.position.x = this.target.x + this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.y = this.target.y + this.cameraRadius * Math.cos(this.cameraPhi);
    this.camera.position.z = this.target.z + this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    this.camera.lookAt(this.target);
  }

  /**
   * Update camera for procedural venues — orbits around a fixed target point.
   */
  private updateProceduralCamera() {
    const envDef = this.currentVenueId ? getVenueEnvironment(this.currentVenueId) : null;
    if (!envDef) return;
    
    const camPos = envDef.cameraPosition ?? [0, 1, 8];
    const camTarget = envDef.cameraTarget ?? [0, -0.5, 0];
    
    // Apply slight orbit offset from the base camera position
    const offsetX = Math.sin(this.cameraTheta) * 2;
    const offsetY = (this.cameraPhi - Math.PI / 2) * 2;
    
    this.camera.position.set(camPos[0] + offsetX, camPos[1] + offsetY, camPos[2]);
    this.camera.lookAt(new THREE.Vector3(camTarget[0], camTarget[1], camTarget[2]));
  }

  private buildPhotorealisticEnvironment() {
    // Initial mesh container; actual geometry and material are built in loadTextureForVenue
    this.mesh = new THREE.Mesh();
    this.scene.add(this.mesh);
  }

  private loadTextureForVenue(venueId: string) {
    if (!this.mesh) return;
    
    let texturePath = '';
    let isCylinder = false;
    let isFullCylinder = false;
    
    if (venueId === 'construction_site') {
      texturePath = '/assets/abandoned_construction_360.jpg';
    } else if (venueId === 'art_studio') {
      texturePath = '/assets/art_studio_360.png';
    } else if (venueId === 'ferry_docks') {
      texturePath = '/assets/ferry_docks_360_upscaled.png'; // Overwritten by user with true 360 image
    } else if (venueId === 'tech_startup') {
      texturePath = '/assets/tech_startup_360_upscaled.png'; // Overwritten by user with true 360 image
    } else if (venueId === 'subway_station') {
      texturePath = '/assets/subway_station_360_upscaled.png'; // Overwritten by user with true 360 image
    } else if (venueId === 'gym') {
      texturePath = '/assets/gym_360.png'; // Overwritten by user with true 360 image
    } else if (venueId === 'financial_district_office') {
      texturePath = '/assets/financial_district_office_360.png';
    } else if (venueId === 'times_square') {
      texturePath = '/assets/times_square_360.png';
    } else if (venueId === 'hot_dog_stand') {
      texturePath = '/assets/hot_dog_stand_360.png';
    } else if (venueId === 'public_library') {
      texturePath = '/assets/public_library_360.png';
    } else if (venueId === 'central_park') {
      texturePath = '/assets/central_park_360.png';
    } else if (venueId === 'nyc_hospital') {
      texturePath = '/assets/nyc_hospital_360.png';
    } else {
      return; // Not supported
    }

    const textureLoader = new THREE.TextureLoader();
      
    // Hide the mesh immediately to prevent flashing the previous background while loading
    if (this.mesh) this.mesh.visible = false;
      
    textureLoader.load(texturePath, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Cleanup old geometry/material
      if (this.mesh && this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh && this.mesh.material instanceof THREE.Material) this.mesh.material.dispose();

      // Maximize crispness
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      if (this.renderer) texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

      let geometry;
      if (isCylinder) {
        // Map 1:1 without repeating. Creates a 114 degree curved screen.
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1);
        texture.offset.x = 0; 
        
        // Account for scale(-1, 1, 1) [flips sign] and rotation(-1.57) [shifts angle].
        // To place the final center at the camera's -2.356 view angle:
        // -(thetaStart + 1.0) - 1.57 = -2.356  =>  thetaStart = -0.214
        geometry = new THREE.CylinderGeometry(500, 500, 1000, 60, 1, true, -0.214, 2.0);
        geometry.scale(-1, 1, 1);
      } else if (isFullCylinder) {
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.repeat.set(3, 1);
        texture.offset.x = 0;
        geometry = new THREE.CylinderGeometry(500, 500, 1000, 60, 1, true, 0, Math.PI * 2);
        geometry.scale(-1, 1, 1);
      } else {
        // Full 360 sphere
        geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
      }

      if (this.mesh) {
        this.mesh.geometry = geometry;
        this.mesh.material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff });
        this.mesh.rotation.y = -Math.PI / 2;
        this.mesh.visible = true; // Show it now that it is loaded
      }
    });
  }

  // ─────────────────────────────────────────────────────
  // PROCEDURAL SCENE BUILDER (Stylized PBR)
  // ─────────────────────────────────────────────────────

  /**
   * Build a fully procedural 3D environment from a VenueEnvironmentDef.
   */
  private buildProceduralScene(venueId: string): void {
    const envDef = getVenueEnvironment(venueId);
    if (!envDef) return;

    // Clean up any previous procedural scene
    this.cleanupProceduralScene();
    
    // Hide the 360° mesh if it exists
    if (this.mesh) this.mesh.visible = false;

    // Set scene background color
    if (envDef.fog) {
      this.scene.background = new THREE.Color(envDef.fog.color);
      this.scene.fog = new THREE.Fog(envDef.fog.color, envDef.fog.near, envDef.fog.far);
    } else {
      // Default soft gradient background
      this.scene.background = new THREE.Color('#1a1a2e');
      this.scene.fog = null;
    }

    // ── Floor ──
    this.buildFloor(envDef);

    // ── Lights ──
    this.buildLights(envDef);

    // ── Foreground props ──
    for (const propDef of envDef.props) {
      const obj = this.buildProp(propDef);
      this.scene.add(obj);
      this.proceduralObjects.push(obj);
    }

    // ── Background layers ──
    for (const layer of envDef.backgroundLayers) {
      for (const propDef of layer.props) {
        const obj = this.buildProp(propDef);
        this.scene.add(obj);
        this.proceduralObjects.push(obj);
      }
    }

    // ── God rays (volumetric light shafts) ──
    if (envDef.postProcessing.godRays) {
      this.buildGodRays(envDef);
    }

    // ── Camera ──
    const camPos = envDef.cameraPosition ?? [0, 1.5, 9.5];
    const camTarget = envDef.cameraTarget ?? [0, -0.5, 0];
    this.camera.position.set(camPos[0], camPos[1], camPos[2]);
    this.camera.lookAt(new THREE.Vector3(camTarget[0], camTarget[1], camTarget[2]));
    this.camera.fov = 70; // Wide FOV to show full environment scene
    this.camera.updateProjectionMatrix();

    // ── Post-Processing ──
    this.setupPostProcessing(envDef);
  }

  /**
   * Build the floor plane with optional tile pattern.
   */
  private buildFloor(envDef: VenueEnvironmentDef): void {
    const floorDef = envDef.floor;
    const geometry = new THREE.PlaneGeometry(floorDef.size[0], floorDef.size[1]);
    geometry.rotateX(-Math.PI / 2);

    let material: THREE.MeshStandardMaterial;

    if (floorDef.tilePattern === 'hexagonal' || floorDef.tilePattern === 'checkerboard') {
      // Generate a procedural tile texture
      const tileTexture = this.generateTileTexture(floorDef.tilePattern);
      material = new THREE.MeshStandardMaterial({
        map: tileTexture,
        roughness: floorDef.material.roughness,
        metalness: floorDef.material.metallic,
      });
    } else {
      material = this.createStandardMaterial(floorDef.material);
    }

    const floor = new THREE.Mesh(geometry, material);
    floor.position.set(floorDef.position[0], floorDef.position[1], floorDef.position[2]);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.proceduralObjects.push(floor);
  }

  /**
   * Generate a procedural tile texture on a canvas.
   */
  private generateTileTexture(pattern: 'hexagonal' | 'checkerboard'): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (pattern === 'checkerboard') {
      const tileSize = 64;
      for (let y = 0; y < size; y += tileSize) {
        for (let x = 0; x < size; x += tileSize) {
          const isWhite = ((x / tileSize) + (y / tileSize)) % 2 === 0;
          ctx.fillStyle = isWhite ? '#F5F5F5' : '#212121';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    } else {
      // Hexagonal tile pattern (classic NYC hex tiles — black & white)
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, size, size);

      const hexRadius = 28;
      const hexHeight = hexRadius * 2;
      const hexWidth = Math.sqrt(3) * hexRadius;
      let toggle = false;

      ctx.strokeStyle = '#BDBDBD';
      ctx.lineWidth = 1.5;

      for (let row = -1; row < size / (hexHeight * 0.75) + 1; row++) {
        for (let col = -1; col < size / hexWidth + 1; col++) {
          const x = col * hexWidth + (row % 2 === 0 ? 0 : hexWidth / 2);
          const y = row * hexHeight * 0.75;
          toggle = !toggle;

          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = x + hexRadius * Math.cos(angle);
            const py = y + hexRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();

          // Alternate black tiles
          if (toggle && (row + col) % 3 === 0) {
            ctx.fillStyle = '#2A2A2A';
            ctx.fill();
          }
          ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Create all lights for a venue environment.
   */
  private buildLights(envDef: VenueEnvironmentDef): void {
    for (const lightDef of envDef.lights) {
      let light: THREE.Light;

      switch (lightDef.type) {
        case 'directional': {
          const dir = new THREE.DirectionalLight(lightDef.color, lightDef.intensity);
          if (lightDef.position) dir.position.set(...lightDef.position);
          if (lightDef.target) dir.target.position.set(...lightDef.target);
          if (lightDef.castShadow) {
            dir.castShadow = true;
            const sz = lightDef.shadowMapSize ?? 512;
            dir.shadow.mapSize.width = sz;
            dir.shadow.mapSize.height = sz;
            dir.shadow.camera.near = 0.5;
            dir.shadow.camera.far = 50;
            dir.shadow.camera.left = -15;
            dir.shadow.camera.right = 15;
            dir.shadow.camera.top = 15;
            dir.shadow.camera.bottom = -15;
            dir.shadow.bias = -0.001;
          }
          this.scene.add(dir.target);
          light = dir;
          break;
        }
        case 'ambient': {
          light = new THREE.AmbientLight(lightDef.color, lightDef.intensity);
          break;
        }
        case 'point': {
          const pt = new THREE.PointLight(lightDef.color, lightDef.intensity, lightDef.distance ?? 0);
          if (lightDef.position) pt.position.set(...lightDef.position);
          if (lightDef.castShadow) {
            pt.castShadow = true;
            const sz = lightDef.shadowMapSize ?? 256;
            pt.shadow.mapSize.width = sz;
            pt.shadow.mapSize.height = sz;
          }
          light = pt;
          break;
        }
        case 'spot': {
          const spot = new THREE.SpotLight(
            lightDef.color,
            lightDef.intensity,
            lightDef.distance ?? 0,
            lightDef.angle ?? Math.PI / 4,
            lightDef.penumbra ?? 0.1
          );
          if (lightDef.position) spot.position.set(...lightDef.position);
          if (lightDef.target) spot.target.position.set(...lightDef.target);
          if (lightDef.castShadow) {
            spot.castShadow = true;
            const sz = lightDef.shadowMapSize ?? 512;
            spot.shadow.mapSize.width = sz;
            spot.shadow.mapSize.height = sz;
          }
          this.scene.add(spot.target);
          light = spot;
          break;
        }
        default:
          continue;
      }

      this.scene.add(light);
      this.proceduralLights.push(light);
    }
  }

  /**
   * Build a prop (and its children) from a VenuePropDef.
   */
  private buildProp(propDef: VenuePropDef): THREE.Object3D {
    const geometry = this.createGeometry(propDef);
    let material = this.createStandardMaterial(propDef.material);

    // Procedural Chalkboard Menu Texture for Cafe Menu Board
    if (propDef.id === 'bar_menu_chalk' || propDef.id === 'menu_surface') {
      const chalkTexture = this.generateChalkboardTexture();
      material = new THREE.MeshStandardMaterial({
        map: chalkTexture,
        roughness: 0.95,
        metalness: 0.0,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(propDef.position[0], propDef.position[1], propDef.position[2]);
    if (propDef.rotation) {
      mesh.rotation.set(propDef.rotation[0], propDef.rotation[1], propDef.rotation[2]);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Recursively build children
    if (propDef.children) {
      for (const child of propDef.children) {
        const childMesh = this.buildProp(child);
        mesh.add(childMesh);
      }
    }

    // Populate Bookshelves with Real 3D Individual Books (Spines, Gold Foil, Pages, Leaning Books)
    if (propDef.id.startsWith('shelf_frame_')) {
      this.populateBookshelfWithReal3DBooks(mesh, propDef);
    }

    return mesh;
  }

  /**
   * Populate a bookshelf unit with hundreds of individual 3D book volumes featuring distinct heights,
   * rich leather colors, gold foil spine bands, paper page edges, and natural leaning angles.
   */
  private populateBookshelfWithReal3DBooks(shelfMesh: THREE.Object3D, propDef: VenuePropDef): void {
    const shelfWidth = propDef.size[0] - 0.5;
    const tierYs = [-3.2, -1.8, -0.4, 1.0, 2.4];
    const leatherColors = [
      '#991B1B', '#1E3A8A', '#064E3B', '#D97706', '#7C2D12',
      '#581C87', '#831843', '#172554', '#14532D', '#C2410C',
      '#451A03', '#312E81', '#7F1D1D', '#047857', '#9F1239'
    ];

    // Pre-calculate book properties to determine exact count
    const booksData: Array<{
      width: number;
      height: number;
      depth: number;
      color: THREE.Color;
      x: number;
      y: number;
      z: number;
      rotZ: number;
      bandYOffset: number;
    }> = [];

    tierYs.forEach((tierY, tierIdx) => {
      let currentX = -shelfWidth / 2 + 0.15;
      let bookCount = 0;

      while (currentX < shelfWidth / 2 - 0.25) {
        bookCount++;
        const width = 0.22 + Math.random() * 0.22;
        const height = 0.7 + Math.random() * 0.2;
        const depth = 0.7 + Math.random() * 0.15;
        const colorHex = leatherColors[(tierIdx * 7 + bookCount * 3) % leatherColors.length];
        
        let rotZ = 0;
        let x = currentX + width / 2;
        
        if (bookCount % 5 === 0 && currentX < shelfWidth / 2 - 0.6) {
          rotZ = -0.16;
          currentX += width + 0.1;
        } else {
          currentX += width + 0.02;
        }

        booksData.push({
          width,
          height,
          depth,
          color: new THREE.Color(colorHex!),
          x,
          y: tierY + height / 2,
          z: 0.25,
          rotZ,
          bandYOffset: (Math.random() - 0.2) * 0.3
        });
      }
    });

    const totalBooks = booksData.length;

    // Create standard materials and geometries (unit size)
    const baseGeo = new THREE.BoxGeometry(1, 1, 1);
    
    // We use one material for all leather bodies, relying on instanceColor
    const leatherMat = new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.05 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.25, metalness: 0.85 });
    const paperMat = new THREE.MeshStandardMaterial({ color: '#FEF3C7', roughness: 0.8, metalness: 0.0 });

    const bodyInstanced = new THREE.InstancedMesh(baseGeo, leatherMat, totalBooks);
    const bandInstanced = new THREE.InstancedMesh(baseGeo, goldMat, totalBooks);
    const pageInstanced = new THREE.InstancedMesh(baseGeo, paperMat, totalBooks);

    bodyInstanced.castShadow = true;
    bodyInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();

    booksData.forEach((data, i) => {
      // 1. Body
      dummy.position.set(data.x, data.y, data.z);
      dummy.rotation.set(0, 0, data.rotZ);
      dummy.scale.set(data.width, data.height, data.depth);
      dummy.updateMatrix();
      bodyInstanced.setMatrixAt(i, dummy.matrix);
      bodyInstanced.setColorAt(i, data.color);

      // 2. Gold Band
      dummy.position.set(data.x, data.y, data.z);
      // We need to apply the rotation to the local offset of the band
      const localBandPos = new THREE.Vector3(0, data.bandYOffset, 0);
      localBandPos.applyEuler(new THREE.Euler(0, 0, data.rotZ));
      dummy.position.add(localBandPos);
      dummy.rotation.set(0, 0, data.rotZ);
      dummy.scale.set(data.width + 0.015, 0.07, data.depth + 0.015);
      dummy.updateMatrix();
      bandInstanced.setMatrixAt(i, dummy.matrix);

      // 3. Paper Pages
      dummy.position.set(data.x, data.y, data.z);
      const localPagePos = new THREE.Vector3(0, 0, data.depth / 2 - 0.01);
      localPagePos.applyEuler(new THREE.Euler(0, 0, data.rotZ));
      dummy.position.add(localPagePos);
      dummy.rotation.set(0, 0, data.rotZ);
      dummy.scale.set(data.width - 0.04, data.height - 0.06, 0.03);
      dummy.updateMatrix();
      pageInstanced.setMatrixAt(i, dummy.matrix);
    });

    bodyInstanced.instanceMatrix.needsUpdate = true;
    if (bodyInstanced.instanceColor) bodyInstanced.instanceColor.needsUpdate = true;
    bandInstanced.instanceMatrix.needsUpdate = true;
    pageInstanced.instanceMatrix.needsUpdate = true;

    shelfMesh.add(bodyInstanced);
    shelfMesh.add(bandInstanced);
    shelfMesh.add(pageInstanced);
  }

  /**
   * Generate an authentic procedural Chalkboard Menu Texture with handwritten chalk items and prices.
   */
  private generateChalkboardTexture(): THREE.CanvasTexture {
    const width = 1024;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Dark Slate Chalkboard Background with texture
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // Subtle Chalk Dust Texturing
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 3000; i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }

    // Outer Chalk Border Lines
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Cafe Menu Title Header
    ctx.fillStyle = '#FDE047'; // Bright Warm Yellow Chalk
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('☕ MACKENZIE CAFE MENU 🥐', width / 2, 65);

    // Header Divider Line
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 80);
    ctx.lineTo(width - 120, 80);
    ctx.stroke();

    // Column 1: COFFEE & ESPRESSO DRINKS (Left Side)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38BDF8'; // Sky Blue Chalk
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText('── COFFEE & ESPRESSO ──', 60, 125);

    const coffeeItems = [
      { name: 'Espresso Single', price: '$3.50', color: '#F8FAFC' },
      { name: 'Double Espresso', price: '$4.25', color: '#F8FAFC' },
      { name: 'Americano', price: '$4.00', color: '#F8FAFC' },
      { name: 'Cappuccino', price: '$4.75', color: '#F8FAFC' },
      { name: 'Vanilla Latte', price: '$5.25', color: '#FEF08A' },
      { name: 'Mocha Latte', price: '$5.50', color: '#FEF08A' },
      { name: 'Cold Brew Coffee', price: '$4.50', color: '#38BDF8' },
    ];

    let startY = 165;
    ctx.font = 'bold 20px "Courier New", monospace';
    coffeeItems.forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.fillText(item.name, 60, startY);
      ctx.fillText(item.price, 400, startY);
      // Dotted chalk line between item and price
      ctx.fillStyle = '#64748B';
      ctx.fillText('. . . . . . . . . . .', 240, startY);
      startY += 36;
    });

    // Center Vertical Chalk Divider
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 100);
    ctx.lineTo(width / 2, 430);
    ctx.stroke();

    // Column 2: BAKERY & SPECIALTY DRINKS (Right Side)
    ctx.fillStyle = '#FBCFE8'; // Pastel Pink Chalk
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText('── BAKERY & SPECIALS ──', 560, 125);

    const foodItems = [
      { name: 'Butter Croissant', price: '$4.00', color: '#F8FAFC' },
      { name: 'Almond Croissant', price: '$4.75', color: '#F8FAFC' },
      { name: 'Blueberry Muffin', price: '$3.75', color: '#FBCFE8' },
      { name: 'Choc Chip Scone', price: '$3.95', color: '#FBCFE8' },
      { name: 'Matcha Green Tea', price: '$5.25', color: '#BBF7D0' },
      { name: 'Chai Tea Latte', price: '$5.00', color: '#FEF08A' },
      { name: 'Avocado Toast', price: '$8.50', color: '#BBF7D0' },
    ];

    startY = 165;
    ctx.font = 'bold 20px "Courier New", monospace';
    foodItems.forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.fillText(item.name, 560, startY);
      ctx.fillText(item.price, 900, startY);
      ctx.fillStyle = '#64748B';
      ctx.fillText('. . . . . . . . . . .', 740, startY);
      startY += 36;
    });

    // Footer Chalk Banner Line
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 445);
    ctx.lineTo(width - 80, 445);
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✨ DAILY SPECIAL: COLD BREW + CROISSANT COMBO $7.50 ✨', width / 2, 480);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Create Three.js geometry from a prop definition.
   */
  private createGeometry(propDef: VenuePropDef): THREE.BufferGeometry {
    const s = propDef.size;
    switch (propDef.geometry) {
      case 'box': {
        // Add subtle bevel using chamfer segments
        const geo = new THREE.BoxGeometry(s[0], s[1], s[2], 2, 2, 2);
        return geo;
      }
      case 'cylinder':
        return new THREE.CylinderGeometry(s[0], s[0], s[1], Math.max(s[2], 8));
      case 'sphere':
        return new THREE.SphereGeometry(s[0], Math.max(s[1], 8), Math.max(s[2], 8));
      case 'plane':
        return new THREE.PlaneGeometry(s[0], s[1]);
      case 'cone':
        return new THREE.ConeGeometry(s[0], s[1], Math.max(s[2], 6));
      case 'torus':
        return new THREE.TorusGeometry(s[0], s[1], 16, Math.max(s[2], 32));
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  /**
   * Create a MeshStandardMaterial from a VenueMaterialDef.
   */
  private createStandardMaterial(matDef: VenueMaterialDef): THREE.MeshStandardMaterial {
    const params: THREE.MeshStandardMaterialParameters = {
      color: matDef.color,
      roughness: matDef.roughness,
      metalness: matDef.metallic,
    };

    if (matDef.emissive) {
      params.emissive = new THREE.Color(matDef.emissive);
      params.emissiveIntensity = matDef.emissiveIntensity ?? 1.0;
    }

    if (matDef.transparent || (matDef.opacity !== undefined && matDef.opacity < 1.0)) {
      params.transparent = true;
      params.opacity = matDef.opacity ?? 0.5;
    }

    return new THREE.MeshStandardMaterial(params);
  }

  /**
   * Build fake "God Rays" using additive-blend transparent planes
   * angled from the light source toward the foreground.
   */
  private buildGodRays(envDef: VenueEnvironmentDef): void {
    // Find the directional light to angle rays from
    const dirLight = envDef.lights.find(l => l.type === 'directional');
    if (!dirLight || !dirLight.position) return;

    const rayCount = 5;
    for (let i = 0; i < rayCount; i++) {
      const width = 0.8 + Math.random() * 1.5;
      const height = 12 + Math.random() * 6;
      const geo = new THREE.PlaneGeometry(width, height);

      // Create a gradient texture for the ray
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, 'rgba(255, 248, 225, 0.3)');
      gradient.addColorStop(0.3, 'rgba(255, 248, 225, 0.15)');
      gradient.addColorStop(1, 'rgba(255, 248, 225, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 256);
      const rayTexture = new THREE.CanvasTexture(canvas);

      const mat = new THREE.MeshBasicMaterial({
        map: rayTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        opacity: 0.4 + Math.random() * 0.3,
      });

      const ray = new THREE.Mesh(geo, mat);
      // Position rays coming from the light direction
      const spread = (i - rayCount / 2) * 2.5;
      ray.position.set(
        dirLight.position[0] * 0.3 + spread,
        dirLight.position[1] * 0.4,
        dirLight.position[2] * 0.3 + 2
      );
      // Angle the ray from the light source toward the ground
      ray.rotation.x = -0.3;
      ray.rotation.y = Math.random() * 0.2 - 0.1;
      ray.rotation.z = (Math.random() - 0.5) * 0.15;

      this.scene.add(ray);
      this.godRayPlanes.push(ray);
      this.proceduralObjects.push(ray);
    }
  }

  /**
   * Set up the EffectComposer post-processing pipeline.
   */
  private setupPostProcessing(envDef: VenueEnvironmentDef): void {
    const pp = envDef.postProcessing;
    
    this.composer = new EffectComposer(this.renderer);
    this.useComposer = true;

    // Base render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // SSAO (Ambient Occlusion — grounds objects to the floor)
    if (pp.ssao.enabled) {
      // Use half-resolution for SSAO to vastly improve performance
      const ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth / 2, window.innerHeight / 2);
      ssaoPass.kernelRadius = pp.ssao.radius;
      ssaoPass.minDistance = pp.ssao.minDistance;
      ssaoPass.maxDistance = pp.ssao.maxDistance;
      this.composer.addPass(ssaoPass);
    }

    // Bloom (light glow)
    if (pp.bloom.enabled) {
      // Use half-resolution for Bloom
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
        pp.bloom.strength,
        pp.bloom.radius,
        pp.bloom.threshold
      );
      this.composer.addPass(bloomPass);
    }

    // Depth of Field (foreground sharp, background blurred)
    if (pp.dof.enabled) {
      const bokehPass = new BokehPass(this.scene, this.camera, {
        focus: pp.dof.focus,
        aperture: pp.dof.aperture,
        maxblur: pp.dof.maxblur,
      });
      this.composer.addPass(bokehPass);
    }

    // Vignette (darkened corners)
    if (pp.vignette) {
      const vignettePass = new ShaderPass(VignetteShader);
      if (vignettePass.uniforms['offset']) vignettePass.uniforms['offset'].value = 1.0;
      if (vignettePass.uniforms['darkness']) vignettePass.uniforms['darkness'].value = 1.3;
      this.composer.addPass(vignettePass);
    }

    // Output pass (ensures correct color space)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  /**
   * Clean up all procedural scene objects.
   */
  private cleanupProceduralScene(): void {
    for (const obj of this.proceduralObjects) {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (obj.material instanceof THREE.Material) obj.material.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      }
    }
    for (const light of this.proceduralLights) {
      this.scene.remove(light);
      if ((light as any).target) this.scene.remove((light as any).target);
    }
    this.proceduralObjects = [];
    this.proceduralLights = [];
    this.godRayPlanes = [];

    // Reset post-processing
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
    this.useComposer = false;

    // Reset fog
    this.scene.fog = null;
    this.scene.background = null;
  }

  private onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Resize post-processing composer
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  private lastFrameTime = 0;
  private fpsTarget = 1000 / 60; // 60 fps cap

  private animate = (time: number) => {
    if (!this.isActive) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Frame capping for performance optimization on high-refresh monitors
    const delta = time - this.lastFrameTime;
    if (delta < this.fpsTarget) {
      return; // Skip frame
    }
    this.lastFrameTime = time - (delta % this.fpsTarget);

    // Animate god ray planes (subtle sway)
    if (this.godRayPlanes.length > 0) {
      const t = Date.now() * 0.0003;
      for (let i = 0; i < this.godRayPlanes.length; i++) {
        const ray = this.godRayPlanes[i];
        if (ray && ray.material instanceof THREE.Material) {
          (ray.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t + i * 1.5) * 0.1;
        }
      }
    }

    // Render with or without post-processing
    if (this.useComposer && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  showVenue(venueId: string) {
    const isTexture = TEXTURE_VENUE_IDS.includes(venueId);
    const isProcedural = PROCEDURAL_VENUE_IDS.includes(venueId);
    
    if (!isTexture && !isProcedural) return;

    if (!this.isInitialized) this.init();
    
    this.canvasContainer.style.display = 'block';
    this.isActive = true;
    this.isProceduralVenue = isProcedural;
    
    if (this.currentVenueId !== venueId) {
      this.currentVenueId = venueId;

      if (isProcedural) {
        // Show the 360° mesh as hidden and build procedural scene
        if (this.mesh) this.mesh.visible = false;
        this.buildProceduralScene(venueId);
      } else {
        // Clean up any procedural scene and load texture
        this.cleanupProceduralScene();
        this.loadTextureForVenue(venueId);
      }
    }
    
    if (isProcedural) {
      // Reset camera for procedural venues
      this.cameraTheta = 0;
      this.cameraPhi = Math.PI / 2;
      this.updateProceduralCamera();
    } else {
      // Reset camera position to default nice view when entering
      this.cameraTheta = Math.PI / 4;
      this.cameraPhi = Math.PI / 2;
      this.updateCameraPosition();
    }
    
    if (!this.animationFrameId) {
      this.lastFrameTime = performance.now();
      this.animate(performance.now());
    }
  }

  hide() {
    if (!this.isInitialized) return;
    
    this.canvasContainer.style.display = 'none';
    this.isActive = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Convert 3D world coordinate to Phaser 1920x1080 screen coordinates
  projectWorldToPhaser(worldPoint: THREE.Vector3): {x: number, y: number, visible: boolean} {
    if (!this.camera || !this.isActive) return {x: 0, y: 0, visible: false};
    
    const vector = worldPoint.clone();
    vector.project(this.camera);
    
    // Map NDC [-1, 1] to Phaser [0, 1920] and [0, 1080]
    return {
      x: (vector.x * 0.5 + 0.5) * 1920,
      y: -(vector.y * 0.5 - 0.5) * 1080,
      visible: vector.z < 1
    };
  }

  // Convert Phaser 1920x1080 screen coordinates to a 3D world coordinate (projected out by `distance`)
  unprojectPhaserToWorld(x: number, y: number, distance: number = 50): THREE.Vector3 {
    if (!this.camera || !this.isActive) return new THREE.Vector3(0, 0, 0);

    // Map Phaser to NDC [-1, 1]
    const ndcX = (x / 1920) * 2 - 1;
    const ndcY = -(y / 1080) * 2 + 1;

    // Use Raycaster for procedural venues to find exact 3D intersection
    if (this.isProceduralVenue && this.scene) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
      // We only care about intersecting actual meshes, not helpers or invisible things
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      if (intersects.length > 0) {
        return intersects[0].point;
      }
    }

    const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
    vector.unproject(this.camera);

    // Get direction from camera
    vector.sub(this.camera.position).normalize();
    
    // Extend by distance
    const target = this.camera.position.clone().add(vector.multiplyScalar(distance));
    return target;
  }
}

export const ThreeJSService = new ThreeJSServiceSingleton();
