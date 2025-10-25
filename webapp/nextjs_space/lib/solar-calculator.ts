
/**
 * ============================================================================
 * SOLAR CALCULATOR - GOOGLE SOLAR API WRAPPER
 * ============================================================================
 * 
 * This module handles Google Solar API-specific logic and delegates
 * core calculations to the unified API for consistency.
 * 
 * Flow:
 * 1. Receive Google Solar API data + user preferences + household characteristics
 * 2. Calculate accurate daily consumption using consumption-calculator
 * 3. Determine optimal system size based on roof analysis
 * 4. Call unified API for pricing, rebates, and calculations
 * 5. Enhance response with Google Solar-specific data
 * 6. Return complete, consistent quote
 * 
 * NOTE: This now delegates to /api/calculate-unified-quote for consistency
 */

import { PrismaClient } from '@prisma/client';
import { determineDailyConsumption, calculateDailyConsumption } from './consumption-calculator';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export interface GoogleSolarData {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  panelCapacityWatts: number;
  imageryQuality?: string;
  estimated?: boolean;
}

export interface UserPreferences {
  // Basic bill info (optional if household characteristics provided)
  quarterlyBill?: number;
  
  // Household characteristics for accurate consumption calculation
  householdSize: number;
  acTier?: string;        // 'minimal', 'moderate', 'heavy'
  poolType?: string;      // 'none', 'unheated', 'heated'
  homeOfficeCount?: number;
  evCount?: number;
  hasEv?: boolean;         // Kept for backward compatibility
  planningEv?: boolean;    // Kept for backward compatibility
  
  // NEW: EV-specific data from Step 3 consumption analysis
  dailyConsumption?: number;  // Calculated daily kWh from Step 3
  evUsageTier?: 'light' | 'average' | 'heavy' | 'very_heavy';
  evChargingTime?: 'morning' | 'midday' | 'evening' | 'night';
  
  // System preferences
  batterySizeKwh?: number; // Optional: user-selected battery size
  panelBrandId?: string;   // Optional: user-selected brands
  batteryBrandId?: string;
  inverterBrandId?: string;
}

export interface CompleteQuote {
  // System Configuration
  systemSizeKw: number;
  panelCount: number;
  panelWattage: number;
  batterySizeKwh: number;
  
  // Selected Brands
  panelBrand: {
    id: string;
    name: string;
    wattage: number;
    efficiency: number;
    tier: string;
  };
  batteryBrand: {
    id: string;
    name: string;
    capacityKwh: number;
    warrantyYears: number;
    tier: string;
  } | null;
  inverterBrand: {
    id: string;
    name: string;
    capacityKw: number;
    tier: string;
  };
  
  // Cost Breakdown
  costs: {
    panelSystem: number;
    battery: number;
    inverter: number;
    installation: number;
    totalBeforeRebates: number;
  };
  
  // Rebates
  rebates: {
    federalSolar: number;
    federalBattery: number;
    stateBattery: number;
    total: number;
  };
  
  // Final Costs
  totalCostAfterRebates: number;
  
  // Payment Options
  payment: {
    upfront: number;
    deposit: number;
    depositPercentage: number;
    monthlyPayment: number;
    installmentMonths: number;
  };
  
  // Savings & ROI
  savings: {
    solar: number;        // Annual savings from solar panels
    battery: number;      // Annual savings from battery storage
    ev: number;           // Annual savings from EV charging
    total: number;        // Total annual savings
    year10: number;       // Cumulative savings over 10 years
    year25: number;       // Cumulative savings over 25 years
  };
  
  roi: {
    paybackYears: number;
    percentageReturn: number; // ROI % over 25 years
  };
  
  // Environmental Impact
  environmental: {
    co2SavedPerYear: number;  // tonnes
    equivalentTrees: number;
    equivalentCars: number;
  };
  
  // Customer Data
  usage: {
    quarterlyBill?: number;
    annualCost: number;
    dailyUsageKwh: number;
    source: 'actual' | 'calculated' | 'validated';
    householdCharacteristics?: {
      householdSize: number;
      acTier?: string;
      poolType?: string;
      homeOfficeCount?: number;
      evCount?: number;
    };
    breakdown?: {
      baseline: number;
      acAdjustment: number;
      poolLoad: number;
      officeLoad: number;
      evLoad: number;
    };
  };
  
  // Source Data Quality
  dataQuality: {
    source: 'google' | 'estimated';
    imageryQuality?: string;
    confidence: 'high' | 'medium' | 'low';
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONSTANTS = {
  // Australian energy costs
  ELECTRICITY_RATE_PER_KWH: 0.28,
  ANNUAL_PRICE_INCREASE: 0.03, // 3% per year
  
  // Solar generation (Perth/WA average)
  AVG_SUN_HOURS_PER_DAY: 4.0,
  DAYS_PER_YEAR: 365,
  SYSTEM_EFFICIENCY: 0.80, // 80% system efficiency (losses, degradation)
  
  // Usage patterns
  DAYTIME_USAGE_PERCENTAGE: 0.30,  // 30% of usage during daytime (when solar produces)
  OVERNIGHT_USAGE_PERCENTAGE: 0.45, // 45% of usage overnight (when battery helps)
  
  // Battery specs
  BATTERY_DEPTH_OF_DISCHARGE: 0.90, // 90% usable capacity
  BATTERY_EFFICIENCY: 0.85,         // 85% round-trip efficiency
  
  // EV charging
  EV_ANNUAL_SAVINGS: 2500,          // Annual savings if charging EV with solar
  MIN_BATTERY_FOR_EV: 10,           // Minimum 10kWh battery for effective EV charging
  
  // Installation (FALLBACK ONLY - actual rates from database)
  BASE_INSTALLATION_COST: 1650,    // Fallback for 6.6kW system (6600W × $0.25)
  
  // Environmental impact (WA grid)
  CO2_PER_KWH_KG: 0.68,             // kg CO2 per kWh from WA grid
  CO2_PER_TREE_PER_YEAR_KG: 21,     // Average CO2 absorbed by a tree per year
  CO2_PER_CAR_PER_YEAR_KG: 4000,    // Average CO2 emitted by a car per year
  
  // Rebates
  SRES_CERTIFICATE_VALUE: 38,       // $ per STC
  SRES_ZONE_RATING: 1.382,          // Zone 3 (Perth)
  FEDERAL_BATTERY_REBATE_MAX: 3000,
  WA_BATTERY_REBATE_MAX: 5000,      // WA battery scheme
  
  // Payment
  DEPOSIT_PERCENTAGE: 10,
  INSTALLMENT_MONTHS: 24,
  
  // Panel defaults
  DEFAULT_PANEL_WATTAGE: 440,
  MIN_PANEL_WATTAGE: 350,
  MAX_PANEL_WATTAGE: 600,
};

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

export async function calculateCompleteSolarQuote(
  googleSolarData: GoogleSolarData,
  userPreferences: UserPreferences
): Promise<CompleteQuote> {
  
  // Step 1: Calculate accurate daily consumption using household characteristics
  // NEW: If dailyConsumption provided from Step 3, use it (already accounts for EV tier, seasonal adjustments, etc.)
  let consumptionResult: any;
  let dailyUsageKwh: number;
  
  if (userPreferences.dailyConsumption && userPreferences.dailyConsumption > 0) {
    // Use pre-calculated consumption from Step 3 (includes smart EV calculations)
    dailyUsageKwh = userPreferences.dailyConsumption;
    consumptionResult = {
      dailyConsumption: dailyUsageKwh,
      source: 'step3_calculated',
      breakdown: null, // Not available when using pre-calculated value
    };
  } else {
    // Fallback: Calculate consumption here
    consumptionResult = await determineDailyConsumption({
      quarterlyBill: userPreferences.quarterlyBill,
      ratePerKwh: CONSTANTS.ELECTRICITY_RATE_PER_KWH,
      householdSize: userPreferences.householdSize,
      acTier: userPreferences.acTier || 'moderate',
      poolType: userPreferences.poolType || 'none',
      homeOfficeCount: userPreferences.homeOfficeCount || 0,
      evCount: userPreferences.evCount || (userPreferences.hasEv ? 1 : (userPreferences.planningEv ? 1 : 0)),
    });
    dailyUsageKwh = consumptionResult.dailyConsumption;
  }
  
  const annualUsageKwh = dailyUsageKwh * CONSTANTS.DAYS_PER_YEAR;
  const annualElectricityCost = annualUsageKwh * CONSTANTS.ELECTRICITY_RATE_PER_KWH;
  
  // Step 2: Determine optimal system size
  const systemSizeKw = determineSystemSize(googleSolarData, userPreferences, dailyUsageKwh);
  
  // Step 3: Calculate battery size (user preference or smart recommendation)
  const hasEv = Boolean((userPreferences.evCount || 0) > 0 || userPreferences.hasEv || userPreferences.planningEv);
  
  let batterySizeKwh: number;
  if (userPreferences.batterySizeKwh) {
    // User has selected a specific battery size
    batterySizeKwh = userPreferences.batterySizeKwh;
  } else if (userPreferences.evUsageTier && userPreferences.evChargingTime) {
    // NEW: Use smart battery sizing with detailed EV data
    const { calculateSmartBatterySize } = await import('./battery-sizing');
    const smartRecommendation = calculateSmartBatterySize({
      dailyUsage: dailyUsageKwh,
      hasEv: hasEv || userPreferences.hasEv || false,
      planningEv: userPreferences.planningEv || false,
      evCount: userPreferences.evCount || 1,
      evChargingTime: userPreferences.evChargingTime,
      evUsageTier: userPreferences.evUsageTier,
    });
    batterySizeKwh = smartRecommendation.recommendedSize;
  } else {
    // Fallback to basic recommendation
    batterySizeKwh = recommendBatterySize(dailyUsageKwh, hasEv);
  }
  
  // ============================================
  // Step 4: CALL UNIFIED CALCULATOR FOR CONSISTENCY
  // ============================================
  // Delegate all pricing, rebate, and calculation logic to unified calculator
  // This ensures 100% consistency across all calculator systems
  
  const { calculateUnifiedQuote } = await import('./unified-quote-calculator');
  
  const quote = await calculateUnifiedQuote({
    systemSizeKw,
    batterySizeKwh,
    postcode: '6000', // Default to Perth, should be passed from user data
    region: 'WA',
    panelProductId: userPreferences.panelBrandId,
    inverterProductId: userPreferences.inverterBrandId,
    batteryProductId: userPreferences.batteryBrandId,
    includeInstallation: true,
    dailyConsumptionKwh: dailyUsageKwh,
    quarterlyBill: userPreferences.quarterlyBill,
    annualConsumption: annualUsageKwh,
  });
  
  // Extract data from unified API response
  const panelCount = quote.panelCount;
  const brands = {
    panel: {
      id: quote.selectedPanel.id,
      name: quote.selectedPanel.name,
      wattage: quote.selectedPanel.wattage,
      efficiency: 0.20, // Default efficiency
      tier: quote.selectedPanel.tier,
    },
    battery: quote.selectedBattery ? {
      id: quote.selectedBattery.id,
      name: quote.selectedBattery.name,
      capacityKwh: quote.selectedBattery.capacity,
      warrantyYears: quote.selectedBattery.warrantyYears,
      tier: quote.selectedBattery.tier,
    } : null,
    inverter: {
      id: quote.selectedInverter.id,
      name: quote.selectedInverter.name,
      capacityKw: quote.selectedInverter.capacity,
      tier: quote.selectedInverter.tier,
    },
  };
  
  const costs = {
    panelSystem: quote.costs.panelCost,
    battery: quote.costs.batteryCost,
    inverter: quote.costs.inverterCost,
    installation: quote.costs.installationCost,
    totalBeforeRebates: quote.costs.subtotal,
  };
  
  const rebates = {
    federalSolar: quote.rebates.federalSolar,
    federalBattery: quote.rebates.federalBattery,
    stateBattery: quote.rebates.stateBattery,
    total: quote.rebates.total,
  };
  
  const totalCostAfterRebates = quote.totalAfterRebates;
  
  // Step 5: Calculate savings (use unified API data if available)
  const savings = quote.savings ? {
    solar: quote.savings.annualSavings * 0.7, // Approximate split
    battery: quote.savings.annualSavings * 0.3,
    ev: hasEv ? 2500 : 0,
    total: quote.savings.annualSavings,
    year10: quote.savings.year10Savings,
    year25: quote.savings.year25Savings,
  } : calculateSavings(
    systemSizeKw,
    batterySizeKwh,
    annualUsageKwh,
    annualElectricityCost,
    hasEv,
    totalCostAfterRebates
  );
  
  // Step 6: Calculate ROI
  const roi = quote.savings ? {
    paybackYears: quote.savings.paybackYears,
    percentageReturn: (quote.savings.year25Savings / totalCostAfterRebates) * 100,
  } : calculateROI(totalCostAfterRebates, savings);
  
  // Step 7: Calculate payment options
  const payment = calculatePaymentOptions(totalCostAfterRebates);
  
  // Step 8: Calculate environmental impact
  const environmental = calculateEnvironmentalImpact(systemSizeKw);
  
  // Step 12: Assemble usage data
  const usage = {
    quarterlyBill: userPreferences.quarterlyBill,
    annualCost: annualElectricityCost,
    dailyUsageKwh: dailyUsageKwh,
    source: consumptionResult.source,
    householdCharacteristics: {
      householdSize: userPreferences.householdSize,
      acTier: userPreferences.acTier || 'moderate',
      poolType: userPreferences.poolType || 'none',
      homeOfficeCount: userPreferences.homeOfficeCount || 0,
      evCount: userPreferences.evCount || (hasEv ? 1 : 0),
    },
    breakdown: consumptionResult.breakdown,
  };
  
  // Step 13: Determine data quality
  const dataQuality = {
    source: (googleSolarData.estimated ? 'estimated' : 'google') as 'google' | 'estimated',
    imageryQuality: googleSolarData.imageryQuality,
    confidence: determineConfidence(googleSolarData),
  };
  
  // Return complete quote
  return {
    systemSizeKw,
    panelCount,
    panelWattage: brands.panel.wattage,
    batterySizeKwh,
    panelBrand: brands.panel,
    batteryBrand: brands.battery,
    inverterBrand: brands.inverter,
    costs,
    rebates,
    totalCostAfterRebates,
    payment,
    savings,
    roi,
    environmental,
    usage,
    dataQuality,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine optimal system size based on Google data and user needs
 */
function determineSystemSize(
  googleData: GoogleSolarData,
  preferences: UserPreferences,
  dailyUsageKwh: number
): number {
  // Calculate size needed to offset user's consumption
  const annualUsageKwh = dailyUsageKwh * CONSTANTS.DAYS_PER_YEAR;
  const systemSizeForUsage = annualUsageKwh / (CONSTANTS.AVG_SUN_HOURS_PER_DAY * CONSTANTS.DAYS_PER_YEAR * CONSTANTS.SYSTEM_EFFICIENCY);
  
  // Calculate size based on roof space
  let systemSizeForRoof: number;
  
  if (googleData.maxArrayPanelsCount > 0) {
    // Use Google's panel count data
    const panelWattage = googleData.panelCapacityWatts || CONSTANTS.DEFAULT_PANEL_WATTAGE;
    systemSizeForRoof = (googleData.maxArrayPanelsCount * panelWattage) / 1000;
  } else if (googleData.maxArrayAreaMeters2 > 0) {
    // Estimate from roof area
    // Average panel is ~2m² and produces ~440W
    const estimatedPanels = Math.floor(googleData.maxArrayAreaMeters2 / 2);
    systemSizeForRoof = (estimatedPanels * CONSTANTS.DEFAULT_PANEL_WATTAGE) / 1000;
  } else {
    // Fallback: conservative estimate
    systemSizeForRoof = 10; // 10kW default
  }
  
  // Take the smaller of the two (don't over-generate or exceed roof capacity)
  // But add 20% buffer for EV charging if applicable
  let recommendedSize = Math.min(systemSizeForUsage, systemSizeForRoof);
  
  const hasEv = (preferences.evCount || 0) > 0 || preferences.hasEv || preferences.planningEv;
  if (hasEv) {
    recommendedSize *= 1.2; // 20% larger for EV
  }
  
  // Round to nearest 0.5kW
  recommendedSize = Math.round(recommendedSize * 2) / 2;
  
  // Ensure minimum 3kW, maximum based on roof
  return Math.max(3, Math.min(recommendedSize, systemSizeForRoof));
}

/**
 * Select appropriate brands based on system requirements
 */
async function selectBrands(
  systemSizeKw: number,
  batterySizeKwh: number,
  userSelections: {
    panelBrandId?: string;
    batteryBrandId?: string;
    inverterBrandId?: string;
  }
) {
  // Fetch brands from database
  const [panels, batteries, inverters] = await Promise.all([
    prisma.panelBrand.findMany({ where: { isAvailable: true }, orderBy: { tier: 'asc' } }),
    prisma.batteryBrand.findMany({ where: { isAvailable: true }, orderBy: { tier: 'asc' } }),
    prisma.inverterBrand.findMany({ where: { isAvailable: true }, orderBy: { tier: 'asc' } }),
  ]);
  
  // Select panel
  let selectedPanel;
  if (userSelections.panelBrandId) {
    selectedPanel = panels.find(p => p.id === userSelections.panelBrandId);
  }
  if (!selectedPanel) {
    // Default to first tier 1 or premium panel
    selectedPanel = panels.find(p => p.tier === 'tier1' || p.tier === 'premium') || panels[0];
  }
  
  // Select battery
  let selectedBattery = null;
  if (batterySizeKwh > 0) {
    if (userSelections.batteryBrandId) {
      selectedBattery = batteries.find(b => b.id === userSelections.batteryBrandId);
    }
    if (!selectedBattery) {
      // Find battery matching the size
      selectedBattery = batteries.find(b => 
        b.capacityKwh >= batterySizeKwh * 0.9 && 
        b.capacityKwh <= batterySizeKwh * 1.1
      ) || batteries[0];
    }
  }
  
  // Select inverter
  let selectedInverter;
  if (userSelections.inverterBrandId) {
    selectedInverter = inverters.find(i => i.id === userSelections.inverterBrandId);
  }
  if (!selectedInverter) {
    // Find inverter matching system size
    selectedInverter = inverters.find(i => 
      i.capacityKw >= systemSizeKw * 0.9 && 
      i.capacityKw <= systemSizeKw * 1.2
    ) || inverters[0];
  }
  
  return {
    panel: {
      id: selectedPanel.id,
      name: selectedPanel.name,
      wattage: selectedPanel.wattage,
      efficiency: selectedPanel.efficiency,
      tier: selectedPanel.tier,
      pricePerKw: selectedPanel.pricePerKw,
    },
    battery: selectedBattery ? {
      id: selectedBattery.id,
      name: selectedBattery.name,
      capacityKwh: selectedBattery.capacityKwh,
      warrantyYears: selectedBattery.warrantyYears,
      tier: selectedBattery.tier,
      price: selectedBattery.price,
    } : null,
    inverter: {
      id: selectedInverter.id,
      name: selectedInverter.name,
      capacityKw: selectedInverter.capacityKw,
      tier: selectedInverter.tier,
      pricePerKw: selectedInverter.pricePerKw,
    },
  };
}

/**
 * Recommend battery size based on usage
 */
function recommendBatterySize(dailyUsageKwh: number, hasEv: boolean): number {
  const overnightUsageKwh = dailyUsageKwh * CONSTANTS.OVERNIGHT_USAGE_PERCENTAGE;
  
  // Battery should cover overnight usage
  let recommendedSize = overnightUsageKwh / (CONSTANTS.BATTERY_DEPTH_OF_DISCHARGE * CONSTANTS.BATTERY_EFFICIENCY);
  
  // Add EV buffer
  if (hasEv) {
    recommendedSize = Math.max(recommendedSize, 15); // Minimum 15kWh for EV
  }
  
  // Round to common sizes: 0, 10, 13.5, 20, 27, 30, 40, 50
  const commonSizes = [0, 10, 13.5, 20, 27, 30, 40, 50];
  return commonSizes.reduce((prev, curr) => 
    Math.abs(curr - recommendedSize) < Math.abs(prev - recommendedSize) ? curr : prev
  );
}

/**
 * Calculate all costs using actual brand prices from database
 * Installation costs now database-driven to match quote-tester
 */
async function calculateCosts(
  systemSizeKw: number,
  batterySizeKwh: number,
  brands: Awaited<ReturnType<typeof selectBrands>>
) {
  // Panel cost: Use actual price per kW from database
  const panelSystem = brands.panel.pricePerKw * systemSizeKw;
  
  // Battery cost: Use actual price from database
  const battery = brands.battery ? brands.battery.price : 0;
  
  // Inverter cost: Use actual price per kW from database
  const inverter = brands.inverter.pricePerKw * systemSizeKw;
  
  // Installation: Get from database (matches quote-tester logic)
  let installation = CONSTANTS.BASE_INSTALLATION_COST; // Fallback
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get standard solar installation rate (25c/W subcontractor)
    const solarInstallLabor = await prisma.installationLaborType.findFirst({
      where: { 
        code: 'SOLAR_INSTALL_1P', // Standard 1-phase installation
        isActive: true 
      }
    });
    
    if (solarInstallLabor && solarInstallLabor.perUnitRate) {
      // Calculate based on system size (per watt rate)
      installation = systemSizeKw * 1000 * solarInstallLabor.perUnitRate;
    } else {
      // Fallback to 25c/W if not in database
      installation = systemSizeKw * 1000 * 0.25;
    }
    
    // Add battery installation if battery selected
    if (batterySizeKwh > 0) {
      const batteryInstallLabor = await prisma.installationLaborType.findFirst({
        where: { 
          code: 'BATTERY_INSTALL',
          isActive: true 
        }
      });
      
      if (batteryInstallLabor) {
        const batteryInstallCost = (batteryInstallLabor.baseRate || 500) + 
                                   (batterySizeKwh * (batteryInstallLabor.perUnitRate || 50));
        installation += batteryInstallCost;
      } else {
        // Fallback: $500 base + $50/kWh
        installation += 500 + (batterySizeKwh * 50);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error fetching installation rates from database, using fallback:', error);
    // Fallback calculation: 25c/W for solar + battery if applicable
    installation = systemSizeKw * 1000 * 0.25;
    if (batterySizeKwh > 0) {
      installation += 500 + (batterySizeKwh * 50);
    }
  }
  
  return {
    panelSystem,
    battery,
    inverter,
    installation,
    totalBeforeRebates: panelSystem + battery + inverter + installation,
  };
}

/**
 * Calculate rebates using database-driven formulas (SINGLE SOURCE OF TRUTH)
 * 
 * This ensures consistency with /api/calculate-quote and uses the validated
 * formulas from the rebate research document.
 */
async function calculateRebates(
  systemSizeKw: number,
  batterySizeKwh: number,
  batteryCost: number
) {
  // Import the database-driven rebate calculator
  const { calculateRebatesFromDB } = await import('./pricing-service');
  
  // Use the database formulas (single source of truth)
  const dbRebates = await calculateRebatesFromDB(
    systemSizeKw,
    batterySizeKwh,
    batteryCost
  );
  
  return {
    federalSolar: dbRebates.federalSRES,
    federalBattery: dbRebates.federalBattery,
    stateBattery: dbRebates.waBatteryScheme,
    total: dbRebates.totalRebates,
  };
}

/**
 * Calculate annual and lifetime savings
 */
function calculateSavings(
  systemSizeKw: number,
  batterySizeKwh: number,
  annualUsageKwh: number,
  annualElectricityCost: number,
  hasEv: boolean,
  totalCostAfterRebates: number
) {
  
  // Solar savings: offset daytime usage
  const daytimeUsageKwh = annualUsageKwh * CONSTANTS.DAYTIME_USAGE_PERCENTAGE;
  const annualGenerationKwh = systemSizeKw * CONSTANTS.AVG_SUN_HOURS_PER_DAY * CONSTANTS.DAYS_PER_YEAR * CONSTANTS.SYSTEM_EFFICIENCY;
  const solarOffsetKwh = Math.min(daytimeUsageKwh, annualGenerationKwh);
  const solar = solarOffsetKwh * CONSTANTS.ELECTRICITY_RATE_PER_KWH;
  
  // Battery savings: offset overnight usage
  let battery = 0;
  if (batterySizeKwh > 0) {
    const overnightUsageKwh = annualUsageKwh * CONSTANTS.OVERNIGHT_USAGE_PERCENTAGE;
    const dailyUsageKwh = annualUsageKwh / CONSTANTS.DAYS_PER_YEAR;
    const overnightDailyKwh = dailyUsageKwh * CONSTANTS.OVERNIGHT_USAGE_PERCENTAGE;
    const batteryCapacityKwh = batterySizeKwh * CONSTANTS.BATTERY_DEPTH_OF_DISCHARGE * CONSTANTS.BATTERY_EFFICIENCY;
    const coverageRatio = Math.min(batteryCapacityKwh / overnightDailyKwh, 1.0);
    battery = overnightUsageKwh * coverageRatio * CONSTANTS.ELECTRICITY_RATE_PER_KWH;
  }
  
  // EV savings
  const ev = (hasEv && batterySizeKwh >= CONSTANTS.MIN_BATTERY_FOR_EV) ? CONSTANTS.EV_ANNUAL_SAVINGS : 0;
  
  // Total annual savings (cap at 98% of current bill)
  const total = Math.min(solar + battery + ev, annualElectricityCost * 0.98);
  
  // Long-term savings with electricity price increases
  let year10 = 0;
  let year25 = 0;
  
  for (let year = 0; year < 25; year++) {
    const yearSavings = total * Math.pow(1 + CONSTANTS.ANNUAL_PRICE_INCREASE, year);
    year25 += yearSavings;
    if (year < 10) {
      year10 += yearSavings;
    }
  }
  
  // Subtract initial investment for net profit
  year10 -= totalCostAfterRebates;
  year25 -= totalCostAfterRebates;
  
  return {
    solar,
    battery,
    ev,
    total,
    year10,
    year25,
  };
}

/**
 * Calculate ROI metrics
 */
function calculateROI(
  totalCostAfterRebates: number,
  savings: ReturnType<typeof calculateSavings>
) {
  const paybackYears = savings.total > 0 ? totalCostAfterRebates / savings.total : 0;
  const percentageReturn = totalCostAfterRebates > 0 
    ? ((savings.year25 + totalCostAfterRebates) / totalCostAfterRebates - 1) * 100 
    : 0;
  
  return {
    paybackYears,
    percentageReturn,
  };
}

/**
 * Calculate payment options
 */
function calculatePaymentOptions(totalCostAfterRebates: number) {
  const deposit = totalCostAfterRebates * (CONSTANTS.DEPOSIT_PERCENTAGE / 100);
  const monthlyPayment = totalCostAfterRebates / CONSTANTS.INSTALLMENT_MONTHS;
  
  return {
    upfront: totalCostAfterRebates,
    deposit,
    depositPercentage: CONSTANTS.DEPOSIT_PERCENTAGE,
    monthlyPayment,
    installmentMonths: CONSTANTS.INSTALLMENT_MONTHS,
  };
}

/**
 * Calculate environmental impact
 */
function calculateEnvironmentalImpact(systemSizeKw: number) {
  const annualGenerationKwh = systemSizeKw * CONSTANTS.AVG_SUN_HOURS_PER_DAY * CONSTANTS.DAYS_PER_YEAR * CONSTANTS.SYSTEM_EFFICIENCY;
  const co2SavedKg = annualGenerationKwh * CONSTANTS.CO2_PER_KWH_KG;
  const co2SavedPerYear = co2SavedKg / 1000; // Convert to tonnes
  
  const equivalentTrees = Math.round(co2SavedKg / CONSTANTS.CO2_PER_TREE_PER_YEAR_KG);
  const equivalentCars = Math.round(co2SavedKg / CONSTANTS.CO2_PER_CAR_PER_YEAR_KG);
  
  return {
    co2SavedPerYear,
    equivalentTrees,
    equivalentCars,
  };
}

/**
 * Determine confidence level in data quality
 */
function determineConfidence(googleData: GoogleSolarData): 'high' | 'medium' | 'low' {
  if (googleData.estimated) return 'low';
  if (googleData.imageryQuality === 'HIGH' && googleData.maxArrayPanelsCount > 0) return 'high';
  if (googleData.imageryQuality === 'MEDIUM' || googleData.maxArrayAreaMeters2 > 50) return 'medium';
  return 'low';
}

