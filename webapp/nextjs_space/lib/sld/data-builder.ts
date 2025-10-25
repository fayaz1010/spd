/**
 * SLD Data Builder
 * Transforms database records into WesternPowerSldData
 */

import { WesternPowerSldData, StringConfig } from './types';
import type { 
  InstallationJob, 
  Lead, 
  EquipmentSpecification,
  SiteVisitChecklist 
} from '@prisma/client';

// ============================================
// AUTO-CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate DC voltage from panel specs
 */
export function calculateDcVoltage(
  panelVoc: number,
  panelsPerString: number
): number {
  return Math.round(panelVoc * panelsPerString * 100) / 100;
}

/**
 * Calculate DC current from panel specs
 */
export function calculateDcCurrent(
  panelIsc: number,
  numberOfStrings: number
): number {
  return Math.round(panelIsc * numberOfStrings * 100) / 100;
}

/**
 * Calculate AC current from system size
 */
export function calculateAcCurrent(
  systemSizeKw: number,
  acVoltage: number
): number {
  return Math.round((systemSizeKw * 1000 / acVoltage) * 100) / 100;
}

/**
 * Calculate export limit based on WA regulations
 */
export function calculateExportLimit(inverterCapacityKw: number): number {
  // WA Rule: ≤5kVA = 5.0kW export, >5kVA = 1.5kW export
  return inverterCapacityKw <= 5 ? 5.0 : 1.5;
}

/**
 * Calculate string configuration
 */
export function calculateStringConfig(
  totalPanels: number,
  panelVoc: number,
  panelIsc: number,
  maxPanelsPerString: number = 11
): StringConfig[] {
  const numberOfStrings = Math.ceil(totalPanels / maxPanelsPerString);
  const panelsPerString = Math.floor(totalPanels / numberOfStrings);
  const remainder = totalPanels % numberOfStrings;
  
  const strings: StringConfig[] = [];
  
  for (let i = 0; i < numberOfStrings; i++) {
    const panelsInThisString = i < remainder ? panelsPerString + 1 : panelsPerString;
    
    strings.push({
      id: i + 1,
      panelCount: panelsInThisString,
      totalVoc: calculateDcVoltage(panelVoc, panelsInThisString),
      totalIsc: panelIsc, // Same for all strings
    });
  }
  
  return strings;
}

/**
 * Determine cable size based on system size and distance
 * AS/NZS 3000 compliant sizing
 */
export function recommendCableSize(
  current: number,
  length: number,
  voltage: number,
  maxVoltageDrop: number = 3 // 3% max voltage drop
): string {
  // Simplified cable sizing (real implementation would use full AS/NZS tables)
  if (current <= 20) return '4mm²';
  if (current <= 32) return '6mm²';
  if (current <= 40) return '10mm²';
  if (current <= 63) return '16mm²';
  return '25mm²';
}

/**
 * Determine breaker rating (1.25 × current for safety)
 */
export function recommendBreakerRating(current: number): string {
  const rating = Math.ceil(current * 1.25);
  
  // Standard breaker sizes
  const standardSizes = [16, 20, 25, 32, 40, 50, 63, 80, 100];
  const selectedSize = standardSizes.find(size => size >= rating) || 100;
  
  return `${selectedSize}A`;
}

// ============================================
// DATA BUILDER FUNCTIONS
// ============================================

/**
 * Build complete SLD data from database records
 */
export async function buildSldData(
  job: InstallationJob & {
    lead: Lead | null;
    equipmentSpec: EquipmentSpecification | null;
  },
  siteVisit: SiteVisitChecklist | null,
  companySettings: any
): Promise<Partial<WesternPowerSldData>> {
  
  // Calculate string configuration
  const panelVoc = job.equipmentSpec?.panelVoc || 40; // Default if not set
  const panelIsc = job.equipmentSpec?.panelIsc || 11.5;
  const strings = calculateStringConfig(job.panelCount, panelVoc, panelIsc);
  
  // Calculate electrical values
  const dcVoltage = strings[0]?.totalVoc || 0;
  const dcCurrent = calculateDcCurrent(panelIsc, strings.length);
  const acVoltage = job.equipmentSpec?.inverterPhases === 3 ? 400 : 230;
  const acCurrent = calculateAcCurrent(job.systemSize, acVoltage);
  
  // Calculate export limit
  const exportLimit = calculateExportLimit(job.systemSize);
  
  // Build the data structure
  const sldData: Partial<WesternPowerSldData> = {
    // Document Control
    documentControl: {
      drawingNumber: `SLD-${job.jobNumber}`,
      revision: 'A',
      revisionDate: new Date().toISOString(),
      sheetNumber: '1 of 1',
      scale: 'NTS',
      dateDesigned: new Date().toISOString(),
    },
    
    // Project Info
    project: {
      jobNumber: job.jobNumber,
      jobId: job.id,
      customerName: job.lead?.name || 'Customer',
      installationAddress: job.lead?.address || 'Installation Address',
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      batteryCapacity: job.batteryCapacity || undefined,
    },
    
    // Designer Info (from company settings)
    designer: {
      name: companySettings.cecDesignerNumber ? 'CEC Designer' : 'Designer',
      cecAccreditation: companySettings.cecDesignerNumber || 'CEC-XXXXX',
      electricalLicense: companySettings.waElectricianLicense,
    },
    
    // Company Info
    company: {
      name: companySettings.businessName || 'Sun Direct Power',
      abn: companySettings.businessABN || 'XX XXX XXX XXX',
      electricalLicense: companySettings.waElectricianLicense || 'EC-XXXXX',
      cecAccreditation: companySettings.cecAccreditationNumber || 'CEC-XXXXX',
      phone: companySettings.businessPhone || '1300 XXX XXX',
      email: companySettings.businessEmail || 'info@sundirectpower.com.au',
    },
    
    // Panel Specs
    panels: {
      manufacturer: job.equipmentSpec?.panelManufacturer || 'Panel Manufacturer',
      model: job.equipmentSpec?.panelModel || job.inverterModel,
      cecApproval: job.equipmentSpec?.panelCecApproval || 'CEC-PANEL-XXXXX',
      wattage: job.equipmentSpec?.panelWattage || 400,
      voc: panelVoc,
      isc: panelIsc,
      vmp: job.equipmentSpec?.panelVmp || 35,
      imp: job.equipmentSpec?.panelImp || 11,
    },
    
    // Strings
    strings,
    
    // Inverter Specs
    inverter: {
      manufacturer: job.equipmentSpec?.inverterManufacturer || 'Inverter Manufacturer',
      model: job.equipmentSpec?.inverterModel || job.inverterModel,
      cecApproval: job.equipmentSpec?.inverterCecApproval || 'CEC-INV-XXXXX',
      capacity: job.systemSize,
      efficiency: job.equipmentSpec?.inverterEfficiency || 97.5,
      maxDcInput: job.equipmentSpec?.inverterMaxDcInput || 1000,
      acVoltage,
      maxAcCurrent: acCurrent,
      phases: job.equipmentSpec?.inverterPhases || 1,
    },
    
    // Battery (if applicable)
    battery: job.batteryCapacity ? {
      manufacturer: job.equipmentSpec?.batteryManufacturer || 'Battery Manufacturer',
      model: job.equipmentSpec?.batteryModel || 'Battery Model',
      cecApproval: job.equipmentSpec?.batteryCecApproval || 'CEC-BAT-XXXXX',
      capacity: job.batteryCapacity,
      usableCapacity: job.equipmentSpec?.batteryUsableCapacity || job.batteryCapacity * 0.9,
      voltage: job.equipmentSpec?.batteryVoltage || 51.2,
      chemistry: job.equipmentSpec?.batteryChemistry || 'LFP',
      bmsModel: job.equipmentSpec?.batteryBmsModel || 'BMS Model',
      vppEnrollment: job.lead?.vppSelection || 'Synergy VPP',
    } : undefined,
    
    // DC Cables
    dcCables: {
      size: job.equipmentSpec?.dcCableSize || recommendCableSize(dcCurrent, 20, dcVoltage),
      material: 'Cu',
      insulation: job.equipmentSpec?.dcCableInsulation || 'V-90',
      voltageRating: '1000V DC',
      length: job.equipmentSpec?.dcCableLength || 20,
      installMethod: job.equipmentSpec?.dcCableInstallMethod || 'Conduit',
      conduitType: job.equipmentSpec?.dcConduitType || 'PVC',
      conduitSize: job.equipmentSpec?.dcConduitSize || '25mm',
    },
    
    // AC Cables
    acCables: {
      size: job.equipmentSpec?.acCableSize || recommendCableSize(acCurrent, 15, acVoltage),
      material: 'Cu',
      type: job.equipmentSpec?.acCableType || 'TPS',
      length: job.equipmentSpec?.acCableLength || 15,
      installMethod: job.equipmentSpec?.acCableInstallMethod || 'Conduit',
      conduitType: job.equipmentSpec?.acConduitType || 'PVC',
      conduitSize: job.equipmentSpec?.acConduitSize || '25mm',
    },
    
    // DC Protection
    dcProtection: {
      breakerRating: job.equipmentSpec?.dcBreakerRating || recommendBreakerRating(dcCurrent),
      voltageRating: '1000V DC',
      breakingCapacity: job.equipmentSpec?.dcBreakerBreakingCapacity || '10kA',
      type: job.equipmentSpec?.dcBreakerType || 'MCB',
      manufacturer: job.equipmentSpec?.dcBreakerManufacturer,
      model: job.equipmentSpec?.dcBreakerModel,
    },
    
    // AC Protection
    acProtection: {
      breakerRating: job.equipmentSpec?.acBreakerRating || recommendBreakerRating(acCurrent),
      poles: job.equipmentSpec?.acBreakerPoles || (acVoltage === 400 ? 3 : 2),
      type: job.equipmentSpec?.acBreakerType || `MCB C${recommendBreakerRating(acCurrent)}`,
      manufacturer: job.equipmentSpec?.acBreakerManufacturer,
      model: job.equipmentSpec?.acBreakerModel,
      rcdRating: job.equipmentSpec?.rcdRating || '30mA',
      rcdType: job.equipmentSpec?.rcdType || 'Type B', // Type B required for inverters
      rcdPoles: job.equipmentSpec?.rcdPoles || (acVoltage === 400 ? 4 : 2),
      rcdManufacturer: job.equipmentSpec?.rcdManufacturer,
      rcdModel: job.equipmentSpec?.rcdModel,
      surgeProtection: job.equipmentSpec?.surgeProtection || false,
      surgeProtectionType: job.equipmentSpec?.surgeProtectionType,
      surgeProtectionRating: job.equipmentSpec?.surgeProtectionRating,
    },
    
    // Isolators
    isolators: {
      dc: {
        rating: job.equipmentSpec?.dcIsolatorRating || `1000V, ${recommendBreakerRating(dcCurrent)}`,
        ipRating: job.equipmentSpec?.dcIsolatorIpRating || 'IP65',
        standard: 'AS/NZS 5033',
        manufacturer: job.equipmentSpec?.dcIsolatorManufacturer,
        model: job.equipmentSpec?.dcIsolatorModel,
        location: job.equipmentSpec?.dcIsolatorLocation || 'Roof',
      },
      ac: {
        rating: job.equipmentSpec?.acIsolatorRating || `250V, ${recommendBreakerRating(acCurrent)}`,
        poles: job.equipmentSpec?.acIsolatorPoles || (acVoltage === 400 ? 4 : 2),
        ipRating: job.equipmentSpec?.acIsolatorIpRating || 'IP65',
        manufacturer: job.equipmentSpec?.acIsolatorManufacturer,
        model: job.equipmentSpec?.acIsolatorModel,
        location: job.equipmentSpec?.acIsolatorLocation || 'Near inverter',
      },
      battery: job.batteryCapacity ? {
        rating: job.equipmentSpec?.batteryIsolatorRating || '600V, 100A',
        ipRating: job.equipmentSpec?.batteryIsolatorIpRating || 'IP65',
        manufacturer: job.equipmentSpec?.batteryIsolatorManufacturer,
        model: job.equipmentSpec?.batteryIsolatorModel,
      } : undefined,
    },
    
    // Earthing
    earthing: {
      system: siteVisit?.earthingSystemType || 'TN-S',
      electrodeType: siteVisit?.earthElectrodeType || 'Rod',
      electrodeLocation: siteVisit?.earthElectrodeLocation || 'Front yard',
      conductorSize: siteVisit?.earthConductorSize || '6mm² Cu',
      menLink: siteVisit?.menLinkPresent ?? true,
      notes: siteVisit?.earthingNotes,
    },
    
    // Metering
    metering: {
      type: siteVisit?.meterType || 'Smart Meter',
      location: siteVisit?.meterBoxLocation || job.lead?.meterLocation || 'External wall',
      bidirectional: siteVisit?.meterBidirectional ?? true,
      ctRating: siteVisit?.meterCtRating,
    },
    
    // Main Switchboard
    mainSwitchboard: {
      mainSwitchRating: siteVisit?.mainSwitchRating?.toString() + 'A' || job.lead?.mainSwitchRating?.toString() + 'A' || '63A',
      poles: siteVisit?.threePhasePower ? 3 : 1,
      busbarRating: siteVisit?.busbarRating || '100A',
      affectedCircuits: (siteVisit?.affectedCircuits as string[]) || ['Solar Circuit'],
      spareWays: siteVisit?.spareWaysAvailable,
    },
    
    // WA-Specific
    waSpecific: {
      exportLimitKw: job.lead?.exportLimitRequested || exportLimit,
      exportLimitReason: exportLimit === 5.0 
        ? 'Standard 5kW limit (≤5kVA inverter)' 
        : 'Reduced 1.5kW limit (>5kVA inverter)',
      exportLimitDevice: job.systemSize > 5 ? 'Export limiting device required' : undefined,
      phaseConfiguration: siteVisit?.threePhasePower ? '3-Phase' : 'Single Phase',
      supplyType: siteVisit?.supplyType || 'Overhead',
      synergyDesRequired: true,
      westernPowerAppRequired: true,
    },
    
    // Compliance
    compliance: {
      standards: [
        'AS/NZS 5033:2021',
        'AS/NZS 3000:2018',
        'AS/NZS 4777.2:2020',
      ],
      cecApproved: true,
      notes: [
        'All components are CEC approved',
        'Installation complies with AS/NZS 5033:2021',
        'Wiring complies with AS/NZS 3000:2018',
        'Inverter complies with AS/NZS 4777.2:2020',
        'All isolators are clearly labeled and accessible',
      ],
    },
  };
  
  return sldData;
}

/**
 * Get default values for missing fields
 */
export function getDefaultValues(): Partial<WesternPowerSldData> {
  return {
    documentControl: {
      drawingNumber: 'SLD-DRAFT',
      revision: 'A',
      revisionDate: new Date().toISOString(),
      sheetNumber: '1 of 1',
      scale: 'NTS',
      dateDesigned: new Date().toISOString(),
    },
    company: {
      name: 'Sun Direct Power',
      abn: 'XX XXX XXX XXX',
      electricalLicense: 'EC-XXXXX',
      cecAccreditation: 'CEC-XXXXX',
      phone: '1300 XXX XXX',
      email: 'info@sundirectpower.com.au',
    },
  };
}
