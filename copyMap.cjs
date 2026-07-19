const fs = require('fs');

const src = '/Users/vincee_ong/.gemini/antigravity-ide/brain/ce505857-3b5e-4a63-8e70-acbccf2a3d9a/nyc_map_bg_1784355779147.png';
const dest = '/Users/vincee_ong/Desktop/Prometheus-Hack/assets/sprites/ui/nyc_map_bg.png';

fs.mkdirSync('/Users/vincee_ong/Desktop/Prometheus-Hack/assets/sprites/ui', { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied successfully!');
