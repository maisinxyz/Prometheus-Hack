const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Modern_office_building.jpg', dest: 'tech_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Electronic_waste_in_Agbogbloshie.jpg', dest: 'tech_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/New_York_City_Subway_car_interior_2019.jpg', dest: 'subway_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/New_York_City_Subway_car_graffiti_1973.jpg', dest: 'subway_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Empire_State_Building_%28aerial_view%29.jpg', dest: 'empire_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Smog_over_New_York_City_1988.jpg', dest: 'empire_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Gym_interior.jpg', dest: 'gym_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Plastic_pollution_in_water.jpg', dest: 'gym_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/New_York_Public_Library_Main_Branch_Rose_Reading_Room.jpg', dest: 'library_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Damaged_books.jpg', dest: 'library_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Art_studio.jpg', dest: 'art_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Toxic_waste.jpg', dest: 'art_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Wall_Street_New_York_City.jpg', dest: 'finance_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Wall_Street_after_crash.jpg', dest: 'finance_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Mount_Sinai_Hospital_New_York_City.jpg', dest: 'hospital_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Medical_waste.jpg', dest: 'hospital_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Hot_dog_cart_in_New_York_City.jpg', dest: 'hotdog_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Littering.jpg', dest: 'hotdog_dirty.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Cafe_interior.jpg', dest: 'cafe_clean.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Coffee_cups_waste.jpg', dest: 'cafe_dirty.jpg' }
];

const download = (url, dest) => {
  return new Promise((resolve) => {
    const fullPath = path.join(__dirname, 'public', 'assets', 'codex', dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(fullPath)).on('finish', resolve);
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, dest).then(resolve);
      } else {
        console.log(`Failed ${dest}: ${res.statusCode}`);
        resolve();
      }
    }).on('error', (err) => {
      console.log(`Error ${dest}:`, err.message);
      resolve();
    });
  });
};

async function run() {
  for (const img of images) {
    console.log(`Downloading ${img.dest}...`);
    await download(img.url, img.dest);
    await new Promise(r => setTimeout(r, 500)); // Delay to avoid 429
  }
  console.log('Done!');
}

run();
