const fs = require('fs');
const https = require('https');
const path = require('path');

// No people in the prompt prevents stretched/weird AI faces/bodies.
const urlCurrent = 'https://image.pollinations.ai/prompt/beautiful%20modern%20bright%20city%20cafe%20interior,%20empty%20tables,%20NO%20PEOPLE,%20single%20use%20coffee%20cups%20left%20on%20tables,%20clean%20architectural%20photography,%20highly%20realistic?nologo=true&seed=888&width=800&height=600';
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
  console.log('Downloading high quality architectural image for Mackenzie Cafe current...');
  await download(urlCurrent, pathCurrent);
  console.log('Done replacing current image');
}

run();
