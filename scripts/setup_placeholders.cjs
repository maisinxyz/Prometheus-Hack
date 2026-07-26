const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));
const artifactDir = 'C:\\Users\\jason\\.gemini\\antigravity-ide\\brain\\f0d6971b-69c3-47d1-9df4-ad28a4411a20';
const assetsDir = path.join(__dirname, 'public', 'assets', 'codex');

const goodImages = {
  broadway_theater: {
    dirty: 'codex_broadway_1784881055491.png',
    clean: 'after_broadway_1784881289018.png'
  },
  central_park: {
    dirty: 'codex_central_park_1784881033540.png',
    clean: 'after_central_park_1784881295763.png'
  },
  construction_site: {
    dirty: 'codex_construction_1784881071264.png',
    clean: 'after_construction_1784881340779.png'
  },
  ferry_docks: {
    dirty: 'codex_docks_1784881047916.png',
    clean: 'after_docks_1784881281306.png'
  },
  times_square: {
    dirty: 'codex_times_square_1784881040822.png',
    clean: 'after_times_square_1784881271147.png'
  },
  tech_startup: {
    dirty: 'tech_dirty_1784882801730.png',
    clean: 'tech_clean_1784882028318.png'
  },
  public_library: {
    dirty: null,
    clean: 'library_clean_1784882035649.png'
  }
};

function createSvg(title, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="50%" font-family="Arial" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
      ${title}
    </text>
  </svg>`;
}

data.forEach(entry => {
  const good = goodImages[entry.venueId];
  
  if (good && good.dirty) {
    fs.copyFileSync(path.join(artifactDir, good.dirty), path.join(assetsDir, good.dirty));
    entry.imageUrl = `/assets/codex/${good.dirty}`;
  } else {
    const dirtySvg = createSvg(`${entry.title} (Dirty - Needs Photo)`, '#8b0000');
    fs.writeFileSync(path.join(assetsDir, `${entry.venueId}_dirty.svg`), dirtySvg);
    entry.imageUrl = `/assets/codex/${entry.venueId}_dirty.svg`;
  }

  if (good && good.clean) {
    fs.copyFileSync(path.join(artifactDir, good.clean), path.join(assetsDir, good.clean));
    entry.afterImageUrl = `/assets/codex/${good.clean}`;
  } else {
    const cleanSvg = createSvg(`${entry.title} (Clean - Needs Photo)`, '#006400');
    fs.writeFileSync(path.join(assetsDir, `${entry.venueId}_clean.svg`), cleanSvg);
    entry.afterImageUrl = `/assets/codex/${entry.venueId}_clean.svg`;
  }
});

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Restored good images and created SVGs for the rest!');
