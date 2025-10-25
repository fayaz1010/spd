/**
 * Solar Calculation Settings Helper
 * Fetches configurable settings from database or returns defaults
 */

export interface SolarCalculationSettings {
  // Electricity Rates
  electricityRetailRate: number;
  feedInTariff: number;
  annualRateIncrease: number;
  
  // System Parameters
  systemEfficiency: number;
  shadingLoss: number;
  soilingLoss: number;
  systemDegradation: number;
  
  // Location-Specific
  defaultTilt: number;
  defaultAzimuth: number;
  peakSunHours: number;
  
  // Financial
  inverterReplacementYear: number;
  inverterReplacementCost: number;
  discountRate: number;
}

/**
 * Default settings for Perth, Western Australia
 */
export const DEFAULT_SOLAR_SETTINGS: SolarCalculationSettings = {
  // Electricity Rates (Perth defaults)
  electricityRetailRate: 0.27,
  feedInTariff: 0.07,
  annualRateIncrease: 0.03,
  
  // System Parameters (Industry standards)
  systemEfficiency: 0.87,
  shadingLoss: 0.05,
  soilingLoss: 0.03,
  systemDegradation: 0.005,
  
  // Perth-Specific
  defaultTilt: 20,
  defaultAzimuth: 0,
  peakSunHours: 4.5,
  
  // Financial
  inverterReplacementYear: 12,
  inverterReplacementCost: 2000,
  discountRate: 0.05,
};

/**
 * Fetch solar calculation settings from API
 * Falls back to defaults if API fails
 */
export async function getSolarSettings(): Promise<SolarCalculationSettings> {
  try {
    const response = await fetch('/api/admin/solar-calculation-settings', {
      cache: 'no-store', // Always fetch fresh settings
    });

    if (response.ok) {
      const data = await response.json();
      if (data.settings) {
        return data.settings;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch solar settings, using defaults:', error);
  }

  return DEFAULT_SOLAR_SETTINGS;
}

/**
 * Get solar settings synchronously (for client components)
 * Note: This will use defaults until settings are loaded
 */
export function getDefaultSolarSettings(): SolarCalculationSettings {
  return DEFAULT_SOLAR_SETTINGS;
}

/**
 * Validate solar settings
 */
export function validateSolarSettings(settings: Partial<SolarCalculationSettings>): boolean {
  if (settings.electricityRetailRate !== undefined && settings.electricityRetailRate <= 0) {
    return false;
  }
  
  if (settings.feedInTariff !== undefined && settings.feedInTariff < 0) {
    return false;
  }
  
  if (settings.systemEfficiency !== undefined && 
      (settings.systemEfficiency <= 0 || settings.systemEfficiency > 1)) {
    return false;
  }
  
  if (settings.peakSunHours !== undefined && 
      (settings.peakSunHours <= 0 || settings.peakSunHours > 12)) {
    return false;
  }
  
  return true;
}
