const fs = require('fs');
const https = require('https');
const path = require('path');

const urlCurrent = 'https://image.pollinations.ai/prompt/a%20realistic%20modern%20city%20cafe%20interior,%20people%20sitting%20at%20tables,%20tables%20are%20cluttered%20with%20many%20single-use%20disposable%20paper%20coffee%20cups,%20showing%20modern%20waste%20issues,%20realistic%20photography,%20bright%20lighting?nologo=true&seed=555&width=800&height=600';
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
  console.log('Downloading new current image for Mackenzie Cafe...');
  await download(urlCurrent, pathCurrent);
  console.log('Done replacing current image');
}

run();
