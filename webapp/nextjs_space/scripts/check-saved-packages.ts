/**
 * CHECK SAVED PACKAGES IN DATABASE
 * 
 * This script checks what's actually stored in the database for website packages
 * to identify where the pricing anomaly comes from.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`█  CHECKING SAVED PACKAGES IN DATABASE`);
  console.log(`${'█'.repeat(80)}\n`);
  
  // Check SystemPackageTemplate table
  const systemPackages = await prisma.systemPackageTemplate.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  
  console.log(`Found ${systemPackages.length} active SystemPackageTemplate records:\n`);
  
  systemPackages.forEach((pkg, index) => {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`PACKAGE ${index + 1}: ${pkg.displayName}`);
    console.log(`${'─'.repeat(80)}`);
    console.log(`ID: ${pkg.id}`);
    console.log(`Name: ${pkg.name}`);
    console.log(`Display Name: ${pkg.displayName}`);
    console.log(`Description: ${pkg.description}`);
    console.log(`Tier: ${pkg.tier}`);
    console.log(`Sort Order: ${pkg.sortOrder}`);
    console.log(`Active: ${pkg.active}`);
    console.log(``);
    
    console.log(`SIZING STRATEGIES:`);
    console.log(`  Solar: ${pkg.solarSizingStrategy} - ${pkg.solarFixedKw}kW`);
    console.log(`  Battery: ${pkg.batterySizingStrategy} - ${pkg.batteryFixedKwh}kWh`);
    console.log(``);
    
    console.log(`FEATURES (JSON):`);
    const features = pkg.features as any;
    if (features) {
      console.log(`  System Size: ${features.systemSizeKw}kW`);
      console.log(`  Panel Count: ${features.panelCount}`);
      console.log(`  Battery Size: ${features.batterySizeKwh}kWh`);
      console.log(``);
      
      console.log(`  PRICING BREAKDOWN:`);
      console.log(`    Panel Cost: $${features.panelCost?.toLocaleString() || 'N/A'}`);
      console.log(`    Inverter Cost: $${features.inverterCost?.toLocaleString() || 'N/A'}`);
      console.log(`    Battery Cost: $${features.batteryCost?.toLocaleString() || 'N/A'}`);
      console.log(`    Installation Cost: $${features.installationCost?.toLocaleString() || 'N/A'}`);
      console.log(`    Installation Wholesale: $${features.installationWholesaleCost?.toLocaleString() || 'N/A'}`);
      console.log(`    Extra Costs: $${features.extraCostsTotal?.toLocaleString() || 'N/A'}`);
      console.log(`    Subtotal: $${features.subtotal?.toLocaleString() || 'N/A'}`);
      console.log(``);
      
      console.log(`  REBATES:`);
      console.log(`    STC Rebate: $${features.stcRebate?.toLocaleString() || 'N/A'}`);
      console.log(`    Federal Battery: $${features.federalBatteryRebate?.toLocaleString() || 'N/A'}`);
      console.log(`    State Battery: $${features.stateBatteryRebate?.toLocaleString() || 'N/A'}`);
      console.log(`    Battery Rebate: $${features.batteryRebate?.toLocaleString() || 'N/A'}`);
      console.log(`    Total Rebates: $${features.totalRebates?.toLocaleString() || 'N/A'}`);
      console.log(``);
      
      console.log(`  🎯 FINAL PRICE: $${features.finalPrice?.toLocaleString() || 'N/A'}`);
      console.log(`  Cost Per Day: $${features.costPerDay?.toFixed(2) || 'N/A'}`);
      console.log(``);
      
      console.log(`  PROFIT ANALYSIS:`);
      console.log(`    Wholesale Cost: $${features.totalWholesaleCost?.toLocaleString() || 'N/A'}`);
      console.log(`    Gross Profit: $${features.grossProfit?.toLocaleString() || 'N/A'}`);
      console.log(`    Profit Margin: ${features.profitMargin?.toFixed(1) || 'N/A'}%`);
      console.log(``);
      
      console.log(`  SAVINGS:`);
      console.log(`    Annual Savings: $${features.annualSavings?.toLocaleString() || 'N/A'}`);
      console.log(`    25-Year Savings: $${features.year25Savings?.toLocaleString() || 'N/A'}`);
      console.log(`    Payback Years: ${features.paybackYears?.toFixed(1) || 'N/A'}`);
    } else {
      console.log(`  ⚠️ No features data found`);
    }
  });
  
  console.log(`\n\n${'█'.repeat(80)}`);
  console.log(`█  CHECKING FOR DUPLICATE OR CONFLICTING FIELDS`);
  console.log(`${'█'.repeat(80)}\n`);
  
  systemPackages.forEach(pkg => {
    const features = pkg.features as any;
    if (features) {
      const issues = [];
      
      // Check for duplicate pricing fields
      if (features.installationCost && features.installationWholesaleCost) {
        if (features.installationCost !== features.installationWholesaleCost) {
          issues.push(`Installation cost mismatch: Retail=$${features.installationCost} vs Wholesale=$${features.installationWholesaleCost}`);
        }
      }
      
      // Check if rebates are consistent
      const calculatedTotalRebates = (features.stcRebate || 0) + 
                                     (features.federalBatteryRebate || 0) + 
                                     (features.stateBatteryRebate || 0) + 
                                     (features.batteryRebate || 0);
      
      if (features.totalRebates && Math.abs(calculatedTotalRebates - features.totalRebates) > 1) {
        issues.push(`Rebate total mismatch: Sum=$${calculatedTotalRebates} vs Stored=$${features.totalRebates}`);
      }
      
      // Check if final price calculation is correct
      const calculatedFinalPrice = (features.subtotal || 0) - (features.totalRebates || 0);
      const gst = calculatedFinalPrice * 0.1;
      const expectedFinalPrice = calculatedFinalPrice + gst;
      
      if (features.finalPrice && Math.abs(expectedFinalPrice - features.finalPrice) > 1) {
        issues.push(`Final price calculation mismatch: Expected=$${expectedFinalPrice.toFixed(0)} vs Stored=$${features.finalPrice}`);
      }
      
      if (issues.length > 0) {
        console.log(`\n⚠️ ISSUES FOUND IN: ${pkg.displayName}`);
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
    }
  });
  
  console.log(`\n\n${'█'.repeat(80)}`);
  console.log(`█  PRICE COMPARISON (SHOULD INCREASE WITH SIZE)`);
  console.log(`${'█'.repeat(80)}\n`);
  
  const sortedBySize = [...systemPackages].sort((a, b) => {
    const aSize = (a.features as any)?.systemSizeKw || 0;
    const bSize = (b.features as any)?.systemSizeKw || 0;
    return aSize - bSize;
  });
  
  console.log(`Packages sorted by system size:\n`);
  sortedBySize.forEach(pkg => {
    const features = pkg.features as any;
    const systemSize = features?.systemSizeKw || 0;
    const batterySize = features?.batterySizeKwh || 0;
    const finalPrice = features?.finalPrice || 0;
    const pricePerKw = systemSize > 0 ? finalPrice / systemSize : 0;
    
    console.log(`${pkg.displayName.padEnd(40)} | ${systemSize.toFixed(1)}kW + ${batterySize}kWh | $${finalPrice.toLocaleString().padStart(8)} | $${pricePerKw.toFixed(0)}/kW`);
  });
  
  // Check for anomalies
  console.log(`\n\nANOMALY CHECK:`);
  for (let i = 1; i < sortedBySize.length; i++) {
    const prev = sortedBySize[i - 1];
    const curr = sortedBySize[i];
    
    const prevFeatures = prev.features as any;
    const currFeatures = curr.features as any;
    
    const prevPrice = prevFeatures?.finalPrice || 0;
    const currPrice = currFeatures?.finalPrice || 0;
    const prevSize = prevFeatures?.systemSizeKw || 0;
    const currSize = currFeatures?.systemSizeKw || 0;
    
    if (currSize > prevSize && currPrice < prevPrice) {
      console.log(`\n❌ ANOMALY DETECTED!`);
      console.log(`   ${prev.displayName} (${prevSize}kW): $${prevPrice.toLocaleString()}`);
      console.log(`   ${curr.displayName} (${currSize}kW): $${currPrice.toLocaleString()}`);
      console.log(`   Larger system is CHEAPER by $${(prevPrice - currPrice).toLocaleString()}`);
    }
  }
  
  await prisma.$disconnect();
}

main();
