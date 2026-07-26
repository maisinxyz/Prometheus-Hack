const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data', 'items.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const spriteMap = {
  "clean_sawdust_pile": "sawdust",
  "broken_brick_piece": "brick",
  "yellow_caution_tape": "cautiontape",
  "cement_mix_bag": "emptycementbag",
  "rusty_nail": "rustynails",
  "cracked_hard_hat": "hardhat",
  "wood_scrap": "wood",
  "drywall_scrap": "rock",
  "concrete_chunk": "rockshattered"
};

for (const item of data) {
  if (spriteMap[item.id]) {
    item.spriteKey = spriteMap[item.id];
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Updated items.json');
