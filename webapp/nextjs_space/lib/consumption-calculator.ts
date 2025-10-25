
import { prisma } from '@/lib/db';

/**
 * Cached consumption assumptions (fetch once, use many times)
 */
let cachedAssumptions: any = null;

async function getAssumptions() {
  if (cachedAssumptions) return cachedAssumptions;

  const assumptions = await prisma.consumptionAssumption.findMany({
    where: { active: true },
  });

  cachedAssumptions = {
    baselines: assumptions.filter(a => a.assumptionType === 'baseline'),
    acTiers: assumptions.filter(a => a.assumptionType === 'ac'),
    pools: assumptions.filter(a => a.assumptionType === 'pool'),
    office: assumptions.find(a => a.assumptionType === 'office'),
    ev: assumptions.find(a => a.assumptionType === 'ev'),
    hotwater: assumptions.find(a => a.assumptionType === 'hotwater'),
    cooking: assumptions.find(a => a.assumptionType === 'cooking'),
  };

  return cachedAssumptions;
}

/**
 * Calculate daily kWh consumption based on household characteristics
 */
export async function calculateDailyConsumption(params: {
  householdSize: number;
  acTier?: string;
  poolType?: string;
  homeOfficeCount?: number;
  evCount?: number;
  hasElectricHotWater?: boolean;
  hasElectricCooking?: boolean;
}) {
  const {
    householdSize,
    acTier = 'moderate',
    poolType = 'none',
    homeOfficeCount = 0,
    evCount = 0,
    hasElectricHotWater = false,
    hasElectricCooking = false,
  } = params;

  const assumptions = await getAssumptions();

  // 1. Get baseline (core appliances, lighting, entertainment ONLY)
  const baselineEntry = assumptions.baselines.find(
    (b: any) => b.householdSize === Math.min(householdSize, 6)
  );
  const baseline = baselineEntry?.baselineKwhPerDay || 9;

  // 2. Get AC load (now additive, not adjustment)
  const acEntry = assumptions.acTiers.find((ac: any) => ac.acTier === acTier);
  const acLoad = acEntry?.acAdjustmentKwhPerDay || 10;

  // 3. Get pool load
  const poolEntry = assumptions.pools.find((p: any) => p.poolType === poolType);
  const poolLoad = poolEntry?.poolKwhPerDay || 0;

  // 4. Calculate hot water load
  const hotWaterKwhPerDay = assumptions.hotwater?.hotWaterKwhPerDay || 6;
  const hotWaterLoad = hasElectricHotWater ? hotWaterKwhPerDay : 0;

  // 5. Calculate cooking load
  const cookingKwhPerDay = assumptions.cooking?.cookingKwhPerDay || 4;
  const cookingLoad = hasElectricCooking ? cookingKwhPerDay : 0;

  // 6. Calculate office load
  const officeKwhPerDay = assumptions.office?.homeOfficeKwhPerDay || 1.5;
  const officeLoad = homeOfficeCount * officeKwhPerDay;

  // 7. Calculate EV load
  const evKwhPerDay = assumptions.ev?.evKwhPerDay || 8;
  const evLoad = evCount * evKwhPerDay;

  // TOTAL
  const totalDailyKwh = baseline + acLoad + poolLoad + hotWaterLoad + cookingLoad + officeLoad + evLoad;

  return {
    totalDailyKwh: Math.round(totalDailyKwh * 10) / 10, // Round to 1 decimal
    breakdown: {
      baseline: Math.round(baseline * 10) / 10,
      acLoad: Math.round(acLoad * 10) / 10,
      poolLoad: Math.round(poolLoad * 10) / 10,
      hotWaterLoad: Math.round(hotWaterLoad * 10) / 10,
      cookingLoad: Math.round(cookingLoad * 10) / 10,
      officeLoad: Math.round(officeLoad * 10) / 10,
      evLoad: Math.round(evLoad * 10) / 10,
    },
    assumptions: {
      householdSize,
      acTier,
      poolType,
      homeOfficeCount,
      evCount,
      hasElectricHotWater,
      hasElectricCooking,
    },
  };
}

/**
 * Calculate daily kWh from bi-monthly electricity bill
 * Australia receives bills every 2 months (60 days), not quarterly
 */
export function calculateDailyFromBill(biMonthlyBill: number, ratePerKwh: number = 0.3237): number {
  // Bi-monthly bill / rate = bi-monthly kWh
  // Using Synergy Home Plan A1 tariff: $0.3237/kWh (WA)
  const biMonthlyKwh = biMonthlyBill / ratePerKwh;
  
  // Bi-monthly kWh / 60 days = daily kWh
  const dailyKwh = biMonthlyKwh / 60;
  
  return Math.round(dailyKwh * 10) / 10; // Round to 1 decimal
}

/**
 * Validate if calculated consumption matches bill-based consumption
 * Returns true if within ±15% threshold
 */
export function validateConsumption(calculated: number, actual: number): {
  isValid: boolean;
  difference: number;
  percentageDiff: number;
} {
  const difference = Math.abs(calculated - actual);
  const percentageDiff = (difference / actual) * 100;
  
  return {
    isValid: percentageDiff <= 15,
    difference: Math.round(difference * 10) / 10,
    percentageDiff: Math.round(percentageDiff * 10) / 10,
  };
}

/**
 * Determine which consumption value to use (actual vs calculated)
 */
export async function determineDailyConsumption(params: {
  // Bill-based (most accurate if available)
  biMonthlyBill?: number;
  quarterlyBill?: number; // Backward compatibility
  ratePerKwh?: number;
  
  // Calculated from characteristics
  householdSize: number;
  acTier?: string;
  poolType?: string;
  homeOfficeCount?: number;
  evCount?: number;
  hasElectricHotWater?: boolean;
  hasElectricCooking?: boolean;
}): Promise<{
  dailyConsumption: number;
  source: 'actual' | 'calculated' | 'validated';
  calculatedDailyKwh?: number;
  actualDailyKwhFromBill?: number;
  validation?: {
    isValid: boolean;
    difference: number;
    percentageDiff: number;
  };
  breakdown?: any;
}> {
  const { biMonthlyBill, quarterlyBill, ratePerKwh = 0.3237, ...characteristicsParams } = params;

  // Calculate from characteristics
  const calculated = await calculateDailyConsumption(characteristicsParams);

  // Support both biMonthlyBill (new) and quarterlyBill (legacy)
  const billAmount = biMonthlyBill || quarterlyBill;

  // If no bill provided, use calculated
  if (!billAmount) {
    return {
      dailyConsumption: calculated.totalDailyKwh,
      source: 'calculated',
      calculatedDailyKwh: calculated.totalDailyKwh,
      breakdown: calculated.breakdown,
    };
  }

  // Calculate from bill
  const actual = calculateDailyFromBill(billAmount, ratePerKwh);

  // Validate if they match
  const validation = validateConsumption(calculated.totalDailyKwh, actual);

  // If validated (within 15%), use actual and mark as validated
  if (validation.isValid) {
    return {
      dailyConsumption: actual,
      source: 'validated',
      calculatedDailyKwh: calculated.totalDailyKwh,
      actualDailyKwhFromBill: actual,
      validation,
      breakdown: calculated.breakdown,
    };
  }

  // If not validated, prefer actual bill (it's real data)
  return {
    dailyConsumption: actual,
    source: 'actual',
    calculatedDailyKwh: calculated.totalDailyKwh,
    actualDailyKwhFromBill: actual,
    validation,
    breakdown: calculated.breakdown,
  };
}
