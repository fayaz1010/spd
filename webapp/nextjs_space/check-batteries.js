const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBatteries() {
  try {
    const batteries = await prisma.product.findMany({
      where: { 
        productType: 'BATTERY',
        isAvailable: true 
      },
      include: {
        SupplierProduct: {
          where: { isActive: true },
        }
      }
    });
    
    console.log(`\n✅ Found ${batteries.length} available batteries:\n`);
    batteries.forEach(b => {
      const specs = b.specifications;
      const capacity = specs.capacity || specs.capacityKwh || 'N/A';
      const hasSupplier = b.SupplierProduct.length > 0;
      console.log(`- ${b.manufacturer} ${b.name}`);
      console.log(`  ID: ${b.id}`);
      console.log(`  Capacity: ${capacity} kWh`);
      console.log(`  Has Supplier: ${hasSupplier ? 'YES' : 'NO'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBatteries();
