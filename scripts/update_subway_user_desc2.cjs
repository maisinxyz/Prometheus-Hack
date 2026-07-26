const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'subway_station') {
    data[i].description = "Before major modernization and resiliency efforts, the subway faced significant environmental and infrastructure challenges. Decades of accumulated track debris contributed to frequent track fires that produced toxic smoke and service disruptions. In addition, the aging system proved vulnerable to extreme weather, with Hurricane Sandy in 2012 causing severe flooding that shut down parts of the network for several days.";
    data[i].imageUrl = "https://upload.wikimedia.org/wikipedia/commons/2/2a/NYC%2C_trashed_sign_on_rails.jpg";
    data[i].afterImageUrl = "https://upload.wikimedia.org/wikipedia/commons/9/9c/86th_Street_Second_Av._Subway_Station_Unveiled_%2831863534822%29.jpg";
    data[i].customAfterLabel = "Current (Eco-Restored)";
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done updating subway_station text and images as per user request 2');
