const fs = require('fs');
const https = require('https');
const path = require('path');

const urlCurrent = 'https://image.pollinations.ai/prompt/realistic%20modern%20day%20nyc%20hot%20dog%20stand%20cart,%20single%20use%20plastic%20wrappers,%20gas%20generator%20smoke,%20crowded%20city%20street,%20littered%20trash%20can,%20photography?nologo=true&seed=111&width=800&height=600';
const urlFuture = 'https://image.pollinations.ai/prompt/futuristic%20eco-friendly%20solar%20powered%20street%20food%20hot%20dog%20cart,%20clean%20sleek%20design,%20biodegradable%20leaf%20wrappers,%20pristine%20city%20street,%20beautiful%20utopian%20photography?nologo=true&seed=111&width=800&height=600';

const pathCurrent = path.join(__dirname, 'public/assets/codex/hotdog_current_ai.jpg');
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
  console.log('Downloading current hot dog cart image...');
  await download(urlCurrent, pathCurrent);
  console.log('Downloading future hot dog cart image...');
  await download(urlFuture, pathFuture);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'hot_dog_stand') {
      data[i].imageUrl = '/assets/codex/hotdog_current_ai.jpg';
      data[i].afterImageUrl = '/assets/codex/hotdog_future_ai.jpg';
      data[i].customBeforeLabel = 'Current';
      data[i].customAfterLabel = 'Future (Eco-Restored)';
      data[i].description = 'Currently, traditional street food vendors rely heavily on single-use plastics, unrecyclable foil wrappers, and noisy, polluting fossil-fuel generators. This leads to overflowing public trash cans that attract vermin, and contributes directly to localized air pollution on crowded city blocks.';
      data[i].afterDescription = 'In the future, we need to transition all street carts to fully solar-powered setups with zero-emission cooking elements. All food must be served in 100% biodegradable or even edible packaging, completely eliminating the massive footprint of single-use street food waste.';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done updating hot dog stand codex entry');
}

run();
