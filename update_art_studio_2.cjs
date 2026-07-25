const fs = require('fs');
const https = require('https');
const path = require('path');

const urlBefore = 'https://image.pollinations.ai/prompt/colorful%20toxic%20paint%20sludge%20spilling%20into%20a%20river%20from%20an%20old%20art%20studio,%20water%20pollution,%20hazardous%20waste,%20environmental%20damage?nologo=true&seed=555&width=800&height=600';
const urlAfter = 'https://image.pollinations.ai/prompt/beautiful%20modern%20art%20studio%20interior%20with%20organic%20plant-based%20paints,%20clean%20recycling%20bins,%20bright%20sunlight,%20eco-friendly?nologo=true&seed=555&width=800&height=600';

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
  console.log('Downloading new before image for art studio...');
  await download(urlBefore, pathBefore);
  console.log('Downloading new after image for art studio...');
  await download(urlAfter, pathAfter);
  console.log('Done downloading new AI images for art studio');
}

run();
