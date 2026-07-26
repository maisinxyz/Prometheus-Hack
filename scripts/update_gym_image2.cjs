const fs = require('fs');
const https = require('https');
const path = require('path');

const urlAfter = 'https://image.pollinations.ai/prompt/modern%20luxury%20fitness%20center%20interior%20bright%20natural%20light%20treadmills%20weights%20beautiful%20gym?nologo=true&seed=999&width=800&height=600';
const pathAfter = path.join(__dirname, 'public/assets/codex/gym_after_ai.jpg');

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
  console.log('Downloading new after image for gym...');
  await download(urlAfter, pathAfter);
  console.log('Done downloading new AI image for gym');
}

run();
