const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

data.forEach(entry => {
  if (entry.venueId === 'construction_site') {
    entry.imageUrl = "https://loremflickr.com/800/600/vintage,construction,building?lock=21";
    entry.afterImageUrl = "https://loremflickr.com/800/600/modern,green,architecture?lock=22";
  } else if (entry.venueId === 'central_park') {
    entry.imageUrl = "https://loremflickr.com/800/600/garbage,park,litter?lock=23";
    entry.afterImageUrl = "https://loremflickr.com/800/600/central,park,beautiful?lock=24";
  } else if (entry.venueId === 'times_square') {
    entry.imageUrl = "https://loremflickr.com/800/600/smog,times,square,dirty?lock=25";
    entry.afterImageUrl = "https://loremflickr.com/800/600/times,square,clean,day?lock=26";
  }
});

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Final update complete');
