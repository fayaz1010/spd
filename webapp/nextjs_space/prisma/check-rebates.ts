// prisma/check-rebates.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRebates() {
  console.log('\n🔍 Checking Rebate Configurations...\n');

  const rebates = await prisma.rebateConfig.findMany({
    where: { active: true },
  });

  console.log(`Found ${rebates.length} active rebates:\n`);

  rebates.forEach((rebate) => {
    console.log(`${rebate.name} (${rebate.type})`);
    console.log(`   Variables: ${JSON.stringify(rebate.variables, null, 2)}`);
    console.log(`   Formula: ${rebate.formula}`);
    console.log('');
  });
}

checkRebates()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
