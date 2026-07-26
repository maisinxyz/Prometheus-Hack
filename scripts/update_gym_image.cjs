const fs = require('fs');
const https = require('https');
const path = require('path');

const urlAfter = 'https://image.pollinations.ai/prompt/futuristic%20eco-friendly%20gym%20interior%20reusable%20water%20stations%20recycled%20oceanic%20plastics%20beautiful%20bright%20natural%20lighting?nologo=true&seed=123&width=800&height=600';
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
  console.log('Downloading after image...');
  await download(urlAfter, pathAfter);
  
  const dataPath = path.join(__dirname, 'src/data/codex.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (let i = 0; i < data.length; i++) {
    if (data[i].venueId === 'gym') {
      data[i].afterImageUrl = '/assets/codex/gym_after_ai.jpg';
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Done downloading and linking local AI image for gym');
}

run();
