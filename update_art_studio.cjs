const fs = require('fs');
const https = require('https');
const path = require('path');

const urlBefore = 'https://image.pollinations.ai/prompt/Vintage%20cluttered%20art%20studio%20interior%20toxic%20paint%20splatters%20messy%20hazardous%20waste%20dark%20gritty%20photography?nologo=true&seed=222&width=800&height=600';
const urlAfter = 'https://image.pollinations.ai/prompt/Modern%20bright%20eco-friendly%20art%20studio%20interior%20non-toxic%20paints%20pristine%20clean%20workspace%20natural%20light%20beautiful%20photography?nologo=true&seed=222&width=800&height=600';

const pathBefore = path.join(__dirname, 'public/assets/codex/art_before_ai.jpg');
const pathAfter = path.join(__dirname, 'public/assets/codex/art_after_ai.jpg');

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
  console.log('Downloading before image for art studio...');
  await download(urlBefore, pathBefore);
  console.log('Downloading after image for art studio...');
  await download(urlAfter, pathAfter);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'art_studio') {
      data[i].imageUrl = '/assets/codex/art_before_ai.jpg';
      data[i].afterImageUrl = '/assets/codex/art_after_ai.jpg';
      data[i].customAfterLabel = 'Current (Eco-Restored)';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done updating art studio images and label');
}

run();
