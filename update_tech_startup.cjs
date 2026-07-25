const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'tech_startup') {
    data[i].title = "The Silicon Alley Energy Drain (2000s)";
    data[i].description = "During the early tech boom, startups relied on massive, highly inefficient on-site server closets. These poorly ventilated rooms consumed enormous amounts of electricity and required heavy, constant air conditioning, putting severe strain on the city's power grid.";
    data[i].imageUrl = "https://loremflickr.com/800/600/messy,server,room,cables?lock=119";
    
    data[i].afterDescription = "Today, modern tech startups leverage highly optimized cloud computing running on shared data centers powered by renewable energy, drastically reducing their physical footprint and local energy consumption.";
    data[i].afterImageUrl = "https://loremflickr.com/800/600/modern,tech,office?lock=120";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating tech_startup entry');
