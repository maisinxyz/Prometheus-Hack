const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));
const downloads = [];

data.forEach((entry, i) => {
  if (entry.imageUrl && entry.imageUrl.startsWith('http')) {
    const dest = `local_dirty_${i}.jpg`;
    downloads.push({ url: entry.imageUrl, dest });
    entry.imageUrl = `/assets/codex/${dest}`;
  }
  if (entry.afterImageUrl && entry.afterImageUrl.startsWith('http')) {
    const dest = `local_clean_${i}.jpg`;
    downloads.push({ url: entry.afterImageUrl, dest });
    entry.afterImageUrl = `/assets/codex/${dest}`;
  }
});

async function downloadImage(urlStr, destPath) {
  try {
    const res = await fetch(urlStr);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
  } catch (err) {
    console.error(`Error downloading ${urlStr}:`, err.message);
  }
}

async function run() {
  for (const d of downloads) {
    console.log(`Downloading ${d.url} to ${d.dest}...`);
    await downloadImage(d.url, path.join(__dirname, 'public', 'assets', 'codex', d.dest));
  }
  fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
  console.log('Done downloading and updating codex.json');
}

run();
