const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');

  // 1. Count products
  const productCount = await prisma.product.count();
  const panelCount = await prisma.product.count({ where: { productType: 'PANEL' } });
  const batteryCount = await prisma.product.count({ where: { productType: 'BATTERY' } });
  const inverterCount = await prisma.product.count({ where: { productType: 'INVERTER' } });

  console.log('📦 Products:');
  console.log(`   Total: ${productCount}`);
  console.log(`   Panels: ${panelCount}`);
  console.log(`   Batteries: ${batteryCount}`);
  console.log(`   Inverters: ${inverterCount}`);

  // 2. Count suppliers
  const supplierCount = await prisma.supplier.count();
  console.log(`\n🏢 Suppliers: ${supplierCount}`);

  // 3. Count supplier-product links
  const supplierProductCount = await prisma.supplierProduct.count();
  const activeSupplierProductCount = await prisma.supplierProduct.count({ where: { isActive: true } });
  console.log(`\n🔗 Supplier-Product Links:`);
  console.log(`   Total: ${supplierProductCount}`);
  console.log(`   Active: ${activeSupplierProductCount}`);

  // 4. Count installation requirements
  const installReqCount = await prisma.productInstallationRequirement.count();
  console.log(`\n🔧 Installation Requirements: ${installReqCount}`);

  // 5. List first few products to see what we have
  console.log('\n📋 Sample Products:');
  const sampleProducts = await prisma.product.findMany({
    take: 5,
    include: {
      SupplierProduct: true,
    },
  });

  sampleProducts.forEach(p => {
    console.log(`\n   ${p.name} (${p.productType})`);
    console.log(`   - ID: ${p.id}`);
    console.log(`   - Supplier links: ${p.SupplierProduct.length} (${p.SupplierProduct.filter(s => s.isActive).length} active)`);
  });

  await prisma.$disconnect();
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
