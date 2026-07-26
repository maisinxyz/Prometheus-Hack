const fs = require('fs');
const https = require('https');
const path = require('path');

const urlAfter = 'https://image.pollinations.ai/prompt/a%20realistic%20modern%20day%20hospital%20building%20exterior,%20clean%20white%20architecture,%20glass%20windows,%20blue%20sky,%20modern%20medical%20center,%20high%20quality%20photography,%20real%20world?nologo=true&seed=999&width=800&height=600';
const pathAfter = path.join(__dirname, 'public/assets/codex/hospital_after_ai.jpg');

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
  console.log('Downloading more realistic current image for hospital...');
  await download(urlAfter, pathAfter);
  console.log('Done replacing hospital image');
}

run();
