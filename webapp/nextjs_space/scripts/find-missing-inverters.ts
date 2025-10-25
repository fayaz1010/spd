import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\nSearching for 6-7kW inverters (including inactive):\n');
  
  // Check ALL inverters (including inactive)
  const allInverters = await prisma.product.findMany({
    where: { productType: 'INVERTER' },
    include: {
      SupplierProduct: {
        orderBy: { unitCost: 'asc' },
        take: 1,
      },
    },
  });
  
  const invertersWithCapacity = allInverters.map(inv => ({
    name: inv.name,
    capacity: (inv.specifications as any)?.capacity || 0,
    isAvailable: inv.isAvailable,
    unitCost: inv.SupplierProduct[0]?.unitCost || 999999,
    hasSupplier: inv.SupplierProduct.length > 0,
  }));
  
  // Find 6-7kW range
  const sixToSevenKw = invertersWithCapacity.filter(inv => 
    inv.capacity >= 6 && inv.capacity <= 7
  );
  
  console.log(`Found ${sixToSevenKw.length} inverters in 6-7kW range:\n`);
  
  if (sixToSevenKw.length > 0) {
    sixToSevenKw.forEach(inv => {
      console.log(`${inv.name} (${inv.capacity}kW)`);
      console.log(`  Available: ${inv.isAvailable ? '✅' : '❌'}`);
      console.log(`  Has Supplier: ${inv.hasSupplier ? '✅' : '❌'}`);
      console.log(`  Cost: $${inv.unitCost}`);
      console.log(``);
    });
  } else {
    console.log(`❌ NO 6-7kW INVERTERS FOUND IN DATABASE!`);
    console.log(`\nYou need to add inverters in these sizes:`);
    console.log(`  - 6kW inverters`);
    console.log(`  - 6.6kW inverters`);
    console.log(`  - 7kW inverters`);
  }
  
  // Show what we have
  console.log(`\n\nCurrent inverter distribution:`);
  const distribution: { [key: number]: number } = {};
  invertersWithCapacity.forEach(inv => {
    if (!distribution[inv.capacity]) distribution[inv.capacity] = 0;
    distribution[inv.capacity]++;
  });
  
  Object.keys(distribution)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(cap => {
      console.log(`  ${cap}kW: ${distribution[cap]} inverters`);
    });
  
  console.log(`\n\n💡 RECOMMENDATION:`);
  console.log(`Add 6kW, 6.6kW, and 7kW inverters to fill the gap between 5kW and 8kW.`);
  console.log(`This will give customers cheaper options for 6-7kW systems.`);
  
  await prisma.$disconnect();
}

main();
