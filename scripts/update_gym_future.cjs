const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'gym') {
    data[i].afterDescription = "In an ideal eco-restored future, state-of-the-art gyms will finally eliminate single-use plastics entirely. They will feature exclusively reusable water stations and workout equipment manufactured completely from recycled oceanic plastics.";
    data[i].customAfterLabel = "Future (Eco-Restored)";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating gym text and label to represent the future');
