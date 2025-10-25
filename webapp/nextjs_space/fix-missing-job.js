const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMissingJob() {
  try {
    // Check the lead "Ainee Matheen"
    const lead = await prisma.lead.findFirst({
      where: {
        email: 'aineematheen@gmail.com'
      },
      include: {
        InstallationJob: true
      }
    });

    if (!lead) {
      console.log('Lead not found');
      return;
    }

    console.log('Lead Details:');
    console.log('  Name:', lead.name);
    console.log('  Email:', lead.email);
    console.log('  Deposit Paid:', lead.depositPaid);
    console.log('  Deposit Amount:', lead.depositAmount);
    console.log('  Payment Status:', lead.paymentStatus);
    console.log('  Status:', lead.status);
    console.log('  System Size:', lead.systemSizeKw);
    console.log('  Num Panels:', lead.numPanels);
    console.log('  Battery Size:', lead.batterySizeKwh);
    console.log('  Quote Data:', JSON.stringify(lead.quoteData, null, 2));
    console.log('  Has Job:', !!lead.InstallationJob);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingJob();
