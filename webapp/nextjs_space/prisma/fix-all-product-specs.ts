import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing All Product Specifications...\n');

  // Fix Panels - extract wattage
  console.log('📦 PANELS:');
  const panels = await prisma.product.findMany({
    where: { productType: 'PANEL' },
  });

  let panelsFixed = 0;
  for (const panel of panels) {
    const specs = panel.specifications as any;
    let wattage = specs?.wattage || 0;

    if (wattage === 0) {
      const match = panel.name.match(/(\d+)\s*W/i);
      if (match) {
        wattage = parseInt(match[1]);
        await prisma.product.update({
          where: { id: panel.id },
          data: {
            specifications: {
              ...specs,
              wattage,
            },
          },
        });
        console.log(`  ✅ ${panel.name}: ${wattage}W`);
        panelsFixed++;
      }
    }
  }
  console.log(`  Fixed ${panelsFixed}/${panels.length} panels\n`);

  // Fix Inverters - extract capacity
  console.log('⚡ INVERTERS:');
  const inverters = await prisma.product.findMany({
    where: { productType: 'INVERTER' },
  });

  let invertersFixed = 0;
  for (const inverter of inverters) {
    const specs = inverter.specifications as any;
    let capacity = specs?.capacity || 0;

    if (capacity === 0) {
      // Try to find kW in name: "5kW", "5.0kW", "10 kW", etc.
      const match = inverter.name.match(/(\d+\.?\d*)\s*kW/i);
      if (match) {
        capacity = parseFloat(match[1]);
        await prisma.product.update({
          where: { id: inverter.id },
          data: {
            specifications: {
              ...specs,
              capacity,
            },
          },
        });
        console.log(`  ✅ ${inverter.name}: ${capacity}kW`);
        invertersFixed++;
      }
    }
  }
  console.log(`  Fixed ${invertersFixed}/${inverters.length} inverters\n`);

  console.log('='.repeat(70));
  console.log('✅ All Product Specifications Fixed!');
  console.log('='.repeat(70));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
