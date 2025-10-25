import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking SystemPackageTemplate values...\n');

  const templates = await prisma.systemPackageTemplate.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  for (const template of templates) {
    console.log(`📦 ${template.displayName} (${template.tier})`);
    console.log(`   Battery Strategy: ${template.batterySizingStrategy}`);
    console.log(`   Battery Fixed kWh: ${template.batteryFixedKwh}`);
    console.log(`   Battery Coverage Hours: ${template.batteryCoverageHours}`);
    console.log(`   Solar Strategy: ${template.solarSizingStrategy}`);
    console.log(`   Solar Coverage %: ${template.solarCoveragePercent}`);
    console.log(`   Active: ${template.active}`);
    console.log('');
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
