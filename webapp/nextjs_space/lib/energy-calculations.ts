/**
 * Comprehensive Energy Calculation Utilities
 * Based on Australian energy usage patterns and solar generation data
 */

// Australian Average Energy Consumption (kWh/day)
export const AUSTRALIAN_ENERGY_AVERAGES = {
  // Base household consumption by size (kWh/day)
  // NOTE: This INCLUDES typical hot water and moderate HVAC usage
  baseConsumption: {
    1: 8,   // Single person
    2: 12,  // Couple
    3: 16,  // Small family
    4: 20,  // Average family
    5: 24,  // Large family
    6: 28,  // 6 people
    7: 32,  // 7 people
    8: 36,  // 8+ people
  },
  
  // Additional HVAC for HEAVY users (beyond base rate)
  // Only add if user has exceptionally high AC usage
  hvacExtra: {
    summer: 8,       // kWh/day extra for heavy summer AC
    winter: 4,       // kWh/day extra for heavy winter heating
    annual: 5,       // Average extra kWh/day for heavy users
  },
  
  // Hot Water - already included in base, these are for reference only
  hotWaterReference: {
    1: 3,   // kWh/day per person (already in base)
    2: 5,
    3: 7,
    4: 8,
    5: 10,
    6: 11,
    7: 12,
    8: 13,
  },
  
  // Pool
  pool: {
    unheated: 3,     // kWh/day (pump only)
    heated: 12,      // kWh/day (pump + heating)
  },
  
  // Electric Vehicle
  ev: {
    dailyKm: 40,           // Average daily driving
    efficiency: 0.18,      // kWh/km (average EV)
    dailyCharge: 7.2,      // kWh/day per EV
  },
  
  // Home Office
  homeOffice: {
    perPerson: 3,    // kWh/day (computer, monitors, lighting, etc.)
  },
};

// Perth Solar Generation (average kWh per kW installed per day)
export const PERTH_SOLAR_GENERATION = {
  summer: 5.5,      // Dec-Feb
  winter: 3.2,      // Jun-Aug
  shoulder: 4.5,    // Mar-May, Sep-Nov
  annual: 4.4,      // Annual average
};

// Time-of-use patterns (percentage of daily consumption)
export const CONSUMPTION_PATTERNS = {
  // Daytime: 6am-6pm (solar generation period)
  daytime: 0.45,    // 45% of daily consumption
  
  // Evening peak: 6pm-10pm
  eveningPeak: 0.35, // 35% of daily consumption
  
  // Night: 10pm-6am
  night: 0.20,      // 20% of daily consumption
};

export interface EnergyProfile {
  quarterlyBill: number;
  householdSize: number;
  hasEv: boolean;
  planningEv: boolean;
  evCount: number;
  evChargingTime?: string;
  hasPool: boolean;
  poolHeated: boolean;
  homeOfficeCount: number;
  hasElectricHotWater?: boolean;
  hasAircon?: boolean;
}

export interface EnergyAnalysis {
  // Consumption breakdown
  dailyConsumption: number;
  annualConsumption: number;
  
  // Detailed breakdown
  breakdown: {
    baseLoad: number;
    hvac: number;
    hotWater: number;
    pool: number;
    ev: number;
    homeOffice: number;
  };
  
  // Time-of-use breakdown
  timeOfUse: {
    daytime: number;      // 6am-6pm
    eveningPeak: number;  // 6pm-10pm
    night: number;        // 10pm-6am
  };
  
  // System sizing
  recommendedSystemKw: number;
  recommendedBatteryKwh: number;
  
  // Generation estimates
  estimatedDailyGeneration: number;
  estimatedAnnualGeneration: number;
  
  // Self-sufficiency
  daytimeSelfSufficiency: number;  // % covered by solar
  nighttimeBatteryNeeds: number;   // kWh needed from battery
  
  // Financial
  currentAnnualCost: number;
  estimatedSavings: number;
}

/**
 * Calculate comprehensive energy analysis
 * NOTE: This is a synchronous wrapper for backward compatibility
 * For new code, use the async calculateDailyConsumption from consumption-service.ts
 */
export function calculateEnergyAnalysis(profile: EnergyProfile): EnergyAnalysis {
  // 1. Calculate base consumption from bill (this is the ACTUAL usage)
  const synergyRate = 0.3237; // $/kWh (Synergy WA average)
  const annualCostFromBill = profile.quarterlyBill * 4;
  const annualConsumptionFromBill = annualCostFromBill / synergyRate;
  const dailyConsumptionFromBill = annualConsumptionFromBill / 365;
  
  // 2. Calculate estimated breakdown using hardcoded values (fallback)
  // TODO: Migrate to database-driven calculation
  
  // Base consumption (includes moderate HVAC + hot water + appliances)
  const baselineConsumption = AUSTRALIAN_ENERGY_AVERAGES.baseConsumption[
    Math.min(profile.householdSize, 8) as keyof typeof AUSTRALIAN_ENERGY_AVERAGES.baseConsumption
  ] || 20;
  
  // For display breakdown: estimate HVAC and hot water portions
  const hvacPortion = Math.round(baselineConsumption * 0.32 * 10) / 10; // ~32% is HVAC
  const hotWaterPortion = Math.round(baselineConsumption * 0.35 * 10) / 10; // ~35% is hot water
  const baseAppliances = Math.round((baselineConsumption - hvacPortion - hotWaterPortion) * 10) / 10;
  
  // Pool (additional)
  const pool = profile.hasPool
    ? (profile.poolHeated 
        ? AUSTRALIAN_ENERGY_AVERAGES.pool.heated 
        : AUSTRALIAN_ENERGY_AVERAGES.pool.unheated)
    : 0;
  
  // EV (additional)
  const evCount = (profile.hasEv || profile.planningEv) ? profile.evCount : 0;
  const ev = evCount * AUSTRALIAN_ENERGY_AVERAGES.ev.dailyCharge;
  
  // Home Office (additional)
  const homeOffice = profile.homeOfficeCount * AUSTRALIAN_ENERGY_AVERAGES.homeOffice.perPerson;
  
  // Total estimated consumption from components
  const estimatedDailyConsumption = baselineConsumption + pool + ev + homeOffice;
  
  // Use bill-based as primary (it's actual usage), but if estimated is significantly higher
  // (e.g., they have EV/pool but bill doesn't reflect it yet), use estimated
  const dailyConsumption = estimatedDailyConsumption > dailyConsumptionFromBill * 1.3
    ? estimatedDailyConsumption  // Use estimated if it's 30%+ higher (likely new additions)
    : dailyConsumptionFromBill;   // Otherwise use actual bill
  
  const annualConsumption = dailyConsumption * 365;
  
  // 3. Time-of-use breakdown
  const daytimeConsumption = dailyConsumption * CONSUMPTION_PATTERNS.daytime;
  const eveningPeakConsumption = dailyConsumption * CONSUMPTION_PATTERNS.eveningPeak;
  const nightConsumption = dailyConsumption * CONSUMPTION_PATTERNS.night;
  
  // Adjust for EV charging time
  let adjustedDaytimeConsumption = daytimeConsumption;
  let adjustedNightConsumption = nightConsumption;
  
  if (evCount > 0 && profile.evChargingTime) {
    if (profile.evChargingTime === 'night') {
      // Move EV consumption to night
      adjustedNightConsumption += ev;
      adjustedDaytimeConsumption -= ev * 0.45; // Remove from daytime proportion
    } else if (profile.evChargingTime === 'midday') {
      // EV charging during peak solar
      adjustedDaytimeConsumption += ev * 0.5;
    }
  }
  
  // 4. System sizing for 24/7 coverage
  // Solar system needs to:
  // - Cover daytime consumption
  // - Charge battery for nighttime + evening consumption
  // - Account for losses (10% inverter + 10% battery round-trip = ~20% total)
  
  const nighttimeNeeds = adjustedNightConsumption + eveningPeakConsumption;
  const totalDailyNeeds = dailyConsumption;
  const totalWithLosses = totalDailyNeeds * 1.25; // 25% buffer for losses and cloudy days
  
  // System size based on Perth's average solar generation (4.4 kWh/kW/day)
  const recommendedSystemKw = Math.ceil(totalWithLosses / PERTH_SOLAR_GENERATION.annual);
  
  // Battery sizing for nighttime + evening (with 20% buffer and 80% DoD)
  const batteryUsableCapacity = nighttimeNeeds * 1.2; // 20% buffer
  const recommendedBatteryKwh = Math.ceil(batteryUsableCapacity / 0.8); // Account for 80% DoD
  
  // 5. Generation estimates
  const estimatedDailyGeneration = recommendedSystemKw * PERTH_SOLAR_GENERATION.annual;
  const estimatedAnnualGeneration = estimatedDailyGeneration * 365;
  
  // 6. Self-sufficiency calculations
  const daytimeSelfSufficiency = Math.min(
    (estimatedDailyGeneration / totalDailyNeeds) * 100,
    100
  );
  
  // 7. Financial estimates
  const currentAnnualCost = profile.quarterlyBill * 4;
  const estimatedSavings = currentAnnualCost * 0.85; // Assume 85% savings with solar + battery
  
  // Calculate breakdown as proportions of actual consumption
  // Scale each component proportionally to match actual bill
  const totalEstimated = estimatedDailyConsumption;
  const scaleFactor = totalEstimated > 0 ? dailyConsumption / totalEstimated : 1;
  
  return {
    dailyConsumption,
    annualConsumption,
    breakdown: {
      baseLoad: baseAppliances * scaleFactor,    // Base appliances (scaled)
      hvac: hvacPortion * scaleFactor,           // HVAC (scaled)
      hotWater: hotWaterPortion * scaleFactor,   // Hot water (scaled)
      pool: pool * scaleFactor,                   // Pool (if present, scaled)
      ev: ev * scaleFactor,                       // EV (if present, scaled)
      homeOffice: homeOffice * scaleFactor,       // Home office (if present, scaled)
    },
    timeOfUse: {
      daytime: adjustedDaytimeConsumption,
      eveningPeak: eveningPeakConsumption,
      night: adjustedNightConsumption,
    },
    recommendedSystemKw,
    recommendedBatteryKwh,
    estimatedDailyGeneration,
    estimatedAnnualGeneration,
    daytimeSelfSufficiency,
    nighttimeBatteryNeeds: nighttimeNeeds,
    currentAnnualCost,
    estimatedSavings,
  };
}

/**
 * Get system size category based on kW
 */
export function getSystemSizeCategory(systemKw: number): 'small' | 'medium' | 'large' {
  if (systemKw <= 6.6) return 'small';
  if (systemKw <= 10) return 'medium';
  return 'large';
}

/**
 * Get battery size recommendation based on nighttime needs
 * Matches available battery products and provides realistic sizing
 */
export function getBatterySizeRecommendation(nighttimeKwh: number): {
  minimum: number;
  recommended: number;
  optimal: number;
} {
  // Available battery sizes in our product catalog
  const availableSizes = [5, 9.6, 10.5, 13.5, 13.8, 20.5, 27.6, 40.5, 50.2];
  
  // Target 1.5x coverage (industry standard buffer for cloudy days + safety margin)
  const target = nighttimeKwh * 1.5;
  
  // Find the smallest battery that meets or exceeds target
  const recommendedSize = availableSizes.find(size => size >= target) || availableSizes[availableSizes.length - 1];
  const recommendedIndex = availableSizes.indexOf(recommendedSize);
  
  // Provide options: one size smaller, recommended, one size larger
  const minIndex = Math.max(0, recommendedIndex - 1);
  const optIndex = Math.min(availableSizes.length - 1, recommendedIndex + 1);
  
  return {
    minimum: availableSizes[minIndex],
    recommended: recommendedSize,
    optimal: availableSizes[optIndex],
  };
}
