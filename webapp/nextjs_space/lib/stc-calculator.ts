/**
 * STC (Small-scale Technology Certificate) Calculator
 * Calculates STC eligibility and value for solar installations
 */

// STC Zone ratings (based on postcode/location)
// Zone 1: Highest solar radiation (Northern Australia)
// Zone 2: High solar radiation
// Zone 3: Medium solar radiation (Most of Australia)
// Zone 4: Lower solar radiation (Southern regions)

interface STCZone {
  zone: number;
  rating: number; // kWh per kW per day
  states: string[];
}

const STC_ZONES: STCZone[] = [
  { zone: 1, rating: 5.5, states: ['NT', 'QLD (North)'] },
  { zone: 2, rating: 5.0, states: ['QLD', 'NSW (North)', 'WA (North)'] },
  { zone: 3, rating: 4.5, states: ['NSW', 'VIC', 'SA', 'WA', 'QLD (South)'] },
  { zone: 4, rating: 4.0, states: ['TAS', 'VIC (South)'] },
];

// STC deeming period (years remaining until 2030)
const STC_END_YEAR = 2030;

// Current STC market price (varies, this is approximate)
const STC_MARKET_PRICE = 38.50; // AUD per STC (as of 2024)

interface STCCalculationInput {
  systemSize: number; // kW
  installationDate: Date;
  postcode: string;
  state: string;
}

interface STCCalculationResult {
  stcCount: number;
  stcValue: number;
  zone: number;
  zoneRating: number;
  deemingPeriod: number;
  systemSize: number;
  calculation: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
}

/**
 * Calculate STC zone based on postcode and state
 */
export function getSTCZone(postcode: string, state: string): number {
  // Simplified zone mapping - in production, use comprehensive postcode database
  const postcodeNum = parseInt(postcode);

  // Northern Territory - Zone 1
  if (state === 'NT') return 1;

  // Queensland
  if (state === 'QLD') {
    if (postcodeNum >= 4000 && postcodeNum <= 4499) return 2; // Brisbane/South
    return 1; // North Queensland
  }

  // New South Wales
  if (state === 'NSW') {
    if (postcodeNum >= 2000 && postcodeNum <= 2249) return 3; // Sydney
    if (postcodeNum >= 2250 && postcodeNum <= 2499) return 2; // North Coast
    return 3;
  }

  // Victoria - Zone 3/4
  if (state === 'VIC') {
    if (postcodeNum >= 3000 && postcodeNum <= 3999) return 3;
    return 4; // Southern regions
  }

  // South Australia - Zone 3
  if (state === 'SA') return 3;

  // Western Australia
  if (state === 'WA') {
    if (postcodeNum >= 6000 && postcodeNum <= 6999) return 3; // Perth
    return 2; // North
  }

  // Tasmania - Zone 4
  if (state === 'TAS') return 4;

  // ACT - Zone 3
  if (state === 'ACT') return 3;

  // Default to Zone 3 (most common)
  return 3;
}

/**
 * Get zone rating (kWh per kW per day)
 */
export function getZoneRating(zone: number): number {
  const zoneData = STC_ZONES.find(z => z.zone === zone);
  return zoneData?.rating || 4.5;
}

/**
 * Calculate deeming period (years remaining until 2030)
 */
export function calculateDeemingPeriod(installationDate: Date): number {
  const installYear = installationDate.getFullYear();
  const yearsRemaining = STC_END_YEAR - installYear;
  
  // Minimum 1 year, maximum based on years to 2030
  return Math.max(1, Math.min(yearsRemaining, 15));
}

/**
 * Calculate number of STCs for a solar installation
 * 
 * Formula: STCs = (System Size in kW × Zone Rating × Deeming Period × 365) ÷ 1000
 */
export function calculateSTCs(input: STCCalculationInput): STCCalculationResult {
  const { systemSize, installationDate, postcode, state } = input;

  // Step 1: Determine STC zone
  const zone = getSTCZone(postcode, state);
  const zoneRating = getZoneRating(zone);

  // Step 2: Calculate deeming period
  const deemingPeriod = calculateDeemingPeriod(installationDate);

  // Step 3: Calculate STCs
  // Formula: (kW × Zone Rating × Deeming Period × 365) ÷ 1000
  const stcCount = Math.floor(
    (systemSize * zoneRating * deemingPeriod * 365) / 1000
  );

  // Step 4: Calculate STC value
  const stcValue = stcCount * STC_MARKET_PRICE;

  return {
    stcCount,
    stcValue,
    zone,
    zoneRating,
    deemingPeriod,
    systemSize,
    calculation: {
      step1: `System Size: ${systemSize} kW`,
      step2: `Zone ${zone} Rating: ${zoneRating} kWh/kW/day`,
      step3: `Deeming Period: ${deemingPeriod} years (until ${STC_END_YEAR})`,
      step4: `STCs = (${systemSize} × ${zoneRating} × ${deemingPeriod} × 365) ÷ 1000 = ${stcCount}`,
    },
  };
}

/**
 * Validate STC eligibility
 */
export function validateSTCEligibility(input: {
  systemSize: number;
  panelsValidated: boolean;
  inverterValidated: boolean;
  electricalCertificate: boolean;
  complianceStatement: boolean;
  customerDeclaration: boolean;
  installationPhotos: boolean;
}): {
  eligible: boolean;
  missingRequirements: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check system size
  if (input.systemSize <= 0) {
    missing.push('Valid system size required');
  }

  if (input.systemSize > 100) {
    warnings.push('Systems over 100kW may require additional approvals');
  }

  // Check panel validation
  if (!input.panelsValidated) {
    missing.push('All panel serial numbers must be validated against CEC approved list');
  }

  // Check inverter validation
  if (!input.inverterValidated) {
    missing.push('Inverter serial number must be validated against CEC approved list');
  }

  // Check electrical certificate
  if (!input.electricalCertificate) {
    missing.push('Certificate of Electrical Safety/Compliance required');
  }

  // Check compliance statement
  if (!input.complianceStatement) {
    missing.push('Written Compliance Statement from CEC accredited installer required');
  }

  // Check customer declaration
  if (!input.customerDeclaration) {
    missing.push('Customer Declaration and STC Assignment required');
  }

  // Check installation photos
  if (!input.installationPhotos) {
    missing.push('Installation photos including serial numbers required');
  }

  return {
    eligible: missing.length === 0,
    missingRequirements: missing,
    warnings,
  };
}

/**
 * Get current STC market price
 * In production, this would fetch from live market data
 */
export function getCurrentSTCPrice(): number {
  return STC_MARKET_PRICE;
}

/**
 * Calculate STC value over time (depreciation)
 */
export function calculateSTCDepreciation(
  baseSTCCount: number,
  installYear: number
): Array<{ year: number; stcCount: number; value: number }> {
  const depreciation = [];
  
  for (let year = installYear; year < STC_END_YEAR; year++) {
    const yearsRemaining = STC_END_YEAR - year;
    const stcCount = Math.floor((baseSTCCount / 15) * yearsRemaining);
    const value = stcCount * STC_MARKET_PRICE;
    
    depreciation.push({
      year,
      stcCount,
      value,
    });
  }

  return depreciation;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);
}
