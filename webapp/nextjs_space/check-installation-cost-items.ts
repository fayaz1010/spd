import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Installation Cost Data...\n');

  // Check installationCostItem (used by calculator)
  const costItems = await prisma.installationCostItem.count();
  console.log(`installationCostItem table: ${costItems} records`);

  // Check installationLaborType (what we seeded)
  const laborTypes = await prisma.installationLaborType.count();
  console.log(`installationLaborType table: ${laborTypes} records`);

  // Check other tables
  const complexityFactors = await prisma.installationComplexityFactor.count();
  console.log(`installationComplexityFactor table: ${complexityFactors} records`);

  const extraCosts = await prisma.extraCost.count();
  console.log(`extraCost table: ${extraCosts} records`);

  console.log('\n' + '='.repeat(70));
  
  if (costItems === 0) {
    console.log('\n❌ PROBLEM: installationCostItem table is EMPTY!');
    console.log('   The calculator uses installationCostItem table');
    console.log('   But we seeded installationLaborType table instead');
    console.log('\n   SOLUTION: Need to migrate data or seed installationCostItem');
  } else {
    console.log('\n✅ installationCostItem table has data');
  }
}

main()
  .finally(() => prisma.$disconnect());
