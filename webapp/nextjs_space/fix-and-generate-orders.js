const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import the order generator
async function importOrderGenerator() {
  // We'll call the API instead since dynamic import might not work in Node script
  return null;
}

async function generateJobNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));
  
  const todayJobs = await prisma.installationJob.findMany({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: {
      jobNumber: 'desc',
    },
    take: 1,
  });
  
  let sequence = 1;
  if (todayJobs.length > 0) {
    const lastJobNumber = todayJobs[0].jobNumber;
    const lastSequence = parseInt(lastJobNumber.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }
  
  return `SDI-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

async function fixAndGenerateOrders() {
  try {
    console.log('\n=== FIXING JOBS AND GENERATING ORDERS ===\n');

    // 1. Fix Job SDI-20251016-001 - Update selectedComponents
    console.log('1. Fixing Job SDI-20251016-001...');
    const job1 = await prisma.installationJob.findFirst({
      where: { jobNumber: 'SDI-20251016-001' },
      include: { lead: true }
    });

    if (job1 && job1.lead.quoteData) {
      const quoteData = job1.lead.quoteData;
      const selectedComponents = {
        panel: quoteData.products?.panel || null,
        battery: quoteData.products?.battery || null,
        inverter: quoteData.products?.inverter || null,
        addons: job1.lead.selectedAddons || [],
      };

      await prisma.installationJob.update({
        where: { id: job1.id },
        data: {
          selectedComponents: selectedComponents,
          updatedAt: new Date()
        }
      });

      console.log('   ✅ Updated selectedComponents for Job SDI-20251016-001');
      console.log('   Panel:', selectedComponents.panel?.manufacturer, selectedComponents.panel?.model);
      console.log('   Battery:', selectedComponents.battery?.manufacturer, selectedComponents.battery?.model);
      console.log('   Inverter:', selectedComponents.inverter?.manufacturer, selectedComponents.inverter?.model);
    }

    // 2. Create missing job for Ainee Matheen
    console.log('\n2. Creating missing job for Ainee Matheen...');
    const lead2 = await prisma.lead.findFirst({
      where: { email: 'aineematheen@gmail.com' },
      include: { InstallationJob: true }
    });

    if (lead2 && !lead2.InstallationJob) {
      const jobNumber = await generateJobNumber();
      const quoteData = lead2.quoteData;
      
      const selectedComponents = {
        panel: quoteData.products?.panel || null,
        battery: quoteData.products?.battery || null,
        inverter: quoteData.products?.inverter || null,
        addons: lead2.selectedAddons || [],
      };

      const schedulingDeadline = new Date();
      schedulingDeadline.setDate(schedulingDeadline.getDate() + 14);

      const newJob = await prisma.installationJob.create({
        data: {
          id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          leadId: lead2.id,
          jobNumber: jobNumber,
          status: 'PENDING_SCHEDULE',
          schedulingDeadline: schedulingDeadline,
          siteLatitude: lead2.latitude,
          siteLongitude: lead2.longitude,
          siteSuburb: lead2.suburb,
          systemSize: lead2.systemSizeKw,
          panelCount: lead2.numPanels,
          batteryCapacity: lead2.batterySizeKwh || 0,
          inverterModel: quoteData.products?.inverter?.model || 'Standard',
          isCommercial: false,
          selectedComponents: selectedComponents,
          estimatedDuration: 6, // Default for 9.5kW + battery
          updatedAt: new Date(),
          installationNotes: `
Property: ${lead2.propertyType}
Roof Type: ${lead2.roofType}
Household Size: ${lead2.householdSize}
Has EV: ${lead2.hasEv ? 'Yes' : 'No'}
${lead2.notes ? `Additional Notes: ${lead2.notes}` : ''}
          `.trim(),
        },
      });

      console.log('   ✅ Created Job:', jobNumber);
      console.log('   Customer:', lead2.name);
      console.log('   System:', lead2.systemSizeKw, 'kW,', lead2.numPanels, 'panels');
      console.log('   Battery:', lead2.batterySizeKwh, 'kWh');
    }

    // 3. Now check all jobs without material orders
    console.log('\n3. Checking jobs without material orders...');
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
            email: true
          }
        }
      }
    });

    console.log(`   Found ${jobsWithoutOrders.length} jobs without material orders\n`);

    for (const job of jobsWithoutOrders) {
      console.log(`   Job: ${job.jobNumber} (${job.lead.name})`);
      console.log(`   Deposit Paid: ${job.lead.depositPaid ? 'YES' : 'NO'}`);
      console.log(`   Selected Components:`, job.selectedComponents);
      
      if (!job.selectedComponents || 
          (!job.selectedComponents.panel && !job.selectedComponents.battery && !job.selectedComponents.inverter)) {
        console.log(`   ⚠️ Cannot generate orders - no components selected`);
      } else {
        console.log(`   ✅ Ready for order generation`);
      }
      console.log('');
    }

    console.log('\n=== NEXT STEPS ===');
    console.log('Run the material order generation for these jobs via:');
    console.log('1. Admin UI: /admin/materials → "Jobs Needing Materials" tab → Click "Auto Generate"');
    console.log('2. Or use the API: POST /api/admin/materials/generate with jobId');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAndGenerateOrders();
