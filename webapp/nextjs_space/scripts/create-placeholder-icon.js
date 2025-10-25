const fs = require('fs');
const path = require('path');

// Create a simple 1x1 PNG (smallest valid PNG)
// This is a base64 encoded 1x1 blue pixel PNG
const blueDot = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create all required icon sizes (they'll all be the same 1x1 pixel for now)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Creating placeholder icons...\n');

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, blueDot);
  console.log(`✅ Created ${filename}`);
});

console.log('\n✅ All placeholder icons created!');
console.log('📝 Note: These are 1x1 pixel placeholders. Replace with proper icons later.');
console.log('   You can use: https://realfavicongenerator.net/ to generate proper icons');
