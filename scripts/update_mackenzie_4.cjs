const fs = require('fs');
const https = require('https');
const path = require('path');

// Before: actual cafe when it first opened
const urlBefore = 'https://image.pollinations.ai/prompt/vintage%20photography%20of%20a%20classic%20coffee%20shop%20interior%20when%20it%20first%20opened,%20retro%201990s%20aesthetic,%20pristine%20clean,%20nostalgic?nologo=true&seed=777&width=800&height=600';

// Current: looks like Cafe de Flore (since Wikipedia direct linking failed and caused a black image)
const urlCurrent = 'https://image.pollinations.ai/prompt/beautiful%20classic%20french%20cafe%20exterior%20on%20a%20bustling%20city%20corner,%20green%20plants,%20people%20drinking%20coffee,%20highly%20realistic%20photography,%20similar%20to%20cafe%20de%20flore?nologo=true&seed=777&width=800&height=600';

const pathBefore = path.join(__dirname, 'public/assets/codex/mackenzie_before_ai.jpg');
const pathCurrent = path.join(__dirname, 'public/assets/codex/mackenzie_current_ai.jpg');

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
  console.log('Downloading before image...');
  await download(urlBefore, pathBefore);
  console.log('Downloading current image...');
  await download(urlCurrent, pathCurrent);
  console.log('Done replacing images');
}

run();
