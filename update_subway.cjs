const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'subway_station') {
    data[i].imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/c/ca/NYC_Subway_R1_100.jpg';
    data[i].afterImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Fulton_Center_-_Full_%2848126530611%29.jpg';
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating subway_station images');
