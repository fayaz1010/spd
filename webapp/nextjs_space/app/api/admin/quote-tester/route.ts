/**
 * ============================================================================
 * QUOTE TESTER API - Uses Unified Calculator
 * ============================================================================
 * 
 * This endpoint now uses the shared calculation function to ensure
 * consistency across all calculator systems.
 * 
 * All calculations use database-driven values with NO hardcoded constants.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateUnifiedQuote } from '@/lib/unified-quote-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      systemSizeKw, 
      batterySizeKwh, 
      includeInstallation = true,
      installationMethod = 'allin',
      installationMarginPercent, // NEW: Admin can set custom margin
      selectedPanelId,
      selectedInverterId,
      selectedBatteryId,
      extraCostIds = [],
      postcode = '6000', // Default to Perth
      region = 'WA',
    } = body;

    // ============================================
    // CALL UNIFIED CALCULATOR
    // ============================================
    // QUOTE TESTER: Customer always pays subbie + commission%
    // Admin can adjust commission% (default 15%)
    // If internal team selected, profit analysis shows extra savings
    
    const quote = await calculateUnifiedQuote({
      systemSizeKw,
      batterySizeKwh: batterySizeKwh || 0,
      postcode,
      region,
      panelProductId: selectedPanelId,
      inverterProductId: selectedInverterId,
      batteryProductId: selectedBatteryId,
      includeInstallation,
      // ALWAYS use subbie pricing for customer quote
      installationMethod: 'allin', // Subbie rate
      installationMarginPercent: installationMarginPercent || 15, // Admin can adjust
      extraCostIds,
      useConservativePricing: true, // Customer pays subbie price
      // TODO: Add internal team selection for profit analysis comparison
    });
    
    // ============================================
    // FORMAT RESPONSE FOR QUOTE TESTER UI
    // ============================================
    
    return NextResponse.json({
      // System Configuration
      systemSizeKw: quote.systemSizeKw,
      panelCount: quote.panelCount,
      batterySizeKwh: quote.batterySizeKwh,
      batteryUnitsNeeded: quote.batteryUnitsNeeded,

      // Selected Products (with detailed supplier info)
      selectedPanel: {
        id: quote.selectedPanel.id,
        name: quote.selectedPanel.name,
        sku: quote.selectedPanel.sku,
        manufacturer: quote.selectedPanel.manufacturer,
        specifications: { wattage: quote.selectedPanel.wattage },
        tier: quote.selectedPanel.tier,
        warrantyYears: quote.selectedPanel.warrantyYears,
        supplierInfo: {
          supplierName: quote.selectedPanel.supplierName,
          supplierSKU: quote.selectedPanel.sku,
          unitCost: quote.selectedPanel.unitCost,
          retailPrice: quote.selectedPanel.retailPrice,
          markupPercent: quote.selectedPanel.markupPercent,
          leadTime: null,
          stockStatus: 'available',
        },
      },
      selectedInverter: {
        id: quote.selectedInverter.id,
        name: quote.selectedInverter.name,
        sku: quote.selectedInverter.sku,
        manufacturer: quote.selectedInverter.manufacturer,
        specifications: { capacity: quote.selectedInverter.capacity },
        tier: quote.selectedInverter.tier,
        warrantyYears: quote.selectedInverter.warrantyYears,
        supplierInfo: {
          supplierName: quote.selectedInverter.supplierName,
          supplierSKU: quote.selectedInverter.sku,
          unitCost: quote.selectedInverter.unitCost,
          retailPrice: quote.selectedInverter.retailPrice,
          markupPercent: quote.selectedInverter.markupPercent,
          leadTime: null,
          stockStatus: 'available',
        },
      },
      selectedBattery: quote.selectedBattery ? {
        id: quote.selectedBattery.id,
        name: quote.selectedBattery.name,
        sku: quote.selectedBattery.sku,
        manufacturer: quote.selectedBattery.manufacturer,
        specifications: { capacity: quote.selectedBattery.capacity },
        tier: quote.selectedBattery.tier,
        warrantyYears: quote.selectedBattery.warrantyYears,
        supplierInfo: {
          supplierName: quote.selectedBattery.supplierName,
          supplierSKU: quote.selectedBattery.sku,
          unitCost: quote.selectedBattery.unitCost,
          retailPrice: quote.selectedBattery.retailPrice,
          markupPercent: quote.selectedBattery.markupPercent,
          leadTime: null,
          stockStatus: 'available',
        },
      } : null,

      // Costs
      panelCost: quote.costs.panelCost,
      inverterCost: quote.costs.inverterCost,
      batteryCost: quote.costs.batteryCost,
      installationCost: quote.costs.installationCost,
      extraCosts: {},
      extraCostsTotal: quote.costs.extraCosts,
      subtotal: quote.costs.subtotal,
      
      // Installation Breakdown (CRITICAL for Quote Tester UI)
      installationBreakdown: quote.installationBreakdown,
      
      // Rebates
      stcRebate: quote.rebates.federalSolar,
      federalBatteryRebate: quote.rebates.federalBattery,
      stateBatteryRebate: quote.rebates.stateBattery,
      batteryRebate: quote.rebates.federalBattery + quote.rebates.stateBattery,
      totalRebates: quote.rebates.total,
      
      // Final Pricing
      totalAfterRebates: quote.totalAfterRebates,
      gst: quote.gst,
      finalPrice: quote.finalPrice,
      
      // Profit Analysis
      totalWholesaleCost: quote.profit.wholesaleCost,
      totalRetailPrice: quote.profit.retailPrice,
      grossProfit: quote.profit.grossProfit,
      profitMargin: quote.profit.profitMargin,
    });
    
  } catch (error) {
    console.error('Quote tester error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate quote' },
      { status: 500 }
    );
  }
}
