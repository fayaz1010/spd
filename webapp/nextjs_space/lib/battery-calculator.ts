
// Smart battery sizing calculator based on usage patterns

export interface BatteryRecommendation {
  recommendedSize: number;
  reason: string;
  description: string;
  coverage: string;
}

export interface AdvancedProfile {
  bedrooms?: number;
  hasPool?: boolean;
  poolHeated?: boolean;
  homeOffices?: number;
  hvacUsage?: string;
  dailyConsumption?: number;
  hasElectricHotWater?: boolean;
  evCount?: number;
}

export function calculateRecommendedBattery(
  quarterlyBill: number,
  householdSize: number,
  usagePattern: string,
  hasEv: boolean,
  planningEv: boolean,
  advancedProfile?: AdvancedProfile
): BatteryRecommendation {
  // Use provided daily consumption if available, otherwise calculate from quarterly bill
  let dailyUsage: number;
  
  if (advancedProfile?.dailyConsumption && advancedProfile.dailyConsumption > 0) {
    dailyUsage = advancedProfile.dailyConsumption;
  } else {
    const annualUsage = (quarterlyBill * 4) / 0.28; // kWh per year at $0.28/kWh
    dailyUsage = annualUsage / 365;
  }
  
  // Apply multipliers based on advanced profile
  if (advancedProfile) {
    let multiplier = 1.0;
    
    // Bedroom size factor (larger homes = more consumption)
    if (advancedProfile.bedrooms) {
      if (advancedProfile.bedrooms >= 5) multiplier *= 1.4;
      else if (advancedProfile.bedrooms === 4) multiplier *= 1.2;
      else if (advancedProfile.bedrooms === 3) multiplier *= 1.0;
      else multiplier *= 0.8;
    }
    
    // Pool factor
    if (advancedProfile.hasPool) {
      multiplier *= 1.25; // Pool adds 25% consumption
      if (advancedProfile.poolHeated) {
        multiplier *= 1.2; // Heated pool adds another 20%
      }
    }
    
    // Home office factor (offices running during day = higher evening battery needs)
    if (advancedProfile.homeOffices) {
      if (advancedProfile.homeOffices >= 2) multiplier *= 1.3;
      else if (advancedProfile.homeOffices === 1) multiplier *= 1.15;
    }
    
    // HVAC usage factor
    if (advancedProfile.hvacUsage === 'heavy') {
      multiplier *= 1.5; // Heavy HVAC can be biggest load
    } else if (advancedProfile.hvacUsage === 'moderate') {
      multiplier *= 1.2;
    }
    // Minimal HVAC doesn't change multiplier
    
    // Electric hot water factor (typically heats overnight)
    if (advancedProfile.hasElectricHotWater) {
      multiplier *= 1.15; // Electric hot water adds ~15% (3-5 kWh/day)
    }
    
    dailyUsage *= multiplier;
  }
  
  // Estimate overnight usage (6pm - 8am = 14 hours)
  let overnightUsage = 0;
  
  switch (usagePattern) {
    case 'day':
      // Mostly day usage: 25% overnight
      overnightUsage = dailyUsage * 0.25;
      break;
    case 'night':
      // Mostly night usage: 65% overnight
      overnightUsage = dailyUsage * 0.65;
      break;
    case 'balanced':
    default:
      // Balanced: 45% overnight
      overnightUsage = dailyUsage * 0.45;
      break;
  }
  
  // Add EV charging needs if applicable
  let evChargingNeeds = 0;
  if (hasEv || planningEv) {
    // Average EV needs 8-10 kWh overnight for daily commute (50km)
    const evCount = advancedProfile?.evCount ?? 1;
    evChargingNeeds = 9 * evCount; // kWh per EV
  }
  
  // Total overnight needs
  const totalOvernightNeeds = overnightUsage + evChargingNeeds;
  
  // Add 15% buffer for efficiency losses and occasional high usage
  const recommendedCapacity = totalOvernightNeeds * 1.15;
  
  // Round to nearest available battery size
  let recommendedSize = 0;
  let coverage = '';
  let reason = '';
  let description = '';
  
  if (recommendedCapacity <= 6) {
    recommendedSize = 5;
    coverage = '~80% bill reduction';
    reason = 'Good for basic overnight needs (3-4 hours)';
    description = `Based on your usage, you need approximately ${Math.round(totalOvernightNeeds)} kWh overnight. A 5 kWh battery will cover partial overnight loads and achieve around 80% bill reduction.`;
  } else if (recommendedCapacity <= 11) {
    recommendedSize = 10;
    coverage = '~90% bill reduction';
    reason = 'Covers most overnight consumption';
    description = `Based on your usage, you need approximately ${Math.round(totalOvernightNeeds)} kWh overnight. A 10 kWh battery will cover most of your needs and achieve around 90% bill reduction.`;
  } else if (recommendedCapacity <= 14) {
    recommendedSize = 13.5;
    coverage = '~95% bill reduction';
    reason = 'Full overnight coverage (6pm-8am)';
    description = `Based on your usage, you need approximately ${Math.round(totalOvernightNeeds)} kWh overnight. A 13.5 kWh battery provides full overnight coverage${evChargingNeeds > 0 ? ' including EV charging' : ''} and achieves around 95% bill reduction.`;
  } else if (recommendedCapacity <= 18) {
    recommendedSize = 15;
    coverage = '~95% bill reduction';
    reason = 'Complete overnight coverage with safety margin';
    description = `Based on your usage, you need approximately ${Math.round(totalOvernightNeeds)} kWh overnight. A 15 kWh battery provides full coverage${evChargingNeeds > 0 ? ' for your EV and home' : ''} with extra reserve.`;
  } else if (recommendedCapacity <= 22) {
    recommendedSize = 20;
    coverage = '~98% bill reduction';
    reason = 'Complete overnight independence';
    description = `Based on your usage, you need approximately ${Math.round(totalOvernightNeeds)} kWh overnight. A 20 kWh battery ensures complete coverage${evChargingNeeds > 0 ? ' for heavy EV charging' : ' for high usage'}.`;
  } else if (recommendedCapacity <= 27) {
    recommendedSize = 25;
    coverage = '~98% bill reduction';
    reason = 'Extended coverage for high-consumption homes';
    description = `Based on your usage, you need approximately ${Math.round(totalOvernightNeeds)} kWh overnight. A 25 kWh battery provides full coverage for large households${evChargingNeeds > 0 ? ' with EV charging' : ' with high consumption'}.`;
  } else if (recommendedCapacity <= 35) {
    recommendedSize = 30;
    coverage = '~98% bill reduction';
    reason = 'Maximum coverage for very high usage homes';
    description = `Based on your usage, you need approximately ${Math.round(totalOvernightNeeds)} kWh overnight. A 30 kWh battery ensures complete coverage for high-consumption homes with heated pool${evChargingNeeds > 0 ? ', EV charging,' : ''} and heavy HVAC usage.`;
  } else if (recommendedCapacity <= 45) {
    recommendedSize = 40;
    coverage = '~98% bill reduction';
    reason = 'For very large homes with multiple high-draw appliances';
    description = `Based on your high usage needs (~${Math.round(totalOvernightNeeds)} kWh overnight), a 40 kWh battery system provides complete coverage for large properties with heated pool, electric hot water, heavy HVAC${evChargingNeeds > 0 ? ', and EV charging' : ''}.`;
  } else {
    recommendedSize = 50;
    coverage = '~98% bill reduction + backup reserve';
    reason = 'Maximum capacity for estate homes with all electric appliances';
    description = `Based on your exceptional usage needs (~${Math.round(totalOvernightNeeds)} kWh overnight), a 50 kWh battery system provides complete energy independence for very large properties with heated pool, electric hot water, multiple EVs, and heavy HVAC usage.`;
  }
  
  return {
    recommendedSize,
    reason,
    description,
    coverage,
  };
}
