/**
 * ============================================================================
 * UNIFIED SOLAR QUOTE API - Single Source of Truth
 * ============================================================================
 * 
 * This is the NEW centralized API for all solar quote calculations.
 * It replaces the confusing mix of calculate-quote and calculate-complete-quote.
 * 
 * Purpose: Generate accurate, complete solar quotes from Google Solar API data
 * and user preferences, with support for 3 system size options.
 * 
 * Created: October 8, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAllPanelBrands, getAllBatteryBrands, getAllInverterBrands } from '@/lib/services/brand-compatibility';

// ============================================================================
// TYPES
// ============================================================================

interface GoogleSolarData {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  panelCapacityWatts: number;
  latitude?: number;
  longitude?: number;
}

interface UserProfile {
  quarterlyBill: number;
  householdSize: number;
  hasEv: boolean;
  planningEv: boolean;
  evCount?: number;
  evChargingTime?: string; // 'morning' | 'midday' | 'evening' | 'night'
  hasPool?: boolean;
  poolHeated?: boolean;
  homeOfficeCount?: number;
  acTier?: string; // 'minimal' | 'moderate' | 'heavy'
}

interface BrandSelections {
  panelBrandId?: string;
  batteryBrandId?: string;
  inverterBrandId?: string;
}

interface CompleteQuote {
  // System specifications
  systemSizeKw: number;
  panelCount: number;
  panelWattage: number;
  batterySizeKwh: number;
  inverterSizeKw: number;
  
  // Selected brands
  panelBrand: {
    id: string;
    name: string;
    manufacturer: string;
    wattage: number;
    warrantyYears: number;
  };
  batteryBrand: {
    id: string;
    name: string;
    manufacturer: string;
    capacityKwh: number;
    warrantyYears: number;
  } | null;
  inverterBrand: {
    id: string;
    name: string;
    manufacturer: string;
    capacityKw: number;
    warrantyYears: number;
  };
  
  // Costs breakdown
  costs: {
    panels: number;
    battery: number;
    inverter: number;
    installation: number;
    subtotal: number;
  };
  
  // Rebates breakdown
  rebates: {
    federalSRES: number;
    federalBattery: number;
    waState: number;
    total: number;
  };
  
  // Final pricing
  totalBeforeRebates: number;
  totalAfterRebates: number;
  depositAmount: number; // 10% of total after rebates
  
  // Savings projections
  savings: {
    monthly: number;
    annual: number;
    year25: number;
  };
  
  // ROI metrics
  roi: {
    paybackYears: number;
    roiPercentage: number;
  };
  
  // Production estimates
  production: {
    annualGeneration: number;
    dailyGeneration: number;
    selfConsumptionPercentage: number;
    exportPercentage: number;
  };
  
  // Environmental impact
  environmental: {
    co2SavedPerYear: number;
    equivalentTrees: number;
    equivalentCars: number;
  };
}

// ============================================================================
// CONSTANTS (Perth, WA specific)
// ============================================================================

const SYNERGY_GRID_RATE = 0.3237; // $/kWh (Home Plan A1)
const FEED_IN_TARIFF_OFF_PEAK = 0.02; // $/kWh (DEBS scheme)
const FEED_IN_TARIFF_PEAK = 0.10; // $/kWh (3pm-9pm, DEBS scheme)
const ANNUAL_KWH_PER_KW = 1460; // Perth average solar generation
const DAYTIME_USAGE_PERCENTAGE = 0.55; // 55% of usage during day
const OVERNIGHT_USAGE_PERCENTAGE = 0.45; // 45% of usage at night
const BATTERY_DEPTH_OF_DISCHARGE = 0.9; // 90% usable
const BATTERY_ROUND_TRIP_EFFICIENCY = 0.85; // 85% efficiency
const INSTALLATION_BASE_COST = 1500; // Base installation fee
const CO2_PER_KWH = 0.68; // kg CO2 per kWh (WA grid)
const TREES_PER_TONNE_CO2 = 45; // Trees needed to offset 1 tonne CO2/year

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      googleSolarData,
      userProfile,
      systemSize, // 'small' | 'medium' | 'large' | number (kW)
      brandSelections,
    } = body;
    
    // Validate required fields
    if (!googleSolarData || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: googleSolarData and userProfile' },
        { status: 400 }
      );
    }
    
    // Calculate complete quote
    const quote = await calculateSolarQuote(
      googleSolarData,
      userProfile,
      systemSize || 'medium',
      brandSelections
    );
    
    return NextResponse.json({
      success: true,
      quote,
    });
    
  } catch (error: any) {
    console.error('Error calculating solar quote:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate quote' },
      { status: 500 }
    );
  }
}

// ============================================================================
// CORE CALCULATION FUNCTION
// ============================================================================

async function calculateSolarQuote(
  googleSolarData: GoogleSolarData,
  userProfile: UserProfile,
  systemSize: 'small' | 'medium' | 'large' | number,
  brandSelections?: BrandSelections
): Promise<CompleteQuote> {
  
  // Step 1: Determine optimal system size
  const systemSizeKw = determineSystemSize(googleSolarData, userProfile, systemSize);
  
  // Step 2: Calculate panel count
  const panelWattage = googleSolarData.panelCapacityWatts;
  const panelCount = Math.min(
    Math.ceil((systemSizeKw * 1000) / panelWattage),
    googleSolarData.maxArrayPanelsCount
  );
  
  // Step 3: Recommend battery size
  const batterySizeKwh = recommendBatterySize(userProfile, systemSizeKw);
  
  // Step 4: Calculate inverter size (typically 1.2x system size)
  const inverterSizeKw = Math.ceil(systemSizeKw * 1.2 * 2) / 2; // Round to nearest 0.5kW
  
  // Step 5: Fetch brands from database
  const brands = await fetchBrands(
    systemSizeKw,
    batterySizeKwh,
    inverterSizeKw,
    brandSelections
  );
  
  // Step 6: Calculate costs
  const costs = calculateCosts(
    systemSizeKw,
    batterySizeKwh,
    inverterSizeKw,
    brands
  );
  
  // Step 7: Calculate rebates
  const rebates = await calculateRebates(
    systemSizeKw,
    batterySizeKwh,
    costs.battery
  );
  
  // Step 8: Calculate final pricing
  const totalBeforeRebates = costs.subtotal;
  const totalAfterRebates = totalBeforeRebates - rebates.total;
  
  // Step 8.5: Calculate deposit using admin settings
  const { calculateDeposit } = await import('@/lib/deposit-calculator');
  const depositInfo = await calculateDeposit(totalAfterRebates);
  const depositAmount = Math.round(depositInfo.depositAmount);
  
  // Step 9: Calculate savings
  const savings = calculateSavings(
    systemSizeKw,
    batterySizeKwh,
    userProfile.quarterlyBill,
    userProfile.hasEv || userProfile.planningEv
  );
  
  // Step 10: Calculate ROI
  const roi = calculateROI(totalAfterRebates, savings.annual);
  
  // Step 11: Calculate production estimates
  const production = calculateProduction(systemSizeKw, batterySizeKwh, userProfile.quarterlyBill);
  
  // Step 12: Calculate environmental impact
  const environmental = calculateEnvironmentalImpact(production.annualGeneration);
  
  // Return complete quote
  return {
    systemSizeKw,
    panelCount,
    panelWattage,
    batterySizeKwh,
    inverterSizeKw,
    panelBrand: brands.panel,
    batteryBrand: brands.battery,
    inverterBrand: brands.inverter,
    costs,
    rebates,
    totalBeforeRebates,
    totalAfterRebates,
    depositAmount,
    savings,
    roi,
    production,
    environmental,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineSystemSize(
  googleSolarData: GoogleSolarData,
  userProfile: UserProfile,
  systemSize: 'small' | 'medium' | 'large' | number
): number {
  // If specific size provided, use it
  if (typeof systemSize === 'number') {
    return systemSize;
  }
  
  // Calculate annual usage from quarterly bill
  const annualUsageKwh = (userProfile.quarterlyBill * 4) / SYNERGY_GRID_RATE;
  const dailyUsageKwh = annualUsageKwh / 365;
  
  // Calculate max roof capacity
  const maxSystemSizeKw = (googleSolarData.maxArrayPanelsCount * googleSolarData.panelCapacityWatts) / 1000;
  
  // Determine size based on usage and preferences
  let targetSizeKw: number;
  
  if (systemSize === 'small') {
    // Small: Cover 60-70% of usage
    targetSizeKw = (dailyUsageKwh * 0.65 * 365) / ANNUAL_KWH_PER_KW;
  } else if (systemSize === 'large') {
    // Large: Cover 100-120% of usage (future-proof)
    targetSizeKw = (dailyUsageKwh * 1.1 * 365) / ANNUAL_KWH_PER_KW;
  } else {
    // Medium (default): Cover 80-90% of usage
    targetSizeKw = (dailyUsageKwh * 0.85 * 365) / ANNUAL_KWH_PER_KW;
  }
  
  // Add buffer for EV
  if (userProfile.hasEv || userProfile.planningEv) {
    const evCount = userProfile.evCount || 1;
    targetSizeKw += evCount * 1.5; // Add 1.5kW per EV
  }
  
  // Add buffer for pool
  if (userProfile.hasPool) {
    targetSizeKw += userProfile.poolHeated ? 2.0 : 1.0;
  }
  
  // Cap at roof capacity
  targetSizeKw = Math.min(targetSizeKw, maxSystemSizeKw);
  
  // Round to common system sizes
  const commonSizes = [3.3, 5.0, 6.6, 8.0, 10.0, 13.0, 15.0];
  const closestSize = commonSizes.reduce((prev, curr) => 
    Math.abs(curr - targetSizeKw) < Math.abs(prev - targetSizeKw) ? curr : prev
  );
  
  return Math.min(closestSize, maxSystemSizeKw);
}

function recommendBatterySize(userProfile: UserProfile, systemSizeKw: number): number {
  // Calculate overnight usage
  const annualUsageKwh = (userProfile.quarterlyBill * 4) / SYNERGY_GRID_RATE;
  const dailyUsageKwh = annualUsageKwh / 365;
  const overnightUsageKwh = dailyUsageKwh * OVERNIGHT_USAGE_PERCENTAGE;
  
  // Base battery size on overnight usage
  let batterySizeKwh = overnightUsageKwh * 1.2; // 120% of overnight usage
  
  // Adjust for EV (if charging at night)
  if (userProfile.hasEv && userProfile.evChargingTime === 'night') {
    batterySizeKwh += 5; // Add 5kWh for EV charging
  }
  
  // Adjust for system size (don't over-battery small systems)
  if (systemSizeKw < 6) {
    batterySizeKwh = Math.min(batterySizeKwh, 5);
  }
  
  // Round to common battery sizes
  const commonBatterySizes = [0, 5, 10, 13.5, 15, 20];
  const closestBatterySize = commonBatterySizes.reduce((prev, curr) => 
    Math.abs(curr - batterySizeKwh) < Math.abs(prev - batterySizeKwh) ? curr : prev
  );
  
  return closestBatterySize;
}

async function fetchBrands(
  systemSizeKw: number,
  batterySizeKwh: number,
  inverterSizeKw: number,
  brandSelections?: BrandSelections
) {
  // Fetch available brands using compatibility layer
  const [panelBrands, batteryBrands, inverterBrands] = await Promise.all([
    getAllPanelBrands({ isAvailable: true }),
    getAllBatteryBrands({ isAvailable: true }),
    getAllInverterBrands({ isAvailable: true }),
  ]);
  
  // Select panel brand
  let selectedPanel = panelBrands.find(b => b.id === brandSelections?.panelBrandId);
  if (!selectedPanel) {
    selectedPanel = panelBrands.find(b => b.isRecommended) || panelBrands[0];
  }
  
  // Select battery brand (if battery needed)
  let selectedBattery = null;
  if (batterySizeKwh > 0) {
    selectedBattery = batteryBrands.find(b => b.id === brandSelections?.batteryBrandId);
    if (!selectedBattery) {
      // Find battery closest to recommended size
      selectedBattery = batteryBrands.reduce((prev, curr) => 
        Math.abs(curr.capacityKwh - batterySizeKwh) < Math.abs(prev.capacityKwh - batterySizeKwh) 
          ? curr : prev
      );
    }
  }
  
  // Select inverter brand
  let selectedInverter = inverterBrands.find(b => b.id === brandSelections?.inverterBrandId);
  if (!selectedInverter) {
    // Find inverter closest to recommended size
    selectedInverter = inverterBrands.reduce((prev, curr) => 
      Math.abs(curr.capacityKw - inverterSizeKw) < Math.abs(prev.capacityKw - inverterSizeKw) 
        ? curr : prev
    );
  }
  
  return {
    panel: {
      id: selectedPanel.id,
      name: selectedPanel.name,
      manufacturer: selectedPanel.manufacturer,
      wattage: selectedPanel.wattage,
      warrantyYears: selectedPanel.warrantyYears,
      pricePerKw: selectedPanel.pricePerKw,
    },
    battery: selectedBattery ? {
      id: selectedBattery.id,
      name: selectedBattery.name,
      manufacturer: selectedBattery.manufacturer,
      capacityKwh: selectedBattery.capacityKwh,
      warrantyYears: selectedBattery.warrantyYears,
      price: selectedBattery.price,
    } : null,
    inverter: {
      id: selectedInverter.id,
      name: selectedInverter.name,
      manufacturer: selectedInverter.manufacturer,
      capacityKw: selectedInverter.capacityKw,
      warrantyYears: selectedInverter.warrantyYears,
      pricePerKw: selectedInverter.pricePerKw,
    },
  };
}

function calculateCosts(
  systemSizeKw: number,
  batterySizeKwh: number,
  inverterSizeKw: number,
  brands: any
) {
  const panelsCost = Math.round(systemSizeKw * brands.panel.pricePerKw);
  const batteryCost = brands.battery ? Math.round(brands.battery.price) : 0;
  const inverterCost = Math.round(inverterSizeKw * brands.inverter.pricePerKw);
  const installationCost = INSTALLATION_BASE_COST;
  const subtotal = panelsCost + batteryCost + inverterCost + installationCost;
  
  return {
    panels: panelsCost,
    battery: batteryCost,
    inverter: inverterCost,
    installation: installationCost,
    subtotal,
  };
}

async function calculateRebates(
  systemSizeKw: number,
  batterySizeKwh: number,
  batteryCost: number
) {
  // Fetch rebate configurations from database
  const rebateConfigs = await prisma.rebateConfig.findMany({
    where: { active: true },
  });
  
  // Federal SRES (Solar panels)
  // Formula: systemSizeKw × 1.382 × 6 × 38
  const federalSRES = Math.round(systemSizeKw * 1.382 * 6 * 38);
  
  // Federal Battery Rebate
  // Formula: batterySizeKwh × 9.3 × 38
  const federalBattery = batterySizeKwh > 0 ? Math.round(batterySizeKwh * 9.3 * 38) : 0;
  
  // WA State Battery Scheme
  // Formula: batterySizeKwh × 130
  const waState = batterySizeKwh > 0 ? Math.round(batterySizeKwh * 130) : 0;
  
  // Apply $5,000 combined cap for battery rebates
  let adjustedFederalBattery = federalBattery;
  let adjustedWaState = waState;
  
  const combinedBatteryRebates = federalBattery + waState;
  if (combinedBatteryRebates > 5000) {
    const scaleFactor = 5000 / combinedBatteryRebates;
    adjustedFederalBattery = Math.round(federalBattery * scaleFactor);
    adjustedWaState = Math.round(waState * scaleFactor);
  }
  
  const total = federalSRES + adjustedFederalBattery + adjustedWaState;
  
  return {
    federalSRES,
    federalBattery: adjustedFederalBattery,
    waState: adjustedWaState,
    total,
  };
}

function calculateSavings(
  systemSizeKw: number,
  batterySizeKwh: number,
  quarterlyBill: number,
  hasEv: boolean
) {
  // Calculate current usage
  const annualElectricityCost = quarterlyBill * 4;
  const annualUsageKwh = annualElectricityCost / SYNERGY_GRID_RATE;
  const dailyUsageKwh = annualUsageKwh / 365;
  
  // Calculate solar generation
  const annualGenerationKwh = systemSizeKw * ANNUAL_KWH_PER_KW;
  const dailyGenerationKwh = annualGenerationKwh / 365;
  
  // Split usage: day vs night
  const daytimeUsageKwh = dailyUsageKwh * DAYTIME_USAGE_PERCENTAGE;
  const overnightUsageKwh = dailyUsageKwh * OVERNIGHT_USAGE_PERCENTAGE;
  
  // Direct self-consumption (daytime)
  const directSelfConsumption = Math.min(daytimeUsageKwh, dailyGenerationKwh);
  const excessSolarKwh = Math.max(0, dailyGenerationKwh - directSelfConsumption);
  
  // Battery storage and overnight coverage
  let batterySelfConsumption = 0;
  let remainingExcessSolar = excessSolarKwh;
  
  if (batterySizeKwh > 0) {
    const usableBatteryCapacity = batterySizeKwh * BATTERY_DEPTH_OF_DISCHARGE * BATTERY_ROUND_TRIP_EFFICIENCY;
    const batteryChargedKwh = Math.min(excessSolarKwh, usableBatteryCapacity);
    batterySelfConsumption = Math.min(batteryChargedKwh, overnightUsageKwh);
    remainingExcessSolar = excessSolarKwh - batteryChargedKwh;
  }
  
  // Calculate savings from self-consumption
  const totalSelfConsumptionKwh = (directSelfConsumption + batterySelfConsumption) * 365;
  const selfConsumptionSavings = totalSelfConsumptionKwh * SYNERGY_GRID_RATE;
  
  // Calculate export revenue (remaining solar exported to grid)
  const annualExportKwh = remainingExcessSolar * 365;
  const exportRevenue = (annualExportKwh * 0.9 * FEED_IN_TARIFF_OFF_PEAK) + 
                        (annualExportKwh * 0.1 * FEED_IN_TARIFF_PEAK);
  
  // Add EV savings if applicable (rough estimate)
  let evSavings = 0;
  if (hasEv) {
    evSavings = 500; // Approximate annual savings from charging EV with solar
  }
  
  // Total annual savings (capped at 98% of current bill to be conservative)
  const annualSavings = Math.min(
    selfConsumptionSavings + exportRevenue + evSavings,
    annualElectricityCost * 0.98
  );
  
  const monthlySavings = annualSavings / 12;
  const year25Savings = annualSavings * 25; // 25-year projection
  
  return {
    monthly: Math.round(monthlySavings),
    annual: Math.round(annualSavings),
    year25: Math.round(year25Savings),
  };
}

function calculateROI(totalCost: number, annualSavings: number) {
  const paybackYears = totalCost / annualSavings;
  const roiPercentage = ((annualSavings * 25 - totalCost) / totalCost) * 100;
  
  return {
    paybackYears: Math.round(paybackYears * 10) / 10, // Round to 1 decimal
    roiPercentage: Math.round(roiPercentage),
  };
}

function calculateProduction(
  systemSizeKw: number,
  batterySizeKwh: number,
  quarterlyBill: number
) {
  const annualGeneration = systemSizeKw * ANNUAL_KWH_PER_KW;
  const dailyGeneration = annualGeneration / 365;
  
  // Estimate self-consumption vs export
  const annualUsageKwh = (quarterlyBill * 4) / SYNERGY_GRID_RATE;
  const selfConsumptionPercentage = batterySizeKwh > 0 ? 70 : 40; // Battery increases self-consumption
  const exportPercentage = 100 - selfConsumptionPercentage;
  
  return {
    annualGeneration: Math.round(annualGeneration),
    dailyGeneration: Math.round(dailyGeneration * 10) / 10,
    selfConsumptionPercentage,
    exportPercentage,
  };
}

function calculateEnvironmentalImpact(annualGenerationKwh: number) {
  const co2SavedPerYear = (annualGenerationKwh * CO2_PER_KWH) / 1000; // Convert to tonnes
  const equivalentTrees = Math.round(co2SavedPerYear * TREES_PER_TONNE_CO2);
  const equivalentCars = Math.round(co2SavedPerYear / 4); // Average car emits ~4 tonnes CO2/year
  
  return {
    co2SavedPerYear: Math.round(co2SavedPerYear * 10) / 10, // Round to 1 decimal
    equivalentTrees,
    equivalentCars,
  };
}
