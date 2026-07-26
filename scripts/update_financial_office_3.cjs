const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/codex.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'financial_district_office') {
    data[i].afterDescription = "Today, many financial district office buildings have adopted energy-efficient lighting, smart heating and cooling systems, and more efficient computer infrastructure to reduce electricity consumption. Increasing use of renewable energy, improved building standards, and responsible electronic waste recycling have helped lower greenhouse gas emissions and minimize the environmental impact of office operations.";
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Done updating financial_district_office current text');
