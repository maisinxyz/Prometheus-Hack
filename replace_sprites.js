const fs = require('fs');
const file = 'src/services/ThreeJSService.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /  private loadSprites\(spritePaths: string\[\]\) \{[\s\S]*?console\.warn\(Failed to load sprite: \$\{path\}\, error\);\n      \}\);\n    \}\);\n  \}/;

const newCode =   private loadSprites(spritePaths: string[]) {
    const loader = new THREE.TextureLoader();
    const pondZoneAngle = Math.PI * 0.25;
    
    // We will load all textures into an array, then sort them so anchors (benches, ponds, tables) are placed first
    const loadPromises = spritePaths.map(path => {
      return new Promise<any>((resolve) => {
        loader.load(path, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const filename = path.toLowerCase();
          const levelMatch = filename.match(/_lvl(\\d+)\\.png/);
          const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;
          
          let type = 'unknown';
          if (filename.includes('compost')) type = 'compost';
          else if (filename.includes('recycling')) type = 'recycling';
          else if (filename.includes('plastic')) type = 'plastic';
          else if (filename.includes('landfill')) type = 'landfill';
          
          resolve({path, texture, type, level});
        }, undefined, () => resolve(null));
      });
    });

    Promise.all(loadPromises).then(results => {
      const validItems = results.filter(r => r !== null);
      
      const ponds: {x: number, z: number}[] = [];
      const benches: {x: number, z: number}[] = [];
      const tables: {x: number, z: number}[] = [];
      
      // Sort: Ponds (plastic 1,9), then Benches (recycling 6), then Tables (recycling 9), then rest
      validItems.sort((a, b) => {
         const getPriority = (item: any) => {
            if (item.type === 'plastic' && (item.level === 1 || item.level === 9)) return 1;
            if (item.type === 'recycling' && item.level === 6) return 2;
            if (item.type === 'recycling' && item.level === 9) return 3;
            return 10;
         };
         return getPriority(a) - getPriority(b);
      });

      validItems.forEach((item) => {
        const {path, texture, type, level} = item;
        let numDuplicates = 1;
        let baseSize = 80;
        let requiresCollision = true;
        let collisionRadius = 40;
        let isPondZone = false;
        
        let anchorToSnapTo: {x: number, z: number}[] | null = null;
        let yOffset = -30;
        let randomizeAnchorOffset = false;
        
        if (type === 'compost') {
          requiresCollision = false;
          numDuplicates = 15;
          if (level <= 6) baseSize = 10;
          else if (level === 7) baseSize = 20;
          else { baseSize = 8; numDuplicates = 20; } // Animals/insects shrunk (lvl 8,9,10)
        } else if (type === 'recycling') {
          numDuplicates = 2;
          requiresCollision = true;
          if (level <= 5) { baseSize = 40; collisionRadius = 25; }
          else if (level === 6) { baseSize = 30; collisionRadius = 20; numDuplicates = 3; } // Bench
          else if (level === 7) { baseSize = 40; collisionRadius = 15; numDuplicates = 3; } // Lamps
          else if (level === 8) { 
             baseSize = 25; requiresCollision = false; anchorToSnapTo = benches; 
             numDuplicates = 1; yOffset = -22; 
          } // Humans on bench
          else if (level === 9) { baseSize = 50; collisionRadius = 35; numDuplicates = 2; } // Picnic table
          else if (level === 10) { 
             baseSize = 35; requiresCollision = false; anchorToSnapTo = tables; 
             numDuplicates = 1; yOffset = -20; 
          } // Humans on table
        } else if (type === 'plastic') {
          numDuplicates = 2;
          requiresCollision = true;
          if (level === 1 || level === 9) { 
             baseSize = 120; collisionRadius = 60; isPondZone = true; numDuplicates = 1; yOffset = -35; 
          } // Pond
          else if (level === 7) { baseSize = 15; requiresCollision = false; numDuplicates = 4; yOffset = 50; } // Birds
          else {
             anchorToSnapTo = ponds;
             requiresCollision = false;
             randomizeAnchorOffset = (level !== 10);
             if (level === 5) { baseSize = 12; numDuplicates = 5; yOffset = -28; } // Lilypads
             else if (level === 10) { baseSize = 30; numDuplicates = 1; yOffset = -22; } // Fountain
             else { baseSize = 15; numDuplicates = 3; yOffset = -28; } // Others in pond
          }
        } else if (type === 'landfill') {
          numDuplicates = 2;
          requiresCollision = true;
          if (level === 1) { baseSize = 40; collisionRadius = 25; numDuplicates = 1; }
          else { baseSize = 15; collisionRadius = 10; numDuplicates = 3; } // Shrink animals (lvl 2,3,4,5)
        }

        for (let i = 0; i < numDuplicates; i++) {
          const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
          const sprite = new THREE.Sprite(material);
          
          const aspect = texture.image.width / texture.image.height;
          const scaleMod = (type === 'compost') ? (0.6 + Math.random() * 0.8) : (0.9 + Math.random() * 0.2);
          sprite.scale.set(baseSize * aspect * scaleMod, baseSize * scaleMod, 1);
          
          let placed = false;
          let attempts = 0;
          let x = 0;
          let z = 0;
          
          if (anchorToSnapTo && anchorToSnapTo.length > 0) {
             const anchor = anchorToSnapTo[i % anchorToSnapTo.length];
             x = anchor.x;
             z = anchor.z;
             if (randomizeAnchorOffset) {
                x += (Math.random() - 0.5) * 40;
                z += (Math.random() - 0.5) * 40;
             }
             placed = true;
          } else {
            while (!placed && attempts < 20) {
              attempts++;
              
              let angle = 0;
              let radius = 0;
              if (isPondZone) {
                 angle = pondZoneAngle;
                 radius = 120;
              } else {
                 angle = Math.random() * Math.PI * 2;
                 radius = (type === 'compost') ? (20 + Math.random() * 430) : (80 + Math.random() * 200);
              }
              
              x = Math.sin(angle) * radius;
              z = Math.cos(angle) * radius;
              
              if (requiresCollision) {
                let collided = false;
                for (const spot of this.occupiedSpots) {
                  const dist = Math.sqrt(Math.pow(x - spot.x, 2) + Math.pow(z - spot.z, 2));
                  if (dist < (collisionRadius + spot.radius)) {
                    collided = true;
                    break;
                  }
                }
                if (!collided) placed = true;
              } else {
                placed = true;
              }
            }
          }
          
          if (placed) {
            sprite.position.x = x;
            sprite.position.y = yOffset;
            sprite.position.z = z;
            
            this.scene.add(sprite);
            this.sprites.push(sprite);
            
            if (requiresCollision) {
              this.occupiedSpots.push({x, z, radius: collisionRadius});
            }
            
            if (type === 'plastic' && (level === 1 || level === 9)) ponds.push({x, z});
            if (type === 'recycling' && level === 6) benches.push({x, z});
            if (type === 'recycling' && level === 9) tables.push({x, z});
          }
        }
      });
    });
  };

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync(file, code);
    console.log('Successfully replaced loadSprites!');
} else {
    console.log('Regex did not match.');
}
