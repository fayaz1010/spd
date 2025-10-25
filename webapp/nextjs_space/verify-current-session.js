const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCurrentSession() {
  try {
    console.log('\n=== VERIFYING LATEST SESSION DATA ===\n');

    // Get the most recent CustomerQuote
    const latestQuote = await prisma.customerQuote.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestQuote) {
      console.log('❌ No CustomerQuote found');
      return;
    }

    console.log('📋 CUSTOMER QUOTE');
    console.log('================');
    console.log(`Quote Reference: ${latestQuote.quoteReference}`);
    console.log(`Session ID: ${latestQuote.sessionId}`);
    console.log(`Status: ${latestQuote.status}`);
    console.log(`Created: ${latestQuote.createdAt}`);
    console.log('');

    console.log('🏠 PROPERTY DETAILS (Step 1)');
    console.log('============================');
    console.log(`Address: ${latestQuote.address || '❌ NOT SAVED'}`);
    console.log(`Suburb: ${latestQuote.suburb || 'N/A'}`);
    console.log(`Property Type: ${latestQuote.propertyType || '❌ NOT SAVED'}`);
    console.log(`Roof Type: ${latestQuote.roofType || '❌ NOT SAVED'}`);
    console.log(`Coordinates: ${latestQuote.latitude}, ${latestQuote.longitude}`);
    console.log('');

    console.log('⚡ ENERGY PROFILE (Step 2)');
    console.log('==========================');
    console.log(`Household Size: ${latestQuote.householdSize || '❌ NOT SAVED'}`);
    console.log(`Bimonthly Bill: $${latestQuote.bimonthlyBill || '❌ NOT SAVED'}`);
    console.log(`Quarterly Bill: $${latestQuote.quarterlyBill || 'N/A'}`);
    console.log(`Daily Consumption: ${latestQuote.dailyConsumption || '❌ NOT SAVED'} kWh`);
    console.log(`Has EV: ${latestQuote.hasEv ? '✅ Yes' : '❌ No'}`);
    if (latestQuote.hasEv) {
      console.log(`  - EV Count: ${latestQuote.evCount}`);
      console.log(`  - Charging Method: ${latestQuote.evChargingMethod}`);
      console.log(`  - Battery Size: ${latestQuote.evBatterySize} kWh`);
      console.log(`  - Charging Hours: ${latestQuote.evChargingHours} hrs/day`);
    }
    console.log(`Has Pool: ${latestQuote.hasPool ? '✅ Yes' : '❌ No'}`);
    if (latestQuote.hasPool) {
      console.log(`  - Heated: ${latestQuote.poolHeated ? 'Yes' : 'No'}`);
    }
    console.log(`Home Offices: ${latestQuote.homeOffices || 0}`);
    console.log(`AC Usage: ${latestQuote.acUsage || 'N/A'}`);
    console.log(`Electric Hot Water: ${latestQuote.hasElectricHotWater ? 'Yes' : 'No'}`);
    console.log('');

    // Check if energy profile JSON is saved
    if (latestQuote.energyProfile) {
      console.log('✅ Full Energy Profile JSON saved');
      const profile = latestQuote.energyProfile;
      if (profile.componentBreakdown) {
        console.log('   Component Breakdown:');
        console.log(`   - Base: ${profile.componentBreakdown.baseAppliances} kWh`);
        console.log(`   - HVAC: ${profile.componentBreakdown.hvac} kWh`);
        console.log(`   - EV: ${profile.componentBreakdown.ev} kWh`);
        console.log(`   - Pool: ${profile.componentBreakdown.pool} kWh`);
      }
    } else {
      console.log('❌ Energy Profile JSON NOT saved');
    }
    console.log('');

    // Check for linked RoofAnalysis
    console.log('🏠 ROOF ANALYSIS (Step 3)');
    console.log('=========================');
    
    const roofAnalysis = await prisma.roofAnalysis.findFirst({
      where: {
        OR: [
          { sessionId: latestQuote.sessionId },
          { quoteId: latestQuote.id },
        ]
      },
      orderBy: { createdAt: 'desc' },
    });

    if (roofAnalysis) {
      console.log('✅ Roof Analysis Found');
      console.log(`Address: ${roofAnalysis.address}`);
      console.log(`Max Panels: ${roofAnalysis.maxArrayPanelsCount}`);
      console.log(`Roof Area: ${roofAnalysis.maxArrayAreaMeters2.toFixed(1)} m²`);
      console.log(`Sunshine Hours/Year: ${roofAnalysis.maxSunshineHoursPerYear.toLocaleString()}`);
      console.log(`Image URL: ${roofAnalysis.rgbUrl ? '✅ Saved' : '❌ Missing'}`);
      console.log(`Quality: ${roofAnalysis.imageryQuality}`);
      console.log(`Confidence: ${roofAnalysis.confidenceLevel}`);
      console.log(`Linked via: ${roofAnalysis.sessionId ? 'sessionId' : roofAnalysis.quoteId ? 'quoteId' : '❌ NOT LINKED'}`);
    } else {
      console.log('❌ No Roof Analysis found for this session');
    }
    console.log('');

    // Summary for Step 4
    console.log('📊 DATA READY FOR STEP 4 (System Packages)?');
    console.log('============================================');
    const readyChecks = {
      'Address': !!latestQuote.address,
      'Daily Consumption': !!latestQuote.dailyConsumption,
      'Energy Profile': !!latestQuote.energyProfile,
      'Roof Analysis': !!roofAnalysis,
      'Household Details': !!latestQuote.householdSize,
    };

    Object.entries(readyChecks).forEach(([key, value]) => {
      console.log(`${value ? '✅' : '❌'} ${key}`);
    });

    const allReady = Object.values(readyChecks).every(v => v);
    console.log('');
    if (allReady) {
      console.log('✅ ALL DATA READY - Step 4 can generate packages from database!');
      console.log('');
      console.log('📦 RECOMMENDED APPROACH FOR STEP 4:');
      console.log('===================================');
      console.log('1. Fetch CustomerQuote by sessionId');
      console.log('2. Fetch RoofAnalysis by sessionId or quoteId');
      console.log('3. Use dailyConsumption from CustomerQuote');
      console.log('4. Use maxArrayPanelsCount from RoofAnalysis');
      console.log('5. Calculate 3 packages: Small, Medium, Large');
      console.log('6. Save packages back to CustomerQuote');
    } else {
      console.log('❌ MISSING DATA - Cannot generate packages yet');
    }
    console.log('');

    // Return data for programmatic use
    return {
      quote: latestQuote,
      roofAnalysis: roofAnalysis,
      allReady: allReady,
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCurrentSession();
