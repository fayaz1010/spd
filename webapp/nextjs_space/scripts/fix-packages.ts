import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix broken packages by populating them with realistic data
 * This script will:
 * 1. Find packages with empty features
 * 2. Populate them with realistic pricing based on their tier
 * 3. Link them to actual products from the database
 */
async function main() {
  console.log('🔧 Fixing Package Templates...\n');

  // Get some real products to use
  const panels = await prisma.product.findMany({
    where: { productType: 'PANEL', isAvailable: true },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        take: 1,
      },
    },
    take: 3,
  });

  const inverters = await prisma.product.findMany({
    where: { productType: 'INVERTER', isAvailable: true },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        take: 1,
      },
    },
    take: 3,
  });

  const batteries = await prisma.product.findMany({
    where: { productType: 'BATTERY', isAvailable: true },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        take: 1,
      },
    },
    take: 2,
  });

  if (panels.length === 0 || inverters.length === 0) {
    console.error('❌ No products found in database. Please seed products first.');
    return;
  }

  console.log(`✓ Found ${panels.length} panels, ${inverters.length} inverters, ${batteries.length} batteries\n`);

  const packages = await prisma.systemPackageTemplate.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

  let fixed = 0;

  for (const pkg of packages) {
    const features = pkg.features as any;
    
    // Check if package needs fixing
    if (features && features.finalPrice > 0) {
      console.log(`✓ ${pkg.displayName} - Already has data, skipping`);
      continue;
    }

    console.log(`\n🔧 Fixing: ${pkg.displayName}`);

    // Determine system specs based on tier
    let systemSizeKw, panelCount, batterySizeKwh, panelProduct, inverterProduct, batteryProduct;
    
    if (pkg.tier === 'budget' || pkg.name === 'Budget') {
      systemSizeKw = 6.6;
      panelCount = 16;
      batterySizeKwh = 0;
      panelProduct = panels[0];
      inverterProduct = inverters[0];
      batteryProduct = null;
    } else if (pkg.tier === 'mid' || pkg.name === 'Recommended') {
      systemSizeKw = 10;
      panelCount = 24;
      batterySizeKwh = 13.5;
      panelProduct = panels[Math.min(1, panels.length - 1)];
      inverterProduct = inverters[Math.min(1, inverters.length - 1)];
      batteryProduct = batteries[0] || null;
    } else {
      systemSizeKw = 13.2;
      panelCount = 32;
      batterySizeKwh = 20;
      panelProduct = panels[Math.min(2, panels.length - 1)];
      inverterProduct = inverters[Math.min(2, inverters.length - 1)];
      batteryProduct = batteries[Math.min(1, batteries.length - 1)] || batteries[0] || null;
    }

    // Calculate costs
    const panelCost = (panelProduct.SupplierProduct[0]?.retailPrice || 300) * panelCount;
    const inverterCost = inverterProduct.SupplierProduct[0]?.retailPrice || 2000;
    const batteryCost = batteryProduct ? (batteryProduct.SupplierProduct[0]?.retailPrice || 8000) : 0;
    
    // Installation cost (simplified)
    const installationCost = systemSizeKw * 400 + (batterySizeKwh > 0 ? 2000 : 0);
    
    const subtotal = panelCost + inverterCost + batteryCost + installationCost;
    
    // Rebates
    const stcRebate = Math.round(systemSizeKw * 550);
    const federalBatteryRebate = batterySizeKwh > 0 ? Math.round(batterySizeKwh * 200) : 0;
    const stateBatteryRebate = batterySizeKwh >= 13.5 ? 3000 : 0;
    const totalRebates = stcRebate + federalBatteryRebate + stateBatteryRebate;
    
    const finalPrice = subtotal - totalRebates;
    const costPerDay = parseFloat((finalPrice / 365 / 10).toFixed(2));
    
    // Savings
    const annualSavings = Math.round(systemSizeKw * 1200 * 0.30);
    const year25Savings = annualSavings * 25;
    const paybackYears = parseFloat((finalPrice / annualSavings).toFixed(1));

    // Build features object
    const newFeatures = {
      systemSizeKw,
      panelCount,
      batterySizeKwh,
      
      panelProduct: {
        id: panelProduct.id,
        name: panelProduct.name,
        manufacturer: panelProduct.manufacturer,
        wattage: (panelProduct.specifications as any)?.wattage || 410,
        tier: panelProduct.tier,
      },
      inverterProduct: {
        id: inverterProduct.id,
        name: inverterProduct.name,
        manufacturer: inverterProduct.manufacturer,
        unitsNeeded: 1,
      },
      batteryProduct: batteryProduct ? {
        id: batteryProduct.id,
        name: batteryProduct.name,
        manufacturer: batteryProduct.manufacturer,
        capacity: (batteryProduct.specifications as any)?.capacity || batterySizeKwh,
        unitsNeeded: 1,
      } : null,
      
      panelCost,
      inverterCost,
      batteryCost,
      installationCost,
      subtotal,
      totalRebates,
      finalPrice,
      costPerDay,
      
      stcRebate,
      federalBatteryRebate,
      stateBatteryRebate,
      
      annualSavings,
      year25Savings,
      paybackYears,
      
      suitability: pkg.tier === 'budget' ? 'Small households' : 
                   pkg.tier === 'mid' ? 'Medium households' : 
                   'Large households',
      dailyUsage: pkg.tier === 'budget' ? '15-25kWh' : 
                  pkg.tier === 'mid' ? '25-40kWh' : 
                  '40-60kWh',
      
      featureList: [
        '25-year panel warranty',
        'CEC certified installer',
        `Tier ${panelProduct.tier || '1'} panels`,
        'Professional installation',
        'Monitoring included',
        'Full rebate assistance',
      ],
    };

    // Update package
    await prisma.systemPackageTemplate.update({
      where: { id: pkg.id },
      data: {
        solarFixedKw: systemSizeKw,
        batteryFixedKwh: batterySizeKwh > 0 ? batterySizeKwh : null,
        features: newFeatures,
        updatedAt: new Date(),
      },
    });

    console.log(`   ✓ Updated with ${systemSizeKw}kW system`);
    console.log(`   ✓ Final Price: $${finalPrice.toLocaleString()}`);
    console.log(`   ✓ Rebates: $${totalRebates.toLocaleString()}`);
    
    fixed++;
  }

  console.log(`\n✅ Fixed ${fixed} packages!`);
  
  // Verify
  console.log('\n📊 Verification:');
  const verifyPackages = await prisma.systemPackageTemplate.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

  for (const pkg of verifyPackages) {
    const features = pkg.features as any;
    console.log(`\n${pkg.displayName}:`);
    console.log(`  System: ${features?.systemSizeKw || 0}kW`);
    console.log(`  Price: $${features?.finalPrice || 0}`);
    console.log(`  Rebates: $${features?.totalRebates || 0}`);
    console.log(`  Savings: $${features?.annualSavings || 0}/year`);
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
