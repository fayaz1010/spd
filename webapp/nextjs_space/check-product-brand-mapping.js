const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductBrandMapping() {
  try {
    console.log('\n=== PRODUCT & BRAND MAPPING ANALYSIS ===\n');

    // Check SupplierProducts
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: {
        category: {
          in: ['PANEL', 'BATTERY', 'INVERTER']
        },
        isActive: true
      },
      include: {
        supplier: {
          select: {
            name: true
          }
        },
        brandMappings: true
      },
      take: 10
    });

    console.log(`SupplierProducts (Panels/Batteries/Inverters): ${supplierProducts.length}`);
    console.log('\nSample SupplierProducts:');
    for (const product of supplierProducts.slice(0, 5)) {
      console.log(`  • ${product.brand} ${product.model}`);
      console.log(`    Category: ${product.category}`);
      console.log(`    Supplier: ${product.supplier.name}`);
      console.log(`    Unit Cost: $${product.unitCost}`);
      console.log(`    Has BrandSupplier mapping: ${product.brandMappings.length > 0 ? 'YES' : 'NO'}`);
      console.log('');
    }

    // Check PanelBrands
    const panelBrands = await prisma.panelBrand.findMany({
      where: { isAvailable: true },
      include: {
        BrandSupplier: {
          include: {
            supplierProduct: {
              include: {
                supplier: true
              }
            }
          }
        }
      },
      take: 5
    });

    console.log(`\nPanelBrands: ${panelBrands.length}`);
    for (const brand of panelBrands) {
      console.log(`  • ${brand.manufacturer} - ${brand.name}`);
      console.log(`    ID: ${brand.id}`);
      console.log(`    Supplier mappings: ${brand.BrandSupplier.length}`);
      if (brand.BrandSupplier.length > 0) {
        for (const mapping of brand.BrandSupplier) {
          console.log(`      → ${mapping.supplierProduct.supplier.name}: $${mapping.supplierCost}`);
        }
      }
      console.log('');
    }

    // Check BatteryBrands
    const batteryBrands = await prisma.batteryBrand.findMany({
      where: { isAvailable: true },
      include: {
        BrandSupplier: {
          include: {
            supplierProduct: {
              include: {
                supplier: true
              }
            }
          }
        }
      },
      take: 5
    });

    console.log(`\nBatteryBrands: ${batteryBrands.length}`);
    for (const brand of batteryBrands) {
      console.log(`  • ${brand.manufacturer} - ${brand.name}`);
      console.log(`    ID: ${brand.id}`);
      console.log(`    Supplier mappings: ${brand.BrandSupplier.length}`);
      if (brand.BrandSupplier.length > 0) {
        for (const mapping of brand.BrandSupplier) {
          console.log(`      → ${mapping.supplierProduct.supplier.name}: $${mapping.supplierCost}`);
        }
      }
      console.log('');
    }

    // Check InverterBrands
    const inverterBrands = await prisma.inverterBrand.findMany({
      where: { isAvailable: true },
      include: {
        BrandSupplier: {
          include: {
            supplierProduct: {
              include: {
                supplier: true
              }
            }
          }
        }
      },
      take: 5
    });

    console.log(`\nInverterBrands: ${inverterBrands.length}`);
    for (const brand of inverterBrands) {
      console.log(`  • ${brand.manufacturer} - ${brand.name}`);
      console.log(`    ID: ${brand.id}`);
      console.log(`    Supplier mappings: ${brand.BrandSupplier.length}`);
      if (brand.BrandSupplier.length > 0) {
        for (const mapping of brand.BrandSupplier) {
          console.log(`      → ${mapping.supplierProduct.supplier.name}: $${mapping.supplierCost}`);
        }
      }
      console.log('');
    }

    // Check what products are needed for the jobs
    console.log('\n=== PRODUCTS NEEDED FOR CURRENT JOBS ===\n');
    
    const jobs = await prisma.installationJob.findMany({
      where: {
        materialOrders: {
          none: {}
        }
      },
      select: {
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
        console.log(`  Panel needed: ${components.panel.manufacturer} ${components.panel.model}`);
        console.log(`    Product ID: ${components.panel.id}`);
        
        // Try to find matching brand
        const matchingBrand = await prisma.panelBrand.findFirst({
          where: {
            OR: [
              { id: components.panel.id },
              {
                AND: [
                  { manufacturer: components.panel.manufacturer },
                  { name: { contains: components.panel.model } }
                ]
              }
            ]
          },
          include: {
            BrandSupplier: true
          }
        });
        
        if (matchingBrand) {
          console.log(`    ✅ Found PanelBrand: ${matchingBrand.id}`);
          console.log(`    Supplier mappings: ${matchingBrand.BrandSupplier.length}`);
        } else {
          console.log(`    ❌ No matching PanelBrand found`);
        }
      }
      
      if (components?.battery) {
        console.log(`  Battery needed: ${components.battery.manufacturer} ${components.battery.model}`);
        console.log(`    Product ID: ${components.battery.id}`);
      }
      
      if (components?.inverter) {
        console.log(`  Inverter needed: ${components.inverter.manufacturer} ${components.inverter.model}`);
        console.log(`    Product ID: ${components.inverter.id}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductBrandMapping();
