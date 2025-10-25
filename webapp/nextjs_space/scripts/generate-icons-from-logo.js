const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '..', 'public', 'images', 'sundirectlogo.png');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('🌞 Generating app icons from Sun Direct Power logo...\n');

  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo not found at:', logoPath);
    console.log('\n💡 Please ensure sundirectlogo.png exists in public/images/');
    return;
  }

  try {
    for (const size of sizes) {
      const filename = `icon-${size}x${size}.png`;
      const filepath = path.join(iconsDir, filename);

      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
        })
        .png()
        .toFile(filepath);

      console.log(`✅ Created ${filename} (${size}x${size})`);
    }

    // Also create a favicon
    await sharp(logoPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));

    console.log('✅ Created favicon.png (32x32)');

    console.log('\n✅ All icons generated successfully from your logo!');
    console.log('🎨 Icons are ready for PWA and mobile devices');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    
    if (error.message.includes('sharp')) {
      console.log('\n💡 Sharp library not installed. Installing now...');
      console.log('   Run: npm install sharp');
    }
  }
}

generateIcons();
