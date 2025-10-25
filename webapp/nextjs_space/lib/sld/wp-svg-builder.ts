/**
 * Western Power Compliant SVG Builder
 * Adds title block, footer, legend, and enhanced specs to existing SLD
 */

import { WesternPowerSldData } from './types';
import { generateFooterSVG } from './footer-engine';

export function buildWPCompliantSvg(
  baseSvg: string,
  data: Partial<WesternPowerSldData>
): string {
  // MINIMAL APPROACH: Just add footer below existing diagram
  
  // Extract the original viewBox
  const viewBoxMatch = baseSvg.match(/viewBox="([^"]+)"/);
  const originalViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 2970 2600';
  const [vbX, vbY, vbWidth, vbHeight] = originalViewBox.split(' ').map(Number);
  
  // Simple calculation: footer goes right after the diagram
  const footerY = vbHeight + 100; // 100 units padding after diagram
  const footerHeight = 480; // 8 rows × 60px
  
  // New viewBox to accommodate footer
  const newHeight = footerY + footerHeight + 50;
  const newViewBox = `0 0 ${vbWidth} ${newHeight}`;
  
  console.log('📊 Simple WP Enhancement:');
  console.log('  Original height:', vbHeight);
  console.log('  Footer Y:', footerY);
  console.log('  New height:', newHeight);
  console.log('  Base SVG length:', baseSvg.length);
  console.log('  Base has components:', baseSvg.includes('<g id="components">'));
  console.log('  Base component count:', (baseSvg.match(/<svg x="/g) || []).length);
  
  // Update viewBox and remove closing tag
  let enhancedSvg = baseSvg
    .replace(/viewBox="[^"]+"/,`viewBox="${newViewBox}"`)
    .replace('</svg>', '');
  
  console.log('  Enhanced SVG length:', enhancedSvg.length);
  console.log('  Enhanced has components:', enhancedSvg.includes('<g id="components">'));
  console.log('  Enhanced component count:', (enhancedSvg.match(/<svg x="/g) || []).length);
  
  // Generate ONLY the footer table
  const footer = generateFooterSVG(data, footerY);
  
  console.log('  Footer generated:', footer.length, 'chars');
  
  // Combine
  return `${enhancedSvg}

${footer}

</svg>`;
}

function generateTitleBlock(data: Partial<WesternPowerSldData>, y: number): string {
  const standards = data.compliance?.standards?.join(' | ') || 'AS/NZS 5033:2021 | AS/NZS 3000:2018';
  const jobNumber = data.project?.jobNumber || 'JOB-XXX';
  const systemSize = data.project?.systemSize || 0;
  const customerName = data.project?.customerName || 'Customer';
  
  return `
  <!-- Title Block -->
  <g id="wp-title-block">
    <rect x="100" y="${y}" width="2770" height="400" fill="#F5F5F5" stroke="#000" stroke-width="2"/>
    
    <!-- Main Title -->
    <text x="1485" y="${y + 130}" font-family="Arial" font-size="48" font-weight="bold" text-anchor="middle" fill="#000">
      SINGLE LINE DIAGRAM
    </text>
    
    <!-- Standards -->
    <text x="1485" y="${y + 190}" font-family="Arial" font-size="20" text-anchor="middle" fill="#666">
      ${standards}
    </text>
    
    <!-- Job Info -->
    <text x="150" y="${y + 290}" font-family="Arial" font-size="20" fill="#000">
      Job: ${jobNumber} | System: ${systemSize}kW | Customer: ${customerName}
    </text>
    
    <!-- WP Compliance Badge -->
    <rect x="2500" y="${y + 50}" width="250" height="80" fill="#4CAF50" stroke="#2E7D32" stroke-width="2" rx="5"/>
    <text x="2625" y="${y + 95}" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle" fill="#FFF">
      WP COMPLIANT
    </text>
  </g>`;
}

function generateEnhancedSpecs(data: Partial<WesternPowerSldData>, y: number): string {
  
  return `
  <!-- Enhanced Specifications Table -->
  <g id="wp-specs-table">
    <rect x="100" y="${y}" width="2770" height="1000" fill="#FFFFFF" stroke="#000" stroke-width="2"/>
    
    <!-- Column Headers -->
    <rect x="100" y="${y}" width="2770" height="50" fill="#E3F2FD"/>
    <line x1="1023" y1="${y}" x2="1023" y2="${y + 1000}" stroke="#000" stroke-width="1"/>
    <line x1="1946" y1="${y}" x2="1946" y2="${y + 1000}" stroke="#000" stroke-width="1"/>
    
    <text x="560" y="${y + 35}" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle">SOLAR PANELS & INVERTER</text>
    <text x="1485" y="${y + 35}" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle">CABLES & PROTECTION</text>
    <text x="2408" y="${y + 35}" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle">EARTHING & METERING</text>
    
    <!-- Column 1: Solar Panels & Inverter -->
    ${generateColumn1Specs(data, 150, y + 80)}
    
    <!-- Column 2: Cables & Protection -->
    ${generateColumn2Specs(data, 1073, y + 80)}
    
    <!-- Column 3: Earthing & Metering -->
    ${generateColumn3Specs(data, 1996, y + 80)}
  </g>`;
}

function generateColumn1Specs(data: Partial<WesternPowerSldData>, x: number, y: number): string {
  const panel = data.panels || {} as any;
  const inverter = data.inverter || {} as any;
  const strings = data.strings || [];
  
  return `
    <text x="${x}" y="${y}" font-family="Arial" font-size="20" font-weight="bold">SOLAR PANELS</text>
    <text x="${x}" y="${y + 80}" font-family="Arial" font-size="18">${panel.manufacturer || 'Panel Manufacturer'} ${panel.model || 'Model'}</text>
    <text x="${x}" y="${y + 110}" font-family="Arial" font-size="18">CEC: ${panel.cecApproval || 'CEC-XXXXX'}</text>
    <text x="${x}" y="${y + 140}" font-family="Arial" font-size="18">${panel.wattage || 400}W | Voc: ${panel.voc || 40}V | Isc: ${panel.isc || 11.5}A</text>
    <text x="${x}" y="${y + 170}" font-family="Arial" font-size="18">Config: ${strings.length} strings × ${strings[0]?.panelCount || 0} panels</text>
    
    <text x="${x}" y="${y + 250}" font-family="Arial" font-size="20" font-weight="bold">INVERTER</text>
    <text x="${x}" y="${y + 330}" font-family="Arial" font-size="18">${inverter.manufacturer || 'Inverter Manufacturer'} ${inverter.model || 'Model'}</text>
    <text x="${x}" y="${y + 360}" font-family="Arial" font-size="18">CEC: ${inverter.cecApproval || 'CEC-XXXXX'}</text>
    <text x="${x}" y="${y + 390}" font-family="Arial" font-size="18">${inverter.capacity || 0}kW | ${inverter.efficiency || 97.5}% | AS/NZS 4777.2</text>
    
    ${data.battery ? `
    <text x="${x}" y="${y + 470}" font-family="Arial" font-size="20" font-weight="bold">BATTERY</text>
    <text x="${x}" y="${y + 550}" font-family="Arial" font-size="18">${data.battery.manufacturer} ${data.battery.model}</text>
    <text x="${x}" y="${y + 580}" font-family="Arial" font-size="18">${data.battery.capacity}kWh ${data.battery.chemistry} | ${data.battery.voltage}V</text>
    <text x="${x}" y="${y + 610}" font-family="Arial" font-size="18">VPP: ${data.battery.vppEnrollment}</text>
    ` : ''}
  `;
}

function generateColumn2Specs(data: Partial<WesternPowerSldData>, x: number, y: number): string {
  const dcCables = data.dcCables || {} as any;
  const acCables = data.acCables || {} as any;
  const dcProtection = data.dcProtection || {} as any;
  const acProtection = data.acProtection || {} as any;
  
  return `
    <text x="${x}" y="${y}" font-family="Arial" font-size="20" font-weight="bold">DC CABLES</text>
    <text x="${x}" y="${y + 80}" font-family="Arial" font-size="18">${dcCables.size || '6mm²'} ${dcCables.material || 'Cu'} ${dcCables.insulation || 'V-90'}</text>
    <text x="${x}" y="${y + 110}" font-family="Arial" font-size="18">${dcCables.voltageRating || '1000V DC'} | ${dcCables.length || 20}m</text>
    <text x="${x}" y="${y + 140}" font-family="Arial" font-size="18">Install: ${dcCables.installMethod || 'Conduit'}</text>
    <text x="${x}" y="${y + 170}" font-family="Arial" font-size="18">DC Breaker: ${dcProtection.breakerRating || '32A'} ${dcProtection.voltageRating || '1000V DC'}</text>
    
    <text x="${x}" y="${y + 250}" font-family="Arial" font-size="20" font-weight="bold">AC CABLES</text>
    <text x="${x}" y="${y + 330}" font-family="Arial" font-size="18">${acCables.size || '6mm²'} ${acCables.material || 'Cu'} ${acCables.type || 'TPS'}</text>
    <text x="${x}" y="${y + 360}" font-family="Arial" font-size="18">${acCables.length || 15}m | ${acCables.installMethod || 'Conduit'}</text>
    <text x="${x}" y="${y + 390}" font-family="Arial" font-size="18">AC Breaker: ${acProtection.breakerRating || '40A'} ${acProtection.poles || 2}P</text>
    <text x="${x}" y="${y + 420}" font-family="Arial" font-size="18">RCD: ${acProtection.rcdType || 'Type B'} ${acProtection.rcdRating || '30mA'}</text>
    
    <text x="${x}" y="${y + 500}" font-family="Arial" font-size="20" font-weight="bold">ISOLATORS</text>
    <text x="${x}" y="${y + 580}" font-family="Arial" font-size="18">DC: ${data.isolators?.dc?.rating || '1000V, 32A'} ${data.isolators?.dc?.ipRating || 'IP65'}</text>
    <text x="${x}" y="${y + 610}" font-family="Arial" font-size="18">AC: ${data.isolators?.ac?.rating || '250V, 40A'} ${data.isolators?.ac?.ipRating || 'IP65'}</text>
  `;
}

function generateColumn3Specs(data: Partial<WesternPowerSldData>, x: number, y: number): string {
  const earthing = data.earthing || {} as any;
  const metering = data.metering || {} as any;
  const switchboard = data.mainSwitchboard || {} as any;
  const waSpecific = data.waSpecific || {} as any;
  
  return `
    <text x="${x}" y="${y}" font-family="Arial" font-size="20" font-weight="bold">EARTHING SYSTEM</text>
    <text x="${x}" y="${y + 80}" font-family="Arial" font-size="18">System: ${earthing.system || 'TN-S'}</text>
    <text x="${x}" y="${y + 110}" font-family="Arial" font-size="18">Electrode: ${earthing.electrodeType || 'Rod'}</text>
    <text x="${x}" y="${y + 140}" font-family="Arial" font-size="18">Location: ${earthing.electrodeLocation || 'Front yard'}</text>
    <text x="${x}" y="${y + 170}" font-family="Arial" font-size="18">Conductor: ${earthing.conductorSize || '6mm² Cu'}</text>
    
    <text x="${x}" y="${y + 250}" font-family="Arial" font-size="20" font-weight="bold">METERING</text>
    <text x="${x}" y="${y + 330}" font-family="Arial" font-size="18">Type: ${metering.type || 'Smart Meter'}</text>
    <text x="${x}" y="${y + 360}" font-family="Arial" font-size="18">Location: ${metering.location || 'External wall'}</text>
    <text x="${x}" y="${y + 390}" font-family="Arial" font-size="18">Bi-directional: ${metering.bidirectional ? 'Yes' : 'No'}</text>
    
    <text x="${x}" y="${y + 470}" font-family="Arial" font-size="20" font-weight="bold">MAIN SWITCHBOARD</text>
    <text x="${x}" y="${y + 550}" font-family="Arial" font-size="18">Main Switch: ${switchboard.mainSwitchRating || '63A'}</text>
    <text x="${x}" y="${y + 580}" font-family="Arial" font-size="18">Busbar: ${switchboard.busbarRating || '100A'}</text>
    <text x="${x}" y="${y + 610}" font-family="Arial" font-size="18">Export Limit: ${waSpecific.exportLimitKw || 5.0}kW</text>
    <text x="${x}" y="${y + 640}" font-family="Arial" font-size="18">Phase: ${waSpecific.phaseConfiguration || 'Single Phase'}</text>
  `;
}

function generateEarthingDiagram(data: Partial<WesternPowerSldData>, y: number): string {
  const x = 500;
  
  return `
  <!-- Earthing Diagram -->
  <g id="wp-earthing-diagram">
    <text x="${x}" y="${y - 50}" font-family="Arial" font-size="24" font-weight="bold">EARTHING SYSTEM</text>
    
    <!-- Vertical line -->
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 300}" stroke="#000" stroke-width="3"/>
    
    <!-- Earth symbol (three horizontal lines) -->
    <line x1="${x - 200}" y1="${y + 300}" x2="${x + 200}" y2="${y + 300}" stroke="#000" stroke-width="3"/>
    <line x1="${x - 150}" y1="${y + 350}" x2="${x + 150}" y2="${y + 350}" stroke="#000" stroke-width="3"/>
    <line x1="${x - 100}" y1="${y + 400}" x2="${x + 100}" y2="${y + 400}" stroke="#000" stroke-width="3"/>
    
    <!-- Labels -->
    <text x="${x + 250}" y="${y + 150}" font-family="Arial" font-size="20">${data.earthing?.conductorSize || '6mm² Cu'}</text>
    <text x="${x + 250}" y="${y + 300}" font-family="Arial" font-size="20">${data.earthing?.electrodeType || 'Rod'} Electrode</text>
    <text x="${x + 250}" y="${y + 350}" font-family="Arial" font-size="20">${data.earthing?.system || 'TN-S'} System</text>
    <text x="${x + 250}" y="${y + 400}" font-family="Arial" font-size="18" fill="#666">${data.earthing?.electrodeLocation || 'Front yard'}</text>
  </g>`;
}

function generateLegend(y: number): string {
  const x = 1500;
  
  return `
  <!-- Legend -->
  <g id="wp-legend">
    <text x="${x}" y="${y - 50}" font-family="Arial" font-size="24" font-weight="bold">LEGEND</text>
    
    <!-- DC Wiring -->
    <line x1="${x + 100}" y1="${y + 50}" x2="${x + 300}" y2="${y + 50}" stroke="#FF0000" stroke-width="4"/>
    <text x="${x + 320}" y="${y + 60}" font-family="Arial" font-size="20">DC Wiring (Red)</text>
    
    <!-- AC Wiring -->
    <line x1="${x + 100}" y1="${y + 120}" x2="${x + 300}" y2="${y + 120}" stroke="#8B4513" stroke-width="4"/>
    <text x="${x + 320}" y="${y + 130}" font-family="Arial" font-size="20">AC Wiring (Brown)</text>
    
    <!-- Symbols -->
    <text x="${x + 100}" y="${y + 200}" font-family="Arial" font-size="20">⏚ = Earth Connection</text>
    <text x="${x + 100}" y="${y + 240}" font-family="Arial" font-size="20">MCB = Miniature Circuit Breaker</text>
    <text x="${x + 100}" y="${y + 280}" font-family="Arial" font-size="20">RCD = Residual Current Device</text>
    <text x="${x + 100}" y="${y + 320}" font-family="Arial" font-size="20">MSB = Main Switchboard</text>
  </g>`;
}

function generateFooter(data: Partial<WesternPowerSldData>, y: number): string {
  const company = data.company || {} as any;
  const designer = data.designer || {} as any;
  const project = data.project || {} as any;
  const docControl = data.documentControl || {} as any;
  
  const rowHeight = 60;
  const col1Width = 923;
  const col2Width = 923;
  const col3Width = 924;
  
  return `
  <!-- Footer Table -->
  <g id="wp-footer">
    <!-- Outer border -->
    <rect x="100" y="${y}" width="2770" height="${rowHeight * 8}" fill="#FFFFFF" stroke="#000" stroke-width="3"/>
    
    <!-- Header row -->
    <rect x="100" y="${y}" width="2770" height="${rowHeight}" fill="#E3F2FD" stroke="#000" stroke-width="2"/>
    <line x1="1023" y1="${y}" x2="1023" y2="${y + rowHeight * 8}" stroke="#000" stroke-width="2"/>
    <line x1="1946" y1="${y}" x2="1946" y2="${y + rowHeight * 8}" stroke="#000" stroke-width="2"/>
    
    <text x="561" y="${y + 38}" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">PROJECT DETAILS</text>
    <text x="1485" y="${y + 38}" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">DESIGNED & APPROVED BY</text>
    <text x="2408" y="${y + 38}" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">COMPANY DETAILS</text>
    
    <!-- Row 1 -->
    <line x1="100" y1="${y + rowHeight}" x2="2870" y2="${y + rowHeight}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight + 35}" font-family="Arial" font-size="16">Customer: ${project.customerName || 'Customer Name'}</text>
    <text x="1043" y="${y + rowHeight + 35}" font-family="Arial" font-size="16">Designer: ${designer.name || 'Designer Name'}</text>
    <text x="1966" y="${y + rowHeight + 35}" font-family="Arial" font-size="16">${company.name || 'Sun Direct Power'}</text>
    
    <!-- Row 2 -->
    <line x1="100" y1="${y + rowHeight * 2}" x2="2870" y2="${y + rowHeight * 2}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 2 + 35}" font-family="Arial" font-size="16">Address: ${(project.installationAddress || 'Installation Address').substring(0, 40)}</text>
    <text x="1043" y="${y + rowHeight * 2 + 35}" font-family="Arial" font-size="16">CEC: ${designer.cecAccreditation || 'CEC-XXXXX'}</text>
    <text x="1966" y="${y + rowHeight * 2 + 35}" font-family="Arial" font-size="16">ABN: ${company.abn || 'XX XXX XXX XXX'}</text>
    
    <!-- Row 3 -->
    <line x1="100" y1="${y + rowHeight * 3}" x2="2870" y2="${y + rowHeight * 3}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 3 + 35}" font-family="Arial" font-size="16">Job: ${project.jobNumber || 'JOB-XXX'} | System: ${project.systemSize || 0}kW</text>
    <text x="1043" y="${y + rowHeight * 3 + 35}" font-family="Arial" font-size="16">License: ${designer.electricalLicense || company.electricalLicense || 'EC-XXXXX'}</text>
    <text x="1966" y="${y + rowHeight * 3 + 35}" font-family="Arial" font-size="16">Lic: ${company.electricalLicense || 'EC-XXXXX'}</text>
    
    <!-- Row 4 -->
    <line x1="100" y1="${y + rowHeight * 4}" x2="2870" y2="${y + rowHeight * 4}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 4 + 35}" font-family="Arial" font-size="16">Drawing: ${docControl.drawingNumber || 'SLD-XXX'} Rev ${docControl.revision || 'A'}</text>
    <text x="1043" y="${y + rowHeight * 4 + 35}" font-family="Arial" font-size="16">Signature: _______________</text>
    <text x="1966" y="${y + rowHeight * 4 + 35}" font-family="Arial" font-size="16">CEC: ${company.cecAccreditation || 'CEC-XXXXX'}</text>
    
    <!-- Row 5 -->
    <line x1="100" y1="${y + rowHeight * 5}" x2="2870" y2="${y + rowHeight * 5}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 5 + 35}" font-family="Arial" font-size="16">Date: ${docControl.dateDesigned ? new Date(docControl.dateDesigned).toLocaleDateString('en-AU') : new Date().toLocaleDateString('en-AU')}</text>
    <text x="1043" y="${y + rowHeight * 5 + 35}" font-family="Arial" font-size="16">Date: _______________</text>
    <text x="1966" y="${y + rowHeight * 5 + 35}" font-family="Arial" font-size="16">Phone: ${company.phone || '1300 XXX XXX'}</text>
    
    <!-- Row 6 - WP Approval -->
    <line x1="100" y1="${y + rowHeight * 6}" x2="2870" y2="${y + rowHeight * 6}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 6 + 35}" font-family="Arial" font-size="16">Standards: AS/NZS 5033:2021</text>
    <rect x="1043" y="${y + rowHeight * 6}" width="${col2Width}" height="${rowHeight * 2}" fill="#FFF9C4" stroke="#000" stroke-width="1"/>
    <text x="1485" y="${y + rowHeight * 6 + 30}" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle">WESTERN POWER APPROVAL</text>
    <text x="1485" y="${y + rowHeight * 6 + 70}" font-family="Arial" font-size="16" text-anchor="middle">Stamp: _______________</text>
    <text x="1966" y="${y + rowHeight * 6 + 35}" font-family="Arial" font-size="16">Email: ${company.email || 'info@sundirectpower.com.au'}</text>
    
    <!-- Row 7 -->
    <line x1="100" y1="${y + rowHeight * 7}" x2="1023" y2="${y + rowHeight * 7}" stroke="#000" stroke-width="1"/>
    <line x1="1946" y1="${y + rowHeight * 7}" x2="2870" y2="${y + rowHeight * 7}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 7 + 35}" font-family="Arial" font-size="16">AS/NZS 3000:2018 | AS/NZS 4777.2:2020</text>
    <text x="1485" y="${y + rowHeight * 7 + 35}" font-family="Arial" font-size="16" text-anchor="middle">Date: _______________</text>
    <text x="1966" y="${y + rowHeight * 7 + 35}" font-family="Arial" font-size="16">www.sundirectpower.com.au</text>
  </g>`;
}
