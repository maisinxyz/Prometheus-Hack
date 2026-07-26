const fs = require('fs');
const https = require('https');
const path = require('path');

const urlAfter = 'https://image.pollinations.ai/prompt/modern%20public%20library%20interior%20bright%20natural%20light%20computers%20digital%20tablets%20e-readers%20people%20reading%20digital%20books%20eco-friendly%20architecture?nologo=true&seed=444&width=800&height=600';

const pathAfter = path.join(__dirname, 'public/assets/codex/library_after_ai2.jpg');

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
  console.log('Downloading new current image for library...');
  await download(urlAfter, pathAfter);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'public_library') {
      data[i].afterImageUrl = '/assets/codex/library_after_ai2.jpg';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done downloading and linking new AI image for library');
}

run();
