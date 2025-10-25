const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  console.log('🔍 Checking Products in Database...\n');
  console.log('═'.repeat(70));
  
  // Check Batteries
  console.log('\n🔋 BATTERIES:');
  const batteries = await prisma.product.findMany({
    where: { productType: 'BATTERY' },
    include: {
      SupplierProduct: {
        include: {
          supplier: true
        }
      }
    }
  });
  
  console.log(`   Total batteries found: ${batteries.length}\n`);
  
  batteries.forEach((battery, idx) => {
    const specs = typeof battery.specifications === 'string' ? JSON.parse(battery.specifications) : battery.specifications;
    const capacity = specs.capacity || specs.capacityKwh || 'N/A';
    
    console.log(`   ${idx + 1}. ${battery.name}`);
    console.log(`      SKU: ${battery.sku}`);
    console.log(`      Capacity: ${capacity}kWh`);
    console.log(`      Brand: ${battery.manufacturer}`);
    console.log(`      Available: ${battery.isAvailable ? '✅' : '❌'}`);
    console.log(`      Suppliers: ${battery.SupplierProduct.length}`);
    if (battery.SupplierProduct.length > 0) {
      battery.SupplierProduct.forEach(sp => {
        console.log(`         - ${sp.supplier.name}: $${sp.unitCost} (Stock: ${sp.stockStatus})`);
      });
    }
    console.log('');
  });
  
  // Check Inverters
  console.log('═'.repeat(70));
  console.log('\n⚡ INVERTERS:');
  const inverters = await prisma.product.findMany({
    where: { productType: 'INVERTER' },
    include: {
      SupplierProduct: {
        include: {
          supplier: true
        }
      }
    }
  });
  
  console.log(`   Total inverters found: ${inverters.length}\n`);
  
  inverters.forEach((inverter, idx) => {
    const specs = typeof inverter.specifications === 'string' ? JSON.parse(inverter.specifications) : inverter.specifications;
    const capacity = specs.capacity || specs.capacityKw || 'N/A';
    
    console.log(`   ${idx + 1}. ${inverter.name}`);
    console.log(`      SKU: ${inverter.sku}`);
    console.log(`      Capacity: ${capacity}kW`);
    console.log(`      Brand: ${inverter.manufacturer}`);
    console.log(`      Available: ${inverter.isAvailable ? '✅' : '❌'}`);
    console.log(`      Suppliers: ${inverter.SupplierProduct.length}`);
    if (inverter.SupplierProduct.length > 0) {
      inverter.SupplierProduct.forEach(sp => {
        console.log(`         - ${sp.supplier.name}: $${sp.unitCost} (Stock: ${sp.stockStatus})`);
      });
    }
    console.log('');
  });
  
  // Summary
  console.log('═'.repeat(70));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total Batteries: ${batteries.length}`);
  console.log(`   Available Batteries: ${batteries.filter(b => b.isAvailable).length}`);
  console.log(`   Total Inverters: ${inverters.length}`);
  console.log(`   Available Inverters: ${inverters.filter(i => i.isAvailable).length}`);
  
  // Check for large batteries (>22kWh)
  const largeBatteries = batteries.filter(b => {
    const specs = typeof b.specifications === 'string' ? JSON.parse(b.specifications) : b.specifications;
    const capacity = specs.capacity || specs.capacityKwh || 0;
    return capacity > 22;
  });
  console.log(`\n   Batteries > 22kWh: ${largeBatteries.length}`);
  if (largeBatteries.length > 0) {
    largeBatteries.forEach(b => {
      const specs = typeof b.specifications === 'string' ? JSON.parse(b.specifications) : b.specifications;
      const capacity = specs.capacity || specs.capacityKwh || 'N/A';
      console.log(`      - ${b.name} (${capacity}kWh) - Available: ${b.isAvailable ? '✅' : '❌'}`);
    });
  }
  
  // Check for large inverters (>7kW)
  const largeInverters = inverters.filter(i => {
    const specs = typeof i.specifications === 'string' ? JSON.parse(i.specifications) : i.specifications;
    const capacity = specs.capacity || specs.capacityKw || 0;
    return capacity > 7;
  });
  console.log(`\n   Inverters > 7kW: ${largeInverters.length}`);
  if (largeInverters.length > 0) {
    largeInverters.forEach(i => {
      const specs = typeof i.specifications === 'string' ? JSON.parse(i.specifications) : i.specifications;
      const capacity = specs.capacity || specs.capacityKw || 'N/A';
      console.log(`      - ${i.name} (${capacity}kW) - Available: ${i.isAvailable ? '✅' : '❌'}`);
    });
  }
  
  await prisma.$disconnect();
}

checkProducts().catch(console.error);
