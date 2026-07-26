const fs = require('fs');
const https = require('https');
const path = require('path');

const urlBefore = 'https://image.pollinations.ai/prompt/realistic%201990s%20photography%20of%20massive%20piles%20of%20single-use%20plastic%20coffee%20cups%20in%20a%20landfill,%20historical%20environmental%20waste,%20no%20logos?nologo=true&seed=999&width=800&height=600';
// We will download the actual Cafe de Flore image from Wikipedia to avoid 403 errors when linking directly
const urlCurrent = 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Caf%C3%A9_de_Flore.jpg';

const pathBefore = path.join(__dirname, 'public/assets/codex/mackenzie_before_ai.jpg');
const pathCurrent = path.join(__dirname, 'public/assets/codex/mackenzie_current_ai.jpg');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    // We need to pass a User-Agent for Wikipedia downloads to prevent 403 Forbidden
    const options = new URL(url);
    const reqOptions = {
      hostname: options.hostname,
      path: options.pathname + (options.search || ''),
      headers: {
        'User-Agent': 'TrashDash-Game-Bot/1.0 (contact@example.com)'
      }
    };

    https.get(reqOptions, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectOpts = new URL(response.headers.location);
          const reqRedirect = {
            hostname: redirectOpts.hostname,
            path: redirectOpts.pathname + (redirectOpts.search || ''),
            headers: {
              'User-Agent': 'TrashDash-Game-Bot/1.0 (contact@example.com)'
            }
          };
          https.get(reqRedirect, (res2) => {
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
  console.log('Downloading historically accurate before image...');
  await download(urlBefore, pathBefore);
  console.log('Downloading original Cafe de Flore image for current...');
  await download(urlCurrent, pathCurrent);
  console.log('Done replacing images');
}

run();
