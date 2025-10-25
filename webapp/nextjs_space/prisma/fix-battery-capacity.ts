import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔋 Fixing Battery Capacity Data...\n');

  const batteries = await prisma.product.findMany({
    where: { productType: 'BATTERY' },
  });

  console.log(`Found ${batteries.length} batteries\n`);

  let fixed = 0;
  let skipped = 0;

  for (const battery of batteries) {
    const specs = battery.specifications as any;
    let capacity = specs?.capacity || specs?.capacityKwh || 0;

    // If capacity is missing, try to extract from name or description
    if (capacity === 0) {
      // Try to find kWh in name: "10kWh", "10 kWh", "10.5kWh", etc.
      const nameMatch = battery.name.match(/(\d+\.?\d*)\s*kWh/i);
      const descMatch = battery.description?.match(/(\d+\.?\d*)\s*kWh/i);
      
      if (nameMatch) {
        capacity = parseFloat(nameMatch[1]);
        console.log(`✅ ${battery.name}: Extracted ${capacity}kWh from name`);
      } else if (descMatch) {
        capacity = parseFloat(descMatch[1]);
        console.log(`✅ ${battery.name}: Extracted ${capacity}kWh from description`);
      } else {
        console.log(`⚠️  ${battery.name}: Could not extract capacity`);
        skipped++;
        continue;
      }

      // Update the product with capacity
      await prisma.product.update({
        where: { id: battery.id },
        data: {
          specifications: {
            ...specs,
            capacity,
            capacityKwh: capacity,
          },
        },
      });

      fixed++;
    } else {
      console.log(`⏭️  ${battery.name}: Already has capacity ${capacity}kWh`);
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Battery Capacity Fix Complete!');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${batteries.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
