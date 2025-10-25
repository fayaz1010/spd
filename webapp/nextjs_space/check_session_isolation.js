require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSessionIsolation() {
  console.log('=== Session Isolation Diagnostic ===\n');
  
  // Get all quotes from the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentQuotes = await prisma.customerQuote.findMany({
    where: {
      createdAt: {
        gte: yesterday
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
  
  console.log(`Found ${recentQuotes.length} quotes in the last 24 hours:\n`);
  
  recentQuotes.forEach((quote, index) => {
    console.log(`Quote ${index + 1}:`);
    console.log(`  Session ID: ${quote.sessionId}`);
    console.log(`  Quote ID: ${quote.id}`);
    console.log(`  Bill Amount: $${quote.quarterlyBill || 0} (bi-monthly)`);
    console.log(`  Created: ${quote.createdAt.toLocaleString()}`);
    console.log(`  Updated: ${quote.updatedAt.toLocaleString()}`);
    console.log(`  Status: ${quote.status}`);
    console.log(`  Has EV: ${quote.hasEv || false}`);
    console.log(`  System Size: ${quote.systemSizeKw || 0} kW`);
    console.log(`  Battery Size: ${quote.batterySizeKwh || 0} kWh`);
    console.log('  ---');
  });
  
  // Check for duplicate sessionIds
  const sessionCounts = {};
  recentQuotes.forEach(quote => {
    sessionCounts[quote.sessionId] = (sessionCounts[quote.sessionId] || 0) + 1;
  });
  
  const duplicates = Object.entries(sessionCounts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log('\n⚠️  WARNING: Found duplicate session IDs:');
    duplicates.forEach(([sessionId, count]) => {
      console.log(`  ${sessionId}: ${count} quotes`);
    });
  } else {
    console.log('\n✅ No duplicate session IDs found - each session has unique records');
  }
  
  // Check the most recent quote details
  if (recentQuotes.length > 0) {
    const latest = recentQuotes[0];
    console.log('\n=== Most Recent Quote Details ===');
    console.log(`Bill Amount: $${latest.quarterlyBill || 0}`);
    console.log(`Household Size: ${latest.householdSize || 0}`);
    console.log(`Has EV: ${latest.hasEv || false}`);
    console.log(`Planning EV: ${latest.planningEv || false}`);
    console.log(`EV Count: ${latest.evCount || 0}`);
    console.log(`EV Charging Time: ${latest.evChargingTime || 'not set'}`);
    console.log(`EV Usage Tier: ${latest.evUsageTier || 'not set'}`);
    console.log(`Has Electric Hot Water: ${latest.hasElectricHotWater || false}`);
    console.log(`Has Electric Cooking: ${latest.hasElectricCooking || false}`);
    console.log(`Daily Usage: ${latest.dailyUsage?.toFixed(2) || 0} kWh`);
  }
  
  await prisma.$disconnect();
}

checkSessionIsolation().catch(console.error);
