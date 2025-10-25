import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\nChecking which suppliers provide which inverter brands:\n');
  
  const inverters = await prisma.product.findMany({
    where: { productType: 'INVERTER', isAvailable: true },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        include: { supplier: true },
      },
    },
  });
  
  // Group by manufacturer
  const byManufacturer: { [key: string]: any[] } = {};
  
  inverters.forEach(inv => {
    const manufacturer = inv.manufacturer;
    if (!byManufacturer[manufacturer]) byManufacturer[manufacturer] = [];
    
    inv.SupplierProduct.forEach(sp => {
      byManufacturer[manufacturer].push({
        product: inv.name,
        capacity: (inv.specifications as any)?.capacity || 0,
        supplier: sp.supplier.name,
        supplierId: sp.supplierId,
        unitCost: sp.unitCost,
      });
    });
  });
  
  console.log('Inverter brands and their suppliers:\n');
  Object.keys(byManufacturer).sort().forEach(manufacturer => {
    console.log(`${manufacturer}:`);
    const products = byManufacturer[manufacturer];
    const capacities = [...new Set(products.map(p => p.capacity))].sort((a, b) => a - b);
    console.log(`  Capacities available: ${capacities.join('kW, ')}kW`);
    
    const suppliers = [...new Set(products.map(p => p.supplier))];
    console.log(`  Suppliers: ${suppliers.join(', ')}`);
    console.log(`  Sample products:`);
    products.slice(0, 2).forEach(p => {
      console.log(`    - ${p.product} (${p.capacity}kW) from ${p.supplier} - $${p.unitCost}`);
    });
    console.log(``);
  });
  
  await prisma.$disconnect();
}

main();
