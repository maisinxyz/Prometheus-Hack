const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/codex.json', 'utf8'));

for (let i = 0; i < data.length; i++) {
  if (data[i].venueId === 'construction_site') {
    data[i].imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/0/07/Empire_State_Building_under_construction_in_1930_%2850937812903%29.jpg';
  }
  if (data[i].venueId === 'public_library') {
    data[i].imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8e/An_old_book.jpg';
  }
  if (data[i].venueId === 'art_studio') {
    data[i].imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/3/36/The_Artist%27s_Studio_by_Johannes_Gumpp.jpg';
    data[i].afterImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/9/98/ArtistStudio.png';
  }
  if (data[i].venueId === 'hot_dog_stand') {
    data[i].imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/0/09/Hot_dog_stand.jpg';
  }
  if (data[i].venueId === 'mackenzie_cafe') {
    data[i].imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Coffee_Shop_%288339247167%29.jpg';
  }
}

fs.writeFileSync('src/data/codex.json', JSON.stringify(data, null, 2));
console.log('Done fixing missing images');
