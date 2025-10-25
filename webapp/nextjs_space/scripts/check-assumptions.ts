import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAssumptions() {
  console.log('=== CONSUMPTION ASSUMPTIONS IN DATABASE ===\n');
  
  const assumptions = await prisma.consumptionAssumption.findMany({
    orderBy: { assumptionType: 'asc' }
  });
  
  // Group by type
  const grouped: Record<string, any[]> = {};
  assumptions.forEach(a => {
    const type = a.assumptionType || 'unknown';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(a);
  });
  
  // Display each type
  for (const [type, items] of Object.entries(grouped)) {
    console.log(`\n### ${type.toUpperCase()} ###`);
    items.forEach(item => {
      console.log(JSON.stringify({
        id: item.id,
        householdSize: item.householdSize,
        baselineKwhPerDay: item.baselineKwhPerDay,
        evTier: item.evTier,
        evKwhPerDay: item.evKwhPerDay,
        poolType: item.poolType,
        poolKwhPerDay: item.poolKwhPerDay,
        acTier: item.acTier,
        acAdjustmentKwhPerDay: item.acAdjustmentKwhPerDay,
        hotWaterKwhPerDay: item.hotWaterKwhPerDay,
        homeOfficeKwhPerDay: item.homeOfficeKwhPerDay,
        cookingKwhPerDay: item.cookingKwhPerDay,
      }, null, 2));
    });
  }
  
  await prisma.$disconnect();
}

checkAssumptions().catch(console.error);
