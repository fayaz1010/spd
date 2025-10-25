/**
 * SLD Validation System
 * Phase 5: Comprehensive validation for Western Power compliance
 */

import { WesternPowerSldData, SldValidationResult, SldSectionStatus } from './types';

// ============================================
// VALIDATION RULES
// ============================================

const REQUIRED_FIELDS = {
  documentControl: ['drawingNumber', 'revision', 'dateDesigned', 'sheetNumber', 'scale'],
  project: ['jobNumber', 'customerName', 'installationAddress', 'systemSize', 'panelCount'],
  designer: ['name', 'cecAccreditation'],
  company: ['name', 'abn', 'electricalLicense', 'cecAccreditation', 'phone', 'email'],
  panels: ['manufacturer', 'model', 'cecApproval', 'wattage', 'voc', 'isc'],
  strings: [], // Array validation
  inverter: ['manufacturer', 'model', 'cecApproval', 'capacity', 'acVoltage', 'maxAcCurrent'],
  dcCables: ['size', 'material', 'voltageRating', 'length', 'installMethod'],
  acCables: ['size', 'material', 'type', 'length', 'installMethod'],
  dcProtection: ['breakerRating', 'voltageRating', 'breakingCapacity', 'type'],
  acProtection: ['breakerRating', 'poles', 'type', 'rcdRating', 'rcdType', 'rcdPoles'],
  isolators: ['dc', 'ac'], // Object validation
  earthing: ['system', 'electrodeType', 'electrodeLocation', 'conductorSize', 'menLink'],
  metering: ['type', 'location', 'bidirectional'],
  mainSwitchboard: ['mainSwitchRating', 'poles', 'busbarRating'],
  waSpecific: ['exportLimitKw', 'exportLimitReason', 'phaseConfiguration', 'supplyType'],
  compliance: ['standards', 'cecApproved'],
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate complete SLD data
 */
export function validateSldData(data: Partial<WesternPowerSldData>): SldValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Validate each section
  for (const [section, fields] of Object.entries(REQUIRED_FIELDS)) {
    const sectionData = (data as any)[section];
    
    if (!sectionData) {
      missingFields.push(section);
      errors.push(`Missing section: ${section}`);
      continue;
    }
    
    // Validate required fields in section
    for (const field of fields) {
      if (!sectionData[field] || sectionData[field] === '') {
        missingFields.push(`${section}.${field}`);
      }
    }
  }
  
  // Validate strings array
  if (!data.strings || data.strings.length === 0) {
    missingFields.push('strings');
    errors.push('At least one string configuration is required');
  }
  
  // Validate battery (if system has battery)
  if (data.project?.batteryCapacity && data.project.batteryCapacity > 0) {
    if (!data.battery) {
      warnings.push('Battery capacity specified but battery details missing');
    } else {
      const batteryFields = ['manufacturer', 'model', 'cecApproval', 'capacity', 'voltage', 'chemistry', 'vppEnrollment'];
      for (const field of batteryFields) {
        if (!(data.battery as any)[field]) {
          missingFields.push(`battery.${field}`);
        }
      }
      
      // VPP enrollment mandatory for WA
      if (!data.battery.vppEnrollment) {
        errors.push('VPP enrollment is mandatory for battery systems in WA');
      }
    }
  }
  
  // Validate export limit
  if (data.waSpecific?.exportLimitKw) {
    const inverterCapacity = data.inverter?.capacity || 0;
    const expectedLimit = inverterCapacity <= 5 ? 5.0 : 1.5;
    
    if (data.waSpecific.exportLimitKw !== expectedLimit) {
      warnings.push(`Export limit ${data.waSpecific.exportLimitKw}kW may not comply with WA regulations (expected ${expectedLimit}kW for ${inverterCapacity}kW inverter)`);
    }
  }
  
  // Validate RCD type
  if (data.acProtection?.rcdType !== 'Type B') {
    warnings.push('Type B RCD is recommended for inverter installations');
  }
  
  // Validate earthing
  if (data.earthing?.menLink === false) {
    warnings.push('MEN link should typically be present in TN-S/TN-C-S systems');
  }
  
  // Calculate completion percentage
  const totalFields = Object.values(REQUIRED_FIELDS).reduce((sum, fields) => sum + fields.length, 0) + 2; // +2 for strings and battery check
  const completedFields = totalFields - missingFields.length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);
  
  // Determine if valid
  const isValid = missingFields.length === 0 && errors.length === 0;
  
  return {
    isValid,
    completionPercentage,
    missingFields,
    warnings,
    errors,
  };
}

/**
 * Validate individual section
 */
export function validateSection(
  section: keyof typeof REQUIRED_FIELDS,
  data: any
): SldSectionStatus {
  const requiredFields = REQUIRED_FIELDS[section];
  const missingFields: string[] = [];
  
  if (!data) {
    return {
      section,
      complete: false,
      completionPercentage: 0,
      missingFields: requiredFields,
    };
  }
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      missingFields.push(field);
    }
  }
  
  const completionPercentage = requiredFields.length > 0
    ? Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100)
    : 100;
  
  return {
    section,
    complete: missingFields.length === 0,
    completionPercentage,
    missingFields,
  };
}

/**
 * Get all section statuses
 */
export function getAllSectionStatuses(data: Partial<WesternPowerSldData>): SldSectionStatus[] {
  const statuses: SldSectionStatus[] = [];
  
  for (const section of Object.keys(REQUIRED_FIELDS) as Array<keyof typeof REQUIRED_FIELDS>) {
    statuses.push(validateSection(section, (data as any)[section]));
  }
  
  return statuses;
}

/**
 * Check if SLD is ready for Western Power submission
 */
export function isReadyForSubmission(data: Partial<WesternPowerSldData>): {
  ready: boolean;
  reason?: string;
  completionPercentage: number;
} {
  const validation = validateSldData(data);
  
  if (!validation.isValid) {
    return {
      ready: false,
      reason: `Missing required fields: ${validation.missingFields.join(', ')}`,
      completionPercentage: validation.completionPercentage,
    };
  }
  
  if (validation.completionPercentage < 100) {
    return {
      ready: false,
      reason: 'Some optional fields are missing',
      completionPercentage: validation.completionPercentage,
    };
  }
  
  if (validation.errors.length > 0) {
    return {
      ready: false,
      reason: validation.errors.join('; '),
      completionPercentage: validation.completionPercentage,
    };
  }
  
  return {
    ready: true,
    completionPercentage: 100,
  };
}

/**
 * Get human-readable validation report
 */
export function getValidationReport(data: Partial<WesternPowerSldData>): string {
  const validation = validateSldData(data);
  const sectionStatuses = getAllSectionStatuses(data);
  
  let report = '=== SLD VALIDATION REPORT ===\n\n';
  report += `Overall Completion: ${validation.completionPercentage}%\n`;
  report += `Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
  
  if (validation.errors.length > 0) {
    report += '🔴 ERRORS:\n';
    validation.errors.forEach(error => {
      report += `  - ${error}\n`;
    });
    report += '\n';
  }
  
  if (validation.warnings.length > 0) {
    report += '⚠️  WARNINGS:\n';
    validation.warnings.forEach(warning => {
      report += `  - ${warning}\n`;
    });
    report += '\n';
  }
  
  if (validation.missingFields.length > 0) {
    report += '📝 MISSING FIELDS:\n';
    validation.missingFields.forEach(field => {
      report += `  - ${field}\n`;
    });
    report += '\n';
  }
  
  report += '📊 SECTION STATUS:\n';
  sectionStatuses.forEach(status => {
    const icon = status.complete ? '✅' : '⏳';
    report += `  ${icon} ${status.section}: ${status.completionPercentage}%\n`;
    if (status.missingFields.length > 0) {
      report += `     Missing: ${status.missingFields.join(', ')}\n`;
    }
  });
  
  return report;
}

/**
 * Get next steps for completion
 */
export function getNextSteps(data: Partial<WesternPowerSldData>): string[] {
  const validation = validateSldData(data);
  const steps: string[] = [];
  
  if (!data.equipmentSpec) {
    steps.push('Complete equipment specifications form');
  }
  
  if (!data.earthing || !data.earthing.system) {
    steps.push('Complete site visit checklist (earthing system)');
  }
  
  if (!data.mainSwitchboard || !data.mainSwitchboard.mainSwitchRating) {
    steps.push('Verify main switch rating during site visit');
  }
  
  if (data.project?.batteryCapacity && (!data.battery || !data.battery.vppEnrollment)) {
    steps.push('Select VPP enrollment (Synergy VPP or Plico VPP)');
  }
  
  if (!data.designer || !data.designer.cecAccreditation) {
    steps.push('Assign CEC accredited designer');
  }
  
  if (validation.missingFields.length > 0) {
    const criticalFields = validation.missingFields.filter(f => 
      f.includes('cecApproval') || f.includes('manufacturer') || f.includes('model')
    );
    
    if (criticalFields.length > 0) {
      steps.push('Complete critical equipment details (CEC approvals, manufacturers, models)');
    }
  }
  
  return steps;
}
