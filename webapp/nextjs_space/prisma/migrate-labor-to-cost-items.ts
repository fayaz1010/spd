import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating Installation Labor Types to Cost Items...\n');

  const laborTypes = await prisma.installationLaborType.findMany({
    where: { isActive: true },
  });

  console.log(`Found ${laborTypes.length} labor types to migrate\n`);

  let created = 0;
  let skipped = 0;

  for (const labor of laborTypes) {
    try {
      // Check if already exists
      const existing = await prisma.installationCostItem.findUnique({
        where: { code: labor.code },
      });

      if (existing) {
        console.log(`  ⏭️  Skipped: ${labor.name} (already exists)`);
        skipped++;
        continue;
      }

      // Determine calculation type
      let calculationType = 'FIXED';
      if (labor.perUnitRate && labor.perUnitRate > 0) {
        if (labor.code.includes('PANEL') || labor.code.includes('PER_PANEL')) {
          calculationType = 'PER_PANEL';
        } else if (labor.code.includes('WATT') || labor.code.includes('PER_WATT')) {
          calculationType = 'PER_WATT';
        } else if (labor.code.includes('KWH') || labor.code.includes('BATTERY_PER')) {
          calculationType = 'PER_KWH';
        } else if (labor.code.includes('KW')) {
          calculationType = 'PER_KW';
        } else {
          calculationType = 'PER_UNIT';
        }
      }

      // Create cost item
      await prisma.installationCostItem.create({
        data: {
          id: `ic_${labor.id}`,
          name: labor.name,
          code: labor.code,
          description: labor.description || '',
          category: labor.category || 'LABOR',
          calculationType,
          baseRate: labor.perUnitRate || labor.baseRate || 0,
          multiplier: 1,
          minQuantity: 0,
          maxQuantity: null,
          estimatedHours: labor.estimatedHours,
          skillLevel: labor.skillLevel,
          teamSize: labor.teamSize,
          providerType: 'SUBCONTRACTOR', // Default to subcontractor
          isActive: true,
          isOptional: false,
          defaultIncluded: true,
          priority: 100,
          sortOrder: labor.sortOrder || 100,
          notes: labor.notes,
        },
      });

      console.log(`  ✅ ${labor.name}`);
      created++;
    } catch (error: any) {
      console.log(`  ❌ Error: ${labor.name} - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Migration Complete!');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${laborTypes.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
