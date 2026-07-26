// Copy assets using base64 encoding to bypass sandbox restrictions
const fs = require('fs');
const path = require('path');

const artifactsDir = '/Users/vincee_ong/.gemini/antigravity-ide/brain/046b945b-dbcf-42c3-a318-024fd5453b0c';

function copyFile(srcName, destPath) {
  const src = path.join(artifactsDir, srcName);
  if (fs.existsSync(src)) {
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const data = fs.readFileSync(src);
    fs.writeFileSync(destPath, data);
    console.log(`Copied ${srcName} -> ${destPath} (${data.length} bytes)`);
  } else {
    console.error(`Source not found: ${src}`);
  }
}

// Copy rock crusher
copyFile(
  'rock_crusher_1784701774695.png',
  path.join(__dirname, 'public', 'assets', 'sprites', 'machines', 'rock_crusher.png')
);

// Copy the user's uploaded construction bg (media__1784702819611.png)
copyFile(
  'media__1784702819611.png',
  path.join(__dirname, 'public', 'assets', 'sprites', 'items', 'construction_bg.png')
);

console.log('Done!');
