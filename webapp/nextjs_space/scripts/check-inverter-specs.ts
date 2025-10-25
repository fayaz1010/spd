import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const inverters = await prisma.product.findMany({
    where: { productType: 'INVERTER', isAvailable: true },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        orderBy: { unitCost: 'asc' },
        take: 1,
      },
    },
  });
  
  console.log(`\nTotal inverters in database: ${inverters.length}\n`);
  console.log(`Checking capacity specifications:\n`);
  
  const invertersWithDetails = inverters.map(inv => {
    const specs = inv.specifications as any;
    return {
      name: inv.name,
      capacity: specs?.capacity || 0,
      rawSpecs: specs,
      unitCost: inv.SupplierProduct[0]?.unitCost || 999999,
    };
  });
  
  // Group by capacity
  const byCapacity: { [key: number]: any[] } = {};
  invertersWithDetails.forEach(inv => {
    const cap = inv.capacity;
    if (!byCapacity[cap]) byCapacity[cap] = [];
    byCapacity[cap].push(inv);
  });
  
  console.log(`Inverters grouped by capacity:\n`);
  Object.keys(byCapacity)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(capacity => {
      console.log(`${capacity}kW (${byCapacity[capacity].length} inverters):`);
      byCapacity[capacity]
        .sort((a, b) => a.unitCost - b.unitCost)
        .slice(0, 3)
        .forEach(inv => {
          console.log(`  - ${inv.name} - $${inv.unitCost}`);
        });
      console.log(``);
    });
  
  console.log(`\nFor 6.9kW system (needs 6.9-8.97kW range):`);
  const suitable = invertersWithDetails.filter(inv => 
    inv.capacity >= 6.9 && inv.capacity <= 8.97
  );
  console.log(`Found ${suitable.length} suitable inverters:`);
  suitable.forEach(inv => {
    console.log(`  - ${inv.name} (${inv.capacity}kW) - $${inv.unitCost}`);
  });
  
  if (suitable.length === 0) {
    console.log(`\n⚠️ NO INVERTERS IN 6.9-8.97kW RANGE!`);
    console.log(`\nClosest options:`);
    console.log(`  5kW inverters: ${byCapacity[5]?.length || 0} available`);
    console.log(`  8kW inverters: ${byCapacity[8]?.length || 0} available`);
    console.log(`  10kW inverters: ${byCapacity[10]?.length || 0} available`);
  }
  
  // Check for missing capacity values
  console.log(`\n\nChecking for inverters with missing/zero capacity:\n`);
  const missingCapacity = invertersWithDetails.filter(inv => !inv.capacity || inv.capacity === 0);
  if (missingCapacity.length > 0) {
    console.log(`⚠️ Found ${missingCapacity.length} inverters with missing capacity:`);
    missingCapacity.forEach(inv => {
      console.log(`  - ${inv.name}`);
      console.log(`    Raw specs:`, JSON.stringify(inv.rawSpecs, null, 2));
    });
  } else {
    console.log(`✅ All inverters have capacity specified`);
  }
  
  await prisma.$disconnect();
}

main();
