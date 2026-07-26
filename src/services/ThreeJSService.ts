import * as THREE from 'three';

class ThreeJSServiceSingleton {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private canvasContainer!: HTMLElement;
  private isInitialized = false;
  private isActive = false;
  private animationFrameId: number | null = null;
  
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
    this.camera.position.x = this.target.x + this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.y = this.target.y + this.cameraRadius * Math.cos(this.cameraPhi);
    this.camera.position.z = this.target.z + this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    this.camera.lookAt(this.target);
  }

  private buildPhotorealisticEnvironment() {
    // We create a giant sphere and map the 360 panorama onto its inside surface
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    
    // Invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/assets/abandoned_construction_360.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Rotate to point at a nice starting angle
      mesh.rotation.y = -Math.PI / 2;
      
      this.scene.add(mesh);
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

  showConstructionSite() {
    if (!this.isInitialized) this.init();
    
    this.canvasContainer.style.display = 'block';
    this.isActive = true;
    
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
