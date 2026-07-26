const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'subway_station') {
    data[i].title = "Climate Vulnerability & Pollution (2000s)";
    data[i].description = "Before eco-restoration, the subway faced severe environmental crises. Decades of improper waste management led to massive trash buildups on the tracks, causing toxic smoke from frequent track fires. Furthermore, the aging tunnels were highly vulnerable to extreme weather, resulting in catastrophic, multi-day flooding during severe storms like Hurricane Sandy.";
    data[i].imageUrl = "https://upload.wikimedia.org/wikipedia/commons/3/3a/Subway_platform_trash_can_%2838389472302%29.jpg";
    
    data[i].afterDescription = "Today, modernized transit hubs operate with high energy efficiency and advanced flood-proof storm barriers. However, there is still significant room for progress to fully waterproof the entire 400-mile tunnel network and entirely eliminate single-use plastics from underground vendors.";
    data[i].afterImageUrl = "https://upload.wikimedia.org/wikipedia/commons/d/d6/Fulton_Center_-_Full_%2848126530611%29.jpg";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating subway_station text and images for accuracy and progress');
