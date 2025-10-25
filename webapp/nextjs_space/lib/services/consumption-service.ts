import { PrismaClient } from '@prisma/client';
import { getTimeOfUsePattern } from './time-of-use-service';

const prisma = new PrismaClient();

/**
 * Fetch consumption assumptions from database
 */
export async function getConsumptionAssumptions() {
  const assumptions = await prisma.consumptionAssumption.findMany({
    where: { active: true, region: 'WA' },
  });

  // Organize by type for easy lookup
  const organized = {
    baseline: {} as Record<number, number>,
    ac: {} as Record<string, number>,
    pool: {} as Record<string, number>,
    ev: {} as Record<string, number>,
    evCharging: {} as Record<string, number>,
    hotWater: {} as Record<number, number>,  // Changed to household-size based
    cooking: 0,
    office: 0,
  };

  assumptions.forEach((assumption) => {
    switch (assumption.assumptionType) {
      case 'baseline':
        if (assumption.householdSize && assumption.baselineKwhPerDay) {
          organized.baseline[assumption.householdSize] = assumption.baselineKwhPerDay;
        }
        break;
      case 'ac':
        if (assumption.acTier && assumption.acAdjustmentKwhPerDay) {
          organized.ac[assumption.acTier] = assumption.acAdjustmentKwhPerDay;
        }
        break;
      case 'pool':
        if (assumption.poolType && assumption.poolKwhPerDay !== null) {
          organized.pool[assumption.poolType] = assumption.poolKwhPerDay;
        }
        break;
      case 'ev':
        if (assumption.evTier && assumption.evKwhPerDay) {
          organized.ev[assumption.evTier] = assumption.evKwhPerDay;
        }
        break;
      case 'ev_charging':
        if (assumption.evTier && assumption.evKwhPerDay) {
          organized.evCharging[assumption.evTier] = assumption.evKwhPerDay;
        }
        break;
      case 'hotwater':
        if (assumption.householdSize && assumption.hotWaterKwhPerDay) {
          organized.hotWater[assumption.householdSize] = assumption.hotWaterKwhPerDay;
        }
        break;
      case 'cooking':
        if (assumption.cookingKwhPerDay) {
          organized.cooking = assumption.cookingKwhPerDay;
        }
        break;
      case 'office':
        if (assumption.homeOfficeKwhPerDay) {
          organized.office = assumption.homeOfficeKwhPerDay;
        }
        break;
    }
  });

  return organized;
}

/**
 * Calculate daily consumption based on user inputs and database assumptions
 */
export async function calculateDailyConsumption(params: {
  householdSize: number;
  hasEv: boolean;
  planningEv: boolean;
  evCount: number;
  evChargingMethod?: string;
  evChargingHours?: number;
  hasPool: boolean;
  poolHeated: boolean;
  homeOfficeCount: number;
  acUsage?: string;  // minimal, moderate, heavy, none
  hasElectricHotWater?: boolean;
  bimonthlyBill?: number;
}) {
  const assumptions = await getConsumptionAssumptions();

  // 1. Get baseline consumption (base appliances only - lights, fridge, TV, etc.)
  const householdSize = Math.min(params.householdSize, 7);
  const baseAppliances = assumptions.baseline[householdSize] || 4;
  
  // 1a. Add AC based on user selection
  const acUsage = params.acUsage || 'moderate';
  const acConsumption = assumptions.ac[acUsage] || (acUsage === 'none' ? 0 : 10);
  
  // 1b. Add hot water based on user selection and household size
  const hotWaterConsumption = params.hasElectricHotWater 
    ? (assumptions.hotWater[householdSize] || 6) 
    : 0;
  
  // Total baseline = base appliances + AC + hot water
  const baselineConsumption = baseAppliances + acConsumption + hotWaterConsumption;

  // 2. Add EV consumption (if applicable)
  // Now calculated based on charging power (kW) × hours per day
  let evConsumption = 0;
  
  console.log('EV Params Received:', {
    hasEv: params.hasEv,
    planningEv: params.planningEv,
    evCount: params.evCount,
    evChargingMethod: params.evChargingMethod,
    evChargingHours: params.evChargingHours,
    evChargingHoursType: typeof params.evChargingHours
  });
  
  if (params.hasEv || params.planningEv) {
    if (params.evChargingMethod && params.evChargingHours) {
      // Get charging power (kW) from database
      const chargingPowerKw = assumptions.evCharging[params.evChargingMethod] || 2.4;
      // Calculate: Power (kW) × Hours = Energy (kWh)
      evConsumption = chargingPowerKw * params.evChargingHours * params.evCount;
      
      console.log('EV Calculation:', {
        method: params.evChargingMethod,
        powerKw: chargingPowerKw,
        hours: params.evChargingHours,
        evCount: params.evCount,
        formula: `${chargingPowerKw} kW × ${params.evChargingHours} hrs × ${params.evCount} EVs`,
        totalConsumption: evConsumption
      });
    } else {
      // Fallback to standard daily consumption if no charging details
      const evPerVehicle = assumptions.ev['standard'] || 9; // Default to standard 9 kWh/day
      evConsumption = evPerVehicle * params.evCount;
      
      console.log('EV Fallback:', {
        evPerVehicle,
        evCount: params.evCount,
        totalConsumption: evConsumption,
        reason: !params.evChargingMethod ? 'No charging method' : 'No charging hours',
        evChargingMethod: params.evChargingMethod,
        evChargingHours: params.evChargingHours
      });
    }
  }

  // 3. Add pool consumption (if applicable)
  let poolConsumption = 0;
  if (params.hasPool) {
    const poolType = params.poolHeated ? 'heated' : 'unheated';
    poolConsumption = assumptions.pool[poolType] || 0;
  }

  // 4. Add home office consumption (if applicable)
  const officeConsumption = params.homeOfficeCount * (assumptions.office || 1.5);

  // 5. Calculate total estimated consumption
  const estimatedDailyConsumption = 
    baselineConsumption + 
    evConsumption + 
    poolConsumption + 
    officeConsumption;

  // 6. Calculate consumption from bill (if provided)
  let billBasedDailyConsumption: number | null = null;
  if (params.bimonthlyBill) {
    const synergyRate = 0.3237; // $/kWh
    const annualCost = params.bimonthlyBill * 6; // 6 bills per year
    const annualConsumption = annualCost / synergyRate;
    billBasedDailyConsumption = annualConsumption / 365;
  }

  // 7. Always use calculated consumption (database-driven)
  // Bills vary by season and don't reflect future additions
  // We'll use bill as a confidence indicator for admin, not for scaling
  const finalDailyConsumption = estimatedDailyConsumption;
  const usageSource: 'calculated' | 'actual' | 'hybrid' = 'calculated';
  
  // Calculate confidence level for admin (how close is our estimate to their bill?)
  let confidenceLevel: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
  let variancePercentage = 0;
  
  if (billBasedDailyConsumption) {
    variancePercentage = ((estimatedDailyConsumption - billBasedDailyConsumption) / billBasedDailyConsumption) * 100;
    
    // Confidence based on variance
    if (Math.abs(variancePercentage) <= 15) {
      confidenceLevel = 'high';  // Within 15% = very accurate
    } else if (Math.abs(variancePercentage) <= 30) {
      confidenceLevel = 'medium';  // Within 30% = reasonable
    } else {
      confidenceLevel = 'low';  // >30% difference = needs review
    }
  }

  console.log('Calculation Summary:', {
    estimatedDailyConsumption,
    billBasedDailyConsumption,
    variancePercentage: Math.round(variancePercentage),
    confidenceLevel,
    components: {
      baseAppliances,
      acConsumption,
      hotWaterConsumption,
      poolConsumption,
      evConsumption,
      officeConsumption,
      total: baselineConsumption + poolConsumption + evConsumption + officeConsumption
    }
  });

  return {
    dailyConsumption: Math.round(finalDailyConsumption * 10) / 10,
    annualConsumption: Math.round(finalDailyConsumption * 365),
    usageSource,
    variancePercentage: Math.round(variancePercentage),
    confidenceLevel,  // For admin to see accuracy
    breakdown: {
      baseline: Math.round(baselineConsumption * 10) / 10,
      ev: Math.round(evConsumption * 10) / 10,
      pool: Math.round(poolConsumption * 10) / 10,
      office: Math.round(officeConsumption * 10) / 10,
    },
    componentBreakdown: {
      baseAppliances: Math.round(baseAppliances * 10) / 10,
      hvac: Math.round(acConsumption * 10) / 10,
      hotWater: Math.round(hotWaterConsumption * 10) / 10,
      ev: Math.round(evConsumption * 10) / 10,
      pool: Math.round(poolConsumption * 10) / 10,
      office: Math.round(officeConsumption * 10) / 10,
    },
    estimated: {
      baseline: baselineConsumption,
      ev: evConsumption,
      pool: poolConsumption,
      office: officeConsumption,
      total: estimatedDailyConsumption,
    },
    billBased: billBasedDailyConsumption ? {
      daily: Math.round(billBasedDailyConsumption * 10) / 10,
      annual: Math.round(billBasedDailyConsumption * 365),
    } : null,
  };
}

/**
 * Calculate system sizing recommendations
 */
export async function calculateSystemRecommendations(params: {
  dailyConsumption: number;
  evConsumption: number; // EV consumption to distribute separately
  hasEv: boolean;
  planningEv: boolean;
  evCount: number;
  evChargingTime?: string;
  evChargingMethod?: string;
  evChargingHours?: number;
  evBatterySize?: number;
}) {
  const assumptions = await getConsumptionAssumptions();

  // 1. Solar system sizing
  // Perth average: 4.4 kWh per kW installed per day
  const solarGenerationPerKw = 4.4;
  
  // Add 25% buffer for system losses and future growth
  const dailyNeedsWithBuffer = params.dailyConsumption * 1.25;
  
  // Calculate required system size
  const recommendedSystemKw = Math.ceil((dailyNeedsWithBuffer / solarGenerationPerKw) * 2) / 2; // Round to nearest 0.5 kW
  const estimatedDailyGeneration = recommendedSystemKw * solarGenerationPerKw;
  const estimatedAnnualGeneration = Math.round(estimatedDailyGeneration * 365);

  // 2. Time-of-use breakdown
  // Get time-of-use pattern from database
  const timeOfUsePattern = await getTimeOfUsePattern();
  
  // Calculate base consumption (excluding EV)
  const baseConsumption = params.dailyConsumption - params.evConsumption;
  
  // Apply time-of-use percentages to base consumption only
  let daytimeConsumption = baseConsumption * timeOfUsePattern.daytime; // 30%
  let eveningConsumption = baseConsumption * timeOfUsePattern.evening; // 45%
  let nightConsumption = baseConsumption * timeOfUsePattern.night; // 25%
  
  // Add EV consumption to the appropriate time slot based on charging time
  if ((params.hasEv || params.planningEv) && params.evConsumption > 0) {
    const chargingTime = params.evChargingTime || 'night'; // Default to night
    
    switch (chargingTime) {
      case 'morning':
      case 'midday':
        daytimeConsumption += params.evConsumption;
        break;
      case 'evening':
        eveningConsumption += params.evConsumption;
        break;
      case 'night':
      default:
        nightConsumption += params.evConsumption;
        break;
    }
  }

  // 3. Battery sizing
  // Battery needs to cover evening + night consumption
  const eveningBatteryPortion = eveningConsumption; // Full evening from battery
  const nighttimeBatteryPortion = nightConsumption; // Full night from battery
  let totalBatteryNeeds = eveningBatteryPortion + nighttimeBatteryPortion;

  // Add 10% safety buffer
  const batteryWithBuffer = totalBatteryNeeds * 1.1;
  
  // Account for depth of discharge (90% DoD for modern lithium batteries)
  const depthOfDischarge = 0.9;
  const nominalCapacity = batteryWithBuffer / depthOfDischarge;
  
  // Round to nearest 5 kWh
  const recommendedBatteryKwh = Math.ceil(nominalCapacity / 5) * 5;

  // 4. Financial estimates
  const currentAnnualCost = params.dailyConsumption * 365 * 0.3237; // Synergy rate
  const estimatedSavings = currentAnnualCost * 0.85; // 85% savings with solar + battery
  const paybackYears = ((recommendedSystemKw * 1000) + (recommendedBatteryKwh * 1000)) / estimatedSavings;

  return {
    solar: {
      recommendedKw: recommendedSystemKw,
      estimatedDailyGeneration: Math.round(estimatedDailyGeneration * 10) / 10,
      estimatedAnnualGeneration,
    },
    battery: {
      recommendedKwh: recommendedBatteryKwh,
      nighttimeLoad: Math.round(nightConsumption * 10) / 10,
      totalBatteryNeeds: Math.round(totalBatteryNeeds * 10) / 10,
    },
    timeOfUse: {
      daytime: Math.round(daytimeConsumption * 10) / 10,
      evening: Math.round(eveningConsumption * 10) / 10,
      night: Math.round(nightConsumption * 10) / 10,
    },
    financial: {
      currentAnnualCost: Math.round(currentAnnualCost),
      estimatedAnnualSavings: Math.round(estimatedSavings),
      estimatedPaybackYears: Math.round(paybackYears * 10) / 10,
    },
  };
}

/**
 * Get detailed breakdown with component-level analysis
 */
export async function getDetailedEnergyBreakdown(params: {
  householdSize: number;
  hasEv: boolean;
  planningEv: boolean;
  evCount: number;
  evChargingTime?: string;
  evChargingMethod?: string;
  evChargingHours?: number;
  evBatterySize?: number;
  hasPool: boolean;
  poolHeated: boolean;
  homeOfficeCount: number;
  acUsage?: string;
  hasElectricHotWater?: boolean;
  bimonthlyBill?: number;
}) {
  const assumptions = await getConsumptionAssumptions();
  const consumption = await calculateDailyConsumption(params);
  const recommendations = await calculateSystemRecommendations({
    dailyConsumption: consumption.dailyConsumption,
    evConsumption: consumption.breakdown.ev, // Pass EV consumption separately
    hasEv: params.hasEv,
    planningEv: params.planningEv,
    evCount: params.evCount,
    evChargingTime: params.evChargingTime,
    evChargingMethod: params.evChargingMethod,
    evChargingHours: params.evChargingHours,
    evBatterySize: params.evBatterySize,
  });

  // Get component details from assumptions for metadata
  const householdSize = Math.min(params.householdSize, 7);
  const baselineKwh = assumptions.baseline[householdSize] || 20;

  return {
    ...consumption,
    ...recommendations,
    // Keep the componentBreakdown from consumption (it has the correct values)
    // Don't overwrite it!
    assumptions: {
      baselineRate: baselineKwh,
      evRate: assumptions.ev['standard'] || 9,
      poolRate: params.poolHeated ? (assumptions.pool['heated'] || 25) : (assumptions.pool['unheated'] || 7),
      officeRate: assumptions.office || 1.5,
      chargingPower: params.evChargingMethod ? (assumptions.evCharging[params.evChargingMethod] || 2.4) : null,
    },
  };
}
