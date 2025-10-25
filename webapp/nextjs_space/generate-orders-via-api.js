const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateOrdersViaAPI() {
  try {
    console.log('\n=== MATERIAL ORDER GENERATION INSTRUCTIONS ===\n');

    // Get jobs without material orders
    const jobs = await prisma.installationJob.findMany({
      where: {
        materialOrders: {
          none: {}
        }
      },
      include: {
        lead: {
          select: {
            name: true,
            email: true,
            depositPaid: true,
          }
        }
      }
    });

    console.log(`Found ${jobs.length} jobs ready for material order generation:\n`);

    for (const job of jobs) {
      console.log(`Job: ${job.jobNumber}`);
      console.log(`  Customer: ${job.lead.name} (${job.lead.email})`);
      console.log(`  System: ${job.systemSize}kW, ${job.panelCount} panels, ${job.batteryCapacity}kWh battery`);
      console.log(`  Deposit Paid: ${job.lead.depositPaid ? '✅ YES' : '❌ NO'}`);
      console.log(`  Job ID: ${job.id}`);
      console.log('');
    }

    console.log('\n=== HOW TO GENERATE ORDERS ===\n');
    console.log('Option 1: Via Admin UI');
    console.log('  1. Go to http://localhost:3000/admin/materials');
    console.log('  2. Click on "Jobs Needing Materials" tab');
    console.log('  3. Click "Auto Generate" button for each job\n');

    console.log('Option 2: Via API (using curl)');
    console.log('  First, get your admin token from localStorage in browser console');
    console.log('  Then run these commands:\n');

    for (const job of jobs) {
      console.log(`  # Generate orders for ${job.jobNumber} (${job.lead.name})`);
      console.log(`  curl -X POST http://localhost:3000/api/admin/materials/generate \\`);
      console.log(`    -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\`);
      console.log(`    -H "Content-Type: application/json" \\`);
      console.log(`    -d '{"jobId":"${job.id}"}'\n`);
    }

    console.log('\n=== CHECKING SUPPLIER DATA ===\n');
    
    // Check if we have suppliers configured
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true }
    });
    
    console.log(`Active Suppliers: ${suppliers.length}`);
    if (suppliers.length === 0) {
      console.log('  ⚠️ WARNING: No active suppliers found!');
      console.log('  You need to add suppliers before generating orders.');
    } else {
      for (const supplier of suppliers) {
        console.log(`  • ${supplier.name} (${supplier.email})`);
      }
    }

    // Check if we have brand-supplier mappings
    const brandMappings = await prisma.brandSupplier.findMany({
      where: { isActive: true },
      include: {
        supplierProduct: {
          include: {
            supplier: true
          }
        },
        panelBrand: true,
        batteryBrand: true,
        inverterBrand: true,
      },
      take: 10
    });

    console.log(`\nBrand-Supplier Mappings: ${brandMappings.length}`);
    if (brandMappings.length === 0) {
      console.log('  ⚠️ WARNING: No brand-supplier mappings found!');
      console.log('  Material orders cannot be generated without supplier product mappings.');
      console.log('  You need to configure which suppliers provide which brands.');
    } else {
      console.log('  Sample mappings:');
      for (const mapping of brandMappings.slice(0, 5)) {
        const brandName = mapping.panelBrand?.name || mapping.batteryBrand?.name || mapping.inverterBrand?.name || 'Unknown';
        console.log(`    • ${brandName} → ${mapping.supplierProduct.supplier.name} ($${mapping.supplierCost})`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateOrdersViaAPI();
