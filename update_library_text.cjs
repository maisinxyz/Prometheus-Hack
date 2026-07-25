const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'library') {
    data[i].description = "Historically, the immense demand for physical books and printed materials came at a severe environmental cost. Mass deforestation to produce paper resulted in the clearing of ancient woodlands, disrupting ecosystems and contributing to significant carbon emissions.";
    data[i].afterDescription = "Today, libraries have heavily mitigated this impact by transitioning to digital archives, e-books, and recycled paper. However, there is still significant room for improvement, as the massive server farms powering these digital databases require vast amounts of electricity and produce their own carbon footprint.";
    data[i].customAfterLabel = "Current";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating library text');
