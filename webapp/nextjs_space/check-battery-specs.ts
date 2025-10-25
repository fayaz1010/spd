import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔋 Checking Battery Specifications\n');
  
  const batteries = await prisma.product.findMany({
    where: { productType: 'BATTERY' },
    include: { SupplierProduct: { take: 1 } },
  });
  
  console.log(`Found ${batteries.length} batteries\n`);
  
  let missingCapacity = 0;
  
  batteries.forEach(bat => {
    const specs = bat.specifications as any;
    const capacity = specs?.capacity || specs?.capacityKwh || 0;
    
    console.log(`${bat.name}:`);
    console.log(`  Capacity: ${capacity}kWh ${capacity === 0 ? '❌ MISSING' : '✅'}`);
    console.log(`  Specs:`, JSON.stringify(specs, null, 2));
    console.log('');
    
    if (capacity === 0) missingCapacity++;
  });
  
  console.log(`\n❌ Batteries missing capacity: ${missingCapacity}/${batteries.length}`);
}

main()
  .finally(() => prisma.$disconnect());
