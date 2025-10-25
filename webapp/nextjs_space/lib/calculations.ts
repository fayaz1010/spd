
// Financial calculations for solar systems

export interface SystemPricing {
  solarCostPerKw: number;
  panelWattage?: number;
  panelBrand?: string;
  inverterBrand?: string;
  installationFee?: number;
  batteryCosts: {
    [key: string]: number;
  };
  addons: {
    [key: string]: number | { name: string; description: string; cost: number };
  };
}

// Default fallback pricing (used only if API fails)
export const FALLBACK_PRICING: SystemPricing = {
  solarCostPerKw: 1000,
  batteryCosts: {
    '0': 0,
    '5': 7000,
    '10': 11000,
    '13.5': 14000,
    '15': 16000,
    '20': 20000,
    '25': 24000,
    '30': 28000,
    '40': 36000,
    '50': 44000,
  },
  addons: {
    evCharger: 2500,
    extendedWarranty: 800,
    premiumPanels: 1500,
    smartMonitoring: 600,
  },
};

export interface RebateCalculation {
  federalSRES: number;
  federalBattery: number;
  waBatteryScheme: number;
  totalRebates: number;
}

// Cache for pricing data (1 minute cache)
let pricingCache: { data: SystemPricing; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function getPricing(): Promise<SystemPricing> {
  // Return cached data if still valid
  if (pricingCache && Date.now() - pricingCache.timestamp < CACHE_DURATION) {
    return pricingCache.data;
  }

  try {
    const response = await fetch('/api/pricing', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pricing');
    }

    const data = await response.json();
    
    // Transform addons to simple number format for backward compatibility
    const transformedAddons: any = {};
    Object.entries(data.pricing.addons).forEach(([key, value]: [string, any]) => {
      transformedAddons[key] = typeof value === 'object' ? value.cost : value;
    });

    const pricing: SystemPricing = {
      ...data.pricing,
      addons: transformedAddons,
    };

    // Update cache
    pricingCache = {
      data: pricing,
      timestamp: Date.now(),
    };

    return pricing;
  } catch (error) {
    console.error('Error fetching pricing, using fallback:', error);
    return FALLBACK_PRICING;
  }
}

export async function calculateRebates(
  systemSizeKw: number,
  batterySizeKwh: number,
  batteryCost?: number
): Promise<RebateCalculation> {
  try {
    // If batteryCost not provided, get it from pricing
    if (!batteryCost && batterySizeKwh > 0) {
      const pricing = await getPricing();
      batteryCost = pricing.batteryCosts[batterySizeKwh.toString()] ?? 0;
    }

    const response = await fetch('/api/rebates/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemSizeKw,
        batterySizeKwh,
        batteryCost: batteryCost || 0,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to calculate rebates');
    }

    const data = await response.json();
    return data.rebates;
  } catch (error) {
    console.error('Error calculating rebates from API, using fallback calculation:', error);
    
    // Fallback calculation
    const federalSRES = systemSizeKw * 500;
    const fallbackBatteryCost = batteryCost || FALLBACK_PRICING.batteryCosts[batterySizeKwh.toString()] || 0;
    const federalBattery = fallbackBatteryCost * 0.3;
    const waBatteryScheme = Math.min(batterySizeKwh * 500, 5000);
    
    return {
      federalSRES,
      federalBattery,
      waBatteryScheme,
      totalRebates: federalSRES + federalBattery + waBatteryScheme,
    };
  }
}

// For backward compatibility - synchronous version using fallback
export function calculateRebatesSync(
  systemSizeKw: number,
  batterySizeKwh: number
): RebateCalculation {
  const federalSRES = systemSizeKw * 500;
  const batteryCost = FALLBACK_PRICING.batteryCosts[batterySizeKwh.toString()] ?? 0;
  const federalBattery = batteryCost * 0.3;
  const waBatteryScheme = Math.min(batterySizeKwh * 500, 5000);
  
  return {
    federalSRES,
    federalBattery,
    waBatteryScheme,
    totalRebates: federalSRES + federalBattery + waBatteryScheme,
  };
}

// Maintain PRICING export for backward compatibility
export const PRICING = FALLBACK_PRICING;

export interface CalculationInputs {
  quarterlyBill: number;
  householdSize?: number;
  usagePattern?: string;
  hasEv?: boolean;
  planningEv?: boolean;
  bedrooms?: number;
  hasPool?: boolean;
  poolHeated?: boolean;
  homeOffices?: number;
  hvacUsage?: string;
  dailyConsumption?: number;
  overnightUsage?: number;
  evCount?: number;
  hasElectricHotWater?: boolean;
}

export interface FinancialScenario {
  scenarioName: string;
  systemCost: number;
  batteryCost: number;
  addonsCost: number;
  totalCost: number;
  rebates: RebateCalculation;
  totalInvestment: number;
  annualSavings: number;
  paybackYears: number;
  savings25Years: number;
  currentAnnualCost?: number;
  current25YearCost?: number;
  savingsBreakdown?: {
    solarOnlySavings: number;
    batterySavings: number;
    evSavings: number;
    totalSavingsPercent: number;
  };
  googleData?: {
    annualProduction: number;
    annualSavings: number;
    paybackYears: number;
    cashFlows?: number[];
  };
  finalEstimate?: {
    annualProduction: number;
    annualSavings: number;
    paybackYears: number;
  };
}

export interface GoogleFinancialAnalysis {
  panelConfigIndex?: number;
  financialDetails?: {
    initialCost?: number;
    cashFlows?: number[];
    savings?: {
      savingsYear1?: number;
      savingsLifetime?: number;
    };
    netMeteringCashFlows?: number[];
  };
  monthlyProduction?: number[];
  annualProduction?: number;
}

/**
 * Extract Google's financial analysis for a given system size
 */
export function findGoogleFinancialAnalysis(
  googleFinancialAnalyses: GoogleFinancialAnalysis[] | undefined,
  systemSizeKw: number
): GoogleFinancialAnalysis | null {
  if (!googleFinancialAnalyses || googleFinancialAnalyses.length === 0) {
    return null;
  }

  // Find the closest matching configuration by system size
  // Google provides multiple configurations, we match by panelConfigIndex
  let closestMatch: GoogleFinancialAnalysis | null = null;
  let closestDiff = Infinity;

  for (const analysis of googleFinancialAnalyses) {
    if (!analysis.panelConfigIndex) continue;
    
    const diff = Math.abs(analysis.panelConfigIndex - systemSizeKw);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestMatch = analysis;
    }
  }

  return closestMatch;
}

/**
 * Calculate scenario with optional Google Financial Analysis integration
 */
export function calculateScenario(
  systemSizeKw: number,
  quarterlyBill: number,
  batterySizeKwh: number = 0,
  selectedAddons: string[] = [],
  hasEv: boolean = false,
  planningEv: boolean = false,
  calculationInputs?: CalculationInputs,
  googleFinancialAnalyses?: GoogleFinancialAnalysis[]
): FinancialScenario {
  // Current annual electricity cost
  const currentAnnualCost = quarterlyBill * 4;
  
  // 25-year cost with 3% annual inflation
  let current25YearCost = 0;
  for (let year = 0; year < 25; year++) {
    current25YearCost += currentAnnualCost * Math.pow(1.03, year);
  }
  
  // System costs
  const systemCost = systemSizeKw * PRICING.solarCostPerKw;
  const batteryCost = PRICING.batteryCosts[batterySizeKwh.toString()] ?? 0;
  
  let addonsCost = 0;
  selectedAddons?.forEach?.((addon: string) => {
    const addonPrice = PRICING.addons[addon];
    const cost = typeof addonPrice === 'object' ? addonPrice.cost : (addonPrice ?? 0);
    addonsCost += cost;
  });
  
  const totalCost = systemCost + batteryCost + addonsCost;
  
  // Calculate rebates (using sync version for backward compatibility)
  const rebates = calculateRebatesSync(systemSizeKw, batterySizeKwh);
  const totalInvestment = totalCost - rebates.totalRebates;
  
  /**
   * IMPROVED ANNUAL SAVINGS CALCULATION
   * 
   * This calculation properly scales savings based on:
   * 1. Solar production covering daytime usage
   * 2. Battery capacity covering actual overnight needs
   * 3. EV charging requirements
   * 
   * The calculation is now tied to actual usage patterns instead of arbitrary tiers.
   */
  
  // Step 1: Calculate actual daily and overnight usage
  const annualUsage = (currentAnnualCost / 4) / 0.28; // Convert quarterly bill to annual kWh (assuming $0.28/kWh)
  const dailyUsage = annualUsage / 365;
  
  // Apply usage multipliers if advanced profile provided
  let adjustedDailyUsage = dailyUsage;
  if (calculationInputs) {
    let multiplier = 1.0;
    
    // Bedroom factor
    if (calculationInputs.bedrooms) {
      if (calculationInputs.bedrooms >= 5) multiplier *= 1.4;
      else if (calculationInputs.bedrooms === 4) multiplier *= 1.2;
      else if (calculationInputs.bedrooms === 3) multiplier *= 1.0;
      else multiplier *= 0.8;
    }
    
    // Pool factor
    if (calculationInputs.hasPool) {
      multiplier *= 1.25;
      if (calculationInputs.poolHeated) multiplier *= 1.2;
    }
    
    // Home office factor
    if (calculationInputs.homeOffices) {
      if (calculationInputs.homeOffices >= 2) multiplier *= 1.3;
      else if (calculationInputs.homeOffices === 1) multiplier *= 1.15;
    }
    
    // HVAC factor
    if (calculationInputs.hvacUsage === 'heavy') multiplier *= 1.5;
    else if (calculationInputs.hvacUsage === 'moderate') multiplier *= 1.2;
    
    // Electric hot water
    if (calculationInputs.hasElectricHotWater) multiplier *= 1.15;
    
    adjustedDailyUsage *= multiplier;
  }
  
  // Step 2: Determine overnight usage based on pattern
  const usagePattern = calculationInputs?.usagePattern || 'balanced';
  let overnightUsageFraction = 0.45; // Default balanced
  
  if (usagePattern === 'day') overnightUsageFraction = 0.25; // Mostly day usage
  else if (usagePattern === 'night') overnightUsageFraction = 0.65; // Mostly night usage
  
  const dailyOvernightUsage = adjustedDailyUsage * overnightUsageFraction;
  const annualOvernightUsage = dailyOvernightUsage * 365;
  
  // Step 3: Calculate solar-only savings (daytime coverage + feed-in)
  // Solar covers ~55% of total usage during day (remaining goes to grid as feed-in)
  const solarOnlySavings = currentAnnualCost * 0.70;
  
  // Step 4: Calculate battery savings
  let batterySavings = 0;
  if (batterySizeKwh > 0) {
    // Battery usable capacity (90% depth of discharge for most modern batteries)
    const usableBatteryCapacity = batterySizeKwh * 0.9;
    
    // Calculate what % of overnight needs the battery can cover
    // Account for charging efficiency (85% round-trip efficiency)
    const effectiveBatteryCapacity = usableBatteryCapacity * 0.85;
    
    // Coverage percentage (capped at 100%)
    const overnightCoverage = Math.min(effectiveBatteryCapacity / dailyOvernightUsage, 1.0);
    
    // Battery saves on overnight grid usage ($0.28/kWh)
    // Additional savings from avoiding peak rates and maximizing self-consumption
    const overnightCost = (annualOvernightUsage * 0.28);
    
    // Battery contribution to total savings
    // Maximum additional 28% bill reduction possible (on top of 70% solar savings)
    batterySavings = overnightCost * overnightCoverage;
  }
  
  const totalBillSavings = solarOnlySavings + batterySavings;
  
  // Cap maximum savings at 98% (even large batteries have some grid usage for reliability)
  const cappedBillSavings = Math.min(totalBillSavings, currentAnnualCost * 0.98);
  const savingsPercentage = (cappedBillSavings / currentAnnualCost);
  
  // Step 5: Calculate EV savings
  // EV charging savings only apply if you have adequate battery storage
  // You can't effectively charge an EV at night without battery storage
  let evSavings = 0;
  const evCount = calculationInputs?.evCount || 1;
  
  if ((hasEv || planningEv) && batterySizeKwh >= 10) {
    // Average EV drives 15,000 km/year, uses ~20 kWh/100km = 3,000 kWh/year
    // Petrol equivalent: 15,000 km at 8L/100km = 1,200L at $1.80/L = $2,160/year
    // Solar charging cost: mostly free during day, battery at night = ~$100/year
    // Net savings: ~$2,500/year vs petrol per vehicle
    evSavings = 2500 * evCount;
  }
  
  const totalAnnualSavings = cappedBillSavings + evSavings;
  
  // Payback period
  const paybackYears = totalInvestment / totalAnnualSavings;
  
  // 25-year savings
  let savings25Years = 0;
  for (let year = 0; year < 25; year++) {
    savings25Years += totalAnnualSavings * Math.pow(1.03, year);
  }
  savings25Years -= totalInvestment;
  
  // Calculate annual production estimate
  // Perth average: 1,460 kWh per kW per year
  const sunDirectProduction = systemSizeKw * 1460;
  
  // Integrate Google's financial analysis if available
  const googleAnalysis = findGoogleFinancialAnalysis(googleFinancialAnalyses, systemSizeKw);
  
  let googleData: any = undefined;
  let finalEstimate: any = undefined;
  
  if (googleAnalysis) {
    const googleAnnualProduction = googleAnalysis.annualProduction || 0;
    const googleAnnualSavings = googleAnalysis.financialDetails?.savings?.savingsYear1 || 0;
    
    // Calculate Google's payback from cash flows or estimate
    let googlePaybackYears = paybackYears; // Default to our calculation
    if (googleAnalysis.financialDetails?.cashFlows && googleAnalysis.financialDetails.cashFlows.length > 0) {
      // Find when cumulative cash flow turns positive
      let cumulativeCashFlow = -(googleAnalysis.financialDetails.initialCost || totalCost);
      for (let i = 0; i < googleAnalysis.financialDetails.cashFlows.length; i++) {
        cumulativeCashFlow += googleAnalysis.financialDetails.cashFlows[i];
        if (cumulativeCashFlow >= 0) {
          googlePaybackYears = i + 1;
          break;
        }
      }
    } else if (googleAnnualSavings > 0) {
      googlePaybackYears = totalInvestment / googleAnnualSavings;
    }
    
    googleData = {
      annualProduction: Math.round(googleAnnualProduction),
      annualSavings: Math.round(googleAnnualSavings),
      paybackYears: Math.round(googlePaybackYears * 10) / 10,
      cashFlows: googleAnalysis.financialDetails?.cashFlows,
    };
    
    // Create combined estimate (average of both)
    finalEstimate = {
      annualProduction: Math.round((sunDirectProduction + googleAnnualProduction) / 2),
      annualSavings: Math.round((totalAnnualSavings + googleAnnualSavings) / 2),
      paybackYears: Math.round(((paybackYears + googlePaybackYears) / 2) * 10) / 10,
    };
  }
  
  return {
    scenarioName: batterySizeKwh > 0 ? 'Solar + Battery' : 'Solar Only',
    systemCost,
    batteryCost,
    addonsCost,
    totalCost,
    rebates,
    totalInvestment,
    annualSavings: totalAnnualSavings,
    paybackYears,
    savings25Years,
    currentAnnualCost,
    current25YearCost,
    savingsBreakdown: {
      solarOnlySavings,
      batterySavings,
      evSavings,
      totalSavingsPercent: Math.round(savingsPercentage * 100),
    },
    googleData,
    finalEstimate,
  };
}

export function calculateEnvironmentalImpact(systemSizeKw: number) {
  // Average system produces ~1,460 kWh per kW per year in Perth
  const annualProduction = systemSizeKw * 1460;
  
  // WA grid emission factor: 0.68 kg CO2-e per kWh
  const co2SavedPerYear = (annualProduction * 0.68) / 1000; // tonnes
  
  // 1 tree absorbs ~21 kg CO2 per year
  const equivalentTrees = Math.round((co2SavedPerYear * 1000) / 21);
  
  // Average car emits 4.6 tonnes CO2 per year
  const equivalentCars = co2SavedPerYear / 4.6;
  
  return {
    co2SavedPerYear: Math.round(co2SavedPerYear * 10) / 10,
    equivalentTrees,
    equivalentCars: Math.round(equivalentCars * 10) / 10,
    annualProduction: Math.round(annualProduction),
  };
}

export function generateQuoteReference(): string {
  const prefix = 'SDP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-AU').format(num);
}
