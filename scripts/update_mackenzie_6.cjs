const fs = require('fs');
const https = require('https');
const path = require('path');

// Focused on a single object so the AI doesn't draw weird/stretched humans or bad geometry
const urlCurrent = 'https://image.pollinations.ai/prompt/a%20single%20modern%20disposable%20paper%20coffee%20cup%20sitting%20on%20a%20wood%20cafe%20table,%20overflowing%20trash%20can%20blurred%20in%20the%20background,%20cinematic%20lighting,%20highly%20realistic%20photography?nologo=true&seed=1024&width=800&height=600';
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
  console.log('Downloading high quality focused image for Mackenzie Cafe current...');
  await download(urlCurrent, pathCurrent);
  console.log('Done replacing current image');
}

run();
