import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔋 Checking Battery Products...\n');

  const batteries = await prisma.product.findMany({
    where: { productType: 'BATTERY', isAvailable: true },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        take: 1,
      },
    },
    orderBy: [
      { tier: 'asc' },
      { sortOrder: 'asc' },
    ],
  });

  console.log(`Total batteries found: ${batteries.length}\n`);

  const grouped = batteries.reduce((acc: any, battery) => {
    const specs = battery.specifications as any;
    const tier = battery.tier || 'unknown';
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push({
      name: battery.name,
      capacity: specs.capacity || specs.capacityKwh || 0,
      hasSupplier: battery.SupplierProduct.length > 0,
      isRecommended: battery.isRecommended,
    });
    return acc;
  }, {});

  for (const [tier, bats] of Object.entries(grouped)) {
    console.log(`\n📊 ${tier.toUpperCase()} Tier:`);
    (bats as any[]).forEach((bat: any) => {
      const supplier = bat.hasSupplier ? '✅' : '❌';
      const recommended = bat.isRecommended ? '⭐' : '  ';
      console.log(`   ${supplier} ${recommended} ${bat.name} - ${bat.capacity}kWh`);
    });
  }

  // Check specific capacities
  console.log('\n\n🎯 Target Batteries:');
  const targets = [
    { capacity: 9.6, tier: 'budget', name: 'Budget Saver' },
    { capacity: 13.8, tier: 'mid', name: 'Balanced Solution' },
    { capacity: 27.6, tier: 'premium', name: 'Zero Bill Hero' },
  ];

  for (const target of targets) {
    const match = batteries.find((b: any) => {
      const specs = b.specifications as any;
      const capacity = specs.capacity || specs.capacityKwh || 0;
      return Math.abs(capacity - target.capacity) < 0.5;
    });

    if (match) {
      const specs = match.specifications as any;
      const capacity = specs.capacity || specs.capacityKwh || 0;
      console.log(`\n✅ ${target.name} (${target.capacity}kWh):`);
      console.log(`   Found: ${match.name}`);
      console.log(`   Capacity: ${capacity}kWh`);
      console.log(`   Tier: ${match.tier}`);
      console.log(`   Has Supplier: ${match.SupplierProduct.length > 0 ? 'Yes' : 'No'}`);
    } else {
      console.log(`\n❌ ${target.name} (${target.capacity}kWh): NOT FOUND`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
