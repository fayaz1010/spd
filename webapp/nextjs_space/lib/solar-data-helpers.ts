/**
 * Solar Data Helpers
 * Functions for geocoding addresses and fetching Google Solar API data
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  suburb: string;
  state: string;
  postcode: string;
}

interface RoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  center: {
    latitude: number;
    longitude: number;
  };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  planeHeightAtCenterMeters: number;
}

interface GoogleSolarData {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  roofSegmentStats: RoofSegment[];
  solarPanelConfigs: any[];
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  imageryQuality: string;
}

interface MonthlyProduction {
  monthlyProduction: number[];
  annualProduction: number;
  dailyAverage: number;
}

interface SavingsData {
  currentMonthlyBill: number;
  newMonthlyBill: number;
  monthlySavings: number;
  annualSavings: number;
  year20Savings: number;
  npv: number;
  roi: number;
  irr: number;
  paybackYears: number;
  selfConsumptionRate: number;
  exportRate: number;
}

/**
 * Geocode an address using Google Maps Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding failed:', data.status, data.error_message);
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract address components
    const getComponent = (type: string) => {
      const component = result.address_components.find((c: any) =>
        c.types.includes(type)
      );
      return component?.long_name || '';
    };

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
      suburb: getComponent('locality'),
      state: getComponent('administrative_area_level_1'),
      postcode: getComponent('postal_code'),
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Fetch Google Solar API data for a location
 */
export async function fetchGoogleSolarData(
  lat: number,
  lng: number
): Promise<GoogleSolarData | null> {
  try {
    const apiKey = process.env.GOOGLE_SOLAR_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Solar API key not configured');
      return null;
    }

    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`
    );

    if (!response.ok) {
      console.error('Google Solar API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.solarPotential) {
      console.error('No solar potential data available for this location');
      return null;
    }

    return {
      maxArrayPanelsCount: data.solarPotential.maxArrayPanelsCount || 0,
      maxArrayAreaMeters2: data.solarPotential.maxArrayAreaMeters2 || 0,
      maxSunshineHoursPerYear: data.solarPotential.maxSunshineHoursPerYear || 0,
      roofSegmentStats: data.solarPotential.roofSegmentStats || [],
      solarPanelConfigs: data.solarPotential.solarPanelConfigs || [],
      imageryDate: data.imageryDate || { year: 0, month: 0, day: 0 },
      imageryQuality: data.imageryQuality || 'UNKNOWN',
    };
  } catch (error) {
    console.error('Error fetching Google Solar data:', error);
    return null;
  }
}

/**
 * Calculate monthly production estimates
 */
export function calculateMonthlyProduction(params: {
  systemSizeKw: number;
  sunshineHours: number;
  latitude: number;
}): MonthlyProduction {
  const { systemSizeKw, sunshineHours, latitude } = params;

  // Monthly sunshine distribution for Perth, WA (adjust by latitude)
  // These are approximate percentages of annual sunshine per month
  const monthlyDistribution = [
    0.11, // Jan - Summer
    0.10, // Feb
    0.09, // Mar - Autumn
    0.08, // Apr
    0.07, // May
    0.06, // Jun - Winter
    0.07, // Jul
    0.08, // Aug
    0.09, // Sep - Spring
    0.10, // Oct
    0.11, // Nov
    0.12, // Dec - Summer
  ];

  // System efficiency factors
  const systemEfficiency = 0.85; // 85% overall efficiency (inverter, wiring, temperature losses)
  const performanceRatio = 0.80; // 80% performance ratio (shading, soiling, degradation)

  // Calculate annual production
  const annualProduction = systemSizeKw * sunshineHours * systemEfficiency * performanceRatio;

  // Calculate monthly production
  const monthlyProduction = monthlyDistribution.map((factor) =>
    Math.round(annualProduction * factor)
  );

  const dailyAverage = Math.round(annualProduction / 365);

  return {
    monthlyProduction,
    annualProduction: Math.round(annualProduction),
    dailyAverage,
  };
}

/**
 * Calculate savings and financial metrics
 */
export function calculateSavings(params: {
  monthlyBill: number;
  annualProduction: number;
  systemSizeKw: number;
  systemCost: number;
}): SavingsData {
  const { monthlyBill, annualProduction, systemSizeKw, systemCost } = params;

  // Electricity rates (WA averages)
  const electricityRate = 0.30; // $/kWh (average retail rate)
  const feedInTariff = 0.03; // $/kWh (export rate)
  const priceEscalation = 0.025; // 2.5% annual increase

  // Consumption patterns
  const selfConsumptionRate = 0.70; // 70% of solar used directly
  const exportRate = 0.30; // 30% exported to grid

  // Calculate annual consumption from bill
  const annualConsumption = (monthlyBill * 12) / electricityRate;

  // Calculate solar usage
  const selfConsumed = annualProduction * selfConsumptionRate;
  const exported = annualProduction * exportRate;

  // Calculate first year savings
  const savingsFromSelfConsumption = selfConsumed * electricityRate;
  const earningsFromExport = exported * feedInTariff;
  const annualSavings = savingsFromSelfConsumption + earningsFromExport;

  // Calculate new monthly bill (can be negative if generating credit)
  const newMonthlyBill = monthlyBill - annualSavings / 12;

  // Calculate 20-year projections with electricity price escalation
  let totalSavings = 0;
  let currentSavings = annualSavings;
  const yearlyBreakdown = [];

  for (let year = 1; year <= 20; year++) {
    totalSavings += currentSavings;
    yearlyBreakdown.push({
      year,
      savings: Math.round(currentSavings),
      cumulative: Math.round(totalSavings),
    });
    currentSavings *= 1 + priceEscalation; // Increase with electricity price
  }

  // Financial metrics
  const paybackYears = systemCost / annualSavings;
  const roi = ((totalSavings - systemCost) / systemCost) * 100;
  const npv = totalSavings - systemCost; // Simplified NPV (not discounted)

  // Calculate IRR (simplified)
  // IRR is the rate at which NPV = 0
  const irr = (Math.pow(totalSavings / systemCost, 1 / 20) - 1) * 100;

  return {
    currentMonthlyBill: Math.round(monthlyBill),
    newMonthlyBill: Math.round(newMonthlyBill),
    monthlySavings: Math.round(annualSavings / 12),
    annualSavings: Math.round(annualSavings),
    year20Savings: Math.round(totalSavings),
    npv: Math.round(npv),
    roi: Math.round(roi),
    irr: Math.round(irr * 10) / 10,
    paybackYears: Math.round(paybackYears * 10) / 10,
    selfConsumptionRate,
    exportRate,
  };
}

/**
 * Calculate environmental impact
 */
export function calculateEnvironmentalImpact(annualProduction: number) {
  // Conversion factors
  const co2PerKwh = 0.42; // kg CO2 per kWh (WA grid average)
  const treesPerTonneCo2 = 43; // Trees needed to offset 1 tonne CO2 per year
  const petrolPerKwh = 0.3; // Litres of petrol equivalent per kWh
  const coalPerKwh = 0.34; // kg of coal per kWh

  const annualCo2Saved = (annualProduction * co2PerKwh) / 1000; // tonnes
  const treesEquivalent = Math.round(annualCo2Saved * treesPerTonneCo2);
  const petrolSaved = Math.round(annualProduction * petrolPerKwh);
  const coalAvoided = Math.round(annualProduction * coalPerKwh);

  return {
    annualCo2SavedTonnes: Math.round(annualCo2Saved * 10) / 10,
    treesEquivalent,
    petrolSavedLitres: petrolSaved,
    coalAvoidedKg: coalAvoided,
    lifetime20Years: {
      co2SavedTonnes: Math.round(annualCo2Saved * 20 * 10) / 10,
      treesEquivalent: treesEquivalent * 20,
      petrolSavedLitres: petrolSaved * 20,
      coalAvoidedKg: coalAvoided * 20,
    },
  };
}
