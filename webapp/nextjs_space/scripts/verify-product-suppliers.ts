import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying Product-Supplier Relationships...\n');
  console.log('='.repeat(70));

  try {
    // Check 1: Count all products
    const totalProducts = await prisma.product.count();
    console.log(`\n📦 Total Products: ${totalProducts}`);

    // Check 2: Products by type
    const panels = await prisma.product.count({ where: { productType: 'PANEL' } });
    const batteries = await prisma.product.count({ where: { productType: 'BATTERY' } });
    const inverters = await prisma.product.count({ where: { productType: 'INVERTER' } });
    
    console.log(`   - Panels: ${panels}`);
    console.log(`   - Batteries: ${batteries}`);
    console.log(`   - Inverters: ${inverters}`);

    // Check 3: Products with supplier links
    console.log('\n🔗 Supplier Links:');
    const productsWithSuppliers = await prisma.product.findMany({
      include: {
        SupplierProduct: {
          where: { isActive: true },
        },
      },
    });

    const withActiveSuppliers = productsWithSuppliers.filter(p => p.SupplierProduct.length > 0);
    const withoutSuppliers = productsWithSuppliers.filter(p => p.SupplierProduct.length === 0);

    console.log(`   ✅ Products with active suppliers: ${withActiveSuppliers.length}`);
    console.log(`   ❌ Products WITHOUT suppliers: ${withoutSuppliers.length}`);

    // Check 4: List products without suppliers
    if (withoutSuppliers.length > 0) {
      console.log('\n⚠️  Products Missing Active Suppliers:');
      console.log('─'.repeat(70));
      for (const product of withoutSuppliers) {
        console.log(`   ❌ ${product.name} (${product.productType})`);
        console.log(`      ID: ${product.id}`);
        console.log(`      Available: ${product.isAvailable}`);
        
        // Check if there are inactive suppliers
        const inactiveSuppliers = await prisma.supplierProduct.count({
          where: { productId: product.id, isActive: false },
        });
        if (inactiveSuppliers > 0) {
          console.log(`      ⚠️  Has ${inactiveSuppliers} INACTIVE supplier(s)`);
        }
        
        // Check if there are suppliers without productId link
        const unlinkSuppliers = await prisma.supplierProduct.count({
          where: { 
            OR: [
              { brand: product.manufacturer, model: product.name },
              { sku: product.sku },
            ],
            productId: null,
          },
        });
        if (unlinkSuppliers > 0) {
          console.log(`      ⚠️  Has ${unlinkSuppliers} UNLINKED supplier(s)`);
        }
        console.log();
      }
    }

    // Check 5: Specific product check - Jinko Solar Tiger Pro 440W
    console.log('\n🔎 Checking Specific Product: "Jinko Solar Tiger Pro 440W"');
    console.log('─'.repeat(70));
    
    const jinkoProduct = await prisma.product.findFirst({
      where: {
        name: { contains: 'Jinko Solar Tiger Pro 440W' },
      },
      include: {
        SupplierProduct: true,
      },
    });

    if (jinkoProduct) {
      console.log(`   ✅ Found in Product table:`);
      console.log(`      ID: ${jinkoProduct.id}`);
      console.log(`      Name: ${jinkoProduct.name}`);
      console.log(`      Available: ${jinkoProduct.isAvailable}`);
      console.log(`      Supplier Products: ${jinkoProduct.SupplierProduct.length}`);
      
      if (jinkoProduct.SupplierProduct.length > 0) {
        for (const sp of jinkoProduct.SupplierProduct) {
          console.log(`\n      Supplier Product:`);
          console.log(`         ID: ${sp.id}`);
          console.log(`         Supplier ID: ${sp.supplierId}`);
          console.log(`         Active: ${sp.isActive}`);
          console.log(`         Unit Cost: $${sp.unitCost}`);
          console.log(`         Retail Price: $${sp.retailPrice || 'N/A'}`);
        }
      } else {
        console.log(`      ❌ NO SUPPLIER PRODUCTS FOUND!`);
      }
    } else {
      console.log(`   ❌ NOT FOUND in Product table`);
      
      // Check if it exists in old PanelBrand table
      const oldPanel = await prisma.panelBrand.findFirst({
        where: { name: { contains: 'Jinko Solar Tiger Pro 440W' } },
      });
      
      if (oldPanel) {
        console.log(`   ⚠️  Found in OLD PanelBrand table (not migrated)`);
        console.log(`      ID: ${oldPanel.id}`);
        console.log(`      Name: ${oldPanel.name}`);
      }
    }

    // Check 6: Supplier status
    console.log('\n🏢 Supplier Status:');
    console.log('─'.repeat(70));
    const suppliers = await prisma.supplier.findMany();
    console.log(`   Total Suppliers: ${suppliers.length}`);
    for (const supplier of suppliers) {
      const productCount = await prisma.supplierProduct.count({
        where: { supplierId: supplier.id, isActive: true },
      });
      console.log(`   - ${supplier.name} (${supplier.isActive ? 'Active' : 'Inactive'}): ${productCount} products`);
    }

    // Check 7: SupplierProduct without Product link
    console.log('\n🔗 Orphaned SupplierProducts:');
    const orphanedSupplierProducts = await prisma.supplierProduct.count({
      where: { productId: null },
    });
    console.log(`   Supplier products without Product link: ${orphanedSupplierProducts}`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Products with Active Suppliers: ${withActiveSuppliers.length}`);
    console.log(`Products WITHOUT Suppliers: ${withoutSuppliers.length}`);
    console.log(`Orphaned SupplierProducts: ${orphanedSupplierProducts}`);
    
    if (withoutSuppliers.length === 0 && orphanedSupplierProducts === 0) {
      console.log('\n✅ All products have active suppliers! Database is healthy.');
    } else {
      console.log('\n⚠️  Issues found! Run migration script to fix.');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
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
