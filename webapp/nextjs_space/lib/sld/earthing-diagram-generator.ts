/**
 * Earthing Diagram Generator
 * Generates compliant earthing system diagram for WP approval
 */

export interface EarthingSystemData {
  electrodeType?: string; // 'Rod', 'Plate', 'Grid'
  electrodeLocation?: string;
  earthConductorSize?: string; // e.g., '6mm² Cu'
  menLinkPresent?: boolean;
  bondingConductorSize?: string;
}

export function generateEarthingDiagram(
  data: EarthingSystemData,
  x: number,
  y: number,
  width: number = 600,
  height: number = 400
): string {
  const electrodeType = data.electrodeType || 'Rod';
  const earthSize = data.earthConductorSize || '6mm² Cu';
  const bondingSize = data.bondingConductorSize || '6mm² Cu';
  
  return `  <!-- Earthing System Diagram -->
  <g id="earthing-diagram">
    <!-- Border -->
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#FFFFFF" stroke="#000" stroke-width="2"/>
    
    <!-- Title -->
    <rect x="${x}" y="${y}" width="${width}" height="40" fill="#E8F5E9"/>
    <text x="${x + width/2}" y="${y + 28}" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle">EARTHING SYSTEM</text>
    
    <!-- Main Switchboard with MEN Link -->
    <rect x="${x + 50}" y="${y + 80}" width="120" height="80" fill="#FFF" stroke="#000" stroke-width="2"/>
    <text x="${x + 110}" y="${y + 110}" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle">Main</text>
    <text x="${x + 110}" y="${y + 130}" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle">Switchboard</text>
    
    ${data.menLinkPresent !== false ? `
    <!-- MEN Link -->
    <line x1="${x + 110}" y1="${y + 160}" x2="${x + 110}" y2="${y + 200}" stroke="#00C853" stroke-width="3"/>
    <text x="${x + 130}" y="${y + 180}" font-family="Arial" font-size="12" font-weight="bold" fill="#00C853">MEN Link</text>
    ` : ''}
    
    <!-- Earth Conductor to Electrode -->
    <line x1="${x + 110}" y1="${y + 200}" x2="${x + 110}" y2="${y + 280}" stroke="#00C853" stroke-width="3"/>
    <text x="${x + 130}" y="${y + 240}" font-family="Arial" font-size="11">${earthSize}</text>
    
    <!-- Earth Electrode Symbol -->
    <g transform="translate(${x + 110}, ${y + 280})">
      <!-- Earth symbol (⏚) -->
      <line x1="-30" y1="0" x2="30" y2="0" stroke="#00C853" stroke-width="3"/>
      <line x1="-20" y1="10" x2="20" y2="10" stroke="#00C853" stroke-width="3"/>
      <line x1="-10" y1="20" x2="10" y2="20" stroke="#00C853" stroke-width="3"/>
    </g>
    
    <text x="${x + 110}" y="${y + 320}" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle">${electrodeType} Electrode</text>
    ${data.electrodeLocation ? `<text x="${x + 110}" y="${y + 335}" font-family="Arial" font-size="10" text-anchor="middle">${data.electrodeLocation}</text>` : ''}
    
    <!-- Solar Array Bonding -->
    <rect x="${x + 300}" y="${y + 80}" width="100" height="60" fill="#FFF" stroke="#000" stroke-width="2"/>
    <text x="${x + 350}" y="${y + 105}" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle">Solar Array</text>
    <text x="${x + 350}" y="${y + 125}" font-family="Arial" font-size="11" text-anchor="middle">Frame</text>
    
    <!-- Bonding conductor -->
    <line x1="${x + 300}" y1="${y + 110}" x2="${x + 170}" y2="${y + 110}" stroke="#00C853" stroke-width="2" stroke-dasharray="5,3"/>
    <line x1="${x + 170}" y1="${y + 110}" x2="${x + 170}" y2="${y + 160}" stroke="#00C853" stroke-width="2" stroke-dasharray="5,3"/>
    <text x="${x + 235}" y="${y + 105}" font-family="Arial" font-size="10">${bondingSize}</text>
    
    <!-- Inverter Bonding -->
    <rect x="${x + 300}" y="${y + 170}" width="100" height="60" fill="#FFF" stroke="#000" stroke-width="2"/>
    <text x="${x + 350}" y="${y + 195}" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle">Inverter</text>
    <text x="${x + 350}" y="${y + 215}" font-family="Arial" font-size="11" text-anchor="middle">Chassis</text>
    
    <!-- Bonding conductor -->
    <line x1="${x + 300}" y1="${y + 200}" x2="${x + 170}" y2="${y + 200}" stroke="#00C853" stroke-width="2" stroke-dasharray="5,3"/>
    <line x1="${x + 170}" y1="${y + 200}" x2="${x + 170}" y2="${y + 160}" stroke="#00C853" stroke-width="2" stroke-dasharray="5,3"/>
    <text x="${x + 235}" y="${y + 195}" font-family="Arial" font-size="10">${bondingSize}</text>
    
    <!-- Legend -->
    <text x="${x + 20}" y="${y + 370}" font-family="Arial" font-size="11" font-weight="bold">Legend:</text>
    <line x1="${x + 70}" y1="${y + 365}" x2="${x + 110}" y2="${y + 365}" stroke="#00C853" stroke-width="3"/>
    <text x="${x + 120}" y="${y + 370}" font-family="Arial" font-size="10">Earth Conductor</text>
    <line x1="${x + 220}" y1="${y + 365}" x2="${x + 260}" y2="${y + 365}" stroke="#00C853" stroke-width="2" stroke-dasharray="5,3"/>
    <text x="${x + 270}" y="${y + 370}" font-family="Arial" font-size="10">Bonding Conductor</text>
    
    <!-- Compliance Note -->
    <text x="${x + width/2}" y="${y + height - 10}" font-family="Arial" font-size="9" text-anchor="middle" fill="#666">
      Earthing system to AS/NZS 3000:2018 | All metallic components bonded
    </text>
  </g>`;
}
