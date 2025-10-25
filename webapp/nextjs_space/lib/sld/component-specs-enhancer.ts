/**
 * Component Specifications Enhancer
 * Adds detailed equipment specifications to component labels for WP compliance
 */

export interface EquipmentSpecs {
  // Solar panels
  panelManufacturer?: string;
  panelModel?: string;
  panelWattage?: number;
  panelVoc?: number;
  panelIsc?: number;
  panelVmp?: number;
  panelImp?: number;
  panelCecApproval?: string;
  
  // Inverter
  inverterManufacturer?: string;
  inverterModel?: string;
  inverterRating?: number;
  inverterCecApproval?: string;
  inverterVoltageRange?: string;
  
  // Battery
  batteryManufacturer?: string;
  batteryModel?: string;
  batteryCapacity?: number;
  batteryVoltage?: number;
  batteryCecApproval?: string;
  batteryChemistry?: string;
  
  // Protection devices
  dcMcbRating?: string;
  dcMcbBreakingCapacity?: string;
  acMcbRating?: string;
  acMcbPoles?: string;
  rcdType?: string;
  rcdRating?: string;
  
  // Isolators
  dcIsolatorRating?: string;
  dcIsolatorIpRating?: string;
  acIsolatorRating?: string;
  acIsolatorIpRating?: string;
  
  // Cables
  dcCableSpec?: string;
  acCableSpec?: string;
  batteryCableSpec?: string;
  
  // Main switchboard
  mainSwitchRating?: string;
  exportLimit?: number;
  busbarRating?: string;
  
  // Metering
  meterType?: string;
  meterCtRating?: string;
}

/**
 * Generate enhanced component specifications for labels
 */
export function getComponentSpecLabel(
  componentType: string,
  specs: EquipmentSpecs
): string[] {
  const labels: string[] = [];
  
  switch (componentType) {
    case 'SOLAR_STRING':
      // Prioritize: Model, Wattage, Electrical specs (only show top 3)
      if (specs.panelManufacturer && specs.panelModel) {
        labels.push(`${specs.panelManufacturer} ${specs.panelModel}`);
      }
      if (specs.panelWattage) {
        labels.push(`${specs.panelWattage}W per panel`);
      }
      if (specs.panelVoc && specs.panelIsc) {
        labels.push(`Voc: ${specs.panelVoc}V | Isc: ${specs.panelIsc}A`);
      }
      // CEC approval omitted to save space (shown in specs table)
      break;
      
    case 'DC_COMBINER':
      labels.push('DC Combiner Box');
      if (specs.dcCableSpec) {
        labels.push(specs.dcCableSpec);
      }
      break;
      
    case 'DC_ISOLATOR':
      labels.push('DC Isolator');
      if (specs.dcIsolatorRating) {
        labels.push(specs.dcIsolatorRating);
      }
      if (specs.dcIsolatorIpRating) {
        labels.push(`IP Rating: ${specs.dcIsolatorIpRating}`);
      }
      labels.push('AS/NZS 5033:2021');
      break;
      
    case 'HYBRID_INVERTER':
    case 'STRING_INVERTER':
      // Prioritize: Model, Rating, MPPT (only show top 3)
      if (specs.inverterManufacturer && specs.inverterModel) {
        labels.push(`${specs.inverterManufacturer} ${specs.inverterModel}`);
      }
      if (specs.inverterRating) {
        labels.push(`${specs.inverterRating}kW Rated`);
      }
      if (specs.inverterVoltageRange) {
        labels.push(`MPPT: ${specs.inverterVoltageRange}`);
      }
      // CEC and standards omitted to save space
      break;
      
    case 'BATTERY':
      // Prioritize: Model, Capacity (only show top 2-3)
      if (specs.batteryManufacturer && specs.batteryModel) {
        labels.push(`${specs.batteryManufacturer} ${specs.batteryModel}`);
      }
      if (specs.batteryCapacity && specs.batteryVoltage) {
        labels.push(`${specs.batteryCapacity}kWh @ ${specs.batteryVoltage}V`);
      }
      if (specs.batteryChemistry) {
        labels.push(specs.batteryChemistry);
      }
      // CEC omitted to save space
      break;
      
    case 'AC_ISOLATOR':
      labels.push('AC Isolator');
      if (specs.acIsolatorRating) {
        labels.push(specs.acIsolatorRating);
      }
      if (specs.acIsolatorIpRating) {
        labels.push(`IP Rating: ${specs.acIsolatorIpRating}`);
      }
      break;
      
    case 'AC_BREAKER':
      labels.push('AC Protection');
      if (specs.acMcbRating) {
        labels.push(`MCB: ${specs.acMcbRating}`);
      }
      if (specs.rcdType && specs.rcdRating) {
        labels.push(`RCD: ${specs.rcdRating} ${specs.rcdType}`);
      }
      break;
      
    case 'AC_METER':
      labels.push('AC Meter');
      if (specs.meterType) {
        labels.push(specs.meterType);
      }
      if (specs.meterCtRating) {
        labels.push(`CT: ${specs.meterCtRating}`);
      }
      labels.push('Bi-directional');
      break;
      
    case 'MAIN_SWITCHBOARD':
      labels.push('Main Switchboard');
      if (specs.mainSwitchRating) {
        labels.push(`Main Switch: ${specs.mainSwitchRating}`);
      }
      if (specs.exportLimit) {
        labels.push(`Export Limit: ${specs.exportLimit}kW`);
      }
      if (specs.busbarRating) {
        labels.push(`Busbar: ${specs.busbarRating}`);
      }
      break;
      
    case 'GRID_CONNECTION':
      labels.push('Grid Connection');
      labels.push('230V AC Single Phase');
      break;
  }
  
  return labels;
}

/**
 * Generate enhanced wire label with full specifications
 */
export function getWireSpecLabel(
  wireType: 'DC' | 'AC' | 'BATTERY_DC',
  specs: EquipmentSpecs
): string {
  switch (wireType) {
    case 'DC':
      return specs.dcCableSpec || '2C × 6mm² + 1 × 6mm² E Cu V-90 1000V DC (Conduit)';
    case 'AC':
      return specs.acCableSpec || '3C × 4mm² + E Cu TPS 230V AC';
    case 'BATTERY_DC':
      return specs.batteryCableSpec || '2C × 16mm² + E Cu 1000V DC';
    default:
      return '';
  }
}
