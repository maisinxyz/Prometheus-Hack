const fs = require('fs');
const https = require('https');
const path = require('path');

const urlBefore = 'https://image.pollinations.ai/prompt/a%20busy%20bustling%20coffee%20shop%20interior,%20massive%20piles%20of%20garbage%20and%20single%20use%20plastic%20coffee%20cups%20overflowing%20from%20trash%20cans,%20extremely%20dirty,%20messy%20floor,%20realistic%20photography?nologo=true&seed=444&width=800&height=600';
const pathBefore = path.join(__dirname, 'public/assets/codex/mackenzie_before_ai.jpg');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          https.get(response.headers.location, (res2) => {
              res2.pipe(file);
              file.on('finish', () => file.close(resolve));
          });
      } else {
          response.pipe(file);
          file.on('finish', () => file.close(resolve));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  console.log('Downloading new before image for Mackenzie Cafe...');
  await download(urlBefore, pathBefore);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'mackenzie_cafe') {
      data[i].customAfterLabel = 'Current (Eco-Restored)';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done updating Mackenzie Cafe before image and label');
}

run();
