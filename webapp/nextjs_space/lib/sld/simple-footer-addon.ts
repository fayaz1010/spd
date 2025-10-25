/**
 * Simple Footer Add-on
 * Adds ONLY a footer table to existing SVG without modifying anything else
 */

import { flattenNestedSvgs } from './svg-flattener';
import { generateSpecsTable, SystemSpecs } from './specs-table-addon';
import { generateEarthingDiagram, EarthingSystemData } from './earthing-diagram-generator';
import { generateLegend } from './legend-generator';
import { generateTitleBlock, TitleBlockData } from './title-block-generator';

/**
 * Calculate where the diagram actually ends by finding max Y position
 * Ignores background and focuses on actual content (components, wires, labels)
 */
function calculateDiagramEnd(svgString: string): number {
  // SIMPLIFIED APPROACH: The standard diagram is designed to fit in ~1200-1400 units
  // The original viewBox is 2600 high but actual content is much less
  // Based on visual inspection, diagram content ends around 1200-1300
  
  const estimatedEnd = 1300; // Conservative estimate for diagram content
  
  console.log(`📏 Using estimated diagram end: ${estimatedEnd}`);
  
  return estimatedEnd;
}

export interface FooterData {
  customerName?: string;
  address?: string;
  jobNumber?: string;
  systemSize?: number;
  drawingNumber?: string;
  revision?: string;
  date?: string;
  designerName?: string;
  designerCEC?: string;
  designerLicense?: string;
  companyName?: string;
  companyABN?: string;
  companyLicense?: string;
  companyCEC?: string;
  companyPhone?: string;
  companyEmail?: string;
  specs?: SystemSpecs; // Optional system specifications
  earthing?: EarthingSystemData; // Optional earthing system data
  titleBlock?: TitleBlockData; // Optional title block data
}

export function addFooterToSvg(baseSvg: string, data: FooterData): string {
  // Extract viewBox
  const viewBoxMatch = baseSvg.match(/viewBox="([^"]+)"/);
  if (!viewBoxMatch) return baseSvg;
  
  const [vbX, vbY, vbWidth, vbHeight] = viewBoxMatch[1].split(' ').map(Number);
  
  // Calculate actual diagram end by finding max Y position of all elements
  const actualDiagramEnd = calculateDiagramEnd(baseSvg);
  
  // Position all enhancement sections
  const titleBlockHeight = data.titleBlock ? 200 : 0;
  const titleBlockY = 50; // At the top
  const diagramStartY = titleBlockY + titleBlockHeight + (data.titleBlock ? 50 : 0);
  
  const specsTableHeight = data.specs ? 400 : 0;
  const earthingLegendHeight = 400; // Both earthing and legend are 400 high
  
  const specsTableY = actualDiagramEnd + diagramStartY + 50;
  const earthingLegendY = specsTableY + specsTableHeight + (data.specs ? 50 : 0);
  const footerY = earthingLegendY + earthingLegendHeight + 50;
  const footerHeight = 480; // 8 rows × 60
  const newHeight = footerY + footerHeight + 50;
  
  console.log('🔧 Footer Addon Debug:');
  console.log('  Original viewBox:', viewBoxMatch[1]);
  console.log('  Footer will start at Y:', footerY);
  console.log('  Base SVG has components:', baseSvg.includes('<g id="components">'));
  console.log('  Base SVG component count:', (baseSvg.match(/<svg x="/g) || []).length);
  
  // FLATTEN nested SVGs to fix browser rendering
  let flattened = flattenNestedSvgs(baseSvg);
  
  console.log('  After flattening, nested svg count:', (flattened.match(/<svg x="/g) || []).length);
  
  // If title block is present, shift entire diagram down
  let shifted = flattened;
  if (data.titleBlock) {
    // Wrap all existing content in a group and translate it down
    shifted = flattened.replace(
      /(<svg[^>]*>)/,
      `$1\n  <g transform="translate(0, ${diagramStartY})">`
    ).replace('</svg>', '  </g>\n</svg>');
  }
  
  // Update viewBox to accommodate all sections
  const enhanced = shifted.replace(
    /viewBox="[^"]+"/,
    `viewBox="0 0 ${vbWidth} ${newHeight}"`
  );
  
  // Remove closing tag
  let withoutClosing = enhanced.replace('</svg>', '');
  
  console.log('  After removing </svg>, has components:', withoutClosing.includes('<g id="components">'));
  console.log('  After removing </svg>, component count:', (withoutClosing.match(/<svg x="/g) || []).length);
  
  // Generate all enhancement sections
  const titleBlock = data.titleBlock ? generateTitleBlock(
    {
      companyName: data.companyName,
      drawingTitle: 'SINGLE LINE DIAGRAM',
      drawingNumber: data.drawingNumber,
      revision: data.revision,
      scale: 'NTS',
      sheetNumber: '1 of 1',
      date: data.date,
      ...data.titleBlock
    },
    titleBlockY,
    vbWidth,
    titleBlockHeight
  ) : '';
  
  const specsTable = data.specs ? generateSpecsTable(data.specs, specsTableY) : '';
  
  // Earthing diagram and legend side by side
  const earthingDiagram = generateEarthingDiagram(
    data.earthing || {},
    100,
    earthingLegendY,
    600,
    400
  );
  
  const legend = generateLegend(
    750, // X position (to the right of earthing)
    earthingLegendY,
    600,
    400
  );
  
  const footer = generateSimpleFooter(data, footerY);
  
  // Combine all sections
  const result = `${withoutClosing}\n\n${titleBlock}\n\n${specsTable}\n\n${earthingDiagram}\n\n${legend}\n\n${footer}\n\n</svg>`;
  
  console.log('  Final SVG has components:', result.includes('<g id="components">'));
  console.log('  Final component count:', (result.match(/<svg x="/g) || []).length);
  
  return result;
}

function generateSimpleFooter(data: FooterData, y: number): string {
  const rowHeight = 60;
  const colWidth = 923; // 2770 / 3
  
  return `  <!-- Footer Table -->
  <g id="footer-table">
    <!-- Outer border -->
    <rect x="100" y="${y}" width="2770" height="${rowHeight * 8}" fill="#FFFFFF" stroke="#000" stroke-width="3"/>
    
    <!-- Column dividers -->
    <line x1="1023" y1="${y}" x2="1023" y2="${y + rowHeight * 8}" stroke="#000" stroke-width="2"/>
    <line x1="1946" y1="${y}" x2="1946" y2="${y + rowHeight * 8}" stroke="#000" stroke-width="2"/>
    
    <!-- Header Row -->
    <rect x="100" y="${y}" width="2770" height="${rowHeight}" fill="#E3F2FD"/>
    <text x="561" y="${y + 38}" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">PROJECT DETAILS</text>
    <text x="1485" y="${y + 38}" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">DESIGNED &amp; APPROVED BY</text>
    <text x="2408" y="${y + 38}" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle">COMPANY DETAILS</text>
    
    <!-- Row 1 -->
    <line x1="100" y1="${y + rowHeight}" x2="2870" y2="${y + rowHeight}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight + 35}" font-family="Arial" font-size="16">Customer: ${data.customerName || 'Customer Name'}</text>
    <text x="1043" y="${y + rowHeight + 35}" font-family="Arial" font-size="16">Designer: ${data.designerName || 'Designer Name'}</text>
    <text x="1966" y="${y + rowHeight + 35}" font-family="Arial" font-size="16">${data.companyName || 'Sun Direct Power'}</text>
    
    <!-- Row 2 -->
    <line x1="100" y1="${y + rowHeight * 2}" x2="2870" y2="${y + rowHeight * 2}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 2 + 35}" font-family="Arial" font-size="16">Address: ${(data.address || 'Installation Address').substring(0, 40)}</text>
    <text x="1043" y="${y + rowHeight * 2 + 35}" font-family="Arial" font-size="16">CEC: ${data.designerCEC || 'CEC-XXXXX'}</text>
    <text x="1966" y="${y + rowHeight * 2 + 35}" font-family="Arial" font-size="16">ABN: ${data.companyABN || 'XX XXX XXX XXX'}</text>
    
    <!-- Row 3 -->
    <line x1="100" y1="${y + rowHeight * 3}" x2="2870" y2="${y + rowHeight * 3}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 3 + 35}" font-family="Arial" font-size="16">Job: ${data.jobNumber || 'JOB-XXX'} | System: ${data.systemSize || 0}kW</text>
    <text x="1043" y="${y + rowHeight * 3 + 35}" font-family="Arial" font-size="16">License: ${data.designerLicense || 'EC-XXXXX'}</text>
    <text x="1966" y="${y + rowHeight * 3 + 35}" font-family="Arial" font-size="16">Lic: ${data.companyLicense || 'EC-XXXXX'}</text>
    
    <!-- Row 4 -->
    <line x1="100" y1="${y + rowHeight * 4}" x2="2870" y2="${y + rowHeight * 4}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 4 + 35}" font-family="Arial" font-size="16">Drawing: ${data.drawingNumber || 'SLD-XXX'} Rev ${data.revision || 'A'}</text>
    <text x="1043" y="${y + rowHeight * 4 + 35}" font-family="Arial" font-size="16">Signature: _______________</text>
    <text x="1966" y="${y + rowHeight * 4 + 35}" font-family="Arial" font-size="16">CEC: ${data.companyCEC || 'CEC-XXXXX'}</text>
    
    <!-- Row 5 -->
    <line x1="100" y1="${y + rowHeight * 5}" x2="2870" y2="${y + rowHeight * 5}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 5 + 35}" font-family="Arial" font-size="16">Date: ${data.date || new Date().toLocaleDateString('en-AU')}</text>
    <text x="1043" y="${y + rowHeight * 5 + 35}" font-family="Arial" font-size="16">Date: _______________</text>
    <text x="1966" y="${y + rowHeight * 5 + 35}" font-family="Arial" font-size="16">Phone: ${data.companyPhone || '1300 XXX XXX'}</text>
    
    <!-- Row 6 - WP Approval -->
    <line x1="100" y1="${y + rowHeight * 6}" x2="2870" y2="${y + rowHeight * 6}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 6 + 35}" font-family="Arial" font-size="16">Standards: AS/NZS 5033:2021</text>
    <rect x="1043" y="${y + rowHeight * 6}" width="${colWidth}" height="${rowHeight * 2}" fill="#FFF9C4" stroke="#000" stroke-width="1"/>
    <text x="1485" y="${y + rowHeight * 6 + 30}" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle">WESTERN POWER APPROVAL</text>
    <text x="1485" y="${y + rowHeight * 6 + 70}" font-family="Arial" font-size="16" text-anchor="middle">Stamp: _______________</text>
    <text x="1966" y="${y + rowHeight * 6 + 35}" font-family="Arial" font-size="16">Email: ${data.companyEmail || 'info@sundirectpower.com.au'}</text>
    
    <!-- Row 7 -->
    <line x1="100" y1="${y + rowHeight * 7}" x2="1023" y2="${y + rowHeight * 7}" stroke="#000" stroke-width="1"/>
    <line x1="1946" y1="${y + rowHeight * 7}" x2="2870" y2="${y + rowHeight * 7}" stroke="#000" stroke-width="1"/>
    <text x="120" y="${y + rowHeight * 7 + 35}" font-family="Arial" font-size="16">AS/NZS 3000:2018 | AS/NZS 4777.2:2020</text>
    <text x="1485" y="${y + rowHeight * 7 + 35}" font-family="Arial" font-size="16" text-anchor="middle">Date: _______________</text>
    <text x="1966" y="${y + rowHeight * 7 + 35}" font-family="Arial" font-size="16">www.sundirectpower.com.au</text>
  </g>`;
}
