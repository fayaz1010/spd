// CEC (Clean Energy Council) Database Utilities
// Validates equipment against CEC approved products list

export interface CECProduct {
  id: string;
  type: 'panel' | 'inverter' | 'battery';
  manufacturer: string;
  model: string;
  serialPrefix?: string;
  wattage?: number;
  approvedDate: Date;
  expiryDate?: Date;
  cecListingId?: string;
  isActive: boolean;
}

export interface CECValidationResult {
  isApproved: boolean;
  confidence: number;
  product?: CECProduct;
  reason: string;
  warnings: string[];
}

/**
 * Validate serial number against CEC database
 */
export async function validateAgainstCEC(
  serialNumber: string,
  equipmentType: 'panel' | 'inverter' | 'battery',
  manufacturer?: string,
  model?: string
): Promise<CECValidationResult> {
  try {
    const response = await fetch('/api/admin/cec/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({
        serialNumber,
        equipmentType,
        manufacturer,
        model
      })
    });

    if (!response.ok) {
      throw new Error('CEC validation failed');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('CEC validation error:', error);
    return {
      isApproved: false,
      confidence: 0,
      reason: 'Unable to validate against CEC database',
      warnings: ['CEC validation service unavailable']
    };
  }
}

/**
 * Extract manufacturer from serial number for CEC lookup
 */
export function extractManufacturerFromSerial(serial: string): string | null {
  const upper = serial.toUpperCase();

  // Panel manufacturers
  const panelPrefixes: Record<string, string> = {
    'TSM': 'Trina Solar',
    'JKM': 'JinkoSolar',
    'SPR': 'SunPower',
    'LG': 'LG Electronics',
    'CS': 'Canadian Solar',
    'LONGI': 'LONGi Solar',
    'JA': 'JA Solar',
    'RISEN': 'Risen Energy',
    'QCELLS': 'Q CELLS',
    'HANWHA': 'Hanwha Q CELLS'
  };

  // Inverter manufacturers
  const inverterPrefixes: Record<string, string> = {
    'FRONIUS': 'Fronius',
    'SMA': 'SMA Solar Technology',
    'SOLAREDGE': 'SolarEdge',
    'ENPHASE': 'Enphase Energy',
    'HUAWEI': 'Huawei',
    'SUNGROW': 'Sungrow',
    'GOODWE': 'GoodWe',
    'GROWATT': 'Growatt'
  };

  // Battery manufacturers
  const batteryPrefixes: Record<string, string> = {
    'TESLA': 'Tesla',
    'POWERWALL': 'Tesla',
    'BYD': 'BYD',
    'LG CHEM': 'LG Chem',
    'SONNEN': 'sonnen',
    'PYLONTECH': 'Pylontech'
  };

  const allPrefixes = { ...panelPrefixes, ...inverterPrefixes, ...batteryPrefixes };

  for (const [prefix, manufacturer] of Object.entries(allPrefixes)) {
    if (upper.includes(prefix)) {
      return manufacturer;
    }
  }

  return null;
}

/**
 * Check if CEC approval is expired
 */
export function isApprovalExpired(expiryDate?: Date): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

/**
 * Get CEC approval status badge
 */
export function getCECStatusBadge(result: CECValidationResult): {
  color: 'green' | 'red' | 'yellow' | 'gray';
  text: string;
  icon: string;
} {
  if (!result.isApproved) {
    return {
      color: 'red',
      text: 'NOT CEC Approved',
      icon: 'X'
    };
  }

  if (result.product?.expiryDate && isApprovalExpired(result.product.expiryDate)) {
    return {
      color: 'yellow',
      text: 'CEC Approval Expired',
      icon: '⚠'
    };
  }

  if (result.confidence < 0.7) {
    return {
      color: 'yellow',
      text: 'CEC Approval Uncertain',
      icon: '?'
    };
  }

  return {
    color: 'green',
    text: 'CEC Approved',
    icon: '✓'
  };
}

/**
 * Format CEC listing for display
 */
export function formatCECListing(product: CECProduct): string {
  const parts = [
    product.manufacturer,
    product.model,
    product.wattage ? `${product.wattage}W` : null,
    product.cecListingId ? `(${product.cecListingId})` : null
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * Sync CEC database from official source
 * This would typically fetch from CEC API or CSV file
 */
export async function syncCECDatabase(): Promise<{
  success: boolean;
  added: number;
  updated: number;
  errors: string[];
}> {
  try {
    const response = await fetch('/api/admin/cec/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('CEC sync failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('CEC sync error:', error);
    return {
      success: false,
      added: 0,
      updated: 0,
      errors: ['Failed to sync CEC database']
    };
  }
}

/**
 * Search CEC database
 */
export async function searchCECProducts(
  query: string,
  type?: 'panel' | 'inverter' | 'battery'
): Promise<CECProduct[]> {
  try {
    const params = new URLSearchParams({
      query,
      ...(type && { type })
    });

    const response = await fetch(`/api/admin/cec/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('CEC search failed');
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('CEC search error:', error);
    return [];
  }
}

/**
 * Get CEC statistics
 */
export async function getCECStats(): Promise<{
  totalProducts: number;
  panels: number;
  inverters: number;
  batteries: number;
  lastSync?: Date;
}> {
  try {
    const response = await fetch('/api/admin/cec/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get CEC stats');
    }

    const data = await response.json();
    return data.stats;
  } catch (error) {
    console.error('CEC stats error:', error);
    return {
      totalProducts: 0,
      panels: 0,
      inverters: 0,
      batteries: 0
    };
  }
}

/**
 * Mock CEC data for testing (until real CEC API is available)
 */
export const MOCK_CEC_PRODUCTS: Partial<CECProduct>[] = [
  // Panels
  {
    type: 'panel',
    manufacturer: 'Trina Solar',
    model: 'TSM-400DE09.08',
    serialPrefix: 'TSM',
    wattage: 400,
    cecListingId: 'A12345',
    isActive: true
  },
  {
    type: 'panel',
    manufacturer: 'JinkoSolar',
    model: 'JKM-400M-6RL3',
    serialPrefix: 'JKM',
    wattage: 400,
    cecListingId: 'A12346',
    isActive: true
  },
  {
    type: 'panel',
    manufacturer: 'Canadian Solar',
    model: 'CS3W-400MS',
    serialPrefix: 'CS',
    wattage: 400,
    cecListingId: 'A12347',
    isActive: true
  },
  
  // Inverters
  {
    type: 'inverter',
    manufacturer: 'Fronius',
    model: 'Primo 5.0-1',
    serialPrefix: 'FRONIUS',
    cecListingId: 'I12345',
    isActive: true
  },
  {
    type: 'inverter',
    manufacturer: 'SolarEdge',
    model: 'SE5000H',
    serialPrefix: 'SOLAREDGE',
    cecListingId: 'I12346',
    isActive: true
  },
  {
    type: 'inverter',
    manufacturer: 'Enphase',
    model: 'IQ7PLUS-72-2-INT',
    serialPrefix: 'ENPHASE',
    cecListingId: 'I12347',
    isActive: true
  },
  
  // Batteries
  {
    type: 'battery',
    manufacturer: 'Tesla',
    model: 'Powerwall 2',
    serialPrefix: 'TESLA',
    cecListingId: 'B12345',
    isActive: true
  },
  {
    type: 'battery',
    manufacturer: 'BYD',
    model: 'Battery-Box Premium HVS 10.2',
    serialPrefix: 'BYD',
    cecListingId: 'B12346',
    isActive: true
  },
  {
    type: 'battery',
    manufacturer: 'LG Chem',
    model: 'RESU10H',
    serialPrefix: 'LG',
    cecListingId: 'B12347',
    isActive: true
  }
];
