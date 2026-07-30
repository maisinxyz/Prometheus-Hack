import Phaser from 'phaser';
import * as THREE from 'three';

/**
 * TitleScene — Landing Page with Play Button.
 */
export class TitleScene extends Phaser.Scene {
  private threeRenderer?: THREE.WebGLRenderer;
  private threeScene?: THREE.Scene;
  private threeCamera?: THREE.PerspectiveCamera;
  private binMesh?: THREE.Group;
  private animationId?: number;
  private targetRotationX = 0;
  private targetRotationY = 0;
  private mouseX = 0;
  private mouseY = 0;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    
    if ((window as any).cursorManager) {
      (window as any).cursorManager.setVisible(false);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupThreeJS();
    });
    
    document.body.style.backgroundColor = '#d1fae5'; // Light green background
    
    // Generate an NYC-style skyline silhouette SVG
    let pathD = "M0,1080 ";
    const buildings = [
      { w: 80, h: 200 }, { w: 60, h: 350 }, { w: 100, h: 150 }, { w: 80, h: 400 }, // random
      { w: 90, h: 600 }, { w: 40, h: 650 }, { w: 10, h: 750 }, { w: 40, h: 650 }, { w: 90, h: 600 }, // Empire State-ish
      { w: 120, h: 250 }, { w: 70, h: 450 }, { w: 80, h: 300 },
      { w: 100, h: 550 }, { w: 60, h: 650 }, { w: 20, h: 800 }, // Spire
      { w: 110, h: 200 }, { w: 80, h: 400 }, { w: 90, h: 350 }, { w: 120, h: 500 },
      { w: 100, h: 250 }, { w: 80, h: 450 }, { w: 60, h: 300 },
      { w: 120, h: 600 }, { w: 50, h: 700 }, // Tall building
      { w: 90, h: 200 }, { w: 100, h: 350 }
    ];
    let currX = 0;
    for (const b of buildings) {
      const y = 1080 - b.h;
      pathD += `L${currX},${y} L${currX + b.w},${y} `;
      currX += b.w;
    }
    pathD += `L${currX},1080 Z`;
    
    const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 ${currX} 1080" preserveAspectRatio="none">
      <path d="${pathD}" fill="#a7f3d0" />
    </svg>
    `;
    const encoded = encodeURIComponent(svgData.trim());
    document.body.style.backgroundImage = `url("data:image/svg+xml;utf8,${encoded}")`;
    document.body.style.backgroundSize = '100% 85%';
    document.body.style.backgroundPosition = 'bottom';
    document.body.style.backgroundRepeat = 'no-repeat';

    this.setupThreeJS(width, height);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupThreeJS();
    });

    // Lies of P style Title (but with game's aesthetic)
    const title = this.add.text(150, 250, 'TrashDash', {
      fontFamily: '"Outfit", "Nunito", sans-serif', // Slightly more squared font for the title
      fontSize: '86px',
      color: '#064e3b', // Dark green
      fontStyle: '900',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#ffffff',
        blur: 4,
        stroke: true,
        fill: true
      }
    });
    title.setOrigin(0, 0.5);

    // Separator line
    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0x064e3b, 0.8);
    graphics.beginPath();
    graphics.moveTo(150, 310);
    graphics.lineTo(600, 310);
    graphics.strokePath();

    // Main Buttons - spaced out by 80px instead of 60px
    this.createMenuButton(150, 380, 'New Game', () => {
      if (confirm("Are you sure you want to start a new game? This will erase all your Chi and garden progress!")) {
        const wasDevMode = localStorage.getItem('trashdash_dev_mode') === 'true';

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
           const key = localStorage.key(i);
           if (key && key.startsWith('trashdash_')) {
              keysToRemove.push(key);
           }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
           const key = sessionStorage.key(i);
           if (key && key.startsWith('trashdash_')) {
              sessionKeysToRemove.push(key);
           }
        }
        sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
        
        if (wasDevMode) {
           localStorage.setItem('trashdash_dev_mode', 'true');
           sessionStorage.setItem('trashdash_dev_chi', '0');
        }

        this.scene.start('LevelSelectScene');
      }
    });

    this.createMenuButton(150, 460, 'Continue', () => {
      localStorage.removeItem('trashdash_dev_mode');
      this.scene.start('LevelSelectScene');
    });

    this.createMenuButton(150, 540, 'Waste Encyclopedia', () => {
      this.scene.start('SpritesScene');
    });

    this.createMenuButton(150, 620, 'Developer Mode (Unlock All)', () => {
      const venueIds = [
        'construction_site', 'ferry_docks', 'tech_startup',
        'subway_station', 'gym', 'public_library',
        'art_studio', 'financial_district_office', 'central_park', 'times_square',
        'nyc_hospital', 'hot_dog_stand', 'mackenzie_cafe'
      ];
      venueIds.forEach(id => {
        sessionStorage.setItem('trashdash_chi_' + id, '100');
      });
      sessionStorage.setItem('trashdash_tutorial_complete', 'true');
      localStorage.setItem('trashdash_dev_mode', 'true');
      this.scene.start('LevelSelectScene');
    });
  }

  private createMenuButton(x: number, y: number, text: string, onClick: () => void) {
    const btnText = this.add.text(0, 0, text, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '32px',
      color: '#374151', // subtle grey
      fontStyle: 'bold',
    });
    btnText.setOrigin(0, 0.5);

    const paddingX = 20;
    const paddingY = 15;
    const width = btnText.width + paddingX * 2;
    const height = btnText.height + paddingY * 2;
    const cornerRadius = 15;

    const bgBox = this.add.graphics();
    bgBox.fillStyle(0xa7f3d0, 1);
    bgBox.fillRoundedRect(-paddingX, -height / 2, width, height, cornerRadius);

    const container = this.add.container(x, y, [bgBox, btnText]);

    bgBox.setInteractive(new Phaser.Geom.Rectangle(-paddingX, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    bgBox.input.cursor = 'pointer';

    // indicator effect for hover
    const indicator = this.add.circle(x - 40, y, 6, 0x10b981); // Emerald green
    indicator.setVisible(false);

    bgBox.on('pointerover', () => {
      btnText.setColor('#000000');
      bgBox.clear();
      bgBox.fillStyle(0x6ee7b7, 1); // slightly darker green on hover
      bgBox.fillRoundedRect(-paddingX, -height / 2, width, height, cornerRadius);
      indicator.setVisible(true);
      // add slight right shift
      this.tweens.add({
        targets: container,
        x: x + 10,
        duration: 150,
        ease: 'Power2'
      });
      this.tweens.add({
        targets: indicator,
        x: x - 30,
        duration: 150,
        ease: 'Power2'
      });
    });

    bgBox.on('pointerout', () => {
      btnText.setColor('#374151');
      bgBox.clear();
      bgBox.fillStyle(0xa7f3d0, 1); // return to light green
      bgBox.fillRoundedRect(-paddingX, -height / 2, width, height, cornerRadius);
      indicator.setVisible(false);
      this.tweens.add({
        targets: container,
        x: x,
        duration: 150,
        ease: 'Power2'
      });
      this.tweens.add({
        targets: indicator,
        x: x - 40,
        duration: 150,
        ease: 'Power2'
      });
    });

    bgBox.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: onClick
      });
    });
  }

  private setupThreeJS(width: number, height: number) {
    const container = document.body;

    this.threeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.domElement.style.position = 'absolute';
    this.threeRenderer.domElement.style.top = '0';
    this.threeRenderer.domElement.style.left = '0';
    this.threeRenderer.domElement.style.zIndex = '0'; // Behind Phaser UI
    this.threeRenderer.domElement.style.pointerEvents = 'none'; // So phaser still gets clicks
    // Add an ID so we can easily find/remove it if necessary
    this.threeRenderer.domElement.id = 'threejs-title-canvas';

    container.insertBefore(this.threeRenderer.domElement, container.firstChild);

    this.threeScene = new THREE.Scene();
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.threeScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    this.threeScene.add(dirLight);

    const spotLight = new THREE.SpotLight(0xffaa55, 2);
    spotLight.position.set(-5, 5, 5);
    this.threeScene.add(spotLight);

    this.threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.threeCamera.position.z = 12;

    // Create the trash bin mesh group
    this.binMesh = new THREE.Group();

    // Bin Body (Green Cylinder, tapering)
    const bodyGeometry = new THREE.CylinderGeometry(2, 1.6, 4.5, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1B4D3E, // Dark green
      roughness: 0.7,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Top Rim
    const rimGeometry = new THREE.CylinderGeometry(2.1, 2.05, 0.2, 32);
    const rim = new THREE.Mesh(rimGeometry, bodyMaterial);
    rim.position.y = 2.15;

    // Middle Rim
    const midRimGeo = new THREE.CylinderGeometry(1.85, 1.8, 0.15, 32);
    const midRim = new THREE.Mesh(midRimGeo, bodyMaterial);
    midRim.position.y = 0;

    // Bottom Rim
    const botRimGeo = new THREE.CylinderGeometry(1.7, 1.65, 0.3, 32);
    const botRim = new THREE.Mesh(botRimGeo, bodyMaterial);
    botRim.position.y = -2.1;
    
    // Vertical Ribs for detail
    const ribGeo = new THREE.BoxGeometry(0.15, 4.2, 0.2);
    const ribs = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const rib = new THREE.Mesh(ribGeo, bodyMaterial);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 1.8;
      // Calculate position around cylinder (average radius ~ 1.8)
      rib.position.x = Math.cos(angle) * radius;
      rib.position.z = Math.sin(angle) * radius;
      // Tilt rib slightly to match tapering body
      rib.rotation.y = -angle;
      rib.rotation.x = -0.05; // slight inward tilt
      ribs.add(rib);
    }
    // Lid Material
    const lidMaterial = new THREE.MeshStandardMaterial({ color: 0x13382D });

    // Hinge for the lid
    const hingeGeo = new THREE.BoxGeometry(1.2, 0.4, 0.6);
    const hinge = new THREE.Mesh(hingeGeo, lidMaterial);
    hinge.position.set(0, 2.3, -2.0);

    // Lid Group (to allow pivoting at the hinge)
    const lidGroup = new THREE.Group();
    // Position the lid group at the hinge pivot point
    lidGroup.position.set(0, 2.3, -2.0);

    // Bin Lid
    const lidGeometry = new THREE.CylinderGeometry(2.1, 2.1, 0.3, 32);
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    // Offset lid relative to the hinge pivot
    lid.position.set(0, 0.1, 2.0);

    // Handle
    const handleGeometry = new THREE.BoxGeometry(1.5, 0.2, 0.2);
    const handle = new THREE.Mesh(handleGeometry, lidMaterial);
    handle.position.set(0, 0.35, 1.2); // Offset relative to pivot

    lidGroup.add(lid);
    lidGroup.add(handle);
    
    // Open the lid slightly
    lidGroup.rotation.x = -0.4;

    // Trash Bag peeking out
    const bagGeo = new THREE.SphereGeometry(1.8, 16, 16);
    // Add some random noise to the bag vertices to make it look crumpled
    const posAttribute = bagGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      posAttribute.setY(i, posAttribute.getY(i) + (Math.random() - 0.5) * 0.3);
    }
    bagGeo.computeVertexNormals();
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(0, 1.9, 0);
    bag.scale.set(1, 0.45, 1);

    // Soda Can
    const canGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
    const canMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.8 });
    const can = new THREE.Mesh(canGeo, canMat);
    can.position.set(0.8, 2.3, 0.5);
    can.rotation.set(Math.PI / 3, 0, Math.PI / 4);

    // Cardboard Box
    const boxGeo = new THREE.BoxGeometry(1.0, 0.8, 0.8);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(-0.6, 2.4, 0.2);
    box.rotation.set(0.2, 0.5, -0.2);

    // Crumpled Paper
    const paperGeo = new THREE.DodecahedronGeometry(0.3, 1);
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });
    const paper = new THREE.Mesh(paperGeo, paperMat);
    paper.position.set(-0.2, 2.2, 1.2);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    wheelGeo.rotateZ(Math.PI / 2);
    
    const wheel1 = new THREE.Mesh(wheelGeo, wheelMat);
    wheel1.position.set(1.5, -2.2, -1.0);
    
    const wheel2 = new THREE.Mesh(wheelGeo, wheelMat);
    wheel2.position.set(-1.5, -2.2, -1.0);

    // Wheel Arches / Guards
    const archGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16, 1, false, 0, Math.PI);
    archGeo.rotateZ(Math.PI / 2);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x13382D, roughness: 0.7 });
    
    const arch1 = new THREE.Mesh(archGeo, archMat);
    arch1.position.set(1.5, -2.2, -1.0);
    
    const arch2 = new THREE.Mesh(archGeo, archMat);
    arch2.position.set(-1.5, -2.2, -1.0);

    // Wheel Hubs
    const hubGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 16);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
    hubGeo.rotateZ(Math.PI / 2);
    const hub1 = new THREE.Mesh(hubGeo, hubMat);
    hub1.position.set(1.5, -2.2, -1);
    const hub2 = new THREE.Mesh(hubGeo, hubMat);
    hub2.position.set(-1.5, -2.2, -1);

    // Wheel Axle
    const axleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.2, 8);
    axleGeo.rotateZ(Math.PI / 2);
    const axle = new THREE.Mesh(axleGeo, wheelMat);
    axle.position.set(0, -2.2, -1);

    // Foot Pedal
    const pedalGeo = new THREE.BoxGeometry(0.8, 0.15, 0.6);
    const pedalMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 });
    const pedal = new THREE.Mesh(pedalGeo, pedalMat);
    pedal.position.set(0, -2.2, 1.6);

    // NYC Sticker
    // Using a curved cylinder segment so it wraps nicely and avoids z-fighting with ribs
    const stickerGeo = new THREE.CylinderGeometry(1.95, 1.85, 0.7, 16, 1, true, -0.4, 0.8);
    
    // Create a canvas texture for the sticker
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FBBF24'; // Yellow
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NYC', 128, 64);
      // Add a border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, 256, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const stickerMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const sticker = new THREE.Mesh(stickerGeo, stickerMat);
    // Position exactly in center so cylinder aligns
    sticker.position.set(0, 1.0, 0); 
    // Rotate so it's centered on the front
    sticker.rotation.y = -0.4 + Math.PI; 
    // Slight tilt to match taper
    sticker.rotation.x = -0.05;

    // Shadow under the bin
    const shadowGeo = new THREE.CircleGeometry(2.4, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -2.35, -0.2);

    // Assemble the bin
    this.binMesh.add(shadow);
    this.binMesh.add(body);
    this.binMesh.add(rim);
    this.binMesh.add(midRim);
    this.binMesh.add(botRim);
    this.binMesh.add(ribs);
    this.binMesh.add(lidGroup);
    this.binMesh.add(hinge);
    this.binMesh.add(bag);
    this.binMesh.add(can);
    this.binMesh.add(box);
    this.binMesh.add(paper);
    this.binMesh.add(arch1);
    this.binMesh.add(arch2);
    this.binMesh.add(wheel1);
    this.binMesh.add(wheel2);
    this.binMesh.add(hub1);
    this.binMesh.add(hub2);
    this.binMesh.add(axle);
    this.binMesh.add(pedal);
    this.binMesh.add(sticker);

    // Position the bin on the right side of the screen, more to the left and smaller
    this.binMesh.position.set(2, -0.5, 0); // Shifted left and down
    this.binMesh.scale.set(0.65, 0.65, 0.65); // Make it smaller
    this.binMesh.rotation.y = -Math.PI / 6; // Angled slightly
    this.binMesh.rotation.z = -0.1; // Slight dramatic tilt
    
    this.threeScene.add(this.binMesh);

    // Track mouse on the body/document, instead of Phaser input if Phaser doesn't catch it
    // But Phaser input should work
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Normalize mouse coordinates to -1 to 1
      this.mouseX = (pointer.x / width) * 2 - 1;
      this.mouseY = -(pointer.y / height) * 2 + 1;
    });

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      if (this.binMesh) {
        // Target rotations based on mouse position
        this.targetRotationY = this.mouseX * 0.5 - Math.PI / 6;
        this.targetRotationX = -this.mouseY * 0.2 + 0.25;

        // Smoothly interpolate current rotation to target rotation
        this.binMesh.rotation.y += (this.targetRotationY - this.binMesh.rotation.y) * 0.05;
        this.binMesh.rotation.x += (this.targetRotationX - this.binMesh.rotation.x) * 0.05;
        
        // Add a very slow idle bobbing/floating effect
        this.binMesh.position.y = Math.sin(Date.now() * 0.002) * 0.2;
      }

      if (this.threeRenderer && this.threeScene && this.threeCamera) {
        this.threeRenderer.render(this.threeScene, this.threeCamera);
      }
    };
    animate();
  }

  private cleanupThreeJS() {
    if (this.animationId !== undefined) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.threeRenderer) {
      this.threeRenderer.domElement.remove();
      this.threeRenderer.dispose();
    }
    document.body.style.backgroundImage = 'none';
  }
}
