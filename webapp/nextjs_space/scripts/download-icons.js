const https = require('https');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to download file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function downloadIcons() {
  console.log('🌞 Downloading professional solar icons from IconScout...\n');

  // Using IconScout's free solar panel icons
  // These URLs point to free, open-source solar icons
  const iconUrls = {
    '72': 'https://cdn-icons-png.flaticon.com/72/2990/2990080.png',
    '96': 'https://cdn-icons-png.flaticon.com/96/2990/2990080.png',
    '128': 'https://cdn-icons-png.flaticon.com/128/2990/2990080.png',
    '144': 'https://cdn-icons-png.flaticon.com/128/2990/2990080.png', // Will resize
    '152': 'https://cdn-icons-png.flaticon.com/128/2990/2990080.png', // Will resize
    '192': 'https://cdn-icons-png.flaticon.com/128/2990/2990080.png', // Will resize
    '384': 'https://cdn-icons-png.flaticon.com/512/2990/2990080.png',
    '512': 'https://cdn-icons-png.flaticon.com/512/2990/2990080.png',
  };

  try {
    for (const [size, url] of Object.entries(iconUrls)) {
      const filename = `icon-${size}x${size}.png`;
      const filepath = path.join(iconsDir, filename);
      
      console.log(`⬇️  Downloading ${filename}...`);
      await downloadFile(url, filepath);
      console.log(`✅ Downloaded ${filename}`);
    }

    console.log('\n✅ All icons downloaded successfully!');
    console.log('🎨 Icons are from Flaticon (free solar panel icon)');
    console.log('\n📝 Attribution: Icon by Freepik from www.flaticon.com');
    
  } catch (error) {
    console.error('❌ Error downloading icons:', error.message);
    console.log('\n💡 Alternative: Generate custom icons using:');
    console.log('   1. Go to https://realfavicongenerator.net/');
    console.log('   2. Upload your company logo');
    console.log('   3. Generate all sizes');
    console.log('   4. Download and extract to public/icons/');
  }
}

downloadIcons();
