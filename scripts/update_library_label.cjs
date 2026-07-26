const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'public_library') {
    data[i].customAfterLabel = "Current (Eco-Restored)";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating public_library label');
