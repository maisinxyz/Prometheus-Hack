const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'subway_station') {
    data[i].title = "Underground Energy Drain (1970s)";
    data[i].description = "Historically, the aging subway infrastructure used terribly inefficient incandescent lighting and friction-based braking systems. These outdated technologies generated enormous amounts of excess heat and wasted massive amounts of electricity, while the tunnels remained highly vulnerable to flooding.";
    data[i].afterDescription = "Today, the subway is a model of eco-transit. Stations have been retrofitted with resilient flood-barriers, high-efficiency LED lighting, and new trains featuring regenerative braking systems that feed power back into the city's green grid.";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating subway_station text');
