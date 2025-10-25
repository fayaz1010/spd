import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteOldTemplate() {
  console.log('\n🗑️  Deleting old template...\n');

  const templateId = 'pkg_1760514934519';

  try {
    const template = await (prisma as any).systemPackageTemplate.findUnique({
      where: { id: templateId },
    });

    if (template) {
      console.log(`Found template: ${template.displayName}`);
      console.log(`  Tier: ${template.tier} (incorrect - should be lowercase)`);
      console.log(`  Badge: ${template.badge}`);
      
      await (prisma as any).systemPackageTemplate.delete({
        where: { id: templateId },
      });

      console.log(`\n✅ Deleted template: ${templateId}`);
    } else {
      console.log(`❌ Template not found: ${templateId}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✅ Cleanup complete!\n');
  console.log('Now you should only have 3 templates:');
  console.log('  1. Smart Starter (budget)');
  console.log('  2. Complete Coverage (mid)');
  console.log('  3. Energy Independent (premium)');
  console.log('');
}

deleteOldTemplate()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
