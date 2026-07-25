const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/codex.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'financial_district_office') {
    data[i].description = "Before modern sustainability initiatives, financial district office buildings consumed enormous amounts of electricity for lighting, heating, cooling, and early computer systems. Much of this electricity was generated from fossil fuels, contributing to air pollution and greenhouse gas emissions. Older office equipment and electronics also produced electronic waste that required careful disposal to prevent hazardous materials from entering the environment.";
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Done updating financial_district_office before text');
