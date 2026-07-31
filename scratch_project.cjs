const THREE = require('three');
const camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 0.1, 1000);
camera.position.set(0, 0, 0.1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.updateMatrixWorld();
camera.updateProjectionMatrix();

const startAngle = -2.35;
const spacing = 0.16;
const radius = 49;
const groundY = -18;

for (let i = 0; i < 4; i++) {
  const theta = startAngle + i * spacing;
  const x = Math.sin(theta) * radius;
  const z = Math.cos(theta) * radius;
  
  const wPos = new THREE.Vector3(x, groundY, z);
  const dir = wPos.clone().normalize();
  wPos.copy(dir).multiplyScalar(49.0);
  
  const projected = wPos.clone().project(camera);
  const phaserX = (projected.x * 0.5 + 0.5) * 1920;
  const phaserY = -(projected.y * 0.5 - 0.5) * 1080;
  console.log(`Bin ${i}: phaserX=${phaserX.toFixed(1)}, phaserY=${phaserY.toFixed(1)}`);
}
