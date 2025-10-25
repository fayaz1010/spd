const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixImagePaths() {
  console.log('Fixing image paths...');
  
  const packages = await prisma.systemPackageTemplate.findMany();
  
  for (const pkg of packages) {
    if (pkg.features) {
      const features = pkg.features;
      let updated = false;
      
      // Fix heroImageUrl
      if (features.heroImageUrl && features.heroImageUrl.includes('D:/')) {
        const filename = features.heroImageUrl.split('/').pop();
        features.heroImageUrl = `/packages/${filename}`;
        updated = true;
        console.log(`Fixed heroImageUrl for ${pkg.name}: ${features.heroImageUrl}`);
      }
      
      // Fix infographicUrl
      if (features.infographicUrl && features.infographicUrl.includes('D:/')) {
        const filename = features.infographicUrl.split('/').pop();
        features.infographicUrl = `/packages/${filename}`;
        updated = true;
        console.log(`Fixed infographicUrl for ${pkg.name}: ${features.infographicUrl}`);
      }
      
      if (updated) {
        await prisma.systemPackageTemplate.update({
          where: { id: pkg.id },
          data: { features }
        });
      }
    }
  }
  
  console.log('Done!');
  await prisma.$disconnect();
}

fixImagePaths().catch(console.error);
