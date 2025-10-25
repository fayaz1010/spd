import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

// Markup percentages by product type
const MARKUP_BY_TYPE: Record<string, number> = {
  PANEL: 50,              // 50% markup on panels
  INVERTER: 40,           // 40% markup on inverters  
  BATTERY: 35,            // 35% markup on batteries
  MOUNTING_HARDWARE: 60,  // 60% markup on mounting
  CABLE_DC: 60,           // 60% markup on cables
  CABLE_AC: 60,
  EV_CHARGER: 30,         // 30% markup on EV chargers
  MONITORING_SYSTEM: 40,
  ISOLATOR: 50,
  SURGE_PROTECTION: 50,
  OTHER: 50,              // 50% default markup
};

async function main() {
  console.log('💰 Adding Retail Prices to Products...\n');

  const supplierProducts = await prisma.supplierProduct.findMany({
    include: {
      product: true,
    },
  });

  console.log(`Found ${supplierProducts.length} supplier products\n`);

  let updated = 0;
  let skipped = 0;

  for (const sp of supplierProducts) {
    try {
      if (!sp.product) {
        skipped++;
        continue;
      }

      // Get markup percentage for this product type
      const markupPercent = MARKUP_BY_TYPE[sp.product.productType] || 50;
      
      // Calculate retail price: cost + markup
      const retailPrice = sp.unitCost * (1 + markupPercent / 100);
      
      // Update supplier product with retail price and markup
      await prisma.supplierProduct.update({
        where: { id: sp.id },
        data: {
          retailPrice: Math.round(retailPrice * 100) / 100, // Round to 2 decimals
          markupPercent,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ ${sp.product.name}: $${sp.unitCost} → $${retailPrice.toFixed(2)} (+${markupPercent}%)`);
      updated++;
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Retail Prices Added!');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);

  // Show sample pricing
  console.log('\n💰 Sample Retail Prices:');
  
  const samples = await prisma.supplierProduct.findMany({
    take: 10,
    include: {
      product: true,
      supplier: true,
    },
    where: {
      retailPrice: { not: null },
    },
  });

  for (const sample of samples) {
    if (sample.product) {
      console.log(`\n   ${sample.product.name}:`);
      console.log(`     Supplier: ${sample.supplier.name}`);
      console.log(`     Cost: $${sample.unitCost}`);
      console.log(`     Retail: $${sample.retailPrice}`);
      console.log(`     Markup: ${sample.markupPercent}%`);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
