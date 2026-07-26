const https = require('https');

function getHTML(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
}

async function search() {
  const html1 = await getHTML('https://unsplash.com/s/photos/dirty-subway');
  let match1 = html1.match(/(https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+)[^\s"']*/);
  console.log('Dirty:', match1 ? match1[1] : 'None');

  const html2 = await getHTML('https://unsplash.com/s/photos/modern-subway-station');
  let match2 = html2.match(/(https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+)[^\s"']*/);
  console.log('Modern:', match2 ? match2[1] : 'None');
}
search();
