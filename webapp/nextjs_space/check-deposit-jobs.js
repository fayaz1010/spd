const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDepositJobs() {
  try {
    // Find all leads with deposit paid
    const leads = await prisma.lead.findMany({
      where: {
        depositPaid: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        depositPaid: true,
        depositAmount: true,
        paymentStatus: true,
        status: true,
        InstallationJob: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            selectedComponents: true,
            materialOrders: {
              select: {
                id: true,
                poNumber: true,
                status: true,
                total: true
              }
            }
          }
        }
      }
    });

    console.log('\n=== LEADS WITH DEPOSIT PAID ===');
    console.log(`Total: ${leads.length}\n`);

    for (const lead of leads) {
      console.log(`Lead: ${lead.name} (${lead.email})`);
      console.log(`  Deposit: $${lead.depositAmount || 0}`);
      console.log(`  Payment Status: ${lead.paymentStatus}`);
      console.log(`  Lead Status: ${lead.status}`);
      
      if (lead.InstallationJob) {
        console.log(`  Job: ${lead.InstallationJob.jobNumber}`);
        console.log(`  Job Status: ${lead.InstallationJob.status}`);
        console.log(`  Material Orders: ${lead.InstallationJob.materialOrders.length}`);
        
        if (lead.InstallationJob.materialOrders.length > 0) {
          for (const order of lead.InstallationJob.materialOrders) {
            console.log(`    - ${order.poNumber}: ${order.status} ($${order.total})`);
          }
        } else {
          console.log(`    ⚠️ NO MATERIAL ORDERS FOUND`);
          console.log(`    Selected Components:`, lead.InstallationJob.selectedComponents);
        }
      } else {
        console.log(`  ⚠️ NO INSTALLATION JOB FOUND`);
      }
      console.log('');
    }

    // Also check for jobs without material orders
    const jobsWithoutOrders = await prisma.installationJob.findMany({
      where: {
        materialOrders: {
          none: {}
        }
      },
      include: {
        lead: {
          select: {
            name: true,
            depositPaid: true,
            depositAmount: true
          }
        }
      }
    });

    console.log('\n=== JOBS WITHOUT MATERIAL ORDERS ===');
    console.log(`Total: ${jobsWithoutOrders.length}\n`);

    for (const job of jobsWithoutOrders) {
      console.log(`Job: ${job.jobNumber}`);
      console.log(`  Customer: ${job.lead.name}`);
      console.log(`  Deposit Paid: ${job.lead.depositPaid ? 'YES' : 'NO'}`);
      console.log(`  Job Status: ${job.status}`);
      console.log(`  System: ${job.systemSize}kW, ${job.panelCount} panels`);
      console.log(`  Selected Components:`, job.selectedComponents);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDepositJobs();
