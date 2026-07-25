const fs = require('fs');
const https = require('https');
const path = require('path');

const urlBefore = 'https://image.pollinations.ai/prompt/vintage%201990s%20dirty%20flooded%20New%20York%20subway%20station%20platform%20trash%20on%20tracks%20gloomy%20lighting?nologo=true&seed=42&width=800&height=600';
const urlAfter = 'https://image.pollinations.ai/prompt/modern%20eco-friendly%20New%20York%20subway%20station%20platform%20pristine%20clean%20bright%20LED%20lighting%20beautiful%20architecture?nologo=true&seed=42&width=800&height=600';

const pathBefore = path.join(__dirname, 'public/assets/codex/subway_before_ai.jpg');
const pathAfter = path.join(__dirname, 'public/assets/codex/subway_after_ai.jpg');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  console.log('Downloading before image...');
  await download(urlBefore, pathBefore);
  console.log('Downloading after image...');
  await download(urlAfter, pathAfter);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'subway_station') {
      data[i].imageUrl = '/assets/codex/subway_before_ai.jpg';
      data[i].afterImageUrl = '/assets/codex/subway_after_ai.jpg';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done downloading and linking local AI images');
}

run();
