import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Calculator Data Requirements...\n');

  // 1. Check Products
  console.log('📦 Products:');
  const panels = await prisma.product.findMany({
    where: { productType: 'PANEL' },
    include: { SupplierProduct: true },
  });
  console.log(`  Panels: ${panels.length}`);
  console.log(`  Panels with pricing: ${panels.filter(p => p.SupplierProduct.length > 0).length}`);
  
  const inverters = await prisma.product.findMany({
    where: { productType: 'INVERTER' },
    include: { SupplierProduct: true },
  });
  console.log(`  Inverters: ${inverters.length}`);
  console.log(`  Inverters with pricing: ${inverters.filter(p => p.SupplierProduct.length > 0).length}`);
  
  const batteries = await prisma.product.findMany({
    where: { productType: 'BATTERY' },
    include: { SupplierProduct: true },
  });
  console.log(`  Batteries: ${batteries.length}`);
  console.log(`  Batteries with pricing: ${batteries.filter(p => p.SupplierProduct.length > 0).length}`);

  // 2. Check Installation Costs
  console.log('\n🔨 Installation Labor Types:');
  const laborTypes = await prisma.installationLaborType.findMany({
    where: { isActive: true },
  });
  console.log(`  Active labor types: ${laborTypes.length}`);
  
  const solarLabor = laborTypes.filter(l => l.category === 'SOLAR');
  console.log(`  Solar installation: ${solarLabor.length}`);
  if (solarLabor.length > 0) {
    console.log(`    Example: ${solarLabor[0].name} - Base: $${solarLabor[0].baseRate}, Per Unit: $${solarLabor[0].perUnitRate}`);
  }
  
  const batteryLabor = laborTypes.filter(l => l.category === 'BATTERY');
  console.log(`  Battery installation: ${batteryLabor.length}`);
  if (batteryLabor.length > 0) {
    console.log(`    Example: ${batteryLabor[0].name} - Base: $${batteryLabor[0].baseRate}, Per Unit: $${batteryLabor[0].perUnitRate}`);
  }

  // 3. Check Rebates
  console.log('\n🎁 Rebate Configurations:');
  const rebates = await prisma.rebateConfig.findMany({
    where: { active: true },
  });
  console.log(`  Active rebates: ${rebates.length}`);
  rebates.forEach(r => {
    console.log(`    ${r.name}: ${r.formula || 'No formula'}`);
  });

  // 4. Check Extra Costs
  console.log('\n💰 Extra Costs:');
  const extraCosts = await prisma.extraCost.findMany({
    where: { active: true },
  });
  console.log(`  Active extra costs: ${extraCosts.length}`);
  if (extraCosts.length > 0) {
    console.log(`    Example: ${extraCosts[0].name} - $${extraCosts[0].cost}`);
  }

  // 5. Sample Calculation
  console.log('\n🧮 Sample Cost Calculation (6.6kW + 10kWh):');
  
  // Find cheapest panel
  const cheapestPanel = panels
    .filter(p => p.SupplierProduct.length > 0)
    .sort((a, b) => {
      const aPrice = Math.min(...a.SupplierProduct.map(sp => sp.unitCost));
      const bPrice = Math.min(...b.SupplierProduct.map(sp => sp.unitCost));
      return aPrice - bPrice;
    })[0];
  
  if (cheapestPanel) {
    const panelPrice = Math.min(...cheapestPanel.SupplierProduct.map(sp => sp.unitCost));
    const panelWattage = (cheapestPanel.specifications as any).wattage || 440;
    const panelsNeeded = Math.ceil(6600 / panelWattage);
    const panelCost = panelsNeeded * panelPrice;
    console.log(`  Panels: ${panelsNeeded} × ${cheapestPanel.name} @ $${panelPrice} = $${panelCost}`);
  }
  
  // Find cheapest inverter
  const cheapestInverter = inverters
    .filter(p => p.SupplierProduct.length > 0)
    .sort((a, b) => {
      const aPrice = Math.min(...a.SupplierProduct.map(sp => sp.unitCost));
      const bPrice = Math.min(...b.SupplierProduct.map(sp => sp.unitCost));
      return aPrice - bPrice;
    })[0];
  
  if (cheapestInverter) {
    const inverterPrice = Math.min(...cheapestInverter.SupplierProduct.map(sp => sp.unitCost));
    console.log(`  Inverter: ${cheapestInverter.name} = $${inverterPrice}`);
  }
  
  // Find cheapest battery
  const cheapestBattery = batteries
    .filter(p => p.SupplierProduct.length > 0)
    .sort((a, b) => {
      const aPrice = Math.min(...a.SupplierProduct.map(sp => sp.unitCost));
      const bPrice = Math.min(...b.SupplierProduct.map(sp => sp.unitCost));
      return aPrice - bPrice;
    })[0];
  
  if (cheapestBattery) {
    const batteryPrice = Math.min(...cheapestBattery.SupplierProduct.map(sp => sp.unitCost));
    console.log(`  Battery: ${cheapestBattery.name} = $${batteryPrice}`);
  }
  
  // Installation
  const solarInstall = solarLabor.find(l => l.perUnitRate && l.perUnitRate > 0);
  if (solarInstall) {
    const installCost = 6600 * (solarInstall.perUnitRate || 0);
    console.log(`  Solar Installation: 6600W × $${solarInstall.perUnitRate}/W = $${installCost}`);
  }
  
  const batteryInstall = batteryLabor.find(l => l.baseRate && l.baseRate > 0);
  if (batteryInstall) {
    const batteryInstallCost = (batteryInstall.baseRate || 0) + (10 * (batteryInstall.perUnitRate || 0));
    console.log(`  Battery Installation: $${batteryInstall.baseRate} + (10kWh × $${batteryInstall.perUnitRate}) = $${batteryInstallCost}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Data Check Complete!');
  console.log('='.repeat(70));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
