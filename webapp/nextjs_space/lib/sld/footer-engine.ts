/**
 * Intelligent Footer Engine for SLD
 * Handles data gathering, table generation, and accurate text placement
 */

import { WesternPowerSldData } from './types';

interface FooterCell {
  text: string;
  bold?: boolean;
  fontSize?: number;
  color?: string;
}

interface FooterRow {
  cells: FooterCell[];
  height: number;
  backgroundColor?: string;
}

interface FooterTable {
  x: number;
  y: number;
  width: number;
  columns: number;
  rows: FooterRow[];
}

export class FooterEngine {
  private data: Partial<WesternPowerSldData>;
  private tableConfig: {
    x: number;
    y: number;
    width: number;
    columns: 3;
    defaultRowHeight: 60;
    defaultFontSize: 16;
    headerFontSize: 20;
    padding: 10;
  };

  constructor(data: Partial<WesternPowerSldData>, y: number) {
    this.data = data;
    this.tableConfig = {
      x: 100,
      y: y,
      width: 2770,
      columns: 3,
      defaultRowHeight: 60,
      defaultFontSize: 16,
      headerFontSize: 20,
      padding: 10,
    };
  }

  /**
   * Gather all footer data from various sources
   */
  private gatherData() {
    const company = this.data.company || {};
    const designer = this.data.designer || {};
    const project = this.data.project || {};
    const docControl = this.data.documentControl || {};

    return {
      // Column 1: Project Details
      projectDetails: {
        customer: project.customerName || 'Customer Name',
        address: (project.installationAddress || 'Installation Address').substring(0, 50),
        jobNumber: project.jobNumber || 'JOB-XXX',
        systemSize: project.systemSize || 0,
        drawingNumber: docControl.drawingNumber || 'SLD-XXX',
        revision: docControl.revision || 'A',
        date: docControl.dateDesigned 
          ? new Date(docControl.dateDesigned).toLocaleDateString('en-AU')
          : new Date().toLocaleDateString('en-AU'),
        standards: ['AS/NZS 5033:2021', 'AS/NZS 3000:2018', 'AS/NZS 4777.2:2020'],
      },
      
      // Column 2: Designer & Approver
      designer: {
        name: designer.name || 'Designer Name',
        cec: designer.cecAccreditation || 'CEC-XXXXX',
        license: designer.electricalLicense || company.electricalLicense || 'EC-XXXXX',
      },
      
      // Column 3: Company
      company: {
        name: company.name || 'Sun Direct Power',
        abn: company.abn || 'XX XXX XXX XXX',
        license: company.electricalLicense || 'EC-XXXXX',
        cec: company.cecAccreditation || 'CEC-XXXXX',
        phone: company.phone || '1300 XXX XXX',
        email: company.email || 'info@sundirectpower.com.au',
        website: 'www.sundirectpower.com.au',
      },
    };
  }

  /**
   * Build table structure with rows and cells
   */
  private buildTableStructure(): FooterTable {
    const data = this.gatherData();
    const colWidth = this.tableConfig.width / this.tableConfig.columns;

    const rows: FooterRow[] = [
      // Header Row
      {
        height: this.tableConfig.defaultRowHeight,
        backgroundColor: '#E3F2FD',
        cells: [
          { text: 'PROJECT DETAILS', bold: true, fontSize: this.tableConfig.headerFontSize },
          { text: 'DESIGNED & APPROVED BY', bold: true, fontSize: this.tableConfig.headerFontSize },
          { text: 'COMPANY DETAILS', bold: true, fontSize: this.tableConfig.headerFontSize },
        ],
      },
      
      // Row 1
      {
        height: this.tableConfig.defaultRowHeight,
        cells: [
          { text: `Customer: ${data.projectDetails.customer}` },
          { text: `Designer: ${data.designer.name}` },
          { text: data.company.name },
        ],
      },
      
      // Row 2
      {
        height: this.tableConfig.defaultRowHeight,
        cells: [
          { text: `Address: ${data.projectDetails.address}` },
          { text: `CEC: ${data.designer.cec}` },
          { text: `ABN: ${data.company.abn}` },
        ],
      },
      
      // Row 3
      {
        height: this.tableConfig.defaultRowHeight,
        cells: [
          { text: `Job: ${data.projectDetails.jobNumber} | System: ${data.projectDetails.systemSize}kW` },
          { text: `License: ${data.designer.license}` },
          { text: `Lic: ${data.company.license}` },
        ],
      },
      
      // Row 4
      {
        height: this.tableConfig.defaultRowHeight,
        cells: [
          { text: `Drawing: ${data.projectDetails.drawingNumber} Rev ${data.projectDetails.revision}` },
          { text: 'Signature: _______________' },
          { text: `CEC: ${data.company.cec}` },
        ],
      },
      
      // Row 5
      {
        height: this.tableConfig.defaultRowHeight,
        cells: [
          { text: `Date: ${data.projectDetails.date}` },
          { text: 'Date: _______________' },
          { text: `Phone: ${data.company.phone}` },
        ],
      },
      
      // Row 6 - Standards & WP Approval
      {
        height: this.tableConfig.defaultRowHeight,
        cells: [
          { text: `Standards: ${data.projectDetails.standards[0]}` },
          { text: 'WESTERN POWER APPROVAL', bold: true, fontSize: 18 },
          { text: `Email: ${data.company.email}` },
        ],
      },
      
      // Row 7 - Continued
      {
        height: this.tableConfig.defaultRowHeight,
        cells: [
          { text: `${data.projectDetails.standards[1]} | ${data.projectDetails.standards[2]}` },
          { text: 'Stamp: _______________ Date: _______________' },
          { text: data.company.website },
        ],
      },
    ];

    return {
      x: this.tableConfig.x,
      y: this.tableConfig.y,
      width: this.tableConfig.width,
      columns: this.tableConfig.columns,
      rows,
    };
  }

  /**
   * Generate SVG for the footer table
   */
  generateSVG(): string {
    const table = this.buildTableStructure();
    const colWidth = table.width / table.columns;
    
    let svg = `  <!-- Footer Table (Generated by Footer Engine) -->\n`;
    svg += `  <g id="wp-footer-table">\n`;
    
    // Outer border
    const totalHeight = table.rows.reduce((sum, row) => sum + row.height, 0);
    svg += `    <rect x="${table.x}" y="${table.y}" width="${table.width}" height="${totalHeight}" fill="#FFFFFF" stroke="#000" stroke-width="3"/>\n`;
    
    // Column dividers (vertical lines)
    for (let col = 1; col < table.columns; col++) {
      const x = table.x + (col * colWidth);
      svg += `    <line x1="${x}" y1="${table.y}" x2="${x}" y2="${table.y + totalHeight}" stroke="#000" stroke-width="2"/>\n`;
    }
    
    // Rows
    let currentY = table.y;
    table.rows.forEach((row, rowIndex) => {
      // Row background
      if (row.backgroundColor) {
        svg += `    <rect x="${table.x}" y="${currentY}" width="${table.width}" height="${row.height}" fill="${row.backgroundColor}"/>\n`;
      }
      
      // Row divider (horizontal line)
      if (rowIndex > 0) {
        svg += `    <line x1="${table.x}" y1="${currentY}" x2="${table.x + table.width}" y2="${currentY}" stroke="#000" stroke-width="1"/>\n`;
      }
      
      // Special handling for WP Approval cell (spans 2 rows)
      if (rowIndex === 5) {
        // Highlight WP approval cell
        const col2X = table.x + colWidth;
        svg += `    <rect x="${col2X}" y="${currentY}" width="${colWidth}" height="${row.height * 2}" fill="#FFF9C4" stroke="#000" stroke-width="1"/>\n`;
      }
      
      // Cells
      row.cells.forEach((cell, cellIndex) => {
        const cellX = table.x + (cellIndex * colWidth);
        const textX = cellX + this.tableConfig.padding;
        const textY = currentY + (row.height / 2) + 5; // Vertically centered
        
        const fontSize = cell.fontSize || this.tableConfig.defaultFontSize;
        const fontWeight = cell.bold ? 'bold' : 'normal';
        const color = cell.color || '#000';
        
        // For header row, center text
        if (rowIndex === 0) {
          svg += `    <text x="${cellX + colWidth / 2}" y="${textY}" font-family="Arial" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}" text-anchor="middle">${this.escapeXml(cell.text)}</text>\n`;
        } else {
          svg += `    <text x="${textX}" y="${textY}" font-family="Arial" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">${this.escapeXml(cell.text)}</text>\n`;
        }
      });
      
      currentY += row.height;
    });
    
    svg += `  </g>\n`;
    return svg;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get total height of the footer
   */
  getTotalHeight(): number {
    const table = this.buildTableStructure();
    return table.rows.reduce((sum, row) => sum + row.height, 0);
  }
}

/**
 * Helper function to generate footer SVG
 */
export function generateFooterSVG(data: Partial<WesternPowerSldData>, y: number): string {
  const engine = new FooterEngine(data, y);
  return engine.generateSVG();
}
