const fs = require('fs');
let data = JSON.parse(fs.readFileSync('src/data/items.json', 'utf8'));

const dummyKeys = ['foodboxfull', 'foodbox1', 'foodbox2', 'emptyfoodbox', 'foodboxplastic'];
for (const key of dummyKeys) {
  data.push({
    "id": `dummy_${key}`,
    "displayName": `Dummy ${key}`,
    "spriteKey": key,
    "correctBinId": "none",
    "isComposite": false,
    "componentIds": [],
    "venueIds": []
  });
}

fs.writeFileSync('src/data/items.json', JSON.stringify(data, null, 2));
console.log('Dummy items added.');
