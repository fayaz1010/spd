/**
 * Solar Production Calculator for Perth, Western Australia
 * Uses actual solar irradiance data and system parameters
 * Calculates monthly and annual production with high accuracy
 */

// Perth, WA Solar Irradiance Data (kWh/m²/day) - Bureau of Meteorology
// These are average peak sun hours per month
export const PERTH_SOLAR_DATA = {
  jan: 8.0,  // Summer - highest production
  feb: 7.5,  // Summer
  mar: 6.5,  // Autumn
  apr: 5.2,  // Autumn
  may: 4.0,  // Winter
  jun: 3.5,  // Winter - lowest production
  jul: 3.8,  // Winter
  aug: 4.8,  // Spring
  sep: 5.8,  // Spring
  oct: 6.8,  // Spring
  nov: 7.5,  // Summer
  dec: 8.0,  // Summer
};

// Days in each month
const DAYS_IN_MONTH = {
  jan: 31, feb: 28, mar: 31, apr: 30, may: 31, jun: 30,
  jul: 31, aug: 31, sep: 30, oct: 31, nov: 30, dec: 31,
};

export interface ProductionParams {
  systemSizeKw: number;
  tilt?: number;              // Panel tilt angle (default: 20° for Perth)
  azimuth?: number;           // Panel orientation (0° = North, default: 0°)
  systemEfficiency?: number;  // Overall system efficiency (default: 87%)
  shadingLoss?: number;       // Shading losses (default: 5%)
  soilingLoss?: number;       // Dirt/dust losses (default: 3%)
  degradationYear?: number;   // System age for degradation calc (default: 0)
  degradationRate?: number;   // Annual degradation (default: 0.5%)
}

export interface MonthlyProduction {
  month: string;
  monthNumber: number;
  dailyAverage: number;    // kWh/day
  monthlyTotal: number;    // kWh/month
  peakSunHours: number;    // hours
  season: 'Summer' | 'Autumn' | 'Winter' | 'Spring';
  seasonEmoji: string;
}

export interface AnnualProduction {
  totalKwh: number;
  averageDailyKwh: number;
  monthlyData: MonthlyProduction[];
  systemDetails: {
    systemSizeKw: number;
    efficiency: number;
    tilt: number;
    azimuth: number;
    totalLosses: number;
  };
}

/**
 * Calculate tilt factor based on panel angle
 * Optimal tilt for Perth is ~30° but most residential is 20-25°
 */
function calculateTiltFactor(tilt: number, month: number): number {
  // Simplified tilt optimization
  // Perth latitude: -31.9505° (Southern hemisphere)
  const optimalTilt = 30;
  const tiltDifference = Math.abs(tilt - optimalTilt);
  
  // Summer months benefit from lower tilt, winter from higher
  const seasonalAdjustment = month >= 5 && month <= 8 ? 1.02 : 0.98;
  
  // Reduce efficiency by 1% for every 5° away from optimal
  const tiltFactor = 1 - (tiltDifference / 500);
  
  return tiltFactor * seasonalAdjustment;
}

/**
 * Calculate azimuth factor based on panel orientation
 * 0° = North (optimal in Southern hemisphere)
 */
function calculateAzimuthFactor(azimuth: number): number {
  // North-facing (0°) is optimal in Southern hemisphere
  const deviationFromNorth = Math.abs(azimuth);
  
  if (deviationFromNorth === 0) return 1.0;
  if (deviationFromNorth <= 15) return 0.98;
  if (deviationFromNorth <= 30) return 0.95;
  if (deviationFromNorth <= 45) return 0.90;
  if (deviationFromNorth <= 90) return 0.80;
  return 0.60; // East or West facing
}

/**
 * Get season for a given month
 */
function getSeason(monthNumber: number): { season: 'Summer' | 'Autumn' | 'Winter' | 'Spring'; emoji: string } {
  if (monthNumber === 12 || monthNumber <= 2) return { season: 'Summer', emoji: '☀️' };
  if (monthNumber >= 3 && monthNumber <= 5) return { season: 'Autumn', emoji: '🍂' };
  if (monthNumber >= 6 && monthNumber <= 8) return { season: 'Winter', emoji: '❄️' };
  return { season: 'Spring', emoji: '🌸' };
}

/**
 * Calculate monthly solar production
 */
export function calculateMonthlyProduction(params: ProductionParams): MonthlyProduction[] {
  const {
    systemSizeKw,
    tilt = 20,
    azimuth = 0,
    systemEfficiency = 0.87,
    shadingLoss = 0.05,
    soilingLoss = 0.03,
    degradationYear = 0,
    degradationRate = 0.005,
  } = params;

  // Calculate degradation factor
  const degradationFactor = 1 - (degradationYear * degradationRate);

  // Calculate total efficiency
  const tiltFactor = 1; // Will be calculated per month
  const azimuthFactor = calculateAzimuthFactor(azimuth);
  const totalEfficiency = systemEfficiency * (1 - shadingLoss) * (1 - soilingLoss) * azimuthFactor * degradationFactor;

  const months = Object.entries(PERTH_SOLAR_DATA);
  
  return months.map(([monthKey, peakSunHours], index) => {
    const monthNumber = index + 1;
    const monthTiltFactor = calculateTiltFactor(tilt, monthNumber);
    
    // Production = System Size × Peak Sun Hours × Efficiency × Tilt Factor
    const dailyProduction = systemSizeKw * peakSunHours * totalEfficiency * monthTiltFactor;
    
    const daysInMonth = DAYS_IN_MONTH[monthKey as keyof typeof DAYS_IN_MONTH];
    const monthlyTotal = dailyProduction * daysInMonth;
    
    const { season, emoji } = getSeason(monthNumber);
    
    return {
      month: monthKey.charAt(0).toUpperCase() + monthKey.slice(1),
      monthNumber,
      dailyAverage: Math.round(dailyProduction * 10) / 10,
      monthlyTotal: Math.round(monthlyTotal),
      peakSunHours: Math.round(peakSunHours * 10) / 10,
      season,
      seasonEmoji: emoji,
    };
  });
}

/**
 * Calculate annual production summary
 */
export function calculateAnnualProduction(params: ProductionParams): AnnualProduction {
  const monthlyData = calculateMonthlyProduction(params);
  
  const totalKwh = monthlyData.reduce((sum, month) => sum + month.monthlyTotal, 0);
  const averageDailyKwh = totalKwh / 365;
  
  const {
    systemSizeKw,
    systemEfficiency = 0.87,
    tilt = 20,
    azimuth = 0,
    shadingLoss = 0.05,
    soilingLoss = 0.03,
  } = params;
  
  const totalLosses = (shadingLoss + soilingLoss) * 100;
  
  return {
    totalKwh: Math.round(totalKwh),
    averageDailyKwh: Math.round(averageDailyKwh * 10) / 10,
    monthlyData,
    systemDetails: {
      systemSizeKw,
      efficiency: systemEfficiency,
      tilt,
      azimuth,
      totalLosses,
    },
  };
}

/**
 * Calculate production for specific time period
 */
export function calculateProductionForPeriod(
  params: ProductionParams,
  startMonth: number,
  endMonth: number
): number {
  const monthlyData = calculateMonthlyProduction(params);
  
  let total = 0;
  for (let i = startMonth - 1; i < endMonth; i++) {
    total += monthlyData[i % 12].monthlyTotal;
  }
  
  return Math.round(total);
}

/**
 * Calculate seasonal production comparison
 */
export function calculateSeasonalProduction(params: ProductionParams) {
  const monthlyData = calculateMonthlyProduction(params);
  
  const summer = monthlyData.filter(m => m.season === 'Summer').reduce((sum, m) => sum + m.monthlyTotal, 0);
  const autumn = monthlyData.filter(m => m.season === 'Autumn').reduce((sum, m) => sum + m.monthlyTotal, 0);
  const winter = monthlyData.filter(m => m.season === 'Winter').reduce((sum, m) => sum + m.monthlyTotal, 0);
  const spring = monthlyData.filter(m => m.season === 'Spring').reduce((sum, m) => sum + m.monthlyTotal, 0);
  
  return {
    summer: { total: Math.round(summer), emoji: '☀️' },
    autumn: { total: Math.round(autumn), emoji: '🍂' },
    winter: { total: Math.round(winter), emoji: '❄️' },
    spring: { total: Math.round(spring), emoji: '🌸' },
  };
}

/**
 * Calculate hourly production profile for a typical day
 * Used for load profile matching
 */
export function calculateHourlyProfile(
  systemSizeKw: number,
  month: number,
  systemEfficiency: number = 0.87
): number[] {
  const monthKey = Object.keys(PERTH_SOLAR_DATA)[month - 1] as keyof typeof PERTH_SOLAR_DATA;
  const peakSunHours = PERTH_SOLAR_DATA[monthKey];
  
  // Typical solar production curve (bell curve)
  // Hours: 0-23 (midnight to 11pm)
  const hourlyProfile: number[] = new Array(24).fill(0);
  
  // Sunrise to sunset (approximate for Perth)
  const sunriseHour = month >= 4 && month <= 9 ? 7 : 6;  // Winter vs Summer
  const sunsetHour = month >= 4 && month <= 9 ? 17 : 19;
  
  const peakHour = 12; // Solar noon
  const productionHours = sunsetHour - sunriseHour;
  
  for (let hour = sunriseHour; hour <= sunsetHour; hour++) {
    // Bell curve: peak at solar noon
    const hoursFromPeak = Math.abs(hour - peakHour);
    const efficiency = Math.max(0, 1 - (hoursFromPeak / (productionHours / 2)) ** 2);
    
    // Production = System Size × Efficiency × Time-of-day factor
    hourlyProfile[hour] = systemSizeKw * systemEfficiency * efficiency;
  }
  
  return hourlyProfile.map(p => Math.round(p * 100) / 100);
}

/**
 * Estimate system size needed for target annual production
 */
export function estimateSystemSize(
  targetAnnualKwh: number,
  params: Omit<ProductionParams, 'systemSizeKw'> = {}
): number {
  // Start with 1kW system to get production per kW
  const baseProduction = calculateAnnualProduction({ systemSizeKw: 1, ...params });
  
  // Calculate required system size
  const requiredSize = targetAnnualKwh / baseProduction.totalKwh;
  
  // Round to nearest 0.1kW
  return Math.round(requiredSize * 10) / 10;
}
