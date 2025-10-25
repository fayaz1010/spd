/**
 * Legend/Key Generator
 * Generates legend explaining symbols, colors, and abbreviations
 */

export function generateLegend(
  x: number,
  y: number,
  width: number = 600,
  height: number = 400
): string {
  return `  <!-- Legend / Key -->
  <g id="legend">
    <!-- Border -->
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#FFFFFF" stroke="#000" stroke-width="2"/>
    
    <!-- Title -->
    <rect x="${x}" y="${y}" width="${width}" height="40" fill="#E3F2FD"/>
    <text x="${x + width/2}" y="${y + 28}" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle">LEGEND / KEY</text>
    
    <!-- Line Colors Section -->
    <text x="${x + 20}" y="${y + 70}" font-family="Arial" font-size="14" font-weight="bold">Line Colors:</text>
    
    <!-- DC Lines (Red) -->
    <line x1="${x + 30}" y1="${y + 90}" x2="${x + 100}" y2="${y + 90}" stroke="#FF0000" stroke-width="3"/>
    <text x="${x + 110}" y="${y + 95}" font-family="Arial" font-size="12">DC Wiring (Red)</text>
    
    <!-- AC Lines (Brown) -->
    <line x1="${x + 30}" y1="${y + 115}" x2="${x + 100}" y2="${y + 115}" stroke="#8B4513" stroke-width="3"/>
    <text x="${x + 110}" y="${y + 120}" font-family="Arial" font-size="12">AC Wiring (Brown/Black)</text>
    
    <!-- Earth Lines (Green/Yellow) -->
    <line x1="${x + 30}" y1="${y + 140}" x2="${x + 100}" y2="${y + 140}" stroke="#00C853" stroke-width="3"/>
    <text x="${x + 110}" y="${y + 145}" font-family="Arial" font-size="12">Earth/Bonding (Green/Yellow)</text>
    
    <!-- Symbols Section -->
    <text x="${x + 20}" y="${y + 180}" font-family="Arial" font-size="14" font-weight="bold">Symbols:</text>
    
    <!-- Earth Symbol -->
    <g transform="translate(${x + 60}, ${y + 200})">
      <line x1="-15" y1="0" x2="15" y2="0" stroke="#000" stroke-width="2"/>
      <line x1="-10" y1="5" x2="10" y2="5" stroke="#000" stroke-width="2"/>
      <line x1="-5" y1="10" x2="5" y2="10" stroke="#000" stroke-width="2"/>
    </g>
    <text x="${x + 90}" y="${y + 205}" font-family="Arial" font-size="12">Earth Connection</text>
    
    <!-- Isolator Symbol -->
    <rect x="${x + 45}" y="${y + 220}" width="30" height="20" fill="none" stroke="#000" stroke-width="2"/>
    <line x1="${x + 50}" y1="${y + 230}" x2="${x + 70}" y2="${y + 230}" stroke="#000" stroke-width="2"/>
    <text x="${x + 90}" y="${y + 235}" font-family="Arial" font-size="12">Isolator/Switch</text>
    
    <!-- Protection Device Symbol -->
    <circle cx="${x + 60}" cy="${y + 260}" r="12" fill="none" stroke="#000" stroke-width="2"/>
    <text x="${x + 90}" y="${y + 265}" font-family="Arial" font-size="12">Protection Device (MCB/RCD)</text>
    
    <!-- Abbreviations Section -->
    <text x="${x + 320}" y="${y + 70}" font-family="Arial" font-size="14" font-weight="bold">Abbreviations:</text>
    
    <text x="${x + 330}" y="${y + 95}" font-family="Arial" font-size="11"><tspan font-weight="bold">DC:</tspan> Direct Current</text>
    <text x="${x + 330}" y="${y + 115}" font-family="Arial" font-size="11"><tspan font-weight="bold">AC:</tspan> Alternating Current</text>
    <text x="${x + 330}" y="${y + 135}" font-family="Arial" font-size="11"><tspan font-weight="bold">MCB:</tspan> Miniature Circuit Breaker</text>
    <text x="${x + 330}" y="${y + 155}" font-family="Arial" font-size="11"><tspan font-weight="bold">RCD:</tspan> Residual Current Device</text>
    <text x="${x + 330}" y="${y + 175}" font-family="Arial" font-size="11"><tspan font-weight="bold">RCBO:</tspan> RCD + MCB Combined</text>
    <text x="${x + 330}" y="${y + 195}" font-family="Arial" font-size="11"><tspan font-weight="bold">CT:</tspan> Current Transformer</text>
    <text x="${x + 330}" y="${y + 215}" font-family="Arial" font-size="11"><tspan font-weight="bold">MEN:</tspan> Multiple Earthed Neutral</text>
    <text x="${x + 330}" y="${y + 235}" font-family="Arial" font-size="11"><tspan font-weight="bold">CEC:</tspan> Clean Energy Council</text>
    <text x="${x + 330}" y="${y + 255}" font-family="Arial" font-size="11"><tspan font-weight="bold">ESS:</tspan> Energy Storage System</text>
    <text x="${x + 330}" y="${y + 275}" font-family="Arial" font-size="11"><tspan font-weight="bold">MPPT:</tspan> Maximum Power Point Tracking</text>
    <text x="${x + 330}" y="${y + 295}" font-family="Arial" font-size="11"><tspan font-weight="bold">Voc:</tspan> Open Circuit Voltage</text>
    <text x="${x + 330}" y="${y + 315}" font-family="Arial" font-size="11"><tspan font-weight="bold">Isc:</tspan> Short Circuit Current</text>
    
    <!-- Standards Note -->
    <text x="${x + 20}" y="${y + 340}" font-family="Arial" font-size="11" font-weight="bold">Applicable Standards:</text>
    <text x="${x + 30}" y="${y + 360}" font-family="Arial" font-size="10">• AS/NZS 5033:2021 - PV Array Installation</text>
    <text x="${x + 30}" y="${y + 375}" font-family="Arial" font-size="10">• AS/NZS 3000:2018 - Electrical Installations (Wiring Rules)</text>
    <text x="${x + 30}" y="${y + 390}" font-family="Arial" font-size="10">• AS/NZS 4777.2:2020 - Grid Connection of Energy Systems</text>
  </g>`;
}
