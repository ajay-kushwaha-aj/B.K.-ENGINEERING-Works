const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, 'public', 'fonts');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const fonts = [
  {
    url: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf',
    dest: path.join(dir, 'Inter-Regular.ttf')
  },
  {
    url: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf',
    dest: path.join(dir, 'Inter-Bold.ttf')
  }
];

fonts.forEach(font => {
  const file = fs.createWriteStream(font.dest);
  https.get(font.url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${path.basename(font.dest)}`);
    });
  }).on('error', err => {
    fs.unlink(font.dest, () => {});
    console.error(`Error downloading ${font.url}:`, err.message);
  });
});
