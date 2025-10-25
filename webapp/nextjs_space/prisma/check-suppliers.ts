import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const suppliers = await prisma.supplier.findMany();
  console.log('\n📋 Suppliers in Database:');
  suppliers.forEach(s => console.log(`  - ${s.name}`));
  console.log(`\nTotal: ${suppliers.length} suppliers\n`);
}

main()
  .finally(() => prisma.$disconnect());
