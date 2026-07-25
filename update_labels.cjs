const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'construction_site') {
    data[i].customAfterLabel = 'Future (Eco-Restored)';
  }
  if (data[i].venueId === 'ferry_docks') {
    data[i].customAfterLabel = 'Current (Eco-Restored)';
    data[i].imageUrl = '/assets/codex/codex_docks_1784881047916.png';
    data[i].afterImageUrl = '/assets/codex/after_docks_1784881281306.png';
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating custom labels and ferry images');
