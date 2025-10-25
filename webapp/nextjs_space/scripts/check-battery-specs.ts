import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Battery Specifications Field...\n');

  const batteries = await prisma.product.findMany({
    where: { productType: 'BATTERY', isAvailable: true },
    take: 5,
  });

  for (const battery of batteries) {
    console.log(`\n📦 ${battery.name}`);
    console.log(`   Tier: ${battery.tier}`);
    console.log(`   Specifications:`, JSON.stringify(battery.specifications, null, 2));
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
