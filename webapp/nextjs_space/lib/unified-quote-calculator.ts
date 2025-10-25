/**
 * ============================================================================
 * UNIFIED QUOTE CALCULATOR - SHARED CALCULATION LOGIC
 * ============================================================================
 * 
 * This module contains the core calculation logic used by all calculator systems.
 * It can be called directly (no HTTP required) for consistency.
 * 
 * Used by:
 * - /api/calculate-unified-quote (API endpoint)
 * - /api/admin/quote-tester (Quote Tester)
 * - lib/solar-calculator.ts (Calculator-v2)
 * - components/proposal/sections/SystemCustomizer.tsx (via API)
 */

import { PrismaClient } from '@prisma/client';
import { calculateRebates } from './services/rebate-service';
import { calculateInstallationCost as calculateInstallationCostNew } from './installation-cost-calculator';
// Legacy import for backward compatibility
import { calculateInstallationCost as calculateInstallationCostLegacy } from './services/installation-pricing-service';

const prisma = new PrismaClient();

export interface UnifiedQuoteRequest {
  systemSizeKw: number;
  batterySizeKwh?: number;
  panelCount?: number;
  postcode?: string;
  region?: string;
  panelProductId?: string;
  inverterProductId?: string;
  batteryProductId?: string;
  includeInstallation?: boolean;
  installationMethod?: 'allin' | 'detailed' | 'inhouse';
  installationMarginPercent?: number; // NEW: Custom margin/commission percentage
  useConservativePricing?: boolean; // NEW: Force subbie rates for public calculators
  extraCostIds?: string[];
  dailyConsumptionKwh?: number;
  quarterlyBill?: number;
  annualConsumption?: number;
}

export interface UnifiedQuoteResponse {
  systemSizeKw: number;
  panelCount: number;
  batterySizeKwh: number;
  batteryUnitsNeeded?: number;
  
  selectedPanel: {
    id: string;
    name: string;
    sku: string;
    manufacturer: string;
    wattage: number;
    warrantyYears: number;
    tier: string;
    unitCost: number;
    retailPrice: number;
    markupPercent: number;
    supplierName: string;
  };
  
  selectedInverter: {
    id: string;
    name: string;
    sku: string;
    manufacturer: string;
    capacity: number;
    warrantyYears: number;
    tier: string;
    unitCost: number;
    retailPrice: number;
    markupPercent: number;
    supplierName: string;
  };
  
  selectedBattery?: {
    id: string;
    name: string;
    sku: string;
    manufacturer: string;
    capacity: number;
    warrantyYears: number;
    tier: string;
    unitCost: number;
    retailPrice: number;
    markupPercent: number;
    supplierName: string;
  };
  
  costs: {
    panelCost: number;
    inverterCost: number;
    batteryCost: number;
    installationCost: number;
    extraCosts: number;
    subtotal: number;
  };
  
  installationBreakdown?: any;
  
  rebates: {
    federalSolar: number;
    federalBattery: number;
    stateBattery: number;
    total: number;
    details: any;
  };
  
  totalAfterRebates: number;
  gst: number;
  finalPrice: number;
  
  profit: {
    wholesaleCost: number;
    retailPrice: number;
    grossProfit: number;
    profitMargin: number;
  };
  
  savings?: {
    annualSavings: number;
    monthlySavings: number;
    paybackYears: number;
    year10Savings: number;
    year25Savings: number;
  };
}

/**
 * Calculate a unified quote using database-driven values
 * This is the single source of truth for all quote calculations
 */
export async function calculateUnifiedQuote(
  request: UnifiedQuoteRequest
): Promise<UnifiedQuoteResponse> {
  const {
    systemSizeKw,
    batterySizeKwh = 0,
    panelCount: requestedPanelCount,
    postcode = '6000',
    region = 'WA',
    panelProductId,
    inverterProductId,
    batteryProductId,
    includeInstallation = true,
    installationMethod = 'allin',
    useConservativePricing = false,
    extraCostIds = [],
    dailyConsumptionKwh,
    quarterlyBill,
    annualConsumption,
  } = request;
  
  // Helper: Get best supplier product
  const getBestSupplierProduct = async (productId: string) => {
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: { productId, isActive: true },
      include: { supplier: true },
      orderBy: { unitCost: 'asc' },
    });
    
    if (supplierProducts.length === 0) return null;
    
    const best = supplierProducts[0];
    return {
      unitCost: best.unitCost,
      retailPrice: best.retailPrice || best.unitCost * 1.15,
      markupPercent: best.markupPercent || ((best.retailPrice || best.unitCost * 1.15) - best.unitCost) / best.unitCost * 100,
      supplierName: best.supplier.name,
      supplierSKU: best.sku,
      leadTime: best.leadTime,
      stockStatus: best.stockStatus,
    };
  };
  
  // Select Panel
  let selectedPanel;
  if (panelProductId) {
    selectedPanel = await prisma.product.findUnique({
      where: { id: panelProductId },
    });
  } else {
    // Get all available panels with their supplier prices
    const panels = await prisma.product.findMany({
      where: { productType: 'PANEL', isAvailable: true },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          orderBy: { unitCost: 'asc' },
          take: 1,
        },
      },
    });
    
    if (panels.length === 0) {
      throw new Error('No panels available');
    }
    
    // STRATEGY: Select CHEAPEST panel by default
    // Sort by lowest unit cost (best value for customer)
    panels.sort((a, b) => {
      const aCost = a.SupplierProduct[0]?.unitCost || 999999;
      const bCost = b.SupplierProduct[0]?.unitCost || 999999;
      return aCost - bCost;
    });
    
    selectedPanel = panels[0];
  }
  
  if (!selectedPanel) {
    throw new Error('Panel not found');
  }
  
  const panelWattage = (selectedPanel.specifications as any)?.wattage || 450;
  const panelCount = requestedPanelCount || Math.ceil((systemSizeKw * 1000) / panelWattage);
  const actualSystemSize = (panelCount * panelWattage) / 1000;
  
  const panelSupplier = await getBestSupplierProduct(selectedPanel.id);
  if (!panelSupplier) {
    throw new Error('No panel supplier found');
  }
  
  // Select Inverter
  let selectedInverter;
  if (inverterProductId) {
    selectedInverter = await prisma.product.findUnique({
      where: { id: inverterProductId },
    });
  } else {
    // Get all available inverters with their supplier prices
    const inverters = await prisma.product.findMany({
      where: { productType: 'INVERTER', isAvailable: true },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          orderBy: { unitCost: 'asc' },
          take: 1,
        },
      },
    });
    
    // Filter inverters that match system size (within 30% overhead)
    const matchingInverters = inverters.filter(inv => {
      const capacity = (inv.specifications as any)?.capacity || 0;
      return capacity >= actualSystemSize && capacity <= actualSystemSize * 1.3;
    });
    
    // STRATEGY: Select CHEAPEST matching inverter by default
    const invertersToSort = matchingInverters.length > 0 ? matchingInverters : inverters;
    invertersToSort.sort((a, b) => {
      const aCost = a.SupplierProduct[0]?.unitCost || 999999;
      const bCost = b.SupplierProduct[0]?.unitCost || 999999;
      return aCost - bCost;
    });
    
    selectedInverter = invertersToSort[0];
  }
  
  if (!selectedInverter) {
    throw new Error('Inverter not found');
  }
  
  const inverterSupplier = await getBestSupplierProduct(selectedInverter.id);
  if (!inverterSupplier) {
    throw new Error('No inverter supplier found');
  }
  
  // Select Battery (if requested)
  let selectedBattery = null;
  let batterySupplier = null;
  let batteryUnitsNeeded = 1;
  let actualBatteryCapacity = batterySizeKwh;
  
  if (batterySizeKwh > 0) {
    if (batteryProductId) {
      selectedBattery = await prisma.product.findUnique({
        where: { id: batteryProductId },
      });
    } else {
      // Get all available batteries with their supplier prices
      const batteries = await prisma.product.findMany({
        where: { productType: 'BATTERY', isAvailable: true },
        include: {
          SupplierProduct: {
            where: { isActive: true },
            orderBy: { unitCost: 'asc' },
            take: 1,
          },
        },
      });
      
      // Find batteries that match the requested capacity
      const batteriesWithCapacity = batteries.map(bat => {
        const capacity = (bat.specifications as any)?.capacity || (bat.specifications as any)?.capacityKwh || 0;
        const difference = Math.abs(capacity - batterySizeKwh);
        const unitCost = bat.SupplierProduct[0]?.unitCost || 999999;
        return {
          battery: bat,
          capacity,
          difference,
          unitCost,
        };
      });
      
      // STRATEGY: Select CHEAPEST battery that matches capacity
      // First filter to batteries within 20% of requested size
      const closeMatches = batteriesWithCapacity.filter(b => 
        b.difference <= batterySizeKwh * 0.2
      );
      
      const batteriesToSort = closeMatches.length > 0 ? closeMatches : batteriesWithCapacity;
      
      // Sort by unit cost (cheapest first)
      batteriesToSort.sort((a, b) => a.unitCost - b.unitCost);
      
      selectedBattery = batteriesToSort[0]?.battery;
    }
    
    if (selectedBattery) {
      batterySupplier = await getBestSupplierProduct(selectedBattery.id);
      
      const batteryUnitCapacity = (selectedBattery.specifications as any)?.capacity || (selectedBattery.specifications as any)?.capacityKwh || batterySizeKwh;
      
      if (batterySizeKwh > batteryUnitCapacity * 1.3) {
        batteryUnitsNeeded = Math.ceil(batterySizeKwh / batteryUnitCapacity);
        actualBatteryCapacity = batteryUnitsNeeded * batteryUnitCapacity;
      } else {
        batteryUnitsNeeded = 1;
        actualBatteryCapacity = batteryUnitCapacity;
      }
    }
  }
  
  // Calculate costs (USE COST PRICES - NO MARKUP)
  const panelCost = panelSupplier.unitCost * panelCount;
  const inverterCost = inverterSupplier.unitCost;
  const batteryCost = batterySupplier ? batterySupplier.unitCost * batteryUnitsNeeded : 0;
  
  let installationCost = 0;
  let installationBreakdown = null;
  if (includeInstallation) {
    // Use new unified installation cost calculator
    const installationResult = await calculateInstallationCostNew({
      systemSize: actualSystemSize,
      panelCount,
      hasBattery: actualBatteryCapacity > 0,
      batteryCapacity: actualBatteryCapacity,
      batteryType: 'dc_coupled', // Default, should be determined from product
      isRetrofit: false,
      storeys: 1, // Default, should come from lead/quote data
      roofType: 'tile', // Default, should come from lead/quote data
      roofPitch: 'standard',
      orientation: 'portrait',
      rakedCeilings: false,
      phases: 1, // Default, should come from lead/quote data
      hasOptimisers: false,
      additionalInverters: 0,
      splits: 0,
      preferredProvider: useConservativePricing ? 'SUBCONTRACTOR' : undefined,
    });
    installationCost = installationResult.subtotal;  // Use subtotal, not total (which includes GST)
    installationBreakdown = installationResult.breakdown;
  }
  
  let extraCostsTotal = 0;
  if (extraCostIds.length > 0) {
    const extraCostsData = await prisma.extraCost.findMany({
      where: { id: { in: extraCostIds }, active: true },
    });
    extraCostsTotal = extraCostsData.reduce((sum, cost) => sum + cost.cost, 0);
  }
  
  const subtotal = panelCost + inverterCost + batteryCost + installationCost + extraCostsTotal;
  
  // Calculate rebates (from database formulas)
  const rebates = await calculateRebates({
    systemSizeKw: actualSystemSize,
    batterySizeKwh: actualBatteryCapacity,
    region,
    postcode,
  });
  
  // Get quote settings for commission
  const quoteSettings = await prisma.quoteSettings.findFirst({
    where: { region },
  });
  
  // Calculate final pricing with commission
  const totalAfterRebates = subtotal - rebates.total;
  
  // Apply commission (zero markup strategy)
  let commission = 0;
  if (quoteSettings) {
    if (quoteSettings.commissionType === 'PERCENTAGE') {
      commission = totalAfterRebates * (quoteSettings.commissionPercent / 100);
    } else {
      commission = quoteSettings.commissionFixed;
    }
    
    // Apply minimum profit if configured
    if (quoteSettings.minimumProfit && commission < quoteSettings.minimumProfit) {
      commission = quoteSettings.minimumProfit;
    }
  }
  
  const totalWithCommission = totalAfterRebates + commission;
  const gst = totalWithCommission * 0.1;
  const finalPrice = totalWithCommission + gst;
  
  // Profit analysis (FIXED: Use actual costs, not assumed margins)
  const wholesaleCost = 
    (panelSupplier.unitCost * panelCount) +
    inverterSupplier.unitCost +
    (batterySupplier ? batterySupplier.unitCost * batteryUnitsNeeded : 0) +
    installationCost;  // Installation already at cost
  
  // Retail price includes what customer pays + rebates (rebates are revenue from government)
  // Customer pays: totalAfterRebates + commission
  // We receive: (customer payment) + (government rebates)
  const totalRevenue = totalAfterRebates + commission + rebates.total;
  const retailPrice = totalRevenue;  // Total revenue is our retail price
  const grossProfit = retailPrice - wholesaleCost;  // Profit = Revenue - Cost
  const profitMargin = retailPrice > 0 ? (grossProfit / retailPrice) * 100 : 0;
  
  // Calculate annual production (ALWAYS calculate, not just for savings)
  const perthProductionFactor = 1400;
  const annualProduction = actualSystemSize * perthProductionFactor;
  
  // Generate monthly production data based on Perth seasonal patterns
  const seasonalFactors = [
    0.095, // Jan - High
    0.090, // Feb - High
    0.088, // Mar - Medium-High
    0.080, // Apr - Medium
    0.070, // May - Medium-Low
    0.065, // Jun - Low
    0.068, // Jul - Low
    0.075, // Aug - Medium-Low
    0.082, // Sep - Medium
    0.090, // Oct - Medium-High
    0.095, // Nov - High
    0.102, // Dec - Highest
  ];
  const monthlyProduction = seasonalFactors.map(factor => Math.round(annualProduction * factor));
  
  // Calculate savings (if usage data provided)
  let savings = undefined;
  
  if (dailyConsumptionKwh || quarterlyBill || annualConsumption) {
    let annualConsumptionKwh = annualConsumption || 0;
    if (!annualConsumptionKwh && dailyConsumptionKwh) {
      annualConsumptionKwh = dailyConsumptionKwh * 365;
    }
    if (!annualConsumptionKwh && quarterlyBill) {
      const retailRate = 0.28;
      annualConsumptionKwh = (quarterlyBill * 4) / retailRate;
    }
    
    const dailyProduction = annualProduction / 365;
    const batteryRatio = actualBatteryCapacity > 0 ? actualBatteryCapacity / dailyProduction : 0;
    let selfConsumptionRate = 0.35;
    if (batteryRatio >= 0.5) selfConsumptionRate = 0.80;
    else if (batteryRatio >= 0.3) selfConsumptionRate = 0.75;
    else if (batteryRatio > 0) selfConsumptionRate = 0.65;
    
    const retailRate = 0.28;
    const feedInTariff = 0.03;
    const selfConsumed = annualProduction * selfConsumptionRate;
    const exported = annualProduction * (1 - selfConsumptionRate);
    const annualSavings = (selfConsumed * retailRate) + (exported * feedInTariff);
    const monthlySavings = annualSavings / 12;
    const paybackYears = finalPrice > 0 && annualSavings > 0 ? finalPrice / annualSavings : 0;
    const year10Savings = annualSavings * 10 * 1.03;
    const year25Savings = annualSavings * 25 * 1.025;
    
    savings = {
      annualSavings: Math.round(annualSavings),
      monthlySavings: Math.round(monthlySavings),
      paybackYears: Math.round(paybackYears * 10) / 10,
      year10Savings: Math.round(year10Savings),
      year25Savings: Math.round(year25Savings),
    };
  }
  
  // Build response
  return {
    systemSizeKw: actualSystemSize,
    panelCount,
    batterySizeKwh: actualBatteryCapacity,
    batteryUnitsNeeded: batteryUnitsNeeded > 1 ? batteryUnitsNeeded : undefined,
    
    selectedPanel: {
      id: selectedPanel.id,
      name: selectedPanel.name,
      sku: selectedPanel.sku,
      manufacturer: selectedPanel.manufacturer,
      wattage: panelWattage,
      warrantyYears: selectedPanel.warrantyYears || 25,
      tier: selectedPanel.tier || 'mid',
      unitCost: panelSupplier.unitCost,
      retailPrice: panelSupplier.retailPrice,
      markupPercent: panelSupplier.markupPercent,
      supplierName: panelSupplier.supplierName,
    },
    
    selectedInverter: {
      id: selectedInverter.id,
      name: selectedInverter.name,
      sku: selectedInverter.sku,
      manufacturer: selectedInverter.manufacturer,
      capacity: (selectedInverter.specifications as any)?.capacity || 0,
      warrantyYears: selectedInverter.warrantyYears || 10,
      tier: selectedInverter.tier || 'mid',
      unitCost: inverterSupplier.unitCost,
      retailPrice: inverterSupplier.retailPrice,
      markupPercent: inverterSupplier.markupPercent,
      supplierName: inverterSupplier.supplierName,
    },
    
    selectedBattery: selectedBattery && batterySupplier ? {
      id: selectedBattery.id,
      name: selectedBattery.name,
      sku: selectedBattery.sku,
      manufacturer: selectedBattery.manufacturer,
      capacity: (selectedBattery.specifications as any)?.capacity || (selectedBattery.specifications as any)?.capacityKwh || 0,
      warrantyYears: selectedBattery.warrantyYears || 10,
      tier: selectedBattery.tier || 'mid',
      unitCost: batterySupplier.unitCost,
      retailPrice: batterySupplier.retailPrice,
      markupPercent: batterySupplier.markupPercent,
      supplierName: batterySupplier.supplierName,
    } : undefined,
    
    costs: {
      panelCost: Math.round(panelCost),
      inverterCost: Math.round(inverterCost),
      batteryCost: Math.round(batteryCost),
      installationCost: Math.round(installationCost),
      extraCosts: Math.round(extraCostsTotal),
      subtotal: Math.round(subtotal),
    },
    
    installationBreakdown,
    
    rebates: {
      federalSolar: rebates.federalSolar,
      federalBattery: rebates.federalBattery,
      stateBattery: rebates.stateBattery,
      total: rebates.total,
      details: rebates.details,
    },
    
    totalAfterRebates: Math.round(totalAfterRebates),
    gst: Math.round(gst),
    finalPrice: Math.round(finalPrice),
    
    profit: {
      wholesaleCost: Math.round(wholesaleCost),
      retailPrice: Math.round(retailPrice),
      grossProfit: Math.round(grossProfit),
      profitMargin: Math.round(profitMargin * 10) / 10,
    },
    
    // Production data (CRITICAL for proposals)
    annualProductionKwh: Math.round(annualProduction),
    monthlyProductionData: monthlyProduction,
    
    savings,
  };
}
