const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMargins() {
  try {
    console.log('\n🔍 CHECKING CURRENT INSTALLATION MARGINS & PRICING\n');
    
    // Check InstallationPricing table
    const installPricing = await prisma.installationPricing.findMany({
      where: { active: true }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 INSTALLATION PRICING CONFIG');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    installPricing.forEach(p => {
      console.log(`Region: ${p.region}`);
      console.log(`  Base Callout: $${p.baseCalloutFee}`);
      console.log(`  Hourly Rate: $${p.hourlyRate}/hr`);
      console.log(`  Panel Install: $${p.panelInstallBase}/panel`);
      console.log(`  Inverter Install: $${p.inverterInstallBase}`);
      console.log(`  Battery Install: $${p.batteryInstallBase} + $${p.batteryInstallPerKwh}/kWh`);
      console.log(`  Commissioning: $${p.commissioningFee}`);
      console.log(`  Tile Roof Multiplier: ${p.tileRoofMultiplier}x`);
      console.log(`  Two Story Multiplier: ${p.twoStoryMultiplier}x`);
      console.log('');
    });
    
    // Check if there's a margin/commission field
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 CURRENT MARGIN CALCULATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('In unified-quote-calculator.ts:');
    console.log('  wholesaleCost = ... + (installationCost * 0.7)');
    console.log('  This means: 30% of installation cost is profit margin');
    console.log('');
    console.log('Example: If installation = $5,000');
    console.log('  Wholesale cost: $3,500 (70%)');
    console.log('  Profit: $1,500 (30%)');
    console.log('');
    
    // Check SystemSettings for any commission settings
    const systemSettings = await prisma.systemSettings.findFirst();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  SYSTEM SETTINGS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (systemSettings) {
      console.log('Deposit Settings:');
      console.log(`  Type: ${systemSettings.depositType || 'N/A'}`);
      console.log(`  Percentage: ${systemSettings.depositPercentage || 'N/A'}%`);
      console.log(`  Fixed Amount: $${systemSettings.depositFixedAmount || 'N/A'}`);
      console.log('');
    }
    
    // Calculate example with subbie rates
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 EXAMPLE: 6.6kW + 10kWh Battery');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const subbie = await prisma.subcontractor.findFirst({
      where: { companyName: 'ABC Solar Installations' }
    });
    
    if (subbie) {
      const solarCost = 6900 * subbie.perWattRate;
      const batteryCost = subbie.batteryBaseRate + (10 * subbie.batteryPerKwhRate);
      const totalSubbie = solarCost + batteryCost;
      
      console.log('Subcontractor (ABC Solar):');
      console.log(`  Solar: 6,900W × $${subbie.perWattRate}/watt = $${solarCost}`);
      console.log(`  Battery: $${subbie.batteryBaseRate} + (10 × $${subbie.batteryPerKwhRate}) = $${batteryCost}`);
      console.log(`  Total: $${totalSubbie}`);
      console.log('');
      
      console.log('If we charge customer $5,970:');
      console.log(`  Our Cost: $${totalSubbie}`);
      console.log(`  Margin: $${5970 - totalSubbie} (${Math.round((5970 - totalSubbie) / 5970 * 100)}%)`);
      console.log('');
      
      console.log('💡 RECOMMENDATION:');
      console.log('  Add commission/margin field to InstallationPricing table');
      console.log('  This allows configurable markup on subbie rates');
      console.log('  Example: 15% commission = $2,818 × 1.15 = $3,241 charged to customer');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMargins();
