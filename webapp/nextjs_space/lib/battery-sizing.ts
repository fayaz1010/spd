
/**
 * Smart Battery Sizing Logic
 * Considers EV charging time, usage tier, and household characteristics
 */

export interface BatterySizingParams {
  dailyUsage: number;
  hasEv: boolean;
  planningEv: boolean;
  evCount: number;
  evChargingTime?: 'morning' | 'midday' | 'evening' | 'night';
  evUsageTier?: 'light' | 'average' | 'heavy' | 'very_heavy';
  hasPool?: boolean;
  poolType?: 'none' | 'unheated' | 'heated';
  usagePattern?: 'day' | 'night' | 'balanced';
}

export interface BatterySizingResult {
  recommendedSize: number;
  minSize: number;
  maxSize: number;
  reasoning: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

/**
 * Get EV daily consumption based on usage tier
 */
export function getEvDailyConsumption(tier: string): number {
  const tiers: Record<string, number> = {
    light: 5, // ~25 km/day
    average: 8, // ~40 km/day
    heavy: 15, // ~75 km/day (like the user with 12-15 sites/day)
    very_heavy: 20, // ~100+ km/day
  };
  return tiers[tier] || 8;
}

/**
 * Calculate smart battery size based on multiple factors
 */
export function calculateSmartBatterySize(params: BatterySizingParams): BatterySizingResult {
  const {
    dailyUsage,
    hasEv,
    planningEv,
    evCount,
    evChargingTime = 'evening',
    evUsageTier = 'average',
    hasPool = false,
    poolType = 'none',
    usagePattern = 'balanced',
  } = params;

  const reasoning: string[] = [];
  let recommendedSize = 0;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';

  // Base storage for overnight usage (typical home uses 40-50% at night)
  const overnightUsageRatio = usagePattern === 'night' ? 0.6 : usagePattern === 'day' ? 0.3 : 0.45;
  const baseOvernightUsage = dailyUsage * overnightUsageRatio;
  
  reasoning.push(`Base overnight usage: ${baseOvernightUsage.toFixed(1)} kWh (${(overnightUsageRatio * 100).toFixed(0)}% of daily)`);

  // EV charging requirements
  let evStorage = 0;
  if (hasEv || planningEv) {
    const evDailyKwh = getEvDailyConsumption(evUsageTier);
    const totalEvKwh = evDailyKwh * (evCount || 1);

    // If charging at night or evening, we need battery storage
    if (evChargingTime === 'evening' || evChargingTime === 'night') {
      evStorage = totalEvKwh;
      reasoning.push(
        `EV charging (${evChargingTime}): ${totalEvKwh.toFixed(1)} kWh needed from battery (${evCount} EV${evCount > 1 ? 's' : ''}, ${evUsageTier} usage)`
      );
      confidenceLevel = evUsageTier === 'heavy' || evUsageTier === 'very_heavy' ? 'high' : 'medium';
    } else if (evChargingTime === 'midday') {
      // Midday charging can use solar directly
      evStorage = 0;
      reasoning.push(
        `EV charging (midday): Can charge directly from solar during the day - no battery storage needed for EV`
      );
    } else {
      // Morning charging - partial battery need
      evStorage = totalEvKwh * 0.5; // Half from battery, half from solar
      reasoning.push(
        `EV charging (morning): ${evStorage.toFixed(1)} kWh from battery, rest from solar`
      );
    }
  }

  // Pool heating (winter nights)
  let poolStorage = 0;
  if (hasPool && poolType === 'heated') {
    poolStorage = 5; // Heated pool pumps run overnight
    reasoning.push(`Heated pool: Additional 5 kWh for overnight pump operation`);
  } else if (hasPool && poolType === 'unheated') {
    poolStorage = 2; // Unheated pool pump
    reasoning.push(`Pool pump: Additional 2 kWh for overnight operation`);
  }

  // Total storage needed
  const totalStorage = baseOvernightUsage + evStorage + poolStorage;
  reasoning.push(`\nTotal storage needed: ${totalStorage.toFixed(1)} kWh`);

  // Add buffer for:
  // 1. Battery degradation (5-10% over time)
  // 2. Depth of discharge (don't fully discharge)
  // 3. Efficiency losses (5-10%)
  const bufferMultiplier = 1.2; // 20% buffer
  recommendedSize = Math.ceil(totalStorage * bufferMultiplier);
  
  reasoning.push(`Recommended with 20% buffer: ${recommendedSize} kWh`);

  // Round to common battery sizes
  const commonSizes = [10, 13.5, 15, 20, 25, 30, 35, 40, 45, 50];
  recommendedSize = commonSizes.find((size) => size >= recommendedSize) || 50;

  // Set min/max range
  const minSize = Math.max(10, Math.floor(totalStorage * 0.8));
  const maxSize = Math.min(50, Math.ceil(totalStorage * 1.5));

  reasoning.push(`\nFinal recommendation: ${recommendedSize} kWh battery`);
  reasoning.push(`Acceptable range: ${minSize}-${maxSize} kWh`);

  return {
    recommendedSize,
    minSize,
    maxSize,
    reasoning,
    confidenceLevel,
  };
}

/**
 * Get battery recommendation explanation for UI
 */
export function getBatteryRecommendationText(params: BatterySizingParams, result: BatterySizingResult): string {
  const { evChargingTime, evUsageTier, hasEv, planningEv } = params;

  if ((hasEv || planningEv) && (evChargingTime === 'evening' || evChargingTime === 'night')) {
    if (evUsageTier === 'heavy' || evUsageTier === 'very_heavy') {
      return `⚡ Heavy EV usage with ${evChargingTime} charging requires substantial battery storage (${result.recommendedSize} kWh) to charge from stored solar energy.`;
    }
    return `🔋 ${evChargingTime} charging means you'll need a ${result.recommendedSize} kWh battery to store solar energy for EV charging.`;
  }

  if ((hasEv || planningEv) && evChargingTime === 'midday') {
    return `☀️ Midday charging is perfect - you can charge directly from solar! A smaller battery (${result.recommendedSize} kWh) is sufficient for household needs.`;
  }

  return `🏠 Based on your usage pattern, a ${result.recommendedSize} kWh battery will cover your overnight consumption.`;
}
