/**
 * Verify Product-Supplier Links
 * 
 * This script checks if products are properly linked to suppliers
 * and if the Products Catalog page should show pricing data.
 */

const { PrismaClient } = require('../docs/nextjs_space/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function verifyProductSupplierLinks() {
  console.log('\n=== PRODUCT-SUPPLIER LINK VERIFICATION ===\n');

  try {
    // 1. Count total products
    const totalProducts = await prisma.product.count();
    console.log(`✓ Total Products in Database: ${totalProducts}`);

    // 2. Count products with supplier links
    const productsWithSuppliers = await prisma.product.count({
      where: {
        SupplierProduct: {
          some: {
            isActive: true
          }
        }
      }
    });
    console.log(`✓ Products with Active Suppliers: ${productsWithSuppliers}`);

    // 3. Count total supplier product links
    const totalSupplierLinks = await prisma.supplierProduct.count({
      where: {
        productId: { not: null },
        isActive: true
      }
    });
    console.log(`✓ Total Active Supplier Links: ${totalSupplierLinks}`);

    // 4. Get products WITHOUT supplier links
    const productsWithoutSuppliers = await prisma.product.findMany({
      where: {
        SupplierProduct: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        productType: true
      }
    });

    if (productsWithoutSuppliers.length > 0) {
      console.log(`\n⚠️  Products WITHOUT Suppliers (${productsWithoutSuppliers.length}):`);
      productsWithoutSuppliers.forEach(p => {
        console.log(`   - ${p.name} (${p.productType}) - SKU: ${p.sku}`);
      });
    } else {
      console.log('\n✓ All products have supplier links!');
    }

    // 5. Sample product with full details
    console.log('\n=== SAMPLE PRODUCT WITH PRICING ===\n');
    const sampleProduct = await prisma.product.findFirst({
      where: {
        SupplierProduct: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          include: {
            supplier: true
          }
        },
        installationReqs: {
          include: {
            laborType: true
          }
        }
      }
    });

    if (sampleProduct) {
      console.log(`Product: ${sampleProduct.name}`);
      console.log(`SKU: ${sampleProduct.sku}`);
      console.log(`Type: ${sampleProduct.productType}`);
      console.log(`Tier: ${sampleProduct.tier || 'N/A'}`);
      
      console.log(`\nSuppliers (${sampleProduct.SupplierProduct.length}):`);
      sampleProduct.SupplierProduct.forEach(sp => {
        console.log(`  - ${sp.supplier.name}`);
        console.log(`    Unit Cost: $${sp.unitCost.toFixed(2)}`);
        console.log(`    Retail Price: $${sp.retailPrice?.toFixed(2) || 'N/A'}`);
        console.log(`    Markup: ${sp.markupPercent?.toFixed(1) || 'N/A'}%`);
        console.log(`    Lead Time: ${sp.leadTime || 'N/A'} days`);
      });

      if (sampleProduct.installationReqs.length > 0) {
        console.log(`\nInstallation Requirements (${sampleProduct.installationReqs.length}):`);
        sampleProduct.installationReqs.forEach(req => {
          console.log(`  - ${req.laborType.name}`);
          console.log(`    Base Rate: $${req.laborType.baseRate.toFixed(2)}`);
          console.log(`    Multiplier: ${req.quantityMultiplier}x`);
        });
      }
    }

    // 6. Summary by product type
    console.log('\n=== SUMMARY BY PRODUCT TYPE ===\n');
    const productTypes = ['PANEL', 'BATTERY', 'INVERTER', 'EV_CHARGER', 'ADDON'];
    
    for (const type of productTypes) {
      const count = await prisma.product.count({
        where: { productType: type }
      });
      
      const withSuppliers = await prisma.product.count({
        where: {
          productType: type,
          SupplierProduct: {
            some: { isActive: true }
          }
        }
      });

      if (count > 0) {
        const percentage = ((withSuppliers / count) * 100).toFixed(1);
        console.log(`${type}: ${withSuppliers}/${count} (${percentage}%) have suppliers`);
      }
    }

    // 7. Check if API response format is correct
    console.log('\n=== API RESPONSE FORMAT CHECK ===\n');
    const apiTestProduct = await prisma.product.findFirst({
      include: {
        SupplierProduct: {
          where: { isActive: true },
          include: { supplier: true }
        }
      }
    });

    if (apiTestProduct) {
      console.log('✓ API returns property: SupplierProduct (capital S, capital P)');
      console.log(`✓ Sample has ${apiTestProduct.SupplierProduct.length} supplier link(s)`);
      
      if (apiTestProduct.SupplierProduct.length > 0) {
        const sp = apiTestProduct.SupplierProduct[0];
        console.log('\n✓ Supplier Product Structure:');
        console.log(`  - id: ${sp.id}`);
        console.log(`  - unitCost: ${sp.unitCost}`);
        console.log(`  - retailPrice: ${sp.retailPrice}`);
        console.log(`  - markupPercent: ${sp.markupPercent}`);
        console.log(`  - supplier.name: ${sp.supplier.name}`);
        console.log(`  - supplier.email: ${sp.supplier.email}`);
      }
    }

    console.log('\n=== VERIFICATION COMPLETE ===\n');

    // Final verdict
    if (productsWithSuppliers === 0) {
      console.log('❌ ISSUE: No products have supplier links!');
      console.log('   The Products Catalog will show "No suppliers linked yet" warnings.');
      console.log('   You need to run the product-supplier linking process.');
    } else if (productsWithSuppliers < totalProducts) {
      console.log(`⚠️  WARNING: Only ${productsWithSuppliers}/${totalProducts} products have suppliers.`);
      console.log('   Some products will show "No suppliers linked yet" warnings.');
    } else {
      console.log('✅ SUCCESS: All products have supplier links!');
      console.log('   The Products Catalog should display pricing correctly.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyProductSupplierLinks();
