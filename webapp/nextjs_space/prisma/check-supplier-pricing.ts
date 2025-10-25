// prisma/check-supplier-pricing.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPricing() {
  console.log('\n🔍 Checking SupplierProduct Pricing...\n');

  // Check a few sample products
  const sampleProducts = await prisma.supplierProduct.findMany({
    take: 10,
    include: {
      product: {
        select: {
          name: true,
          productType: true,
          tier: true,
        },
      },
      supplier: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log('📦 Sample SupplierProducts:\n');
  sampleProducts.forEach((sp) => {
    console.log(`${sp.product.name}`);
    console.log(`   Supplier: ${sp.supplier.name}`);
    console.log(`   Unit Cost: $${sp.unitCost}`);
    console.log(`   Retail Price: $${sp.retailPrice || 'NULL'}`);
    console.log(`   Markup: ${sp.markupPercent}%`);
    console.log(`   Active: ${sp.isActive}`);
    console.log('');
  });

  // Check if any have null retail prices
  const nullRetailPrices = await prisma.supplierProduct.count({
    where: {
      retailPrice: null,
    },
  });

  const zeroRetailPrices = await prisma.supplierProduct.count({
    where: {
      retailPrice: 0,
    },
  });

  const total = await prisma.supplierProduct.count();

  console.log('═'.repeat(80));
  console.log('📊 Pricing Summary:');
  console.log('═'.repeat(80));
  console.log(`Total SupplierProducts: ${total}`);
  console.log(`With NULL retail price: ${nullRetailPrices}`);
  console.log(`With ZERO retail price: ${zeroRetailPrices}`);
  console.log(`With valid retail price: ${total - nullRetailPrices - zeroRetailPrices}`);
  console.log('');

  if (nullRetailPrices > 0 || zeroRetailPrices > 0) {
    console.log('⚠️  WARNING: Some products have missing or zero retail prices!');
    console.log('   This will cause $0 pricing in the calculator.');
    console.log('   Run: npx tsx prisma/fix-retail-prices.ts');
  } else {
    console.log('✅ All products have valid retail prices!');
  }
}

checkPricing()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
