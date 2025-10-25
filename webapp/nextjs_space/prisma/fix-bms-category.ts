import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing BMS Product Category...\n');

  // Find BMS product
  const bms = await prisma.product.findFirst({
    where: { 
      name: { contains: 'BMS' },
      productType: 'BATTERY'
    },
  });

  if (bms) {
    console.log(`Found: ${bms.name}`);
    console.log(`Current Type: ${bms.productType}`);
    
    // Update to OTHER (accessory category)
    await prisma.product.update({
      where: { id: bms.id },
      data: { productType: 'OTHER' },
    });
    
    console.log(`✅ Updated to: OTHER (Accessory)\n`);
  } else {
    console.log('⚠️  BMS product not found\n');
  }

  // Check for any other non-battery items in BATTERY category
  const batteries = await prisma.product.findMany({
    where: { productType: 'BATTERY' },
  });

  console.log('Checking all BATTERY products:');
  for (const bat of batteries) {
    const specs = bat.specifications as any;
    const capacity = specs?.capacity || specs?.capacityKwh || 0;
    
    if (capacity === 0) {
      console.log(`  ⚠️  ${bat.name}: 0kWh - May need recategorization`);
    } else {
      console.log(`  ✅ ${bat.name}: ${capacity}kWh`);
    }
  }

  console.log('\n✅ BMS Category Fixed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
