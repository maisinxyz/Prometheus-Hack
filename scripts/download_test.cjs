const https = require('https');
const fs = require('fs');

const url = "https://upload.wikimedia.org/wikipedia/commons/4/47/New_york_times_square-terabass.jpg";
const dest = "public/assets/codex/test_real.jpg";

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  if (res.statusCode === 200) {
    res.pipe(fs.createWriteStream(dest)).on('finish', () => console.log('Success'));
  } else {
    console.log('Error:', res.statusCode);
  }
}).on('error', (err) => console.log(err));
