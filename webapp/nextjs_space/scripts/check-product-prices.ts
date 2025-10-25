import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.supplierProduct.findMany({
    where: { isActive: true },
    include: { product: true },
    take: 5,
  });
  
  console.log('\nChecking product prices:\n');
  products.forEach(sp => {
    console.log(`${sp.product.name}:`);
    console.log(`  Unit Cost: $${sp.unitCost}`);
    console.log(`  Retail Price: $${sp.retailPrice}`);
    console.log(`  Markup: ${sp.markupPercent}%`);
    console.log(``);
  });
  
  await prisma.$disconnect();
}

main();
