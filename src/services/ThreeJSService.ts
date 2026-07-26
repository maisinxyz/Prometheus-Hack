import * as THREE from 'three';

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
  
  // Camera Orbit Variables
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraTheta = Math.PI / 4; // Horizontal angle
  private cameraPhi = Math.PI / 2;   // Vertical angle
  private cameraRadius = 0.1; // Orbit from the center of the sphere
  private target = new THREE.Vector3(0, 0, 0);

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

      // Update Angles (Inverted x so dragging left looks left)
      this.cameraTheta += deltaMove.x * 0.005;
      this.cameraPhi += deltaMove.y * 0.005;

      // Clamp vertical angle so we don't flip upside down
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));

      this.updateCameraPosition();

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
    if (this.currentVenueId === 'ferry_docks') {
        // Clamp panning so they never see the edges of the 2.0 radian cylinder screen
        const initialTheta = Math.PI / 4;
        this.cameraTheta = Math.max(initialTheta - 0.22, Math.min(initialTheta + 0.22, this.cameraTheta));
    }

    this.camera.position.x = this.target.x + this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.y = this.target.y + this.cameraRadius * Math.cos(this.cameraPhi);
    this.camera.position.z = this.target.z + this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    this.camera.lookAt(this.target);
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
    if (venueId === 'construction_site') {
      texturePath = '/assets/abandoned_construction_360.jpg';
    } else if (venueId === 'ferry_docks') {
      texturePath = '/assets/ferry_docks_360_upscaled.png'; // Use upscaled original image
      isCylinder = true;
    } else if (venueId === 'tech_startup') {
      texturePath = '/assets/tech_startup_360_upscaled.png';
      isCylinder = true;
    } else {
      return; // Not supported
    }

    const textureLoader = new THREE.TextureLoader();
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
      } else {
        geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
      }

      if (this.mesh) {
        this.mesh.geometry = geometry;
        this.mesh.material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff });
        this.mesh.rotation.y = -Math.PI / 2;
      }
    });
  }

  private onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = () => {
    if (!this.isActive) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Only render, no automatic camera movement!
    this.renderer.render(this.scene, this.camera);
  }

  showVenue(venueId: string) {
    if (venueId !== 'construction_site' && venueId !== 'ferry_docks' && venueId !== 'tech_startup') return;

    if (!this.isInitialized) this.init();
    
    this.canvasContainer.style.display = 'block';
    this.isActive = true;
    
    if (this.currentVenueId !== venueId) {
      this.currentVenueId = venueId;
      this.loadTextureForVenue(venueId);
    }
    
    // Reset camera position to default nice view when entering
    this.cameraTheta = Math.PI / 4;
    this.cameraPhi = Math.PI / 2;
    this.updateCameraPosition();
    
    if (!this.animationFrameId) {
      this.animate();
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

  // Projects a 3D world coordinate to 2D screen coordinates
  getScreenPosition(x: number, y: number, z: number): {x: number, y: number, visible: boolean} {
    if (!this.camera || !this.isActive) return {x: 0, y: 0, visible: false};
    
    const vector = new THREE.Vector3(x, y, z);
    vector.project(this.camera);
    
    // Convert normalized device coordinates (NDC) to screen pixels
    const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = -(vector.y * 0.5 - 0.5) * window.innerHeight;
    
    return {
      x: screenX,
      y: screenY,
      visible: vector.z < 1 // z < 1 means it is in front of the camera
    };
  }
}

export const ThreeJSService = new ThreeJSServiceSingleton();
