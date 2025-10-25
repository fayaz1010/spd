/**
 * APPLY ZERO MARKUP STRATEGY
 * 
 * This script applies the zero markup + final commission strategy:
 * 1. Sets all supplier product retail prices to unit cost (removes markup)
 * 2. Marks optional installation items as truly optional
 * 3. Creates/updates quote settings with 15% commission
 * 
 * Run with: npx tsx scripts/apply-zero-markup-strategy.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`█  APPLYING ZERO MARKUP STRATEGY`);
  console.log(`${'█'.repeat(80)}\n`);
  
  // ============================================================================
  // STEP 1: Remove Product Markups
  // ============================================================================
  console.log(`STEP 1: Removing product markups (set retailPrice = unitCost)...\n`);
  
  const supplierProducts = await prisma.supplierProduct.findMany({
    where: { isActive: true },
    include: { product: true },
  });
  
  let updatedCount = 0;
  let totalMarkupRemoved = 0;
  
  for (const sp of supplierProducts) {
    if (sp.retailPrice && sp.retailPrice > sp.unitCost) {
      const markupRemoved = sp.retailPrice - sp.unitCost;
      totalMarkupRemoved += markupRemoved;
      
      await prisma.supplierProduct.update({
        where: { id: sp.id },
        data: {
          retailPrice: sp.unitCost,
          markupPercent: 0,
        },
      });
      
      updatedCount++;
      console.log(`  ✅ ${sp.product.name}: $${sp.retailPrice.toFixed(2)} → $${sp.unitCost.toFixed(2)} (saved $${markupRemoved.toFixed(2)})`);
    }
  }
  
  console.log(`\n✅ Updated ${updatedCount} products`);
  console.log(`💰 Total markup removed: $${totalMarkupRemoved.toFixed(2)}\n`);
  
  // ============================================================================
  // STEP 2: Mark Optional Installation Items
  // ============================================================================
  console.log(`\nSTEP 2: Marking optional installation items...\n`);
  
  const optionalItems = [
    'TILT_KIT',
    'SMART_METER_1P',
    'SMART_METER_3P',
    'BATTERY_EXPANSION',
    'BACKUP_CIRCUITS',
    'SITE_INSPECTION_SOLAR',
    'SITE_INSPECTION_BATTERY',
    'SYSTEM_REMOVAL',
    'REVISIT_CHARGE',
    'CANCELLATION_FEE',
    'TRIPLE_STOREY',  // Should be conditional
    'RAKED_CEILINGS',  // Should be conditional
  ];
  
  const updated = await prisma.installationCostItem.updateMany({
    where: {
      code: { in: optionalItems },
    },
    data: {
      isOptional: true,
      defaultIncluded: false,
    },
  });
  
  console.log(`✅ Marked ${updated.count} items as optional\n`);
  
  optionalItems.forEach(code => {
    console.log(`  • ${code}`);
  });
  
  // ============================================================================
  // STEP 3: Create/Update Quote Settings
  // ============================================================================
  console.log(`\n\nSTEP 3: Creating/updating quote settings...\n`);
  
  const existingSettings = await prisma.quoteSettings.findFirst();
  
  if (existingSettings) {
    await prisma.quoteSettings.update({
      where: { id: existingSettings.id },
      data: {
        region: 'WA',
        commissionType: 'PERCENTAGE',
        commissionPercent: 15.0,
        commissionFixed: 0,
        minimumProfit: 1000,
        applyCommissionAfterRebates: true,
        defaultPriceMultiplier: 1.0,
      },
    });
    console.log(`✅ Updated existing quote settings (ID: ${existingSettings.id})`);
  } else {
    const newSettings = await prisma.quoteSettings.create({
      data: {
        region: 'WA',
        depositType: 'percentage',
        depositPercentage: 30,
        depositFixedAmount: 5000,
        quoteValidityDays: 30,
        defaultPriceMultiplier: 1.0,
        gstRate: 10,
        showPackageComparison: true,
        allowCustomPackages: false,
        commissionType: 'PERCENTAGE',
        commissionPercent: 15.0,
        commissionFixed: 0,
        minimumProfit: 1000,
        applyCommissionAfterRebates: true,
      },
    });
    console.log(`✅ Created new quote settings (ID: ${newSettings.id})`);
  }
  
  console.log(`\nQuote Settings:`);
  console.log(`  Region: WA`);
  console.log(`  Commission Type: PERCENTAGE`);
  console.log(`  Commission Rate: 15%`);
  console.log(`  Minimum Profit: $1,000`);
  console.log(`  Apply After Rebates: Yes`);
  
  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log(`\n\n${'█'.repeat(80)}`);
  console.log(`█  ZERO MARKUP STRATEGY APPLIED SUCCESSFULLY`);
  console.log(`${'█'.repeat(80)}\n`);
  
  console.log(`✅ Product markups removed: ${updatedCount} products`);
  console.log(`✅ Optional items marked: ${updated.count} items`);
  console.log(`✅ Quote settings configured: 15% commission`);
  console.log(`\n💰 Total savings per quote: ~$${totalMarkupRemoved.toFixed(0)}`);
  console.log(`\n🎯 Next Steps:`);
  console.log(`   1. Restart your dev server to load new Prisma types`);
  console.log(`   2. Test calculators to verify pricing`);
  console.log(`   3. Delete old seeded packages`);
  console.log(`   4. Create new packages from Quote Tester`);
  console.log(`\n✅ READY FOR PRODUCTION!\n`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
