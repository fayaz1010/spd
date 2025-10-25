const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRebateConfig() {
  try {
    console.log('\n🔍 Checking Rebate Configuration\n');
    
    const rebateConfigs = await prisma.rebateConfig.findMany({
      where: { active: true },
    });
    
    console.log(`Found ${rebateConfigs.length} active rebate configs:\n`);
    
    for (const config of rebateConfigs) {
      console.log(`📋 ${config.name}`);
      console.log(`   Type: ${config.type}`);
      console.log(`   Region: ${config.region}`);
      console.log(`   Active: ${config.active}`);
      console.log(`   Variables:`, JSON.stringify(config.variables, null, 2));
      console.log('');
    }
    
    // Test calculation for 6.9kW system
    const sresConfig = rebateConfigs.find(r => r.type === 'federal_sres');
    if (sresConfig) {
      const vars = sresConfig.variables;
      const stcValue = vars.stcValue || 38.90;
      const deemingPeriod = vars.deemingPeriod || 6;
      const zoneRating = 1.536; // Perth Zone 2
      
      const numSTCs = Math.floor(6.9 * zoneRating * deemingPeriod);
      const rebate = Math.round(numSTCs * stcValue);
      
      console.log(`\n💰 Test Calculation for 6.9kW in Perth (Zone 2):`);
      console.log(`   STC Value: $${stcValue}`);
      console.log(`   Deeming Period: ${deemingPeriod} years`);
      console.log(`   Zone Rating: ${zoneRating}`);
      console.log(`   STCs: floor(6.9 × ${zoneRating} × ${deemingPeriod}) = ${numSTCs}`);
      console.log(`   Rebate: ${numSTCs} × $${stcValue} = $${rebate}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRebateConfig();
