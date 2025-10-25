
export interface CalculationInputs {
  quarterlyBill: number;
  householdSize: number;
  usagePattern?: string;
  hasEv?: boolean;
  planningEv?: boolean;
  evCount?: number;
  bedrooms?: number;
  hasPool?: boolean;
  poolHeated?: boolean;
  homeOffices?: number;
  hvacUsage?: string;
  dailyConsumption?: number;
  hasElectricHotWater?: boolean;
  systemSizeKw?: number;
  [key: string]: any;
}

export interface BatteryRecommendation {
  recommendedSize: number;
  reasoning: {
    overnightNeeds: number;
    evNeeds: number;
    totalNeeds: number;
    excessSolar: number;
    coverage: string;
    message: string;
    dailySolarProduction: number;
    daytimeUsage: number;
  };
  alternatives: Array<{
    size: number;
    coverage: number;
    cost: number;
    message: string;
    isRecommended: boolean;
  }>;
}

export function smartBatteryRecommendation(
  roofAnalysis: any,
  userProfile: CalculationInputs,
  systemSizeKw: number,
  pricing: {
    batteryCosts: Record<number, number>;
  }
): BatteryRecommendation {
  // Calculate actual usage patterns
  const annualUsage = (userProfile.quarterlyBill * 4) / 0.28;
  const dailyUsage = annualUsage / 365;
  
  // Pattern-based overnight fraction
  const overnightFractionMap = {
    'day': 0.25,      // 25% overnight if mostly day usage
    'balanced': 0.45, // 45% overnight if balanced
    'night': 0.65     // 65% overnight if night owls
  };
  
  const overnightFraction = overnightFractionMap[userProfile.usagePattern as keyof typeof overnightFractionMap] || 0.45;
  const overnightUsageKwh = dailyUsage * overnightFraction;
  
  // Consider EV charging
  let evOvernightNeeds = 0;
  if (userProfile.hasEv || userProfile.planningEv) {
    // Average EV: 15,000 km/year, 20 kWh/100km = 8.2 kWh/day
    // 80% of EV charging happens overnight
    evOvernightNeeds = 8.2 * 0.8 * (userProfile.evCount || 1);
  }
  
  const totalOvernightNeeds = overnightUsageKwh + evOvernightNeeds;
  
  // Calculate excess solar production available for charging
  const dailySolarProduction = (systemSizeKw * 1460) / 365;
  const daytimeUsage = dailyUsage * (1 - overnightFraction);
  const excessSolar = Math.max(0, dailySolarProduction - daytimeUsage);
  
  // Battery should store the MINIMUM of:
  // 1. Overnight needs
  // 2. Excess solar available
  // 3. Roof-constrained system production
  const idealBatterySize = Math.min(
    totalOvernightNeeds * 1.1, // 10% buffer
    excessSolar,
    dailySolarProduction * 0.6  // Max 60% to battery
  );
  
  // Round to available sizes
  const availableSizes = [5, 10, 13.5, 15, 20, 25, 30, 40, 50];
  const recommendedSize = availableSizes.find(size => size >= idealBatterySize) || 50;
  
  // Generate alternatives
  const alternatives = availableSizes.map(size => {
    const coverage = (size / totalOvernightNeeds) * 100;
    return {
      size,
      coverage: Math.min(coverage, 100),
      cost: pricing.batteryCosts[size] || 0,
      message: generateBatteryMessage(size, totalOvernightNeeds),
      isRecommended: size === recommendedSize
    };
  });
  
  return {
    recommendedSize,
    reasoning: {
      overnightNeeds: overnightUsageKwh,
      evNeeds: evOvernightNeeds,
      totalNeeds: totalOvernightNeeds,
      excessSolar,
      coverage: ((recommendedSize / totalOvernightNeeds) * 100).toFixed(0) + '%',
      message: generateBatteryMessage(recommendedSize, totalOvernightNeeds),
      dailySolarProduction,
      daytimeUsage
    },
    alternatives
  };
}

function generateBatteryMessage(batterySize: number, needs: number): string {
  const coverage = (batterySize / needs) * 100;
  
  if (coverage >= 98) {
    return `${batterySize}kWh battery provides complete overnight independence! 🌙`;
  } else if (coverage >= 80) {
    return `${batterySize}kWh battery covers ${coverage.toFixed(0)}% of overnight needs - excellent choice! ⭐`;
  } else if (coverage >= 60) {
    return `${batterySize}kWh battery significantly reduces grid dependence (${coverage.toFixed(0)}% coverage) 💚`;
  } else {
    return `${batterySize}kWh battery provides backup power and partial overnight coverage 🔋`;
  }
}

export function calculateBatteryCoverage(
  batterySize: number,
  totalNeeds: number
): number {
  return Math.min((batterySize / totalNeeds) * 100, 100);
}
