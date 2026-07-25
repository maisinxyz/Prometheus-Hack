const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'subway_station') {
    data[i].imageUrl = "https://image.pollinations.ai/prompt/vintage%201990s%20dirty%20flooded%20New%20York%20subway%20station%20platform%20trash%20on%20tracks%20gloomy%20lighting?nologo=true&seed=42&width=800&height=600";
    data[i].afterImageUrl = "https://image.pollinations.ai/prompt/modern%20eco-friendly%20New%20York%20subway%20station%20platform%20pristine%20clean%20bright%20LED%20lighting%20beautiful%20architecture?nologo=true&seed=42&width=800&height=600";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating subway_station to use online AI generated images from pollinations.ai');
