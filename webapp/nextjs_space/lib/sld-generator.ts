// Single Line Diagram (SLD) Generator
// Generates electrical single line diagrams for solar installations

export interface SLDData {
  // System Info
  systemSize: number;
  panelCount: number;
  panelWattage: number;
  panelVoltage: number;
  panelCurrent: number;
  
  // Inverter Info
  inverterModel: string;
  inverterCapacity: number;
  inverterPhases: number;
  inverterVoltage: number;
  
  // Battery Info (optional)
  hasBattery: boolean;
  batteryModel?: string;
  batteryCapacity?: number;
  batteryVoltage?: number;
  
  // String Configuration
  stringsCount: number;
  panelsPerString: number;
  
  // Protection
  dcIsolator: boolean;
  acIsolator: boolean;
  surgeProtection: boolean;
  earthing: boolean;
  
  // Cable Specifications
  dcCableSize: number;
  dcCableLength: number;
  acCableSize: number;
  acCableLength: number;
  
  // Grid Connection
  gridVoltage: number;
  exportLimit?: number;
  
  // Site Info
  customerName: string;
  address: string;
  installationDate: string;
}

export interface SLDCalculations {
  // DC Side
  stringVoltage: number;
  stringCurrent: number;
  totalDCVoltage: number;
  totalDCCurrent: number;
  totalDCPower: number;
  
  // AC Side
  acCurrent: number;
  acPower: number;
  
  // Voltage Rise
  voltageRise: number;
  voltageRisePercent: number;
  isVoltageRiseCompliant: boolean;
  
  // Cable Sizing
  isDCCableSizeAdequate: boolean;
  isACCableSizeAdequate: boolean;
  
  // Recommendations
  recommendations: string[];
}

export function calculateSLDParameters(data: SLDData): SLDCalculations {
  // DC Side Calculations
  const stringVoltage = data.panelVoltage * data.panelsPerString;
  const stringCurrent = data.panelCurrent;
  const totalDCVoltage = stringVoltage; // Strings in parallel
  const totalDCCurrent = stringCurrent * data.stringsCount;
  const totalDCPower = data.systemSize * 1000; // kW to W
  
  // AC Side Calculations
  const acPower = data.inverterCapacity * 1000; // kW to W
  const acCurrent = acPower / (data.inverterVoltage * (data.inverterPhases === 3 ? Math.sqrt(3) : 1));
  
  // Voltage Rise Calculation (simplified AS/NZS 5033)
  const dcResistance = (0.0175 * data.dcCableLength) / data.dcCableSize;
  const dcVoltageRise = totalDCCurrent * dcResistance * 2; // 2 for return path
  const voltageRise = dcVoltageRise;
  const voltageRisePercent = (voltageRise / totalDCVoltage) * 100;
  const isVoltageRiseCompliant = voltageRisePercent <= 3; // AS/NZS 5033 limit for DC
  
  // Cable Sizing Check (simplified)
  const minDCCableSize = (totalDCCurrent * 1.25 * data.dcCableLength) / 7; // Simplified
  const minACCableSize = (acCurrent * 1.25 * data.acCableLength) / 7;
  const isDCCableSizeAdequate = data.dcCableSize >= minDCCableSize;
  const isACCableSizeAdequate = data.acCableSize >= minACCableSize;
  
  // Recommendations
  const recommendations: string[] = [];
  
  if (!isVoltageRiseCompliant) {
    recommendations.push(`Voltage rise ${voltageRisePercent.toFixed(2)}% exceeds 3% limit. Increase DC cable size or reduce cable length.`);
  }
  
  if (!isDCCableSizeAdequate) {
    recommendations.push(`DC cable size should be at least ${minDCCableSize.toFixed(1)}mm². Current: ${data.dcCableSize}mm²`);
  }
  
  if (!isACCableSizeAdequate) {
    recommendations.push(`AC cable size should be at least ${minACCableSize.toFixed(1)}mm². Current: ${data.acCableSize}mm²`);
  }
  
  if (data.systemSize > data.inverterCapacity * 1.33) {
    recommendations.push(`System oversized by ${((data.systemSize / data.inverterCapacity - 1) * 100).toFixed(0)}%. Consider larger inverter.`);
  }
  
  if (!data.surgeProtection) {
    recommendations.push('Surge protection recommended for lightning protection.');
  }
  
  return {
    stringVoltage,
    stringCurrent,
    totalDCVoltage,
    totalDCCurrent,
    totalDCPower,
    acCurrent,
    acPower,
    voltageRise,
    voltageRisePercent,
    isVoltageRiseCompliant,
    isDCCableSizeAdequate,
    isACCableSizeAdequate,
    recommendations,
  };
}

export function generateSLDSVG(data: SLDData, calculations: SLDCalculations): string {
  // Generate SVG Single Line Diagram
  // This is a simplified version - in production, use a proper SVG library
  
  const width = 800;
  const height = 1000;
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Title Block -->
      <rect x="10" y="10" width="${width - 20}" height="100" fill="#f0f0f0" stroke="#000" stroke-width="2"/>
      <text x="20" y="35" font-size="20" font-weight="bold">SINGLE LINE DIAGRAM</text>
      <text x="20" y="55" font-size="14">${data.customerName}</text>
      <text x="20" y="75" font-size="12">${data.address}</text>
      <text x="20" y="95" font-size="12">Date: ${data.installationDate}</text>
      
      <!-- Solar Array -->
      <g id="solar-array">
        <rect x="50" y="150" width="200" height="100" fill="#fff" stroke="#000" stroke-width="2"/>
        <text x="150" y="180" text-anchor="middle" font-size="14" font-weight="bold">SOLAR ARRAY</text>
        <text x="150" y="200" text-anchor="middle" font-size="12">${data.panelCount} × ${data.panelWattage}W Panels</text>
        <text x="150" y="220" text-anchor="middle" font-size="12">${data.systemSize}kW Total</text>
        <text x="150" y="235" text-anchor="middle" font-size="10">${data.stringsCount} strings × ${data.panelsPerString} panels</text>
      </g>
      
      <!-- DC Cable -->
      <line x1="150" y1="250" x2="150" y2="300" stroke="#000" stroke-width="3"/>
      <text x="160" y="275" font-size="10">${data.dcCableSize}mm² × ${data.dcCableLength}m</text>
      
      <!-- DC Isolator -->
      ${data.dcIsolator ? `
      <g id="dc-isolator">
        <rect x="120" y="300" width="60" height="40" fill="#fff" stroke="#000" stroke-width="2"/>
        <text x="150" y="325" text-anchor="middle" font-size="10" font-weight="bold">DC ISO</text>
      </g>
      <line x1="150" y1="340" x2="150" y2="380" stroke="#000" stroke-width="3"/>
      ` : ''}
      
      <!-- Inverter -->
      <g id="inverter">
        <rect x="50" y="400" width="200" height="100" fill="#fff" stroke="#000" stroke-width="2"/>
        <text x="150" y="430" text-anchor="middle" font-size="14" font-weight="bold">INVERTER</text>
        <text x="150" y="450" text-anchor="middle" font-size="12">${data.inverterModel}</text>
        <text x="150" y="470" text-anchor="middle" font-size="12">${data.inverterCapacity}kW</text>
        <text x="150" y="485" text-anchor="middle" font-size="10">${data.inverterPhases} Phase</text>
      </g>
      
      <!-- Battery (if applicable) -->
      ${data.hasBattery ? `
      <g id="battery">
        <line x1="250" y1="450" x2="350" y2="450" stroke="#000" stroke-width="2"/>
        <rect x="350" y="400" width="150" height="100" fill="#fff" stroke="#000" stroke-width="2"/>
        <text x="425" y="430" text-anchor="middle" font-size="14" font-weight="bold">BATTERY</text>
        <text x="425" y="450" text-anchor="middle" font-size="12">${data.batteryModel}</text>
        <text x="425" y="470" text-anchor="middle" font-size="12">${data.batteryCapacity}kWh</text>
      </g>
      ` : ''}
      
      <!-- AC Cable -->
      <line x1="150" y1="500" x2="150" y2="550" stroke="#000" stroke-width="3"/>
      <text x="160" y="525" font-size="10">${data.acCableSize}mm² × ${data.acCableLength}m</text>
      
      <!-- AC Isolator -->
      ${data.acIsolator ? `
      <g id="ac-isolator">
        <rect x="120" y="550" width="60" height="40" fill="#fff" stroke="#000" stroke-width="2"/>
        <text x="150" y="575" text-anchor="middle" font-size="10" font-weight="bold">AC ISO</text>
      </g>
      <line x1="150" y1="590" x2="150" y2="630" stroke="#000" stroke-width="3"/>
      ` : ''}
      
      <!-- Meter/Grid Connection -->
      <g id="meter">
        <rect x="50" y="650" width="200" height="80" fill="#fff" stroke="#000" stroke-width="2"/>
        <text x="150" y="680" text-anchor="middle" font-size="14" font-weight="bold">METER</text>
        <text x="150" y="700" text-anchor="middle" font-size="12">Grid Connection</text>
        <text x="150" y="720" text-anchor="middle" font-size="10">${data.gridVoltage}V ${data.inverterPhases} Phase</text>
      </g>
      
      <!-- Protection Symbols -->
      ${data.surgeProtection ? `
      <g id="surge-protection">
        <circle cx="300" cy="450" r="20" fill="#fff" stroke="#000" stroke-width="2"/>
        <text x="300" y="455" text-anchor="middle" font-size="10">SPD</text>
      </g>
      ` : ''}
      
      ${data.earthing ? `
      <g id="earthing">
        <line x1="150" y1="730" x2="150" y2="760" stroke="#000" stroke-width="2"/>
        <line x1="130" y1="760" x2="170" y2="760" stroke="#000" stroke-width="2"/>
        <line x1="140" y1="770" x2="160" y2="770" stroke="#000" stroke-width="2"/>
        <line x1="145" y1="780" x2="155" y2="780" stroke="#000" stroke-width="2"/>
        <text x="180" y="765" font-size="10">Earth</text>
      </g>
      ` : ''}
      
      <!-- Calculations Box -->
      <rect x="500" y="150" width="280" height="400" fill="#f9f9f9" stroke="#000" stroke-width="2"/>
      <text x="640" y="180" text-anchor="middle" font-size="14" font-weight="bold">CALCULATIONS</text>
      
      <text x="520" y="210" font-size="11" font-weight="bold">DC Side:</text>
      <text x="520" y="230" font-size="10">String Voltage: ${calculations.stringVoltage.toFixed(1)}V</text>
      <text x="520" y="245" font-size="10">String Current: ${calculations.stringCurrent.toFixed(1)}A</text>
      <text x="520" y="260" font-size="10">Total DC Current: ${calculations.totalDCCurrent.toFixed(1)}A</text>
      <text x="520" y="275" font-size="10">Total DC Power: ${(calculations.totalDCPower / 1000).toFixed(2)}kW</text>
      
      <text x="520" y="305" font-size="11" font-weight="bold">AC Side:</text>
      <text x="520" y="325" font-size="10">AC Current: ${calculations.acCurrent.toFixed(1)}A</text>
      <text x="520" y="340" font-size="10">AC Power: ${(calculations.acPower / 1000).toFixed(2)}kW</text>
      
      <text x="520" y="370" font-size="11" font-weight="bold">Voltage Rise:</text>
      <text x="520" y="390" font-size="10">DC Voltage Rise: ${calculations.voltageRise.toFixed(2)}V</text>
      <text x="520" y="405" font-size="10">Percentage: ${calculations.voltageRisePercent.toFixed(2)}%</text>
      <text x="520" y="420" font-size="10" fill="${calculations.isVoltageRiseCompliant ? 'green' : 'red'}">
        ${calculations.isVoltageRiseCompliant ? '✓ Compliant' : '✗ Non-Compliant'}
      </text>
      
      <text x="520" y="450" font-size="11" font-weight="bold">Cable Sizing:</text>
      <text x="520" y="470" font-size="10">DC Cable: ${data.dcCableSize}mm² ${calculations.isDCCableSizeAdequate ? '✓' : '✗'}</text>
      <text x="520" y="485" font-size="10">AC Cable: ${data.acCableSize}mm² ${calculations.isACCableSizeAdequate ? '✓' : '✗'}</text>
      
      <!-- Standards Compliance -->
      <rect x="500" y="570" width="280" height="150" fill="#e8f4f8" stroke="#000" stroke-width="2"/>
      <text x="640" y="600" text-anchor="middle" font-size="14" font-weight="bold">COMPLIANCE</text>
      <text x="520" y="625" font-size="10">AS/NZS 5033:2021</text>
      <text x="520" y="640" font-size="10">AS/NZS 4777.2:2020</text>
      <text x="520" y="655" font-size="10">AS/NZS 3000:2018</text>
      <text x="520" y="680" font-size="9">CEC Accredited Installation</text>
      <text x="520" y="695" font-size="9">Date: ${data.installationDate}</text>
      
      <!-- Footer -->
      <text x="400" y="980" text-anchor="middle" font-size="10" fill="#666">
        Generated by Sun Direct Power - Solar Installation Management System
      </text>
    </svg>
  `;
}

export function generateSLDReport(data: SLDData): string {
  const calculations = calculateSLDParameters(data);
  
  return `
# SINGLE LINE DIAGRAM REPORT

## Installation Details
- **Customer:** ${data.customerName}
- **Address:** ${data.address}
- **Installation Date:** ${data.installationDate}

## System Specifications

### Solar Array
- **System Size:** ${data.systemSize}kW
- **Panel Count:** ${data.panelCount} panels
- **Panel Wattage:** ${data.panelWattage}W each
- **Configuration:** ${data.stringsCount} strings × ${data.panelsPerString} panels
- **Panel Voltage:** ${data.panelVoltage}V
- **Panel Current:** ${data.panelCurrent}A

### Inverter
- **Model:** ${data.inverterModel}
- **Capacity:** ${data.inverterCapacity}kW
- **Phases:** ${data.inverterPhases}
- **Voltage:** ${data.inverterVoltage}V

${data.hasBattery ? `
### Battery Storage
- **Model:** ${data.batteryModel}
- **Capacity:** ${data.batteryCapacity}kWh
- **Voltage:** ${data.batteryVoltage}V
` : ''}

## Electrical Calculations

### DC Side
- **String Voltage:** ${calculations.stringVoltage.toFixed(1)}V
- **String Current:** ${calculations.stringCurrent.toFixed(1)}A
- **Total DC Voltage:** ${calculations.totalDCVoltage.toFixed(1)}V
- **Total DC Current:** ${calculations.totalDCCurrent.toFixed(1)}A
- **Total DC Power:** ${(calculations.totalDCPower / 1000).toFixed(2)}kW

### AC Side
- **AC Current:** ${calculations.acCurrent.toFixed(1)}A
- **AC Power:** ${(calculations.acPower / 1000).toFixed(2)}kW

### Voltage Rise Analysis
- **DC Voltage Rise:** ${calculations.voltageRise.toFixed(2)}V
- **Percentage:** ${calculations.voltageRisePercent.toFixed(2)}%
- **Compliance:** ${calculations.isVoltageRiseCompliant ? '✓ PASS' : '✗ FAIL'} (AS/NZS 5033 limit: 3%)

### Cable Specifications
- **DC Cable:** ${data.dcCableSize}mm² × ${data.dcCableLength}m ${calculations.isDCCableSizeAdequate ? '✓' : '✗'}
- **AC Cable:** ${data.acCableSize}mm² × ${data.acCableLength}m ${calculations.isACCableSizeAdequate ? '✓' : '✗'}

## Protection Equipment
- **DC Isolator:** ${data.dcIsolator ? '✓ Installed' : '✗ Not Installed'}
- **AC Isolator:** ${data.acIsolator ? '✓ Installed' : '✗ Not Installed'}
- **Surge Protection:** ${data.surgeProtection ? '✓ Installed' : '✗ Not Installed'}
- **Earthing:** ${data.earthing ? '✓ Installed' : '✗ Not Installed'}

## Grid Connection
- **Grid Voltage:** ${data.gridVoltage}V
- **Export Limit:** ${data.exportLimit ? data.exportLimit + 'kW' : 'No limit'}

${calculations.recommendations.length > 0 ? `
## Recommendations
${calculations.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
` : ''}

## Compliance Standards
- AS/NZS 5033:2021 - Installation of photovoltaic (PV) arrays
- AS/NZS 4777.2:2020 - Grid connection of energy systems via inverters
- AS/NZS 3000:2018 - Electrical installations (Wiring Rules)

---
*Generated by Sun Direct Power - Solar Installation Management System*
*Date: ${new Date().toLocaleDateString('en-AU')}*
  `;
}
