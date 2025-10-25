import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Package Templates...\n');

  const packages = await prisma.systemPackageTemplate.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

  console.log(`Found ${packages.length} active packages\n`);

  for (const pkg of packages) {
    console.log(`\n📦 Package: ${pkg.displayName}`);
    console.log(`   ID: ${pkg.id}`);
    console.log(`   Name: ${pkg.name}`);
    console.log(`   Tier: ${pkg.tier}`);
    console.log(`   Solar: ${pkg.solarFixedKw}kW`);
    console.log(`   Battery: ${pkg.batteryFixedKwh || 0}kWh`);
    
    const features = pkg.features as any;
    
    if (!features) {
      console.log(`   ❌ Features field is NULL or empty!`);
      continue;
    }
    
    console.log(`\n   💰 Pricing:`);
    console.log(`      Subtotal: $${features.subtotal || 0}`);
    console.log(`      Rebates: $${features.totalRebates || 0}`);
    console.log(`      Final Price: $${features.finalPrice || 0}`);
    console.log(`      Cost/Day: $${features.costPerDay || 0}`);
    
    console.log(`\n   📊 Savings:`);
    console.log(`      Annual: $${features.annualSavings || 0}`);
    console.log(`      25-Year: $${features.year25Savings || 0}`);
    console.log(`      Payback: ${features.paybackYears || 0} years`);
    
    console.log(`\n   🔧 Products:`);
    console.log(`      Panel: ${features.panelProduct?.name || 'N/A'}`);
    console.log(`      Inverter: ${features.inverterProduct?.name || 'N/A'}`);
    console.log(`      Battery: ${features.batteryProduct?.name || 'N/A'}`);
    
    // Check if all critical fields are zero
    if (features.finalPrice === 0 || features.subtotal === 0) {
      console.log(`\n   ⚠️  WARNING: Package has $0 pricing!`);
    }
  }
  
  console.log(`\n\n✅ Check complete!`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
