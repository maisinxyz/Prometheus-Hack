const fs = require('fs');
const https = require('https');
const path = require('path');

const urlFuture = 'https://image.pollinations.ai/prompt/a%20modern%20sleek%20metallic%20nyc%20hot%20dog%20stand%20cart%20with%20bright%20solar%20panels%20on%20the%20roof,%20clean%20zero-emission%20electric%20cooking,%20beautiful%20bright%20sunny%20day,%20highly%20realistic%20photography?nologo=true&seed=333&width=800&height=600';
const pathFuture = path.join(__dirname, 'public/assets/codex/hotdog_future_ai.jpg');

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
  console.log('Downloading new hot dog future image...');
  await download(urlFuture, pathFuture);
  console.log('Done replacing hot dog future image');
}

run();
