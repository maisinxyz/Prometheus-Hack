const fs = require('fs');
const path = require('path');

const srcPath = '/Users/vincee_ong/.gemini/antigravity-ide/brain/046b945b-dbcf-42c3-a318-024fd5453b0c/rock_crusher_1784701774695.png';
const destDir = path.join(__dirname, 'public', 'assets', 'sprites', 'machines');
const destPath = path.join(destDir, 'rock_crusher.png');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(srcPath, destPath);
console.log('Copied generated image to', destPath);
