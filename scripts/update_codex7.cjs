const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

const queriesToRun = {
  times_square: { clean: "Times_Square" },
  ferry_docks: { clean: "Staten_Island_Ferry" },
  tech_startup: { dirty: "Server_room", clean: "Office" },
  construction_site: { dirty: "Construction_of_the_Empire_State_Building" },
  gym: { dirty: "Aerobics", clean: "Fitness_center" },
  public_library: { dirty: "Old_book", clean: "New_York_Public_Library_Main_Branch" },
  art_studio: { dirty: "Studio_(workspace)", clean: "Studio_(workspace)" },
  financial_district_office: { dirty: "Trading_floor", clean: "Wall_Street" },
  nyc_hospital: { dirty: "Hospital_ward", clean: "Mount_Sinai_Hospital_(Manhattan)" },
  hot_dog_stand: { dirty: "Hot_dog_cart", clean: "Hot_dog_cart" },
  mackenzie_cafe: { dirty: "Coffeehouse", clean: "Coffeehouse" }
};

const USER_AGENT = 'PrometheusBot/1.0 (contact: bot@example.com)';

async function getWikiSummaryImage(page) {
  try {
    const api = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`;
    const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT }});
    const json = await res.json();
    if (json.originalimage && json.originalimage.source) {
      return json.originalimage.source;
    }
  } catch (err) {
    console.error("Wiki summary failed for:", page, err.message);
  }
  return null;
}

async function run() {
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const queries = queriesToRun[entry.venueId];
    if (queries) {
      console.log(`Processing ${entry.venueId}...`);
      
      if (queries.dirty) {
        const url = await getWikiSummaryImage(queries.dirty);
        if (url) {
            entry.imageUrl = url;
            console.log(` Found dirty: ${url}`);
        } else {
            console.log(` No dirty image for ${queries.dirty}`);
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      if (queries.clean) {
        const url = await getWikiSummaryImage(queries.clean);
        if (url) {
            entry.afterImageUrl = url;
            console.log(` Found clean: ${url}`);
        } else {
            console.log(` No clean image for ${queries.clean}`);
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
  console.log('Done linking Wikipedia images');
}

run();
