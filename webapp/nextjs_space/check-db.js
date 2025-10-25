const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Count records
    const roofCount = await prisma.roofAnalysis.count();
    const quoteCount = await prisma.customerQuote.count();
    const leadCount = await prisma.lead.count();

    console.log('\n=== DATABASE STATUS ===\n');
    console.log(`Roof Analyses: ${roofCount} records`);
    console.log(`Customer Quotes: ${quoteCount} records`);
    console.log(`Leads: ${leadCount} records`);

    // Get latest roof analysis
    if (roofCount > 0) {
      const latest = await prisma.roofAnalysis.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      console.log('\n=== LATEST ROOF ANALYSIS ===');
      console.log(`Address: ${latest.address}`);
      console.log(`Session ID: ${latest.sessionId}`);
      console.log(`Panels: ${latest.maxArrayPanelsCount}`);
      console.log(`Area: ${latest.maxArrayAreaMeters2} m²`);
      console.log(`RGB URL: ${latest.rgbUrl ? '✅ Saved' : '❌ Missing'}`);
      console.log(`Quality: ${latest.imageryQuality}`);
      console.log(`Created: ${latest.createdAt}`);
    }

    // Get latest quote
    if (quoteCount > 0) {
      const latest = await prisma.customerQuote.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      console.log('\n=== LATEST CUSTOMER QUOTE ===');
      console.log(`Reference: ${latest.quoteReference}`);
      console.log(`Session ID: ${latest.sessionId}`);
      console.log(`Household: ${latest.householdSize}`);
      console.log(`Has EV: ${latest.hasEv}`);
      console.log(`Has Pool: ${latest.hasPool}`);
      console.log(`Daily Consumption: ${latest.dailyConsumption} kWh`);
      console.log(`System Size: ${latest.systemSize} kW`);
      console.log(`Created: ${latest.createdAt}`);
    }

    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
