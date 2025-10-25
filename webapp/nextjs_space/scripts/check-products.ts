import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('Checking Product table for ADDON type...\n');
    
    const addonProducts = await prisma.product.findMany({
      where: { productType: 'ADDON' },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    console.log(`Found ${addonProducts.length} products with ADDON type:\n`);
    addonProducts.forEach((product, index) => {
      const supplier = product.SupplierProduct[0];
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Retail Price: $${supplier?.retailPrice || 0}`);
      console.log(`   Available: ${product.isAvailable}`);
      console.log('');
    });

    console.log('\nChecking AddonPricing table...\n');
    
    const addonPricing = await prisma.addonPricing.findMany();
    console.log(`Found ${addonPricing.length} records in AddonPricing table:\n`);
    addonPricing.forEach((addon, index) => {
      console.log(`${index + 1}. ${addon.name}`);
      console.log(`   ID: ${addon.addonId}`);
      console.log(`   Cost: $${addon.cost}`);
      console.log('');
    });

    console.log('\n=== RECOMMENDATION ===');
    if (addonProducts.length > 0) {
      console.log('✅ You have addon products in the Product table.');
      console.log('✅ The AddonPricing table appears to be legacy/redundant.');
      console.log('✅ We should use Product table with productType: ADDON');
    } else if (addonPricing.length > 0) {
      console.log('⚠️  No ADDON products found in Product table.');
      console.log('⚠️  All addons are in the legacy AddonPricing table.');
      console.log('💡 We should migrate AddonPricing data to Product table.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
