/**
 * PRICING DIAGNOSTIC SCRIPT
 * 
 * This script traces the EXACT calculation flow for packages to identify
 * where the pricing anomaly occurs (smaller system costing more than larger).
 * 
 * Run with: npx ts-node scripts/diagnose-pricing.ts
 */

import { PrismaClient } from '@prisma/client';
import { calculateUnifiedQuote } from '../lib/unified-quote-calculator';

const prisma = new PrismaClient();

interface DiagnosticResult {
  packageName: string;
  systemSize: number;
  batterySize: number;
  
  // Step 1: Product Selection
  panelSelected: {
    name: string;
    wattage: number;
    unitCost: number;
    retailPrice: number;
    count: number;
    totalCost: number;
  };
  
  inverterSelected: {
    name: string;
    capacity: number;
    unitCost: number;
    retailPrice: number;
    totalCost: number;
  };
  
  batterySelected?: {
    name: string;
    capacity: number;
    unitCost: number;
    retailPrice: number;
    units: number;
    totalCost: number;
  };
  
  // Step 2: Installation Cost Calculation
  installationCost: {
    method: string;
    preferredProvider: string;
    itemsApplied: Array<{
      code: string;
      name: string;
      category: string;
      providerType: string;
      calculationType: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      calculation: string;
    }>;
    subtotal: number;
    gst: number;
    total: number;
  };
  
  // Step 3: Cost Breakdown
  costs: {
    panelCost: number;
    inverterCost: number;
    batteryCost: number;
    installationCost: number;
    extraCosts: number;
    subtotal: number;
  };
  
  // Step 4: Rebates
  rebates: {
    federalSolar: number;
    federalBattery: number;
    stateBattery: number;
    total: number;
  };
  
  // Step 5: Final Pricing
  pricing: {
    totalAfterRebates: number;
    gst: number;
    finalPrice: number;
  };
  
  // Step 6: Profit Analysis
  profit: {
    wholesaleCost: number;
    retailPrice: number;
    grossProfit: number;
    profitMargin: number;
  };
}

async function diagnosePackage(
  systemSizeKw: number,
  batterySizeKwh: number,
  packageName: string
): Promise<DiagnosticResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`DIAGNOSING: ${packageName}`);
  console.log(`System: ${systemSizeKw}kW | Battery: ${batterySizeKwh}kWh`);
  console.log(`${'='.repeat(80)}\n`);
  
  // Call the unified calculator with EXACT same params as quote tester
  const quote = await calculateUnifiedQuote({
    systemSizeKw,
    batterySizeKwh,
    postcode: '6000',
    region: 'WA',
    includeInstallation: true,
    installationMethod: 'allin',
    installationMarginPercent: 15,
    useConservativePricing: true,
  });
  
  // Get installation cost breakdown
  const { calculateInstallationCost } = await import('../lib/installation-cost-calculator');
  const installationResult = await calculateInstallationCost({
    systemSize: quote.systemSizeKw,
    panelCount: quote.panelCount,
    hasBattery: quote.batterySizeKwh > 0,
    batteryCapacity: quote.batterySizeKwh,
    batteryType: 'dc_coupled',
    isRetrofit: false,
    storeys: 1,
    roofType: 'tile',
    roofPitch: 'standard',
    orientation: 'portrait',
    rakedCeilings: false,
    phases: 1,
    hasOptimisers: false,
    additionalInverters: 0,
    splits: 0,
    preferredProvider: 'SUBCONTRACTOR',
  });
  
  const result: DiagnosticResult = {
    packageName,
    systemSize: quote.systemSizeKw,
    batterySize: quote.batterySizeKwh,
    
    panelSelected: {
      name: quote.selectedPanel.name,
      wattage: quote.selectedPanel.wattage,
      unitCost: quote.selectedPanel.unitCost,
      retailPrice: quote.selectedPanel.retailPrice,
      count: quote.panelCount,
      totalCost: quote.costs.panelCost,
    },
    
    inverterSelected: {
      name: quote.selectedInverter.name,
      capacity: quote.selectedInverter.capacity,
      unitCost: quote.selectedInverter.unitCost,
      retailPrice: quote.selectedInverter.retailPrice,
      totalCost: quote.costs.inverterCost,
    },
    
    batterySelected: quote.selectedBattery ? {
      name: quote.selectedBattery.name,
      capacity: quote.selectedBattery.capacity,
      unitCost: quote.selectedBattery.unitCost,
      retailPrice: quote.selectedBattery.retailPrice,
      units: quote.batteryUnitsNeeded || 1,
      totalCost: quote.costs.batteryCost,
    } : undefined,
    
    installationCost: {
      method: 'allin',
      preferredProvider: 'SUBCONTRACTOR',
      itemsApplied: installationResult.items.map(item => ({
        code: item.code,
        name: item.name,
        category: item.category,
        providerType: item.providerType,
        calculationType: item.unit,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        calculation: item.calculation,
      })),
      subtotal: installationResult.subtotal,
      gst: installationResult.gst,
      total: installationResult.total,
    },
    
    costs: quote.costs,
    
    rebates: {
      federalSolar: quote.rebates.federalSolar,
      federalBattery: quote.rebates.federalBattery,
      stateBattery: quote.rebates.stateBattery,
      total: quote.rebates.total,
    },
    
    pricing: {
      totalAfterRebates: quote.totalAfterRebates,
      gst: quote.gst,
      finalPrice: quote.finalPrice,
    },
    
    profit: quote.profit,
  };
  
  return result;
}

function printDiagnostic(result: DiagnosticResult) {
  console.log(`\n📦 PACKAGE: ${result.packageName}`);
  console.log(`   System: ${result.systemSize}kW | Battery: ${result.batterySize}kWh\n`);
  
  console.log(`STEP 1: PRODUCT SELECTION`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);
  console.log(`Panel: ${result.panelSelected.name}`);
  console.log(`  - Wattage: ${result.panelSelected.wattage}W`);
  console.log(`  - Unit Cost: $${result.panelSelected.unitCost.toFixed(2)}`);
  console.log(`  - Retail Price: $${result.panelSelected.retailPrice.toFixed(2)}`);
  console.log(`  - Count: ${result.panelSelected.count}`);
  console.log(`  - Total: $${result.panelSelected.totalCost.toLocaleString()}`);
  
  console.log(`\nInverter: ${result.inverterSelected.name}`);
  console.log(`  - Capacity: ${result.inverterSelected.capacity}kW`);
  console.log(`  - Unit Cost: $${result.inverterSelected.unitCost.toFixed(2)}`);
  console.log(`  - Retail Price: $${result.inverterSelected.retailPrice.toFixed(2)}`);
  console.log(`  - Total: $${result.inverterSelected.totalCost.toLocaleString()}`);
  
  if (result.batterySelected) {
    console.log(`\nBattery: ${result.batterySelected.name}`);
    console.log(`  - Capacity: ${result.batterySelected.capacity}kWh`);
    console.log(`  - Unit Cost: $${result.batterySelected.unitCost.toFixed(2)}`);
    console.log(`  - Retail Price: $${result.batterySelected.retailPrice.toFixed(2)}`);
    console.log(`  - Units: ${result.batterySelected.units}`);
    console.log(`  - Total: $${result.batterySelected.totalCost.toLocaleString()}`);
  }
  
  console.log(`\n\nSTEP 2: INSTALLATION COST CALCULATION`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);
  console.log(`Method: ${result.installationCost.method}`);
  console.log(`Provider: ${result.installationCost.preferredProvider}\n`);
  
  console.log(`Installation Items Applied:`);
  result.installationCost.itemsApplied.forEach(item => {
    console.log(`  ${item.code} - ${item.name}`);
    console.log(`    Category: ${item.category} | Provider: ${item.providerType}`);
    console.log(`    Calculation: ${item.calculation}`);
    console.log(`    Quantity: ${item.quantity} | Unit: $${item.unitCost.toFixed(2)} | Total: $${item.totalCost.toFixed(2)}`);
  });
  
  console.log(`\n  Installation Subtotal: $${result.installationCost.subtotal.toFixed(2)}`);
  console.log(`  Installation GST: $${result.installationCost.gst.toFixed(2)}`);
  console.log(`  Installation Total: $${result.installationCost.total.toFixed(2)}`);
  
  console.log(`\n\nSTEP 3: COST BREAKDOWN`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);
  console.log(`  Panel Cost:        $${result.costs.panelCost.toLocaleString()}`);
  console.log(`  Inverter Cost:     $${result.costs.inverterCost.toLocaleString()}`);
  console.log(`  Battery Cost:      $${result.costs.batteryCost.toLocaleString()}`);
  console.log(`  Installation Cost: $${result.costs.installationCost.toLocaleString()}`);
  console.log(`  Extra Costs:       $${result.costs.extraCosts.toLocaleString()}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  SUBTOTAL:          $${result.costs.subtotal.toLocaleString()}`);
  
  console.log(`\n\nSTEP 4: REBATES`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);
  console.log(`  Federal Solar (STC):   $${result.rebates.federalSolar.toLocaleString()}`);
  console.log(`  Federal Battery:       $${result.rebates.federalBattery.toLocaleString()}`);
  console.log(`  State Battery:         $${result.rebates.stateBattery.toLocaleString()}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  TOTAL REBATES:         $${result.rebates.total.toLocaleString()}`);
  
  console.log(`\n\nSTEP 5: FINAL PRICING`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);
  console.log(`  Subtotal:              $${result.costs.subtotal.toLocaleString()}`);
  console.log(`  Less Rebates:         -$${result.rebates.total.toLocaleString()}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  After Rebates:         $${result.pricing.totalAfterRebates.toLocaleString()}`);
  console.log(`  GST (10%):            +$${result.pricing.gst.toLocaleString()}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  🎯 FINAL PRICE:        $${result.pricing.finalPrice.toLocaleString()}`);
  
  console.log(`\n\nSTEP 6: PROFIT ANALYSIS`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);
  console.log(`  Wholesale Cost:        $${result.profit.wholesaleCost.toLocaleString()}`);
  console.log(`  Retail Price:          $${result.profit.retailPrice.toLocaleString()}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  Gross Profit:          $${result.profit.grossProfit.toLocaleString()}`);
  console.log(`  Profit Margin:         ${result.profit.profitMargin.toFixed(1)}%`);
}

async function main() {
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`█  PRICING DIAGNOSTIC TOOL - INVESTIGATING ANOMALY`);
  console.log(`█  Issue: Smaller system (6.6kW) costs MORE than larger system (13.2kW+20kWh)`);
  console.log(`${'█'.repeat(80)}\n`);
  
  try {
    // Test the three packages from the screenshots
    const package1 = await diagnosePackage(6.6, 0, 'Smart Starter (6.6kW)');
    const package2 = await diagnosePackage(10, 13.5, 'Complete Coverage (10kW + 13.5kWh)');
    const package3 = await diagnosePackage(13.2, 20, 'Energy Independent (13.2kW + 20kWh)');
    
    printDiagnostic(package1);
    printDiagnostic(package2);
    printDiagnostic(package3);
    
    // Comparison Summary
    console.log(`\n\n${'█'.repeat(80)}`);
    console.log(`█  COMPARISON SUMMARY`);
    console.log(`${'█'.repeat(80)}\n`);
    
    const packages = [package1, package2, package3];
    
    console.log(`Package Comparison:`);
    console.log(`─────────────────────────────────────────────────────────────────────────────`);
    packages.forEach(pkg => {
      console.log(`${pkg.packageName}:`);
      console.log(`  System: ${pkg.systemSize}kW | Battery: ${pkg.batterySize}kWh`);
      console.log(`  Final Price: $${pkg.pricing.finalPrice.toLocaleString()}`);
      console.log(`  Price per kW: $${(pkg.pricing.finalPrice / pkg.systemSize).toFixed(0)}`);
      console.log(``);
    });
    
    // Identify the issue
    console.log(`\n${'█'.repeat(80)}`);
    console.log(`█  ISSUE IDENTIFICATION`);
    console.log(`${'█'.repeat(80)}\n`);
    
    if (package1.pricing.finalPrice > package3.pricing.finalPrice) {
      console.log(`❌ ANOMALY CONFIRMED!`);
      console.log(`   ${package1.packageName}: $${package1.pricing.finalPrice.toLocaleString()}`);
      console.log(`   ${package3.packageName}: $${package3.pricing.finalPrice.toLocaleString()}`);
      console.log(`   Difference: $${(package1.pricing.finalPrice - package3.pricing.finalPrice).toLocaleString()}`);
      console.log(``);
      console.log(`Investigating root cause...`);
      console.log(``);
      
      // Compare installation costs
      console.log(`Installation Cost Comparison:`);
      console.log(`  ${package1.packageName}: $${package1.costs.installationCost.toLocaleString()}`);
      console.log(`  ${package3.packageName}: $${package3.costs.installationCost.toLocaleString()}`);
      console.log(``);
      
      // Compare rebates
      console.log(`Rebate Comparison:`);
      console.log(`  ${package1.packageName}: $${package1.rebates.total.toLocaleString()}`);
      console.log(`  ${package3.packageName}: $${package3.rebates.total.toLocaleString()}`);
      console.log(``);
      
      // Compare equipment costs
      console.log(`Equipment Cost Comparison:`);
      console.log(`  ${package1.packageName}: $${(package1.costs.panelCost + package1.costs.inverterCost + package1.costs.batteryCost).toLocaleString()}`);
      console.log(`  ${package3.packageName}: $${(package3.costs.panelCost + package3.costs.inverterCost + package3.costs.batteryCost).toLocaleString()}`);
    } else {
      console.log(`✅ No anomaly detected in current calculation.`);
      console.log(`   This suggests the issue is in how packages are SAVED or DISPLAYED.`);
    }
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
