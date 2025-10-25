const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductsAndFix() {
  try {
    console.log('\n=== PRODUCT SYSTEM ANALYSIS ===\n');

    // Check Product table
    const products = await prisma.product.findMany({
      where: {
        productType: {
          in: ['PANEL', 'INVERTER', 'BATTERY']
        },
        isAvailable: true
      },
      include: {
        SupplierProduct: {
          include: {
            supplier: true,
            brandMappings: true
          }
        }
      },
      take: 10
    });

    console.log(`Products in unified Product table: ${products.length}\n`);

    for (const product of products.slice(0, 5)) {
      console.log(`• ${product.manufacturer} - ${product.name}`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Type: ${product.productType}`);
      console.log(`  SKU: ${product.sku}`);
      console.log(`  Supplier Products: ${product.SupplierProduct.length}`);
      
      if (product.SupplierProduct.length > 0) {
        for (const sp of product.SupplierProduct) {
          console.log(`    → ${sp.supplier.name}: $${sp.unitCost}`);
          console.log(`      Brand Mappings: ${sp.brandMappings.length}`);
        }
      }
      console.log('');
    }

    // Check what products the jobs need
    console.log('\n=== CHECKING JOB REQUIREMENTS ===\n');
    
    const jobs = await prisma.installationJob.findMany({
      where: {
        materialOrders: {
          none: {}
        }
      },
      select: {
        id: true,
        jobNumber: true,
        selectedComponents: true,
        lead: {
          select: {
            name: true
          }
        }
      }
    });

    for (const job of jobs) {
      console.log(`Job: ${job.jobNumber} (${job.lead.name})`);
      const components = job.selectedComponents;
      
      if (components?.panel) {
        const panelProduct = await prisma.product.findUnique({
          where: { id: components.panel.id },
          include: {
            SupplierProduct: {
              include: {
                supplier: true
              }
            }
          }
        });
        
        if (panelProduct) {
          console.log(`  ✅ Panel found: ${panelProduct.manufacturer} ${panelProduct.name}`);
          console.log(`     Suppliers: ${panelProduct.SupplierProduct.length}`);
          for (const sp of panelProduct.SupplierProduct) {
            console.log(`       • ${sp.supplier.name}: $${sp.unitCost}`);
          }
        } else {
          console.log(`  ❌ Panel NOT found: ${components.panel.id}`);
        }
      }
      
      if (components?.battery) {
        const batteryProduct = await prisma.product.findUnique({
          where: { id: components.battery.id },
          include: {
            SupplierProduct: {
              include: {
                supplier: true
              }
            }
          }
        });
        
        if (batteryProduct) {
          console.log(`  ✅ Battery found: ${batteryProduct.manufacturer} ${batteryProduct.name}`);
          console.log(`     Suppliers: ${batteryProduct.SupplierProduct.length}`);
          for (const sp of batteryProduct.SupplierProduct) {
            console.log(`       • ${sp.supplier.name}: $${sp.unitCost}`);
          }
        } else {
          console.log(`  ❌ Battery NOT found: ${components.battery.id}`);
        }
      }
      
      if (components?.inverter) {
        const inverterProduct = await prisma.product.findUnique({
          where: { id: components.inverter.id },
          include: {
            SupplierProduct: {
              include: {
                supplier: true
              }
            }
          }
        });
        
        if (inverterProduct) {
          console.log(`  ✅ Inverter found: ${inverterProduct.manufacturer} ${inverterProduct.name}`);
          console.log(`     Suppliers: ${inverterProduct.SupplierProduct.length}`);
          for (const sp of inverterProduct.SupplierProduct) {
            console.log(`       • ${sp.supplier.name}: $${sp.unitCost}`);
          }
        } else {
          console.log(`  ❌ Inverter NOT found: ${components.inverter.id}`);
        }
      }
      
      console.log('');
    }

    console.log('\n=== DIAGNOSIS ===\n');
    console.log('The material order generator is looking for:');
    console.log('  1. PanelBrand/BatteryBrand/InverterBrand tables (OLD SYSTEM)');
    console.log('  2. BrandSupplier mappings linking brands to suppliers');
    console.log('');
    console.log('But your system uses:');
    console.log('  1. Unified Product table (NEW SYSTEM)');
    console.log('  2. SupplierProduct linking products to suppliers');
    console.log('');
    console.log('SOLUTION: Update material-list-generator.ts to use Product table');
    console.log('instead of PanelBrand/BatteryBrand/InverterBrand tables.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductsAndFix();
