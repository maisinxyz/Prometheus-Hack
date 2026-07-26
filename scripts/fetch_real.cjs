const https = require('https');
const fs = require('fs');
const path = require('path');

const files = [
  { name: 'File:Interior_of_a_modern_office.jpg', dest: 'tech_clean.jpg' },
  { name: 'File:Electronic_waste_in_Agbogbloshie.jpg', dest: 'tech_dirty.jpg' },
  { name: 'File:R160_Interior_2019.jpg', dest: 'subway_clean.jpg' },
  { name: 'File:Graffiti_on_New_York_City_Subway_car_1973.jpg', dest: 'subway_dirty.jpg' },
  { name: 'File:Empire_State_Building_(aerial_view).jpg', dest: 'empire_clean.jpg' },
  { name: 'File:Smog_over_New_York_City.jpg', dest: 'empire_dirty.jpg' },
  { name: 'File:Gym_interior.jpg', dest: 'gym_clean.jpg' },
  { name: 'File:Plastic_pollution_in_water.jpg', dest: 'gym_dirty.jpg' },
  { name: 'File:New_York_Public_Library_Main_Branch_Rose_Reading_Room.jpg', dest: 'library_clean.jpg' },
  { name: 'File:Damaged_books.jpg', dest: 'library_dirty.jpg' },
  { name: 'File:Artist_studio.jpg', dest: 'art_clean.jpg' },
  { name: 'File:Toxic_waste.jpg', dest: 'art_dirty.jpg' },
  { name: 'File:Wall_Street_New_York_City.jpg', dest: 'finance_clean.jpg' },
  { name: 'File:Littering.jpg', dest: 'finance_dirty.jpg' },
  { name: 'File:Mount_Sinai_Hospital_New_York_City.jpg', dest: 'hospital_clean.jpg' },
  { name: 'File:Medical_waste.jpg', dest: 'hospital_dirty.jpg' },
  { name: 'File:Hot_dog_cart_in_New_York_City.jpg', dest: 'hotdog_clean.jpg' },
  { name: 'File:Littering.jpg', dest: 'hotdog_dirty.jpg' }, // reuse
  { name: 'File:Cafe_interior.jpg', dest: 'cafe_clean.jpg' },
  { name: 'File:Coffee_cups_waste.jpg', dest: 'cafe_dirty.jpg' }
];

const fetchImageUrl = (filename) => {
  return new Promise((resolve) => {
    const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
    https.get(api, { headers: { 'User-Agent': 'Antigravity/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].imageinfo) {
            resolve(pages[pageId].imageinfo[0].url);
          } else {
            resolve(null);
          }
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
};

const download = (url, dest) => {
  return new Promise((resolve) => {
    const fullPath = path.join(__dirname, 'public', 'assets', 'codex', dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(fullPath)).on('finish', resolve);
      } else {
        console.log(`Failed ${dest}: ${res.statusCode}`);
        resolve();
      }
    }).on('error', () => resolve());
  });
};

async function run() {
  for (const file of files) {
    console.log(`Fetching ${file.name}...`);
    const url = await fetchImageUrl(file.name);
    if (url) {
      console.log(`Downloading to ${file.dest}...`);
      await download(url, file.dest);
    } else {
      console.log(`Could not find URL for ${file.name}`);
      // Fallback: create an empty file so it doesn't 404 entirely (or we can use AI)
      fs.writeFileSync(path.join(__dirname, 'public', 'assets', 'codex', file.dest), 'broken');
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}
run();
