const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/codex.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'financial_district_office') {
    data[i].description = "Historically, the intense computational demands of high-frequency trading in financial district offices required staggering amounts of electricity, severely straining the local power grid and relying heavily on fossil fuels. Additionally, the rapid turnover of computer servers generated massive amounts of toxic electronic waste (e-waste) that leached heavy metals into landfills.";
    data[i].afterDescription = "Today, modern financial district offices have heavily mitigated this environmental impact by transitioning to ultra-efficient, green-certified server infrastructure powered by renewable energy. Furthermore, strict e-waste recycling programs ensure that outdated trading hardware is safely dismantled, allowing rare earth metals to be reclaimed and reused.";
    data[i].customAfterLabel = "Current (Eco-Restored)";
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Done updating financial_district_office text');
