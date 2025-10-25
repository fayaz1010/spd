/**
 * Specifications Table Add-on
 * Generates the system specifications table for WP compliance
 */

export interface SystemSpecs {
  // Modules
  panelManufacturer?: string;
  panelModel?: string;
  panelWattage?: number;
  panelVoc?: number;
  panelIsc?: number;
  stringsCount?: number;
  panelsPerString?: number;
  
  // Inverter
  inverterManufacturer?: string;
  inverterModel?: string;
  inverterRating?: number;
  
  // Battery
  batteryManufacturer?: string;
  batteryModel?: string;
  batteryCapacity?: number;
  batteryVoltage?: number;
  
  // Project
  meterIdentifier?: string;
  systemSize?: number;
  annualOutput?: number;
  postcode?: string;
  
  // Version Control
  designedBy?: string;
  designDate?: string;
  versionNumber?: string;
  projectId?: string;
}

export function generateSpecsTable(specs: SystemSpecs, y: number): string {
  const tableWidth = 2770;
  const tableX = 100;
  const rowHeight = 50;
  
  // Calculate sections
  const leftColWidth = tableWidth * 0.75; // 75% for specs
  const rightColWidth = tableWidth * 0.25; // 25% for project details
  
  let currentY = y;
  
  return `  <!-- System Specifications Table -->
  <g id="specs-table">
    <!-- Outer border -->
    <rect x="${tableX}" y="${y}" width="${tableWidth}" height="400" fill="#FFFFFF" stroke="#000" stroke-width="2"/>
    
    <!-- Header -->
    <rect x="${tableX}" y="${y}" width="${tableWidth}" height="40" fill="#E3F2FD"/>
    <text x="${tableX + 20}" y="${y + 28}" font-family="Arial" font-size="22" font-weight="bold">System Specifications</text>
    
    <!-- Vertical divider between left and right sections -->
    <line x1="${tableX + leftColWidth}" y1="${y}" x2="${tableX + leftColWidth}" y2="${y + 400}" stroke="#000" stroke-width="2"/>
    
    <!-- LEFT SECTION: Technical Specs -->
    
    <!-- Modules and Strings -->
    <text x="${tableX + 20}" y="${y + 70}" font-family="Arial" font-size="18" font-weight="bold">Modules and Strings</text>
    <text x="${tableX + 20}" y="${y + 95}" font-family="Arial" font-size="14">
      ${specs.stringsCount || 2} x Strings: ${specs.panelManufacturer || 'Manufacturer'} ${specs.panelModel || 'Model'} ${specs.panelWattage || 0}W
    </text>
    <text x="${tableX + 20}" y="${y + 115}" font-family="Arial" font-size="14">
      ${specs.panelsPerString || 0} x ${specs.panelWattage || 0}W = ${(specs.panelsPerString || 0) * (specs.panelWattage || 0)}W per string
    </text>
    <text x="${tableX + 20}" y="${y + 135}" font-family="Arial" font-size="14">
      Voc: ${specs.panelVoc || 0}V | Isc: ${specs.panelIsc || 0}A
    </text>
    
    <line x1="${tableX}" y1="${y + 150}" x2="${tableX + leftColWidth}" y2="${y + 150}" stroke="#CCC" stroke-width="1"/>
    
    <!-- Inverters -->
    <text x="${tableX + 20}" y="${y + 175}" font-family="Arial" font-size="18" font-weight="bold">Inverters</text>
    <text x="${tableX + 20}" y="${y + 200}" font-family="Arial" font-size="14">
      Manufacturer: ${specs.inverterManufacturer || 'Manufacturer'}
    </text>
    <text x="${tableX + 20}" y="${y + 220}" font-family="Arial" font-size="14">
      Model: ${specs.inverterModel || 'Model'} | Rating: ${specs.inverterRating || 0}kW
    </text>
    
    <line x1="${tableX}" y1="${y + 240}" x2="${tableX + leftColWidth}" y2="${y + 240}" stroke="#CCC" stroke-width="1"/>
    
    <!-- Battery Storage -->
    ${specs.batteryCapacity ? `
    <text x="${tableX + 20}" y="${y + 265}" font-family="Arial" font-size="18" font-weight="bold">Battery Storage (ESS)</text>
    <text x="${tableX + 20}" y="${y + 290}" font-family="Arial" font-size="14">
      ${specs.batteryManufacturer || 'Manufacturer'} ${specs.batteryModel || 'Model'}
    </text>
    <text x="${tableX + 20}" y="${y + 310}" font-family="Arial" font-size="14">
      Capacity: ${specs.batteryCapacity || 0}kWh | Voltage: ${specs.batteryVoltage || 0}V
    </text>
    ` : `
    <text x="${tableX + 20}" y="${y + 265}" font-family="Arial" font-size="18" font-weight="bold">Battery Storage (ESS)</text>
    <text x="${tableX + 20}" y="${y + 290}" font-family="Arial" font-size="14">No battery system</text>
    `}
    
    <line x1="${tableX}" y1="${y + 330}" x2="${tableX + leftColWidth}" y2="${y + 330}" stroke="#CCC" stroke-width="1"/>
    
    <!-- Notes -->
    <text x="${tableX + 20}" y="${y + 355}" font-family="Arial" font-size="16" font-weight="bold">Notes:</text>
    <text x="${tableX + 20}" y="${y + 380}" font-family="Arial" font-size="12" fill="#666">All equipment complies with AS/NZS standards</text>
    
    <!-- RIGHT SECTION: Project Details & Version Control -->
    
    <!-- Project Details -->
    <rect x="${tableX + leftColWidth}" y="${y + 40}" width="${rightColWidth}" height="160" fill="#F9F9F9"/>
    <text x="${tableX + leftColWidth + 15}" y="${y + 65}" font-family="Arial" font-size="16" font-weight="bold">Project Details</text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 90}" font-family="Arial" font-size="12">
      Meter Identifier: ${specs.meterIdentifier || '(NOT SPECIFIED)'}
    </text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 110}" font-family="Arial" font-size="12">
      Postcode: ${specs.postcode || '0000'}
    </text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 135}" font-family="Arial" font-size="12">
      System Size: ${specs.systemSize || 0}kW
    </text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 155}" font-family="Arial" font-size="12">
      Annual Output: ${specs.annualOutput || 0}kWh
    </text>
    
    <line x1="${tableX + leftColWidth}" y1="${y + 200}" x2="${tableX + tableWidth}" y2="${y + 200}" stroke="#000" stroke-width="1"/>
    
    <!-- Version Control -->
    <rect x="${tableX + leftColWidth}" y="${y + 200}" width="${rightColWidth}" height="200" fill="#FFF9E6"/>
    <text x="${tableX + leftColWidth + 15}" y="${y + 225}" font-family="Arial" font-size="16" font-weight="bold">Version Control:</text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 250}" font-family="Arial" font-size="11">
      Design Completed By:
    </text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 265}" font-family="Arial" font-size="11" font-weight="bold">
      ${specs.designedBy || 'designer@company.com'}
    </text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 290}" font-family="Arial" font-size="11">
      Date: ${specs.designDate || new Date().toLocaleDateString('en-AU')}
    </text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 315}" font-family="Arial" font-size="11">
      Version Number: ${specs.versionNumber || 'Version 1.0'}
    </text>
    <text x="${tableX + leftColWidth + 15}" y="${y + 340}" font-family="Arial" font-size="11">
      Project ID: ${specs.projectId || 'PROJ-XXX'}
    </text>
  </g>`;
}
