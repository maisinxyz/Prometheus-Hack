const fs = require('fs');
const https = require('https');
const path = require('path');

const urlBefore = 'https://image.pollinations.ai/prompt/a%20busy%20vintage%20coffee%20shop%20interior,%20overflowing%20trash%20cans%20with%20single%20use%20plastic%20coffee%20cups,%20waste,%20dirty%20cafe,%20photography?nologo=true&seed=123&width=800&height=600';
const urlCurrent = 'https://image.pollinations.ai/prompt/a%20modern%20bustling%20city%20cafe%20interior,%20some%20people%20using%20ceramic%20mugs%20but%20still%20many%20single%20use%20disposable%20coffee%20cups%20on%20tables,%20realistic%20photography?nologo=true&seed=123&width=800&height=600';

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
  console.log('Downloading before image for Mackenzie Cafe...');
  await download(urlBefore, pathBefore);
  console.log('Downloading current image for Mackenzie Cafe...');
  await download(urlCurrent, pathCurrent);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'mackenzie_cafe') {
      data[i].imageUrl = '/assets/codex/mackenzie_before_ai.jpg';
      data[i].afterImageUrl = '/assets/codex/mackenzie_current_ai.jpg';
      data[i].customAfterLabel = 'Current';
      data[i].afterDescription = 'While some modern cafes now offer reusable ceramics, the vast majority of takeaway orders still rely heavily on single-use cups. Although some are biodegradable and there is slightly less waste than in the past, the sheer daily volume of disposable coffee cups still creates a massive environmental burden that must be aggressively changed.';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done updating Mackenzie Cafe codex entry');
}

run();
