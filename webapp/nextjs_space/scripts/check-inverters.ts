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
  
  console.log('\nAvailable Inverters (sorted by cost):\n');
  
  const invertersWithCost = inverters.map(inv => ({
    name: inv.name,
    capacity: (inv.specifications as any)?.capacity || 0,
    unitCost: inv.SupplierProduct[0]?.unitCost || 999999,
  }));
  
  invertersWithCost.sort((a, b) => a.unitCost - b.unitCost);
  
  invertersWithCost.forEach(inv => {
    console.log(`${inv.name}`);
    console.log(`  Capacity: ${inv.capacity}kW`);
    console.log(`  Cost: $${inv.unitCost}`);
    console.log(``);
  });
  
  console.log(`\nFor 6.9kW system, suitable inverters (7-9kW):`);
  invertersWithCost
    .filter(inv => inv.capacity >= 6.9 && inv.capacity <= 9)
    .forEach(inv => {
      console.log(`  ${inv.name} - ${inv.capacity}kW - $${inv.unitCost}`);
    });
  
  await prisma.$disconnect();
}

main();
