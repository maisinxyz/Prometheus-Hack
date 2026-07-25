const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'construction_site') {
    data[i].imageUrl = '/assets/codex/codex_construction_1784881071264.png';
  }
  if (data[i].venueId === 'tech_startup') {
    data[i].afterImageUrl = '/assets/codex/tech_clean_1784882028318.png';
    data[i].customAfterLabel = 'Current (Eco-Restored)';
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating construction_site before image and tech_startup after image + label');
