const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQuoteSettings() {
  console.log('🔍 Checking Quote Settings...\n');
  
  const settings = await prisma.quoteSettings.findFirst({
    where: { region: 'WA' }
  });
  
  if (!settings) {
    console.log('❌ No quote settings found for WA region!');
    console.log('\n💡 Creating default settings...');
    
    const newSettings = await prisma.quoteSettings.create({
      data: {
        region: 'WA',
        commissionType: 'FIXED',
        commissionFixed: 3000,
        commissionPercent: 20,
        minimumProfit: 2000,
      }
    });
    
    console.log('✅ Created:', newSettings);
  } else {
    console.log('✅ Found quote settings:');
    console.log('   Region:', settings.region);
    console.log('   Commission Type:', settings.commissionType);
    console.log('   Commission Percent:', settings.commissionPercent + '%');
    console.log('   Commission Fixed:', '$' + settings.commissionFixed);
    console.log('   Minimum Profit:', '$' + settings.minimumProfit);
    console.log('   Apply After Rebates:', settings.applyCommissionAfterRebates);
  }
  
  await prisma.$disconnect();
}

checkQuoteSettings().catch(console.error);
