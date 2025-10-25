/**
 * Self-Consumption Calculator
 * Calculates how much solar energy is used directly vs exported to grid
 * Based on load profile, battery storage, and system size
 */

interface SelfConsumptionParams {
  dailyProduction: number; // kWh per day
  dailyConsumption: number; // kWh per day
  hasBattery: boolean;
  batteryCapacityKwh?: number;
  batteryEfficiency?: number; // Round-trip efficiency (0.95 = 95%)
  depthOfDischarge?: number; // 0.90 = 90%
}

interface SelfConsumptionResult {
  // Energy flows (kWh/day)
  selfConsumedKwh: number;
  exportedKwh: number;
  gridImportKwh: number;
  
  // Percentages
  selfConsumptionPercent: number; // % of solar production used directly
  selfSufficiencyPercent: number; // % of consumption met by solar
  exportPercent: number; // % of solar production exported
  
  // Battery metrics (if applicable)
  batteryChargedKwh?: number;
  batteryDischargedKwh?: number;
  batteryUsagePercent?: number;
}

/**
 * Calculate self-consumption and self-sufficiency
 * 
 * Self-consumption: How much of your solar production you use yourself
 * Self-sufficiency: How much of your energy needs are met by solar
 */
export function calculateSelfConsumption(params: SelfConsumptionParams): SelfConsumptionResult {
  const {
    dailyProduction,
    dailyConsumption,
    hasBattery,
    batteryCapacityKwh = 0,
    batteryEfficiency = 0.95,
    depthOfDischarge = 0.90
  } = params;

  // Usable battery capacity
  const usableBatteryCapacity = batteryCapacityKwh * depthOfDischarge;

  if (!hasBattery || batteryCapacityKwh === 0) {
    // WITHOUT BATTERY
    // Typical household: ~35-40% of solar is used during daytime
    // Rest is exported because no storage for nighttime use
    
    // Assume 35% of consumption happens during solar hours (6am-6pm)
    const daytimeConsumption = dailyConsumption * 0.35;
    
    // Direct self-consumption (limited by daytime usage)
    const selfConsumedKwh = Math.min(dailyProduction, daytimeConsumption);
    
    // Excess goes to grid
    const exportedKwh = Math.max(0, dailyProduction - selfConsumedKwh);
    
    // Nighttime + excess daytime needs from grid
    const gridImportKwh = Math.max(0, dailyConsumption - selfConsumedKwh);
    
    const selfConsumptionPercent = dailyProduction > 0 
      ? (selfConsumedKwh / dailyProduction) * 100 
      : 0;
    const selfSufficiencyPercent = dailyConsumption > 0 
      ? (selfConsumedKwh / dailyConsumption) * 100 
      : 0;
    const exportPercent = dailyProduction > 0 
      ? (exportedKwh / dailyProduction) * 100 
      : 0;
    
    return {
      selfConsumedKwh: Math.round(selfConsumedKwh * 10) / 10,
      exportedKwh: Math.round(exportedKwh * 10) / 10,
      gridImportKwh: Math.round(gridImportKwh * 10) / 10,
      selfConsumptionPercent: Math.round(selfConsumptionPercent),
      selfSufficiencyPercent: Math.round(selfSufficiencyPercent),
      exportPercent: Math.round(exportPercent),
    };
  } else {
    // WITH BATTERY
    // Battery stores excess daytime production for nighttime use
    // Significantly increases self-consumption and self-sufficiency
    
    // Daytime consumption (6am-6pm): ~35% of daily total
    const daytimeConsumption = dailyConsumption * 0.35;
    
    // Nighttime consumption (6pm-6am): ~65% of daily total
    const nighttimeConsumption = dailyConsumption * 0.65;
    
    // Step 1: Direct daytime self-consumption
    const directSelfConsumption = Math.min(dailyProduction, daytimeConsumption);
    
    // Step 2: Excess production goes to battery
    const excessProduction = Math.max(0, dailyProduction - daytimeConsumption);
    const batteryChargedKwh = Math.min(
      excessProduction * batteryEfficiency, 
      usableBatteryCapacity
    );
    
    // Step 3: Battery powers nighttime consumption
    const batteryDischargedKwh = Math.min(
      batteryChargedKwh * batteryEfficiency,
      nighttimeConsumption
    );
    
    // Step 4: Calculate totals
    const selfConsumedKwh = directSelfConsumption + batteryDischargedKwh;
    
    // Excess after battery is full goes to grid
    const excessAfterBattery = excessProduction - (batteryChargedKwh / batteryEfficiency);
    const exportedKwh = Math.max(0, excessAfterBattery);
    
    // Grid import for remaining nighttime needs
    const gridImportKwh = Math.max(0, dailyConsumption - selfConsumedKwh);
    
    const selfConsumptionPercent = dailyProduction > 0 
      ? (selfConsumedKwh / dailyProduction) * 100 
      : 0;
    const selfSufficiencyPercent = dailyConsumption > 0 
      ? (selfConsumedKwh / dailyConsumption) * 100 
      : 0;
    const exportPercent = dailyProduction > 0 
      ? (exportedKwh / dailyProduction) * 100 
      : 0;
    const batteryUsagePercent = usableBatteryCapacity > 0 
      ? (batteryChargedKwh / usableBatteryCapacity) * 100 
      : 0;
    
    return {
      selfConsumedKwh: Math.round(selfConsumedKwh * 10) / 10,
      exportedKwh: Math.round(exportedKwh * 10) / 10,
      gridImportKwh: Math.round(gridImportKwh * 10) / 10,
      selfConsumptionPercent: Math.round(selfConsumptionPercent),
      selfSufficiencyPercent: Math.round(selfSufficiencyPercent),
      exportPercent: Math.round(exportPercent),
      batteryChargedKwh: Math.round(batteryChargedKwh * 10) / 10,
      batteryDischargedKwh: Math.round(batteryDischargedKwh * 10) / 10,
      batteryUsagePercent: Math.round(batteryUsagePercent),
    };
  }
}

/**
 * Calculate annual self-consumption metrics
 */
export function calculateAnnualSelfConsumption(params: SelfConsumptionParams) {
  const daily = calculateSelfConsumption(params);
  
  return {
    ...daily,
    annualSelfConsumedKwh: Math.round(daily.selfConsumedKwh * 365),
    annualExportedKwh: Math.round(daily.exportedKwh * 365),
    annualGridImportKwh: Math.round(daily.gridImportKwh * 365),
  };
}

/**
 * Estimate self-consumption improvement with battery
 * Shows customer the benefit of adding battery storage
 */
export function compareBatteryImpact(
  dailyProduction: number,
  dailyConsumption: number,
  batteryCapacityKwh: number
) {
  const withoutBattery = calculateSelfConsumption({
    dailyProduction,
    dailyConsumption,
    hasBattery: false,
  });
  
  const withBattery = calculateSelfConsumption({
    dailyProduction,
    dailyConsumption,
    hasBattery: true,
    batteryCapacityKwh,
  });
  
  return {
    withoutBattery,
    withBattery,
    improvement: {
      selfConsumptionIncrease: withBattery.selfConsumptionPercent - withoutBattery.selfConsumptionPercent,
      selfSufficiencyIncrease: withBattery.selfSufficiencyPercent - withoutBattery.selfSufficiencyPercent,
      exportReduction: withoutBattery.exportedKwh - withBattery.exportedKwh,
      gridImportReduction: withoutBattery.gridImportKwh - withBattery.gridImportKwh,
    },
  };
}
