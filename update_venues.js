const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data', 'venues.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const updates = {
  "mackenzie_cafe": { lat: 40.7565, lng: -73.9870 },
  "financial_district_office": { lat: 40.7070, lng: -74.0110 },
  "nyc_hospital": { lat: 40.7890, lng: -73.9530 },
  "times_square": { lat: 40.7580, lng: -73.9855 },
  "broadway_theater": { lat: 40.7590, lng: -73.9845 },
  "hot_dog_stand": { lat: 40.7308, lng: -73.9973 },
  "subway_station": { lat: 40.7527, lng: -73.9772 },
  "empire_state_building": { lat: 40.7484, lng: -73.9857 },
  "gym": { lat: 40.7816, lng: -73.9786 },
  "central_park": { lat: 40.7738, lng: -73.9708 },
  "public_library": { lat: 40.7532, lng: -73.9822 },
  "art_studio": { lat: 40.7233, lng: -74.0030 },
  "construction_site": { lat: 40.8115, lng: -73.9465 },
  "tech_startup": { lat: 40.7405, lng: -73.9903 },
  "ferry_docks": { lat: 40.7011, lng: -74.0132 }
};

for (const venue of data) {
  if (updates[venue.id]) {
    venue.latitude = updates[venue.id].lat;
    venue.longitude = updates[venue.id].lng;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Updated venues.json');
