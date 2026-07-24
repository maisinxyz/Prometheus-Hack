const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

data.forEach(entry => {
  if (entry.venueId === 'broadway_theater') {
    entry.imageUrl = "https://loremflickr.com/800/600/vintage,broadway,theater?lock=31";
    entry.afterImageUrl = "https://loremflickr.com/800/600/modern,broadway,times,square?lock=32";
    entry.afterDescription = "The theater district has improved significantly since the coal era, utilizing LED lighting, but there is still substantial room for improvement to eliminate single-use plastic cups and playbill litter.";
  } else if (entry.venueId === 'ferry_docks') {
    entry.imageUrl = "https://loremflickr.com/800/600/vintage,docks,pollution?lock=33";
    entry.afterImageUrl = "https://loremflickr.com/800/600/modern,harbor,ferry?lock=34";
    entry.afterDescription = "While harbor water quality has improved significantly since the steam era, there is still ample room for improvement to protect marine life from microplastics and fuel leaks.";
  } else if (entry.venueId === 'tech_startup') {
    entry.imageUrl = "https://loremflickr.com/800/600/ewaste,computers?lock=1";
    entry.afterImageUrl = "https://loremflickr.com/800/600/modern,office,startup?lock=2";
  } else if (entry.venueId === 'subway_station') {
    entry.imageUrl = "https://loremflickr.com/800/600/graffiti,subway,train?lock=3";
    entry.afterImageUrl = "https://loremflickr.com/800/600/clean,subway,interior?lock=4";
  } else if (entry.venueId === 'empire_state_building') {
    entry.imageUrl = "https://loremflickr.com/800/600/smog,newyork,skyline?lock=5";
    entry.afterImageUrl = "https://loremflickr.com/800/600/empire,state,building,clear?lock=6";
  } else if (entry.venueId === 'gym') {
    entry.imageUrl = "https://loremflickr.com/800/600/plastic,pollution,gym?lock=7";
    entry.afterImageUrl = "https://loremflickr.com/800/600/modern,gym,fitness?lock=8";
  } else if (entry.venueId === 'public_library') {
    entry.imageUrl = "https://loremflickr.com/800/600/damaged,books,library?lock=9";
    entry.afterImageUrl = "https://loremflickr.com/800/600/new,york,public,library,reading,room?lock=10";
  } else if (entry.venueId === 'art_studio') {
    entry.imageUrl = "https://loremflickr.com/800/600/toxic,waste,paint?lock=11";
    entry.afterImageUrl = "https://loremflickr.com/800/600/bright,art,studio?lock=12";
  } else if (entry.venueId === 'financial_district_office') {
    entry.imageUrl = "https://loremflickr.com/800/600/street,litter,wallstreet?lock=13";
    entry.afterImageUrl = "https://loremflickr.com/800/600/wall,street,clean?lock=14";
  } else if (entry.venueId === 'nyc_hospital') {
    entry.imageUrl = "https://loremflickr.com/800/600/medical,waste,trash?lock=15";
    entry.afterImageUrl = "https://loremflickr.com/800/600/modern,hospital,building?lock=16";
  } else if (entry.venueId === 'hot_dog_stand') {
    entry.imageUrl = "https://loremflickr.com/800/600/overflowing,trash,can?lock=17";
    entry.afterImageUrl = "https://loremflickr.com/800/600/hotdog,cart,new,york?lock=18";
  } else if (entry.venueId === 'mackenzie_cafe') {
    entry.imageUrl = "https://loremflickr.com/800/600/coffee,cups,waste?lock=19";
    entry.afterImageUrl = "https://loremflickr.com/800/600/modern,cafe,interior?lock=20";
  }
});

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Update complete');
