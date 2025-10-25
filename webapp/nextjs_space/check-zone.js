const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkZone() {
  try {
    const zone6000 = await prisma.postcodeZoneRating.findUnique({
      where: { postcode: '6000' }
    });
    
    console.log('\nPostcode 6000 (Perth):');
    console.log('Zone:', zone6000?.zone);
    console.log('Rating:', zone6000?.zoneRating);
    console.log('Description:', zone6000?.description);
    
    // Calculate STCs for 6.9kW
    const systemSize = 6.9;
    const deemingPeriod = 6;
    const stcValue = 38.90;
    const zoneRating = zone6000?.zoneRating || 1.382;
    
    const numSTCs = Math.floor(systemSize * zoneRating * deemingPeriod);
    const rebate = Math.round(numSTCs * stcValue);
    
    console.log('\nSTC Calculation for 6.9kW:');
    console.log(`floor(${systemSize} × ${zoneRating} × ${deemingPeriod}) = ${numSTCs} STCs`);
    console.log(`${numSTCs} × $${stcValue} = $${rebate}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkZone();
