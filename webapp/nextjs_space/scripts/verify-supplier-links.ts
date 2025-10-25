import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySupplierLinks() {
  console.log('🔍 Verifying supplier links...\n');

  // 1. Check all products
  const products = await prisma.product.findMany({
    include: {
      SupplierProduct: {
        include: {
          supplier: true,
        },
      },
    },
  });

  console.log(`📦 Total products: ${products.length}\n`);

  // 2. Find products without active suppliers
  const productsWithoutSuppliers: any[] = [];
  const productsWithInactiveSuppliers: any[] = [];

  for (const product of products) {
    const activeSuppliers = product.SupplierProduct.filter(sp => sp.isActive);
    
    if (product.SupplierProduct.length === 0) {
      productsWithoutSuppliers.push(product);
    } else if (activeSuppliers.length === 0) {
      productsWithInactiveSuppliers.push(product);
    }
  }

  console.log(`❌ Products without ANY suppliers: ${productsWithoutSuppliers.length}`);
  productsWithoutSuppliers.forEach(p => {
    console.log(`   - ${p.name} (${p.productType})`);
  });

  console.log(`\n⚠️  Products with INACTIVE suppliers: ${productsWithInactiveSuppliers.length}`);
  productsWithInactiveSuppliers.forEach(p => {
    console.log(`   - ${p.name} (${p.productType})`);
  });

  // 3. Check if default supplier exists
  const defaultSupplier = await prisma.supplier.findFirst({
    where: { name: 'Default Supplier' },
  });

  if (!defaultSupplier) {
    console.log('\n❌ Default Supplier not found! Creating...');
    const newSupplier = await prisma.supplier.create({
      data: {
        id: `supplier_${Date.now()}`,
        name: 'Default Supplier',
        email: 'admin@sundirect.com.au',
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Created Default Supplier: ${newSupplier.id}`);
  } else {
    console.log(`\n✅ Default Supplier exists: ${defaultSupplier.id}`);
  }

  // 4. Fix products without suppliers
  if (productsWithoutSuppliers.length > 0 || productsWithInactiveSuppliers.length > 0) {
    console.log('\n🔧 Fixing supplier links...');
    
    const supplier = defaultSupplier || await prisma.supplier.findFirst();
    
    if (!supplier) {
      console.log('❌ No supplier found to link products to!');
      return;
    }

    const allProblemsProducts = [...productsWithoutSuppliers, ...productsWithInactiveSuppliers];

    for (const product of allProblemsProducts) {
      console.log(`\n   Fixing: ${product.name}`);
      
      // Delete any inactive supplier links
      await prisma.supplierProduct.deleteMany({
        where: {
          productId: product.id,
          isActive: false,
        },
      });

      // Check if active link already exists
      const existingLink = await prisma.supplierProduct.findFirst({
        where: {
          productId: product.id,
          supplierId: supplier.id,
          isActive: true,
        },
      });

      if (!existingLink) {
        // Create new supplier link
        const specs = product.specifications as any;
        let unitCost = 0;
        let retailPrice = 0;

        // Set default pricing based on product type
        if (product.productType === 'PANEL') {
          unitCost = 200;
          retailPrice = 280;
        } else if (product.productType === 'BATTERY') {
          const capacity = specs.capacity || 10;
          unitCost = capacity * 800;
          retailPrice = capacity * 1120;
        } else if (product.productType === 'INVERTER') {
          const capacity = specs.capacityKw || 5;
          unitCost = capacity * 400;
          retailPrice = capacity * 560;
        }

        await prisma.supplierProduct.create({
          data: {
            id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productId: product.id,
            supplierId: supplier.id,
            category: product.productType,
            brand: product.manufacturer || 'Unknown',
            model: product.name,
            unit: 'unit',
            unitCost,
            retailPrice,
            markupPercent: 40,
            isActive: true,
            updatedAt: new Date(),
          },
        });
        console.log(`   ✅ Created supplier link: $${unitCost} → $${retailPrice}`);
      } else {
        console.log(`   ✅ Active supplier link already exists`);
      }
    }
  }

  // 5. Final verification
  console.log('\n\n📊 Final Status:');
  const finalProducts = await prisma.product.findMany({
    include: {
      SupplierProduct: {
        where: { isActive: true },
      },
    },
  });

  const panelsWithSuppliers = finalProducts.filter(p => p.productType === 'PANEL' && p.SupplierProduct.length > 0).length;
  const batteriesWithSuppliers = finalProducts.filter(p => p.productType === 'BATTERY' && p.SupplierProduct.length > 0).length;
  const invertersWithSuppliers = finalProducts.filter(p => p.productType === 'INVERTER' && p.SupplierProduct.length > 0).length;

  console.log(`✅ Panels with active suppliers: ${panelsWithSuppliers}/${finalProducts.filter(p => p.productType === 'PANEL').length}`);
  console.log(`✅ Batteries with active suppliers: ${batteriesWithSuppliers}/${finalProducts.filter(p => p.productType === 'BATTERY').length}`);
  console.log(`✅ Inverters with active suppliers: ${invertersWithSuppliers}/${finalProducts.filter(p => p.productType === 'INVERTER').length}`);

  console.log('\n✅ Verification complete!');
}

verifySupplierLinks()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
