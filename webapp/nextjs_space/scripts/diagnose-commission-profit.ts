/**
 * COMMISSION & PROFIT MARGIN DIAGNOSTIC SCRIPT
 * 
 * This script traces EXACTLY where commission and profit margins are added
 * to identify if they're being applied multiple times (double-dipping).
 * 
 * Run with: npx tsx scripts/diagnose-commission-profit.ts
 */

import { PrismaClient } from '@prisma/client';
import { calculateUnifiedQuote } from '../lib/unified-quote-calculator';

const prisma = new PrismaClient();

interface CommissionTrace {
  location: string;
  description: string;
  appliedTo: string;
  rate: number;
  baseAmount: number;
  commissionAmount: number;
  totalAfter: number;
}

async function diagnoseCommissionAndProfit(
  systemSizeKw: number,
  batterySizeKwh: number,
  packageName: string
) {
  console.log(`\n${'█'.repeat(100)}`);
  console.log(`█  COMMISSION & PROFIT DIAGNOSTIC: ${packageName}`);
  console.log(`█  System: ${systemSizeKw}kW | Battery: ${batterySizeKwh}kWh`);
  console.log(`${'█'.repeat(100)}\n`);
  
  const commissionTrace: CommissionTrace[] = [];
  
  // ============================================================================
  // STEP 1: Get Raw Product Costs (NO MARKUP YET)
  // ============================================================================
  console.log(`STEP 1: RAW PRODUCT COSTS (Wholesale/Unit Cost)`);
  console.log(`${'─'.repeat(100)}\n`);
  
  // Get panel
  const panels = await prisma.product.findMany({
    where: { productType: 'PANEL', isAvailable: true },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        orderBy: { unitCost: 'asc' },
        take: 1,
        include: { supplier: true },
      },
    },
  });
  
  const selectedPanel = panels[0];
  const panelSupplier = selectedPanel.SupplierProduct[0];
  const panelWattage = (selectedPanel.specifications as any)?.wattage || 450;
  const panelCount = Math.ceil((systemSizeKw * 1000) / panelWattage);
  
  console.log(`Panel: ${selectedPanel.name}`);
  console.log(`  Supplier: ${panelSupplier.supplier.name}`);
  console.log(`  Unit Cost (Wholesale): $${panelSupplier.unitCost.toFixed(2)}`);
  console.log(`  Retail Price (in DB): $${panelSupplier.retailPrice?.toFixed(2) || 'N/A'}`);
  console.log(`  Markup % (in DB): ${panelSupplier.markupPercent?.toFixed(1) || 'N/A'}%`);
  console.log(`  Quantity: ${panelCount} panels`);
  console.log(`  Total Wholesale: $${(panelSupplier.unitCost * panelCount).toFixed(2)}`);
  console.log(`  Total Retail: $${((panelSupplier.retailPrice || 0) * panelCount).toFixed(2)}`);
  
  if (panelSupplier.retailPrice && panelSupplier.retailPrice > panelSupplier.unitCost) {
    const markup = panelSupplier.retailPrice - panelSupplier.unitCost;
    const markupPercent = (markup / panelSupplier.unitCost) * 100;
    commissionTrace.push({
      location: 'Panel Supplier Pricing',
      description: 'Markup from unit cost to retail price',
      appliedTo: 'Panel cost',
      rate: markupPercent,
      baseAmount: panelSupplier.unitCost * panelCount,
      commissionAmount: markup * panelCount,
      totalAfter: (panelSupplier.retailPrice || 0) * panelCount,
    });
    console.log(`  ⚠️ MARKUP DETECTED: ${markupPercent.toFixed(1)}% = $${(markup * panelCount).toFixed(2)}`);
  }
  console.log(``);
  
  // Get inverter
  const inverters = await prisma.product.findMany({
    where: { productType: 'INVERTER', isAvailable: true },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        orderBy: { unitCost: 'asc' },
        take: 1,
        include: { supplier: true },
      },
    },
  });
  
  const actualSystemSize = (panelCount * panelWattage) / 1000;
  const matchingInverters = inverters.filter(inv => {
    const capacity = (inv.specifications as any)?.capacity || 0;
    return capacity >= actualSystemSize && capacity <= actualSystemSize * 1.3;
  });
  
  const selectedInverter = (matchingInverters.length > 0 ? matchingInverters : inverters)[0];
  const inverterSupplier = selectedInverter.SupplierProduct[0];
  
  console.log(`Inverter: ${selectedInverter.name}`);
  console.log(`  Supplier: ${inverterSupplier.supplier.name}`);
  console.log(`  Unit Cost (Wholesale): $${inverterSupplier.unitCost.toFixed(2)}`);
  console.log(`  Retail Price (in DB): $${inverterSupplier.retailPrice?.toFixed(2) || 'N/A'}`);
  console.log(`  Markup % (in DB): ${inverterSupplier.markupPercent?.toFixed(1) || 'N/A'}%`);
  
  if (inverterSupplier.retailPrice && inverterSupplier.retailPrice > inverterSupplier.unitCost) {
    const markup = inverterSupplier.retailPrice - inverterSupplier.unitCost;
    const markupPercent = (markup / inverterSupplier.unitCost) * 100;
    commissionTrace.push({
      location: 'Inverter Supplier Pricing',
      description: 'Markup from unit cost to retail price',
      appliedTo: 'Inverter cost',
      rate: markupPercent,
      baseAmount: inverterSupplier.unitCost,
      commissionAmount: markup,
      totalAfter: inverterSupplier.retailPrice || 0,
    });
    console.log(`  ⚠️ MARKUP DETECTED: ${markupPercent.toFixed(1)}% = $${markup.toFixed(2)}`);
  }
  console.log(``);
  
  // Get battery (if needed)
  let selectedBattery = null;
  let batterySupplier = null;
  let batteryUnitsNeeded = 1;
  
  if (batterySizeKwh > 0) {
    const batteries = await prisma.product.findMany({
      where: { productType: 'BATTERY', isAvailable: true },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          orderBy: { unitCost: 'asc' },
          take: 1,
          include: { supplier: true },
        },
      },
    });
    
    const batteriesWithCapacity = batteries.map(bat => ({
      battery: bat,
      capacity: (bat.specifications as any)?.capacity || (bat.specifications as any)?.capacityKwh || 0,
      difference: Math.abs(((bat.specifications as any)?.capacity || (bat.specifications as any)?.capacityKwh || 0) - batterySizeKwh),
    }));
    
    batteriesWithCapacity.sort((a, b) => a.difference - b.difference);
    selectedBattery = batteriesWithCapacity[0]?.battery;
    batterySupplier = selectedBattery?.SupplierProduct[0];
    
    if (selectedBattery && batterySupplier) {
      const batteryUnitCapacity = (selectedBattery.specifications as any)?.capacity || (selectedBattery.specifications as any)?.capacityKwh || batterySizeKwh;
      
      if (batterySizeKwh > batteryUnitCapacity * 1.3) {
        batteryUnitsNeeded = Math.ceil(batterySizeKwh / batteryUnitCapacity);
      }
      
      console.log(`Battery: ${selectedBattery.name}`);
      console.log(`  Supplier: ${batterySupplier.supplier.name}`);
      console.log(`  Unit Cost (Wholesale): $${batterySupplier.unitCost.toFixed(2)}`);
      console.log(`  Retail Price (in DB): $${batterySupplier.retailPrice?.toFixed(2) || 'N/A'}`);
      console.log(`  Markup % (in DB): ${batterySupplier.markupPercent?.toFixed(1) || 'N/A'}%`);
      console.log(`  Units Needed: ${batteryUnitsNeeded}`);
      console.log(`  Total Wholesale: $${(batterySupplier.unitCost * batteryUnitsNeeded).toFixed(2)}`);
      console.log(`  Total Retail: $${((batterySupplier.retailPrice || 0) * batteryUnitsNeeded).toFixed(2)}`);
      
      if (batterySupplier.retailPrice && batterySupplier.retailPrice > batterySupplier.unitCost) {
        const markup = batterySupplier.retailPrice - batterySupplier.unitCost;
        const markupPercent = (markup / batterySupplier.unitCost) * 100;
        commissionTrace.push({
          location: 'Battery Supplier Pricing',
          description: 'Markup from unit cost to retail price',
          appliedTo: 'Battery cost',
          rate: markupPercent,
          baseAmount: batterySupplier.unitCost * batteryUnitsNeeded,
          commissionAmount: markup * batteryUnitsNeeded,
          totalAfter: (batterySupplier.retailPrice || 0) * batteryUnitsNeeded,
        });
        console.log(`  ⚠️ MARKUP DETECTED: ${markupPercent.toFixed(1)}% = $${(markup * batteryUnitsNeeded).toFixed(2)}`);
      }
      console.log(``);
    }
  }
  
  // ============================================================================
  // STEP 2: Installation Cost Breakdown
  // ============================================================================
  console.log(`\n\nSTEP 2: INSTALLATION COST BREAKDOWN`);
  console.log(`${'─'.repeat(100)}\n`);
  
  const { calculateInstallationCost } = await import('../lib/installation-cost-calculator');
  const installationResult = await calculateInstallationCost({
    systemSize: actualSystemSize,
    panelCount,
    hasBattery: batterySizeKwh > 0,
    batteryCapacity: batterySizeKwh,
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
  
  console.log(`Installation Items:`);
  installationResult.items.forEach(item => {
    console.log(`  ${item.code} - ${item.name}`);
    console.log(`    Provider: ${item.providerType}`);
    console.log(`    Base Rate: $${item.unitCost.toFixed(2)} per ${item.unit}`);
    console.log(`    Quantity: ${item.quantity}`);
    console.log(`    Total: $${item.totalCost.toFixed(2)}`);
    console.log(`    Calculation: ${item.calculation}`);
  });
  
  console.log(`\n  Installation Subtotal: $${installationResult.subtotal.toFixed(2)}`);
  console.log(`  Installation GST: $${installationResult.gst.toFixed(2)}`);
  console.log(`  Installation Total (inc GST): $${installationResult.total.toFixed(2)}`);
  
  // Check if installation has built-in margin
  const internalCost = installationResult.provider.internal;
  const subcontractorCost = installationResult.provider.subcontractor;
  
  if (internalCost > 0 && subcontractorCost > 0 && subcontractorCost > internalCost) {
    const margin = subcontractorCost - internalCost;
    const marginPercent = (margin / internalCost) * 100;
    console.log(`\n  ⚠️ SUBCONTRACTOR PREMIUM DETECTED:`);
    console.log(`    Internal Cost: $${internalCost.toFixed(2)}`);
    console.log(`    Subcontractor Cost: $${subcontractorCost.toFixed(2)}`);
    console.log(`    Premium: $${margin.toFixed(2)} (${marginPercent.toFixed(1)}%)`);
    
    commissionTrace.push({
      location: 'Installation Cost - Subcontractor Premium',
      description: 'Difference between internal and subcontractor rates',
      appliedTo: 'Installation cost',
      rate: marginPercent,
      baseAmount: internalCost,
      commissionAmount: margin,
      totalAfter: subcontractorCost,
    });
  }
  
  // ============================================================================
  // STEP 3: Check InstallationPricing Table for Additional Margins
  // ============================================================================
  console.log(`\n\nSTEP 3: INSTALLATION PRICING CONFIGURATION`);
  console.log(`${'─'.repeat(100)}\n`);
  
  const installationPricing = await prisma.installationPricing.findFirst({
    where: { region: 'WA' },
  });
  
  if (installationPricing) {
    console.log(`Installation Pricing Settings (from database):`);
    console.log(`  Internal Margin %: ${installationPricing.internalMarginPercent || 'N/A'}%`);
    console.log(`  Subbie Commission %: ${installationPricing.subbieCommissionPercent || 'N/A'}%`);
    
    if (installationPricing.subbieCommissionPercent && installationPricing.subbieCommissionPercent > 0) {
      console.log(`\n  ⚠️ SUBBIE COMMISSION CONFIGURED: ${installationPricing.subbieCommissionPercent}%`);
      console.log(`     This may be applied ON TOP of installation cost!`);
    }
  }
  
  // ============================================================================
  // STEP 4: Run Full Unified Calculator
  // ============================================================================
  console.log(`\n\nSTEP 4: UNIFIED CALCULATOR FULL CALCULATION`);
  console.log(`${'─'.repeat(100)}\n`);
  
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
  
  console.log(`Equipment Costs (from unified calculator):`);
  console.log(`  Panel Cost: $${quote.costs.panelCost.toLocaleString()}`);
  console.log(`  Inverter Cost: $${quote.costs.inverterCost.toLocaleString()}`);
  console.log(`  Battery Cost: $${quote.costs.batteryCost.toLocaleString()}`);
  console.log(`  Installation Cost: $${quote.costs.installationCost.toLocaleString()}`);
  console.log(`  Extra Costs: $${quote.costs.extraCosts.toLocaleString()}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  SUBTOTAL: $${quote.costs.subtotal.toLocaleString()}`);
  
  console.log(`\nRebates:`);
  console.log(`  Federal Solar (STC): $${quote.rebates.federalSolar.toLocaleString()}`);
  console.log(`  Federal Battery: $${quote.rebates.federalBattery.toLocaleString()}`);
  console.log(`  State Battery: $${quote.rebates.stateBattery.toLocaleString()}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  TOTAL REBATES: $${quote.rebates.total.toLocaleString()}`);
  
  console.log(`\nFinal Pricing:`);
  console.log(`  After Rebates: $${quote.totalAfterRebates.toLocaleString()}`);
  console.log(`  GST (10%): $${quote.gst.toLocaleString()}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  🎯 FINAL PRICE: $${quote.finalPrice.toLocaleString()}`);
  
  console.log(`\nProfit Analysis:`);
  console.log(`  Wholesale Cost: $${quote.profit.wholesaleCost.toLocaleString()}`);
  console.log(`  Retail Price: $${quote.profit.retailPrice.toLocaleString()}`);
  console.log(`  Gross Profit: $${quote.profit.grossProfit.toLocaleString()}`);
  console.log(`  Profit Margin: ${quote.profit.profitMargin.toFixed(1)}%`);
  
  // ============================================================================
  // STEP 5: Check for Double Commission
  // ============================================================================
  console.log(`\n\nSTEP 5: PROFIT MARGIN CALCULATION CHECK`);
  console.log(`${'─'.repeat(100)}\n`);
  
  // Check the profit calculation in unified-quote-calculator.ts line 339
  console.log(`Checking profit calculation (line 339 in unified-quote-calculator.ts):`);
  console.log(`  Formula: installationCost * 0.7`);
  console.log(`  This assumes 30% of installation cost is profit`);
  console.log(``);
  
  const installationWholesaleEstimate = quote.costs.installationCost * 0.7;
  console.log(`  Installation Cost (charged): $${quote.costs.installationCost.toLocaleString()}`);
  console.log(`  Estimated Wholesale (70%): $${installationWholesaleEstimate.toFixed(2)}`);
  console.log(`  Implied Margin: 30%`);
  
  if (installationPricing?.subbieCommissionPercent) {
    console.log(`\n  ⚠️ WARNING: Subbie commission is ${installationPricing.subbieCommissionPercent}%`);
    console.log(`     But profit calculation assumes 30% margin`);
    console.log(`     These should match to avoid double-counting!`);
  }
  
  // ============================================================================
  // STEP 6: Commission Trace Summary
  // ============================================================================
  console.log(`\n\n${'█'.repeat(100)}`);
  console.log(`█  COMMISSION & MARKUP TRACE SUMMARY`);
  console.log(`${'█'.repeat(100)}\n`);
  
  if (commissionTrace.length === 0) {
    console.log(`✅ No additional markups or commissions detected beyond base pricing.`);
  } else {
    console.log(`Found ${commissionTrace.length} markup/commission applications:\n`);
    
    let totalCommission = 0;
    commissionTrace.forEach((trace, index) => {
      console.log(`${index + 1}. ${trace.location}`);
      console.log(`   Description: ${trace.description}`);
      console.log(`   Applied To: ${trace.appliedTo}`);
      console.log(`   Rate: ${trace.rate.toFixed(1)}%`);
      console.log(`   Base Amount: $${trace.baseAmount.toFixed(2)}`);
      console.log(`   Commission/Markup: $${trace.commissionAmount.toFixed(2)}`);
      console.log(`   Total After: $${trace.totalAfter.toFixed(2)}`);
      console.log(``);
      
      totalCommission += trace.commissionAmount;
    });
    
    console.log(`TOTAL COMMISSION/MARKUP ACROSS ALL ITEMS: $${totalCommission.toFixed(2)}`);
  }
  
  // ============================================================================
  // STEP 7: Compare with Excel Quote
  // ============================================================================
  console.log(`\n\n${'█'.repeat(100)}`);
  console.log(`█  COMPARISON GUIDE FOR EXCEL QUOTE`);
  console.log(`${'█'.repeat(100)}\n`);
  
  console.log(`To compare with your Excel quote, check these values:\n`);
  
  console.log(`1. EQUIPMENT COSTS (should match wholesale + markup):`);
  console.log(`   Panels: ${panelCount} × $${panelSupplier.unitCost.toFixed(2)} = $${(panelSupplier.unitCost * panelCount).toFixed(2)} (wholesale)`);
  console.log(`   Panels: ${panelCount} × $${(panelSupplier.retailPrice || 0).toFixed(2)} = $${((panelSupplier.retailPrice || 0) * panelCount).toFixed(2)} (retail)`);
  console.log(`   Markup: $${(((panelSupplier.retailPrice || 0) - panelSupplier.unitCost) * panelCount).toFixed(2)}`);
  console.log(``);
  
  console.log(`   Inverter: $${inverterSupplier.unitCost.toFixed(2)} (wholesale)`);
  console.log(`   Inverter: $${(inverterSupplier.retailPrice || 0).toFixed(2)} (retail)`);
  console.log(`   Markup: $${((inverterSupplier.retailPrice || 0) - inverterSupplier.unitCost).toFixed(2)}`);
  console.log(``);
  
  if (batterySupplier) {
    console.log(`   Battery: ${batteryUnitsNeeded} × $${batterySupplier.unitCost.toFixed(2)} = $${(batterySupplier.unitCost * batteryUnitsNeeded).toFixed(2)} (wholesale)`);
    console.log(`   Battery: ${batteryUnitsNeeded} × $${(batterySupplier.retailPrice || 0).toFixed(2)} = $${((batterySupplier.retailPrice || 0) * batteryUnitsNeeded).toFixed(2)} (retail)`);
    console.log(`   Markup: $${(((batterySupplier.retailPrice || 0) - batterySupplier.unitCost) * batteryUnitsNeeded).toFixed(2)}`);
    console.log(``);
  }
  
  console.log(`2. INSTALLATION COST:`);
  console.log(`   Subcontractor Rate: $${installationResult.subtotal.toFixed(2)}`);
  console.log(`   GST: $${installationResult.gst.toFixed(2)}`);
  console.log(`   Total: $${installationResult.total.toFixed(2)}`);
  console.log(``);
  
  console.log(`3. REBATES:`);
  console.log(`   STC: $${quote.rebates.federalSolar.toLocaleString()}`);
  console.log(`   Battery Rebates: $${(quote.rebates.federalBattery + quote.rebates.stateBattery).toLocaleString()}`);
  console.log(``);
  
  console.log(`4. FINAL CALCULATION:`);
  console.log(`   Equipment: $${(quote.costs.panelCost + quote.costs.inverterCost + quote.costs.batteryCost).toLocaleString()}`);
  console.log(`   Installation: $${quote.costs.installationCost.toLocaleString()}`);
  console.log(`   Subtotal: $${quote.costs.subtotal.toLocaleString()}`);
  console.log(`   Less Rebates: -$${quote.rebates.total.toLocaleString()}`);
  console.log(`   After Rebates: $${quote.totalAfterRebates.toLocaleString()}`);
  console.log(`   Plus GST (10%): +$${quote.gst.toLocaleString()}`);
  console.log(`   FINAL: $${quote.finalPrice.toLocaleString()}`);
  
  return {
    quote,
    commissionTrace,
    installationResult,
  };
}

async function main() {
  console.log(`\n${'█'.repeat(100)}`);
  console.log(`█  COMMISSION & PROFIT MARGIN DIAGNOSTIC TOOL`);
  console.log(`█  Identifying where commission and margins are applied`);
  console.log(`${'█'.repeat(100)}\n`);
  
  try {
    // Test the three packages
    await diagnoseCommissionAndProfit(6.6, 0, 'Smart Starter (6.6kW)');
    await diagnoseCommissionAndProfit(10, 13.5, 'Complete Coverage (10kW + 13.5kWh)');
    await diagnoseCommissionAndProfit(13.2, 20, 'Energy Independent (13.2kW + 20kWh)');
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
