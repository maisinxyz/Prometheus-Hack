const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

const searchTerms = {
  construction_site: { dirty: "construction waste", clean: "modern architecture building" },
  broadway_theater: { dirty: "smog New York", clean: "Broadway theater New York" },
  ferry_docks: { dirty: "Gowanus Canal", clean: "New York Harbor ferry" },
  tech_startup: { dirty: "electronic waste", clean: "office interior" },
  subway_station: { dirty: "New York Subway graffiti", clean: "New York Subway car interior" },
  empire_state_building: { dirty: "smog New York City", clean: "Empire State Building" },
  gym: { dirty: "plastic pollution", clean: "gym interior" },
  public_library: { dirty: "damaged books", clean: "New York Public Library reading room" },
  art_studio: { dirty: "toxic waste", clean: "artist studio" },
  financial_district_office: { dirty: "litter street", clean: "Wall Street" },
  central_park: { dirty: "garbage park", clean: "Central Park" },
  times_square: { dirty: "Times Square 1970s", clean: "Times Square" },
  nyc_hospital: { dirty: "medical waste", clean: "Mount Sinai Hospital" },
  hot_dog_stand: { dirty: "trash can overflowing", clean: "hot dog cart" },
  mackenzie_cafe: { dirty: "coffee cups waste", clean: "cafe interior" }
};

async function getWikiImageUrl(query) {
  try {
    const api = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json&gsrlimit=1`;
    const res = await fetch(api, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const json = await res.json();
    if (json.query && json.query.pages) {
      const pageId = Object.keys(json.query.pages)[0];
      if (json.query.pages[pageId].imageinfo) {
        return json.query.pages[pageId].imageinfo[0].url;
      }
    }
  } catch (err) {
    console.error("Wiki search failed for:", query, err.message);
  }
  return null;
}

async function downloadImage(urlStr, destPath) {
  try {
    const res = await fetch(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
  } catch (err) {
    console.error(`Error downloading ${urlStr}:`, err.message);
  }
}

async function run() {
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const terms = searchTerms[entry.venueId];
    if (terms) {
      console.log(`Processing ${entry.venueId}...`);
      
      const dirtyUrl = await getWikiImageUrl(terms.dirty);
      if (dirtyUrl) {
        const dest = `wiki_dirty_${i}.jpg`;
        console.log(` Downloading dirty: ${dirtyUrl}`);
        await downloadImage(dirtyUrl, path.join(__dirname, 'public', 'assets', 'codex', dest));
        entry.imageUrl = `/assets/codex/${dest}`;
      } else {
        console.log(` No dirty image found for ${entry.venueId}`);
      }

      const cleanUrl = await getWikiImageUrl(terms.clean);
      if (cleanUrl) {
        const dest = `wiki_clean_${i}.jpg`;
        console.log(` Downloading clean: ${cleanUrl}`);
        await downloadImage(cleanUrl, path.join(__dirname, 'public', 'assets', 'codex', dest));
        entry.afterImageUrl = `/assets/codex/${dest}`;
      } else {
        console.log(` No clean image found for ${entry.venueId}`);
      }
    }
    await new Promise(r => setTimeout(r, 1000)); // Be nice to Wikipedia
  }
  
  fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
  console.log('Done downloading Wiki images and updating codex.json');
}

run();
