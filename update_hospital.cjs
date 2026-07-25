const fs = require('fs');
const https = require('https');
const path = require('path');

const urlAfter = 'https://image.pollinations.ai/prompt/beautiful%20modern%20zero-emission%20hospital%20exterior,%20lush%20green%20architecture,%20clean%20environment,%20beautiful%20photography,%20eco-friendly%20hospital?nologo=true&seed=888&width=800&height=600';
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
  console.log('Downloading new after image for hospital...');
  await download(urlAfter, pathAfter);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'nyc_hospital') {
      data[i].afterImageUrl = '/assets/codex/hospital_after_ai.jpg';
      data[i].customAfterLabel = 'Current (Eco-Restored)';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done updating hospital image and label');
}

run();
