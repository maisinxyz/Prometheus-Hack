const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'subway_station') {
    data[i].imageUrl = "https://upload.wikimedia.org/wikipedia/commons/3/34/Nearly_every_NYC_subway_service_affected_by_flooding_crop.jpg";
    data[i].afterImageUrl = "https://upload.wikimedia.org/wikipedia/commons/9/9c/86th_Street_Second_Av._Subway_Station_Unveiled_%2831863534822%29.jpg";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating subway_station images to Wikipedia Deep Dive results');
