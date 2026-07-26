const fs = require('fs');
const path = require('path');

// Ensure module is imported via dynamic import since it might be ESM
async function run() {
  const { searchImages, SafeSearchType } = await import('duck-duck-scrape');

  const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

  const searchTerms = {
    construction_site: { dirty: "1920s construction site historical photo", clean: "modern green building architecture" },
    broadway_theater: { dirty: "vintage broadway theater exterior 1940s", clean: "modern broadway theater new york" },
    ferry_docks: { dirty: "Gowanus Canal historical pollution photo", clean: "New York Harbor ferry modern" },
    tech_startup: { dirty: "huge pile of electronic waste dump", clean: "modern tech startup office interior" },
    subway_station: { dirty: "1970s New York Subway graffiti covered train", clean: "clean empty modern new york subway interior" },
    empire_state_building: { dirty: "1960s New York City smog skyline", clean: "Empire State Building clear sky modern photo" },
    gym: { dirty: "plastic water bottles ocean pollution", clean: "modern bright gym fitness center interior" },
    public_library: { dirty: "decaying damaged old books pile", clean: "New York Public Library Rose Reading Room interior" },
    art_studio: { dirty: "hazardous toxic waste barrels", clean: "artist studio bright interior painting" },
    financial_district_office: { dirty: "litter trash covered city street", clean: "Wall Street New York City modern" },
    central_park: { dirty: "garbage pile in park 1970s", clean: "Central Park beautiful sunny day" },
    times_square: { dirty: "Times Square 1970s dirty historical", clean: "Times Square modern pedestrian plaza clear day" },
    nyc_hospital: { dirty: "medical waste trash", clean: "Mount Sinai Hospital New York exterior" },
    hot_dog_stand: { dirty: "overflowing public trash can street", clean: "New York City hot dog cart modern" },
    mackenzie_cafe: { dirty: "disposable coffee cups trash pile", clean: "modern cozy cafe interior" }
  };

  async function downloadImage(query, destPath) {
    try {
      console.log(`Searching DDG for: ${query}`);
      const results = await searchImages(query, { safeSearch: SafeSearchType.STRICT });
      if (results && results.results && results.results.length > 0) {
        const urlStr = results.results[0].image;
        console.log(`  Found: ${urlStr}`);
        const res = await fetch(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(destPath, buffer);
        return true;
      } else {
        console.log(`  No results for ${query}`);
      }
    } catch (err) {
      console.error(`  Error for ${query}:`, err.message);
    }
    return false;
  }

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const terms = searchTerms[entry.venueId];
    if (terms) {
      const destDirty = `ddg_dirty_${entry.venueId}.jpg`;
      const destClean = `ddg_clean_${entry.venueId}.jpg`;
      
      const okDirty = await downloadImage(terms.dirty, path.join(__dirname, 'public', 'assets', 'codex', destDirty));
      if (okDirty) entry.imageUrl = `/assets/codex/${destDirty}`;

      const okClean = await downloadImage(terms.clean, path.join(__dirname, 'public', 'assets', 'codex', destClean));
      if (okClean) entry.afterImageUrl = `/assets/codex/${destClean}`;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
  console.log('Done downloading DDG images and updating codex.json');
}

run().catch(console.error);
