import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking current inverter prices in database...\n');

  try {
    // Get all inverter products with their supplier products
    const inverters = await prisma.product.findMany({
      where: { 
        productType: 'INVERTER',
        isAvailable: true,
      },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    console.log(`Found ${inverters.length} inverter products:\n`);

    for (const inverter of inverters) {
      const specs = inverter.specifications as any;
      const capacity = specs?.capacity || specs?.capacityKw || 'Unknown';
      
      console.log(`📦 ${inverter.manufacturer} ${inverter.name}`);
      console.log(`   Product ID: ${inverter.id}`);
      console.log(`   Capacity: ${capacity}kW`);
      console.log(`   Tier: ${inverter.tier || 'N/A'}`);
      console.log(`   Available: ${inverter.isAvailable}`);
      
      if (inverter.SupplierProduct.length > 0) {
        console.log(`   Supplier Products:`);
        inverter.SupplierProduct.forEach(sp => {
          console.log(`     - ${sp.supplier.name}`);
          console.log(`       Retail: $${sp.retailPrice?.toLocaleString() || 'N/A'}`);
          console.log(`       Unit Cost: $${sp.unitCost?.toLocaleString() || 'N/A'}`);
          console.log(`       SKU: ${sp.sku || 'N/A'}`);
          console.log(`       Active: ${sp.isActive}`);
        });
      } else {
        console.log(`   ⚠️  NO SUPPLIER PRODUCTS`);
      }
      console.log('');
    }

    // Summary
    console.log('\n📊 Summary:');
    const withSuppliers = inverters.filter(i => i.SupplierProduct.length > 0);
    const withoutSuppliers = inverters.filter(i => i.SupplierProduct.length === 0);
    
    console.log(`Total Inverters: ${inverters.length}`);
    console.log(`With Supplier Products: ${withSuppliers.length}`);
    console.log(`Without Supplier Products: ${withoutSuppliers.length}`);
    
    if (withoutSuppliers.length > 0) {
      console.log('\n⚠️  Products without supplier data:');
      withoutSuppliers.forEach(i => {
        console.log(`   - ${i.manufacturer} ${i.name} (${i.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
