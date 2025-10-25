import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplates() {
  console.log('\n🔍 Checking SystemPackageTemplate records...\n');

  const templates = await (prisma as any).systemPackageTemplate.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  console.log(`Found ${templates.length} templates:\n`);

  templates.forEach((template: any) => {
    console.log(`ID: ${template.id}`);
    console.log(`  Name: ${template.name}`);
    console.log(`  Display Name: ${template.displayName}`);
    console.log(`  Tier: ${template.tier}`);
    console.log(`  Active: ${template.active}`);
    console.log(`  Badge: ${template.badge}`);
    console.log(`  Sort Order: ${template.sortOrder}`);
    console.log(`  Solar Coverage: ${template.solarCoveragePercent}%`);
    console.log(`  Battery Strategy: ${template.batterySizingStrategy}`);
    console.log(`  Price Multiplier: ${template.priceMultiplier}x`);
    console.log('');
  });

  // Check for duplicates or old templates with UPPERCASE tiers
  const oldTemplates = templates.filter((t: any) => 
    t.tier === 'RECOMMENDED' || 
    t.tier === 'BUDGET' || 
    t.tier === 'PREMIUM'
  );

  if (oldTemplates.length > 0) {
    console.log('⚠️  Found old templates with incorrect tier names (UPPERCASE):');
    oldTemplates.forEach((t: any) => {
      console.log(`  - ${t.id}: ${t.name} (tier: ${t.tier})`);
    });
    console.log('\n❌ These should be deleted or updated to use lowercase tiers.\n');
  } else {
    console.log('✅ All templates have correct lowercase tier names!\n');
  }

  await prisma.$disconnect();
}

checkTemplates()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
