import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing all products data...\n');

  // Delete in correct order (foreign key constraints)
  console.log('Deleting supplier-product links...');
  const supplierProducts = await prisma.supplierProduct.deleteMany({});
  console.log(`  ✓ Deleted ${supplierProducts.count} supplier-product links`);

  try {
    console.log('Deleting addon-product links...');
    const addonProducts = await prisma.addonProduct.deleteMany({});
    console.log(`  ✓ Deleted ${addonProducts.count} addon-product links`);
  } catch (e) {
    console.log('  ⏭️  Skipped addon-product links (table may not exist)');
  }

  console.log('Deleting products...');
  const products = await prisma.product.deleteMany({});
  console.log(`  ✓ Deleted ${products.count} products`);

  console.log('\n✅ All products data cleared!');
  console.log('\nReady to import fresh product data from PDFs.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
