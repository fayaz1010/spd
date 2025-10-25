/**
 * Script to manually generate material orders for jobs
 * Run with: npx tsx scripts/generate-material-orders.ts
 */

import { PrismaClient } from '@prisma/client';
import { autoGenerateOrders } from '../lib/order-generator';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n=== GENERATING MATERIAL ORDERS ===\n');

    // Find all jobs without material orders
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

    console.log(`Found ${jobs.length} jobs without material orders\n`);

    if (jobs.length === 0) {
      console.log('✅ All jobs already have material orders!');
      return;
    }

    for (const job of jobs) {
      console.log(`\n📦 Processing Job: ${job.jobNumber}`);
      console.log(`   Customer: ${job.lead.name}`);
      console.log(`   System: ${job.systemSize}kW, ${job.panelCount} panels`);
      if (job.batteryCapacity) {
        console.log(`   Battery: ${job.batteryCapacity}kWh`);
      }
      console.log(`   Deposit Paid: ${job.lead.depositPaid ? 'YES' : 'NO'}`);

      try {
        console.log(`\n   Generating orders...`);
        const result = await autoGenerateOrders(job.id);

        if (result.success) {
          console.log(`   ✅ SUCCESS!`);
          console.log(`   Total Orders: ${result.summary.totalOrders}`);
          console.log(`   Total Cost: $${result.summary.totalCost.toFixed(2)}`);
          
          console.log(`\n   Supplier Breakdown:`);
          for (const supplier of result.summary.supplierBreakdown) {
            console.log(`     • ${supplier.supplierName}: ${supplier.itemCount} items, $${supplier.subtotal.toFixed(2)}`);
          }

          console.log(`\n   Purchase Orders Created:`);
          for (const order of result.orders) {
            console.log(`     • ${order.poNumber} - ${order.supplier.name} - $${order.total.toFixed(2)}`);
          }
        } else {
          console.log(`   ❌ FAILED`);
          console.log(`   Errors:`);
          for (const error of result.errors) {
            console.log(`     • ${error}`);
          }
        }
      } catch (error: any) {
        console.error(`   ❌ ERROR:`, error.message);
        console.error(error.stack);
      }

      console.log('\n' + '='.repeat(60));
    }

    // Show summary
    console.log('\n=== SUMMARY ===\n');
    const allOrders = await prisma.materialOrder.findMany({
      include: {
        supplier: true,
        job: {
          include: {
            lead: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`Total Material Orders in System: ${allOrders.length}\n`);
    
    if (allOrders.length > 0) {
      console.log('Recent Orders:');
      for (const order of allOrders) {
        console.log(`  • ${order.poNumber} - ${order.job.jobNumber} (${order.job.lead.name})`);
        console.log(`    Supplier: ${order.supplier.name}`);
        console.log(`    Total: $${order.total.toFixed(2)}`);
        console.log(`    Status: ${order.status}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
