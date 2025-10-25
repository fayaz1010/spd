// Generate simple SVG icons and convert to PNG
const fs = require('fs');
const path = require('path');

// Create a simple solar panel icon SVG
const createSolarIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#3B82F6"/>
  
  <!-- Sun rays -->
  <g fill="#FCD34D" stroke="#FCD34D" stroke-width="3">
    <line x1="${size/2}" y1="${size*0.15}" x2="${size/2}" y2="${size*0.25}" stroke-linecap="round"/>
    <line x1="${size*0.85}" y1="${size/2}" x2="${size*0.75}" y2="${size/2}" stroke-linecap="round"/>
    <line x1="${size/2}" y1="${size*0.85}" x2="${size/2}" y2="${size*0.75}" stroke-linecap="round"/>
    <line x1="${size*0.15}" y1="${size/2}" x2="${size*0.25}" y2="${size/2}" stroke-linecap="round"/>
    <line x1="${size*0.25}" y1="${size*0.25}" x2="${size*0.32}" y2="${size*0.32}" stroke-linecap="round"/>
    <line x1="${size*0.75}" y1="${size*0.25}" x2="${size*0.68}" y2="${size*0.32}" stroke-linecap="round"/>
    <line x1="${size*0.75}" y1="${size*0.75}" x2="${size*0.68}" y2="${size*0.68}" stroke-linecap="round"/>
    <line x1="${size*0.25}" y1="${size*0.75}" x2="${size*0.32}" y2="${size*0.68}" stroke-linecap="round"/>
  </g>
  
  <!-- Sun circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.15}" fill="#FCD34D"/>
  
  <!-- Solar panel -->
  <g transform="translate(${size/2}, ${size*0.65})">
    <rect x="${-size*0.2}" y="0" width="${size*0.4}" height="${size*0.15}" fill="#1E40AF" stroke="#FFFFFF" stroke-width="2" rx="2"/>
    <line x1="${-size*0.2}" y1="${size*0.075}" x2="${size*0.2}" y2="${size*0.075}" stroke="#FFFFFF" stroke-width="1"/>
    <line x1="${-size*0.067}" y1="0" x2="${-size*0.067}" y2="${size*0.15}" stroke="#FFFFFF" stroke-width="1"/>
    <line x1="${size*0.067}" y1="0" x2="${size*0.067}" y2="${size*0.15}" stroke="#FFFFFF" stroke-width="1"/>
  </g>
</svg>
`;

// Icon sizes needed
const sizes = [144, 192, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('📱 Generating app icons...\n');

sizes.forEach(size => {
  const svg = createSolarIconSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, svgFilename);
  
  // Save SVG file
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Created ${svgFilename}`);
});

// Also create favicon
const faviconSVG = createSolarIconSVG(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSVG);
console.log('✅ Created favicon.svg');

console.log('\n📝 Note: SVG files created. For production, convert to PNG using:');
console.log('   - Online tool: https://svgtopng.com/');
console.log('   - Or install sharp: npm install sharp');
console.log('\n✅ Icons generated successfully!');
