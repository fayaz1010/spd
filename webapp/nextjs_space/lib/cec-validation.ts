/**
 * CEC (Clean Energy Council) Validation System
 * Validates solar panels and inverters against CEC approved lists
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CEC Approved Products Database
// In production, this would be fetched from CEC API or regularly updated database
// For now, we'll use a mock database with common products

interface CECPanel {
  manufacturer: string;
  model: string;
  wattage: number;
  approved: boolean;
  approvalDate: string;
  expiryDate?: string;
}

interface CECInverter {
  manufacturer: string;
  model: string;
  capacity: number; // kW
  approved: boolean;
  as4777Compliant: boolean;
  approvalDate: string;
  expiryDate?: string;
}

// Mock CEC Database - In production, fetch from CEC API
const CEC_PANELS: CECPanel[] = [
  // Tier 1 Manufacturers
  { manufacturer: 'Trina Solar', model: 'TSM-DE09.08', wattage: 405, approved: true, approvalDate: '2023-01-15' },
  { manufacturer: 'Trina Solar', model: 'TSM-DE19', wattage: 550, approved: true, approvalDate: '2023-06-20' },
  { manufacturer: 'JA Solar', model: 'JAM72S30', wattage: 550, approved: true, approvalDate: '2023-03-10' },
  { manufacturer: 'JA Solar', model: 'JAM54S31', wattage: 430, approved: true, approvalDate: '2023-02-15' },
  { manufacturer: 'Longi Solar', model: 'LR5-72HIH', wattage: 550, approved: true, approvalDate: '2023-04-01' },
  { manufacturer: 'Longi Solar', model: 'LR5-54HIH', wattage: 430, approved: true, approvalDate: '2023-04-01' },
  { manufacturer: 'Canadian Solar', model: 'CS3W-410P', wattage: 410, approved: true, approvalDate: '2023-01-20' },
  { manufacturer: 'Canadian Solar', model: 'CS6R-410MS', wattage: 410, approved: true, approvalDate: '2023-05-15' },
  { manufacturer: 'Jinko Solar', model: 'JKM550M-7RL4', wattage: 550, approved: true, approvalDate: '2023-02-28' },
  { manufacturer: 'Jinko Solar', model: 'JKM430M-54HL4', wattage: 430, approved: true, approvalDate: '2023-02-28' },
  { manufacturer: 'REC Solar', model: 'REC400AA', wattage: 400, approved: true, approvalDate: '2023-01-10' },
  { manufacturer: 'Suntech', model: 'STP550S-B72', wattage: 550, approved: true, approvalDate: '2023-03-15' },
  { manufacturer: 'Risen Energy', model: 'RSM150-8-550BMDG', wattage: 550, approved: true, approvalDate: '2023-04-20' },
];

const CEC_INVERTERS: CECInverter[] = [
  // Tier 1 Inverters
  { manufacturer: 'Fronius', model: 'Primo 5.0-1', capacity: 5.0, approved: true, as4777Compliant: true, approvalDate: '2023-01-15' },
  { manufacturer: 'Fronius', model: 'Symo 8.2-3-M', capacity: 8.2, approved: true, as4777Compliant: true, approvalDate: '2023-01-15' },
  { manufacturer: 'SMA', model: 'Sunny Boy 5.0', capacity: 5.0, approved: true, as4777Compliant: true, approvalDate: '2023-02-01' },
  { manufacturer: 'SMA', model: 'Sunny Tripower 10.0', capacity: 10.0, approved: true, as4777Compliant: true, approvalDate: '2023-02-01' },
  { manufacturer: 'Sungrow', model: 'SG5.0RS', capacity: 5.0, approved: true, as4777Compliant: true, approvalDate: '2023-01-20' },
  { manufacturer: 'Sungrow', model: 'SG10RS', capacity: 10.0, approved: true, as4777Compliant: true, approvalDate: '2023-01-20' },
  { manufacturer: 'Huawei', model: 'SUN2000-5KTL-L1', capacity: 5.0, approved: true, as4777Compliant: true, approvalDate: '2023-03-10' },
  { manufacturer: 'Huawei', model: 'SUN2000-10KTL-M1', capacity: 10.0, approved: true, as4777Compliant: true, approvalDate: '2023-03-10' },
  { manufacturer: 'GoodWe', model: 'GW5000-DNS', capacity: 5.0, approved: true, as4777Compliant: true, approvalDate: '2023-02-15' },
  { manufacturer: 'GoodWe', model: 'GW10K-DT', capacity: 10.0, approved: true, as4777Compliant: true, approvalDate: '2023-02-15' },
  { manufacturer: 'Enphase', model: 'IQ8PLUS-72-2-AU', capacity: 0.29, approved: true, as4777Compliant: true, approvalDate: '2023-01-25' },
  { manufacturer: 'SolarEdge', model: 'SE5000H-AU', capacity: 5.0, approved: true, as4777Compliant: true, approvalDate: '2023-02-20' },
  { manufacturer: 'SolarEdge', model: 'SE10K-AU', capacity: 10.0, approved: true, as4777Compliant: true, approvalDate: '2023-02-20' },
];

/**
 * Validate a panel against CEC approved list
 */
export async function validatePanel(
  manufacturer: string,
  model: string,
  wattage: number
): Promise<{
  valid: boolean;
  approved: boolean;
  message: string;
  details?: CECPanel;
}> {
  try {
    // Normalize inputs
    const normalizedManufacturer = manufacturer.trim().toLowerCase();
    const normalizedModel = model.trim().toLowerCase();

    // Search CEC database
    const match = CEC_PANELS.find(
      (panel) =>
        panel.manufacturer.toLowerCase().includes(normalizedManufacturer) &&
        panel.model.toLowerCase() === normalizedModel &&
        Math.abs(panel.wattage - wattage) <= 5 // Allow 5W tolerance
    );

    if (!match) {
      // Check if manufacturer exists but model doesn't
      const manufacturerExists = CEC_PANELS.some((panel) =>
        panel.manufacturer.toLowerCase().includes(normalizedManufacturer)
      );

      if (manufacturerExists) {
        return {
          valid: false,
          approved: false,
          message: `Panel model "${model}" not found in CEC approved list for ${manufacturer}. Please verify the model number.`,
        };
      }

      return {
        valid: false,
        approved: false,
        message: `Panel manufacturer "${manufacturer}" not found in CEC approved list. Only CEC approved panels are eligible for STC rebates.`,
      };
    }

    // Check if approval is still valid
    if (match.expiryDate) {
      const expiryDate = new Date(match.expiryDate);
      if (expiryDate < new Date()) {
        return {
          valid: false,
          approved: false,
          message: `Panel approval expired on ${match.expiryDate}. This panel is no longer eligible for STC rebates.`,
          details: match,
        };
      }
    }

    return {
      valid: true,
      approved: true,
      message: `✓ Panel approved by CEC. Eligible for STC rebates.`,
      details: match,
    };
  } catch (error) {
    console.error('Panel validation error:', error);
    return {
      valid: false,
      approved: false,
      message: 'Error validating panel. Please try again.',
    };
  }
}

/**
 * Validate an inverter against CEC approved list
 */
export async function validateInverter(
  manufacturer: string,
  model: string,
  capacity: number
): Promise<{
  valid: boolean;
  approved: boolean;
  as4777Compliant: boolean;
  message: string;
  details?: CECInverter;
}> {
  try {
    // Normalize inputs
    const normalizedManufacturer = manufacturer.trim().toLowerCase();
    const normalizedModel = model.trim().toLowerCase();

    // Search CEC database
    const match = CEC_INVERTERS.find(
      (inverter) =>
        inverter.manufacturer.toLowerCase().includes(normalizedManufacturer) &&
        inverter.model.toLowerCase() === normalizedModel &&
        Math.abs(inverter.capacity - capacity) <= 0.5 // Allow 0.5kW tolerance
    );

    if (!match) {
      // Check if manufacturer exists but model doesn't
      const manufacturerExists = CEC_INVERTERS.some((inverter) =>
        inverter.manufacturer.toLowerCase().includes(normalizedManufacturer)
      );

      if (manufacturerExists) {
        return {
          valid: false,
          approved: false,
          as4777Compliant: false,
          message: `Inverter model "${model}" not found in CEC approved list for ${manufacturer}. Please verify the model number.`,
        };
      }

      return {
        valid: false,
        approved: false,
        as4777Compliant: false,
        message: `Inverter manufacturer "${manufacturer}" not found in CEC approved list. Only CEC approved inverters are eligible for STC rebates.`,
      };
    }

    // Check AS/NZS 4777.2:2020 compliance
    if (!match.as4777Compliant) {
      return {
        valid: false,
        approved: true,
        as4777Compliant: false,
        message: `⚠️ Inverter is CEC approved but not AS/NZS 4777.2:2020 compliant. Grid connection may be rejected.`,
        details: match,
      };
    }

    // Check if approval is still valid
    if (match.expiryDate) {
      const expiryDate = new Date(match.expiryDate);
      if (expiryDate < new Date()) {
        return {
          valid: false,
          approved: false,
          as4777Compliant: false,
          message: `Inverter approval expired on ${match.expiryDate}. This inverter is no longer eligible for STC rebates.`,
          details: match,
        };
      }
    }

    return {
      valid: true,
      approved: true,
      as4777Compliant: true,
      message: `✓ Inverter approved by CEC and AS/NZS 4777.2:2020 compliant. Eligible for STC rebates and grid connection.`,
      details: match,
    };
  } catch (error) {
    console.error('Inverter validation error:', error);
    return {
      valid: false,
      approved: false,
      as4777Compliant: false,
      message: 'Error validating inverter. Please try again.',
    };
  }
}

/**
 * Batch validate multiple panels
 */
export async function validatePanelBatch(
  panels: Array<{ manufacturer: string; model: string; wattage: number; serialNumber: string }>
): Promise<{
  valid: boolean;
  totalPanels: number;
  validPanels: number;
  invalidPanels: number;
  results: Array<{
    serialNumber: string;
    valid: boolean;
    message: string;
  }>;
}> {
  const results = await Promise.all(
    panels.map(async (panel) => {
      const validation = await validatePanel(panel.manufacturer, panel.model, panel.wattage);
      return {
        serialNumber: panel.serialNumber,
        valid: validation.valid,
        message: validation.message,
      };
    })
  );

  const validPanels = results.filter((r) => r.valid).length;
  const invalidPanels = results.filter((r) => !r.valid).length;

  return {
    valid: invalidPanels === 0,
    totalPanels: panels.length,
    validPanels,
    invalidPanels,
    results,
  };
}

/**
 * Get list of CEC approved panels (for autocomplete/search)
 */
export function getCECApprovedPanels(searchTerm?: string): CECPanel[] {
  if (!searchTerm) {
    return CEC_PANELS.filter((p) => p.approved);
  }

  const term = searchTerm.toLowerCase();
  return CEC_PANELS.filter(
    (p) =>
      p.approved &&
      (p.manufacturer.toLowerCase().includes(term) ||
        p.model.toLowerCase().includes(term) ||
        p.wattage.toString().includes(term))
  );
}

/**
 * Get list of CEC approved inverters (for autocomplete/search)
 */
export function getCECApprovedInverters(searchTerm?: string): CECInverter[] {
  if (!searchTerm) {
    return CEC_INVERTERS.filter((i) => i.approved);
  }

  const term = searchTerm.toLowerCase();
  return CEC_INVERTERS.filter(
    (i) =>
      i.approved &&
      (i.manufacturer.toLowerCase().includes(term) ||
        i.model.toLowerCase().includes(term) ||
        i.capacity.toString().includes(term))
  );
}

/**
 * Check for potential fraud (duplicate serial numbers)
 */
export async function checkSerialNumberFraud(
  serialNumber: string,
  jobId: string
): Promise<{
  fraudDetected: boolean;
  message: string;
  previousJobs?: string[];
}> {
  try {
    // Check if serial number already exists in database
    const existingPanels = await (prisma as any).panelSerial?.findMany({
      where: {
        serialNumber,
        jobId: { not: jobId }, // Exclude current job
      },
      include: {
        job: {
          select: {
            jobNumber: true,
            installationDate: true,
          },
        },
      },
    });

    if (existingPanels.length > 0) {
      const previousJobs = existingPanels.map((p: any) => p.job.jobNumber);
      return {
        fraudDetected: true,
        message: `⚠️ FRAUD ALERT: Serial number "${serialNumber}" has been used in ${existingPanels.length} previous job(s). This may indicate panel reuse or fraud.`,
        previousJobs,
      };
    }

    return {
      fraudDetected: false,
      message: 'Serial number is unique.',
    };
  } catch (error) {
    console.error('Fraud check error:', error);
    return {
      fraudDetected: false,
      message: 'Unable to check for fraud.',
    };
  }
}

/**
 * Save validated panel serial to database
 */
export async function savePanelSerial(data: {
  jobId: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  wattage: number;
  photoUrl?: string;
  validated: boolean;
  validationMessage?: string;
}) {
  return await (prisma as any).panelSerial?.create({
    data: {
      jobId: data.jobId,
      serialNumber: data.serialNumber,
      manufacturer: data.manufacturer,
      model: data.model,
      wattage: data.wattage,
      photoUrl: data.photoUrl,
      validated: data.validated,
      validationMessage: data.validationMessage,
      validatedAt: data.validated ? new Date() : null,
    },
  });
}

/**
 * Save validated inverter serial to database
 */
export async function saveInverterSerial(data: {
  jobId: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  capacity: number;
  photoUrl?: string;
  validated: boolean;
  as4777Compliant: boolean;
  validationMessage?: string;
}) {
  return await (prisma as any).inverterSerial?.create({
    data: {
      jobId: data.jobId,
      serialNumber: data.serialNumber,
      manufacturer: data.manufacturer,
      model: data.model,
      capacity: data.capacity,
      photoUrl: data.photoUrl,
      validated: data.validated,
      as4777Compliant: data.as4777Compliant,
      validationMessage: data.validationMessage,
      validatedAt: data.validated ? new Date() : null,
    },
  });
}
