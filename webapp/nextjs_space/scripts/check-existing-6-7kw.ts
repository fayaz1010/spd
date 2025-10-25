import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const skus = ['SG6.0RS', 'SG7.0RS', 'X1-BOOST-6.0', 'X1-BOOST-7.0', 'GW6000-EH', 'GW7000-EH', 'PRIMO-6.0-1', 'SE6000H', 'SE7600H'];
  
  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
  });
  
  console.log(`\nFound ${products.length} existing products:\n`);
  products.forEach(p => {
    console.log(`${p.name} - Available: ${p.isAvailable}`);
  });
  
  if (products.length === 0) {
    console.log('None exist - safe to create them!\n');
  }
  
  await prisma.$disconnect();
}

main();
