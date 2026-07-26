const fs = require('fs');
const https = require('https');
const path = require('path');

const urlBefore = 'https://image.pollinations.ai/prompt/massive%20deforestation%20ancient%20woodlands%20cut%20down%20trees%20piled%20up%20for%20paper%20production%20environmental%20destruction?nologo=true&seed=888&width=800&height=600';
const urlAfter = 'https://image.pollinations.ai/prompt/massive%20modern%20server%20farm%20data%20center%20interior%20glowing%20lights%20rows%20of%20servers%20powering%20digital%20library?nologo=true&seed=888&width=800&height=600';

const pathBefore = path.join(__dirname, 'public/assets/codex/library_before_ai.jpg');
const pathAfter = path.join(__dirname, 'public/assets/codex/library_after_ai.jpg');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Handle redirects if any (pollinations shouldn't redirect but just in case)
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
  console.log('Downloading before image for library...');
  await download(urlBefore, pathBefore);
  console.log('Downloading after image for library...');
  await download(urlAfter, pathAfter);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'public_library') {
      data[i].imageUrl = '/assets/codex/library_before_ai.jpg';
      data[i].afterImageUrl = '/assets/codex/library_after_ai.jpg';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done downloading and linking local AI images for public_library');
}

run();
