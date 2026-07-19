const fs = require('fs');
let data = JSON.parse(fs.readFileSync('src/data/items.json', 'utf8'));

// Update existing sprites
for (let item of data) {
  if (item.id === 'coffee_cup') item.spriteKey = 'coffecup';
  if (item.id === 'coffee_cup_lid') item.spriteKey = 'coffeelid';
  if (item.id === 'napkin_clean') item.spriteKey = 'tissues';
  if (item.id === 'napkin_greasy') item.spriteKey = 'tissues';
  if (item.id === 'apple_core') item.spriteKey = 'applecore';
  
  // Remove takeout_box_with_food from mackenzie_cafe since we're replacing it with foodbox
  if (item.id === 'takeout_box_with_food') {
    item.venueIds = item.venueIds.filter(v => v !== 'mackenzie_cafe');
  }
}

// Add new food boxes
data.push({
  "id": "foodbox_full",
  "displayName": "Full Food Box",
  "spriteKey": "foodbox",
  "correctBinId": "none",
  "isComposite": true,
  "componentIds": [],
  "venueIds": ["mackenzie_cafe"]
});
data.push({
  "id": "foodbox_empty",
  "displayName": "Empty Food Box",
  "spriteKey": "foodbox",
  "correctBinId": "none",
  "isComposite": true,
  "componentIds": [],
  "venueIds": ["mackenzie_cafe"]
});

fs.writeFileSync('src/data/items.json', JSON.stringify(data, null, 2));
console.log('items.json updated.');
