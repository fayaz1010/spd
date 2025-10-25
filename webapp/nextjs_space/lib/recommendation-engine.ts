
/**
 * Intelligent Recommendation Engine
 * Generates multiple system configurations based on Google Solar API data
 */

import { CalculationInputs, SystemPricing, getPricing, calculateRebates } from './calculations';

export interface SystemConfiguration {
  id: string;
  name: string;
  description: string;
  useCase: string;
  priority: 'recommended' | 'high' | 'medium' | 'low';
  
  // System specs
  numPanels: number;
  systemKw: number;
  panelWattage: number;
  inverterSizeKw: number;
  
  // Battery recommendations
  recommendedBatteryKwh: number;
  minBatteryKwh: number;
  maxBatteryKwh: number;
  
  // Financial projections
  estimatedCost: number;
  annualProduction: number;
  annualSavings: number;
  paybackYears: number;
  savings25Years: number;
  
  // Environmental impact
  co2SavedPerYear: number;
  equivalentTrees: number;
  
  // Roof utilization
  roofUtilization: number; // percentage of available roof space used
  
  // Pros and cons
  pros: string[];
  cons: string[];
}

export interface RoofAnalysisData {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  panelCapacityWatts: number;
  roofSegments: any[];
  financialAnalyses: any[];
  carbonOffsetKgPerMwh: number;
}

export async function generateConfigurations(
  roofAnalysis: RoofAnalysisData,
  userProfile: CalculationInputs,
  pricing?: SystemPricing,
  useCentralizedAPI: boolean = false
): Promise<SystemConfiguration[]> {
  const configurations: SystemConfiguration[] = [];
  
  // Get pricing if not provided
  if (!pricing) {
    pricing = await getPricing();
  }
  
  // Calculate usage-based needs
  // CRITICAL: Use dailyConsumption from Step 3 if available (most accurate)
  // Otherwise fall back to bill-based calculation
  let dailyUsageKwh = 0;
  let annualUsageKwh = 0;
  
  if (userProfile.dailyConsumption && userProfile.dailyConsumption > 0) {
    // Use actual consumption from Step 3 (includes all appliances, EV, pool, etc.)
    dailyUsageKwh = userProfile.dailyConsumption;
    annualUsageKwh = dailyUsageKwh * 365;
  } else {
    // Fall back to bill-based estimate
    // Using Synergy Home Plan A1 tariff: $0.3237/kWh (WA)
    // Bill is bi-monthly (60 days), not quarterly
    const biMonthlyKwh = userProfile.quarterlyBill / 0.3237;
    dailyUsageKwh = biMonthlyKwh / 60;
    annualUsageKwh = dailyUsageKwh * 365;
  }
  
  // Calculate system size needed
  // Perth average: 1,460 kWh per kW per year = 4 hours effective sun per day
  const usageBasedKw = Math.ceil((annualUsageKwh / 1460) * 10) / 10; // 1460 kWh per kW per year in Perth
  
  const panelWattage = roofAnalysis.panelCapacityWatts || 440;
  const usageBasedPanels = Math.ceil((usageBasedKw * 1000) / panelWattage);
  
  // CRITICAL: Handle case where Google Solar API returns 0 panels
  // This can happen with:
  // - Small/unsuitable roofs
  // - Heavy shading
  // - Roof angles/materials not suitable
  // - API data quality issues
  // In these cases, use usage-based estimate instead of 0
  let maxPanelsOnRoof = roofAnalysis.maxArrayPanelsCount;
  if (!maxPanelsOnRoof || maxPanelsOnRoof === 0) {
    console.warn('Google Solar API returned 0 panels. Using usage-based estimate.');
    // Use usage-based panels as fallback, minimum 12 panels (5kW system)
    maxPanelsOnRoof = Math.max(usageBasedPanels, Math.ceil((5 * 1000) / panelWattage));
  }
  
  // Calculate overnight usage for battery sizing
  // CRITICAL: Use overnightUsage from Step 3 if available (accounts for EV charging time)
  // Otherwise fall back to pattern-based calculation
  let dailyOvernightUsage = 0;
  
  if (userProfile.overnightUsage && userProfile.overnightUsage > 0) {
    // Use actual overnight calculation from Step 3 (includes EV charging time)
    dailyOvernightUsage = userProfile.overnightUsage;
  } else {
    // Fall back to pattern-based estimate
    const usagePattern = userProfile.usagePattern || 'balanced';
    let overnightFraction = 0.45; // Default balanced
    if (usagePattern === 'day') overnightFraction = 0.25;
    else if (usagePattern === 'night') overnightFraction = 0.65;
    
    dailyOvernightUsage = dailyUsageKwh * overnightFraction;
  }
  
  // Configuration 1: USAGE MATCHED (Recommended for most customers)
  const usageMatchedPanels = Math.min(usageBasedPanels, maxPanelsOnRoof);
  const usageMatchedKw = (usageMatchedPanels * panelWattage) / 1000;
  const usageMatchedBatteryKwh = Math.ceil(dailyOvernightUsage * 1.2); // 20% buffer
  
  configurations.push({
    id: 'usage-matched',
    name: 'Usage Matched',
    description: 'Right-sized for your current consumption',
    useCase: 'Eliminate or drastically reduce your electricity bills without over-investing',
    priority: 'recommended',
    numPanels: usageMatchedPanels,
    systemKw: usageMatchedKw,
    panelWattage,
    inverterSizeKw: Math.ceil(usageMatchedKw * 1.2 * 10) / 10,
    recommendedBatteryKwh: usageMatchedBatteryKwh,
    minBatteryKwh: Math.floor(dailyOvernightUsage * 0.8),
    maxBatteryKwh: Math.ceil(dailyOvernightUsage * 2),
    ...await calculateFinancials(usageMatchedKw, usageMatchedBatteryKwh, userProfile, pricing),
    roofUtilization: Math.round((usageMatchedPanels / maxPanelsOnRoof) * 100),
    pros: [
      'Optimal cost-to-savings ratio',
      'Minimal grid dependency',
      'Fast payback period',
      'Perfect for current lifestyle'
    ],
    cons: [
      'Limited room for increased usage',
      'May need expansion if lifestyle changes',
      'Less export income potential'
    ]
  });
  
  // Configuration 2: MAXIMUM CAPACITY (Future-proof)
  const maxKw = (maxPanelsOnRoof * panelWattage) / 1000;
  const maxBatteryKwh = Math.min(Math.ceil(dailyOvernightUsage * 2.5), 30); // Cap at 30 kWh for most homes
  
  configurations.push({
    id: 'maximum-capacity',
    name: 'Maximum Power',
    description: 'Fill your entire roof with solar panels',
    useCase: 'Future-proof for EV charging, pool heating, and growing family needs',
    priority: maxPanelsOnRoof > usageBasedPanels * 1.5 ? 'high' : 'medium',
    numPanels: maxPanelsOnRoof,
    systemKw: maxKw,
    panelWattage,
    inverterSizeKw: Math.ceil(maxKw * 1.2 * 10) / 10,
    recommendedBatteryKwh: maxBatteryKwh,
    minBatteryKwh: usageMatchedBatteryKwh,
    maxBatteryKwh: 50, // Maximum capacity slider
    ...await calculateFinancials(maxKw, maxBatteryKwh, userProfile, pricing),
    roofUtilization: 100,
    pros: [
      'Maximum energy independence',
      'Highest export income potential',
      'Future-proof for lifestyle changes',
      'Supports multiple EVs',
      'Best long-term investment'
    ],
    cons: [
      'Higher upfront investment',
      'May overproduce for current needs',
      'Longer payback period'
    ]
  });
  
  // Configuration 3: FULL OVERNIGHT COVERAGE (Based on Step 2 Usage Data)
  // This configuration is specifically designed to provide complete overnight independence
  // using the actual usage patterns from Step 2
  const overnightCoverageBatteryKwh = Math.ceil(dailyOvernightUsage * 1.3); // 30% buffer for safety
  const overnightCoveragePanels = usageMatchedPanels; // Use same solar as usage matched
  const overnightCoverageKw = usageMatchedKw;
  
  configurations.push({
    id: 'full-overnight',
    name: 'Full Overnight Coverage',
    description: 'Complete energy independence through the night',
    useCase: 'Eliminate nighttime grid usage based on your actual usage patterns from Step 2',
    priority: 'high',
    numPanels: overnightCoveragePanels,
    systemKw: overnightCoverageKw,
    panelWattage,
    inverterSizeKw: Math.ceil(overnightCoverageKw * 1.2 * 10) / 10,
    recommendedBatteryKwh: overnightCoverageBatteryKwh,
    minBatteryKwh: Math.floor(dailyOvernightUsage),
    maxBatteryKwh: Math.ceil(dailyOvernightUsage * 2),
    ...await calculateFinancials(overnightCoverageKw, overnightCoverageBatteryKwh, userProfile, pricing),
    roofUtilization: Math.round((overnightCoveragePanels / maxPanelsOnRoof) * 100),
    pros: [
      'Complete overnight independence',
      'Based on YOUR actual usage data',
      'Optimal battery sizing for your needs',
      'Minimize grid reliance',
      'Backup power during outages',
      'Maximum eligible rebates'
    ],
    cons: [
      'Higher battery investment',
      'May be oversized if usage decreases',
      'Slightly longer payback vs solar-only'
    ]
  });
  
  // Configuration 4: GOOGLE AI OPTIMIZED (If available from API)
  if (roofAnalysis.financialAnalyses && roofAnalysis.financialAnalyses.length > 0) {
    const googleOptimal = extractGoogleRecommendation(roofAnalysis.financialAnalyses, panelWattage);
    if (googleOptimal && googleOptimal.numPanels && googleOptimal.systemKw) {
      configurations.push({
        id: 'google-optimized',
        name: 'Google AI Optimized',
        description: 'Google\'s AI-calculated optimal system',
        useCase: 'Data-driven recommendation based on your roof\'s solar potential and local economics',
        priority: 'high',
        numPanels: googleOptimal.numPanels,
        systemKw: googleOptimal.systemKw,
        panelWattage,
        inverterSizeKw: Math.ceil(googleOptimal.systemKw * 1.2 * 10) / 10,
        recommendedBatteryKwh: usageMatchedBatteryKwh,
        minBatteryKwh: Math.floor(dailyOvernightUsage * 0.8),
        maxBatteryKwh: Math.ceil(dailyOvernightUsage * 2),
        ...await calculateFinancials(googleOptimal.systemKw, usageMatchedBatteryKwh, userProfile, pricing),
        roofUtilization: Math.round((googleOptimal.numPanels / maxPanelsOnRoof) * 100),
        pros: [
          'AI-optimized for your specific roof',
          'Accounts for shading and orientation',
          'Balanced investment approach',
          'Google-verified calculations'
        ],
        cons: [
          'May not account for future plans',
          'Conservative recommendations'
        ]
      });
    }
  }
  
  // Sort configurations by priority
  const priorityOrder = { 'recommended': 1, 'high': 2, 'medium': 3, 'low': 4 };
  configurations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return configurations;
}

function extractGoogleRecommendation(financialAnalyses: any[], panelWattage: number): Partial<SystemConfiguration> | null {
  try {
    // Google provides multiple financial scenarios
    // Find the one with best 20-year savings or middle option
    if (financialAnalyses.length === 0) return null;
    
    // Typically the middle scenario is the "recommended" one
    const recommendedIndex = Math.floor(financialAnalyses.length / 2);
    const scenario = financialAnalyses[recommendedIndex];
    
    if (!scenario || !scenario.panelConfigIndex) return null;
    
    const numPanels = scenario.panelConfigIndex || 20;
    const systemKw = (numPanels * panelWattage) / 1000;
    
    return {
      numPanels,
      systemKw
    };
  } catch (error) {
    console.error('Error extracting Google recommendation:', error);
    return null;
  }
}

async function calculateFinancials(
  systemKw: number,
  batteryKwh: number,
  userProfile: CalculationInputs,
  pricing: SystemPricing
) {
  // Calculate costs
  const systemCost = systemKw * pricing.solarCostPerKw;
  
  // Get battery cost with interpolation for sizes not in the pricing table
  let batteryCost = 0;
  if (batteryKwh > 0) {
    // Try exact match first
    batteryCost = pricing.batteryCosts[batteryKwh.toString()] ?? 
                  pricing.batteryCosts[Math.round(batteryKwh).toString()];
    
    // If no exact match, interpolate between nearest values
    if (!batteryCost || batteryCost === 0) {
      const sizes = Object.keys(pricing.batteryCosts)
        .map(k => parseFloat(k))
        .filter(k => k > 0)
        .sort((a, b) => a - b);
      
      // Find surrounding sizes
      let lowerSize = 0, lowerCost = 0, upperSize = 0, upperCost = 0;
      
      for (let i = 0; i < sizes.length; i++) {
        if (sizes[i] <= batteryKwh) {
          lowerSize = sizes[i];
          lowerCost = pricing.batteryCosts[lowerSize.toString()] || 0;
        }
        if (sizes[i] >= batteryKwh && upperSize === 0) {
          upperSize = sizes[i];
          upperCost = pricing.batteryCosts[upperSize.toString()] || 0;
          break;
        }
      }
      
      // Interpolate
      if (lowerSize > 0 && upperSize > 0 && lowerSize !== upperSize) {
        const fraction = (batteryKwh - lowerSize) / (upperSize - lowerSize);
        batteryCost = lowerCost + (upperCost - lowerCost) * fraction;
      } else if (lowerSize > 0) {
        batteryCost = lowerCost;
      } else if (upperSize > 0) {
        batteryCost = upperCost;
      }
    }
  }
  
  const totalCost = systemCost + batteryCost;
  
  // Calculate rebates
  const rebates = await calculateRebates(systemKw, batteryKwh, batteryCost);
  const totalInvestment = Math.max(0, totalCost - rebates.totalRebates); // Ensure never negative
  
  // Calculate annual production
  const annualProduction = Math.round(systemKw * 1460); // kWh per year in Perth
  
  // Calculate annual savings
  const currentAnnualCost = userProfile.quarterlyBill * 4;
  const solarSavings = currentAnnualCost * 0.70; // Solar covers ~70% daytime
  
  // Battery savings
  let batterySavings = 0;
  if (batteryKwh > 0) {
    const annualUsage = currentAnnualCost / 0.28;
    const dailyUsage = annualUsage / 365;
    const overnightUsage = dailyUsage * 0.45;
    const batteryCapacity = batteryKwh * 0.9 * 0.85; // 90% DoD, 85% efficiency
    const overnightCoverage = Math.min(batteryCapacity / overnightUsage, 1.0);
    batterySavings = (annualUsage * 0.45 * 0.28) * overnightCoverage;
  }
  
  // EV savings
  let evSavings = 0;
  if ((userProfile.hasEv || userProfile.planningEv) && batteryKwh >= 10) {
    evSavings = 2500 * (userProfile.evCount || 1);
  }
  
  const totalSavings = solarSavings + batterySavings + evSavings;
  const annualSavings = Math.min(totalSavings, currentAnnualCost * 0.98); // Cap at 98%
  
  // Payback period (ensure reasonable value)
  const paybackYears = annualSavings > 0 ? totalInvestment / annualSavings : 99;
  
  // 25-year savings with 3% inflation
  let savings25Years = 0;
  for (let year = 0; year < 25; year++) {
    savings25Years += annualSavings * Math.pow(1.03, year);
  }
  savings25Years -= totalInvestment;
  
  // Environmental impact
  const co2SavedPerYear = (annualProduction * 0.68) / 1000; // WA grid factor: 0.68 kg/kWh
  const equivalentTrees = Math.round((co2SavedPerYear * 1000) / 21); // 1 tree = 21 kg CO2/year
  
  return {
    estimatedCost: totalInvestment,
    annualProduction,
    annualSavings,
    paybackYears,
    savings25Years,
    co2SavedPerYear,
    equivalentTrees
  };
}
