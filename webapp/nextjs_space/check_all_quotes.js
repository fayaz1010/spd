require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllQuotes() {
  console.log('=== ALL QUOTES CHECK ===\n');
  
  const allQuotes = await prisma.customerQuote.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });
  
  console.log(`Total quotes found: ${allQuotes.length}\n`);
  
  allQuotes.forEach((quote, index) => {
    console.log(`[${index + 1}] ${quote.id}`);
    console.log(`  Bill: $${quote.quarterlyBill || 0}`);
    console.log(`  Created: ${quote.createdAt.toLocaleString()}`);
    console.log(`  Session: ${quote.sessionId?.substring(0, 30)}...`);
    console.log(`  System: ${quote.systemSizeKw || 0} kW`);
    console.log(`  Has EV: ${quote.hasEv || false}`);
    console.log('');
  });
  
  // Look for any quote with $620 or $840
  const target1 = allQuotes.find(q => q.quarterlyBill === 620);
  const target2 = allQuotes.find(q => q.quarterlyBill === 840);
  
  if (target1) {
    console.log('✅ Found quote with $620:');
    console.log(JSON.stringify(target1, null, 2));
  } else {
    console.log('❌ No quote found with $620');
  }
  
  if (target2) {
    console.log('\n📊 Found quote with $840:');
    console.log(JSON.stringify(target2, null, 2));
  } else {
    console.log('❌ No quote found with $840');
  }
  
  await prisma.$disconnect();
}

checkAllQuotes().catch(console.error);
