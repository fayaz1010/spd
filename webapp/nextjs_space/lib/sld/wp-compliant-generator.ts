/**
 * Western Power Compliant SLD Generator
 * Phase 3: Enhanced SVG generator with 100% WP compliance
 * Extends base SvgGenerator with title block, footer, legend, earthing diagram
 */

import { WesternPowerSldData } from './types';
import { ComponentPosition, Zone } from './layout-engine';
import { Wire } from './wiring-engine';

export interface WPCompliantGeneratorOptions {
  pageWidth: number;
  pageHeight: number;
  showZones?: boolean;
  showGrid?: boolean;
}

export class WPCompliantSldGenerator {
  private options: WPCompliantGeneratorOptions;
  private scale: number = 10;
  
  constructor(options: WPCompliantGeneratorOptions) {
    this.options = {
      showZones: true,
      showGrid: false,
      ...options,
    };
  }
  
  /**
   * Generate complete WP-compliant SVG
   */
  generateCompliantSvg(
    components: ComponentPosition[],
    wires: Wire[],
    zones: Zone[],
    componentSvgs: Map<string, string>,
    data: WesternPowerSldData
  ): string {
    const { pageWidth, pageHeight } = this.options;
    
    // Extended height for all sections (title block + diagram + specs + footer + legend)
    const extendedHeight = pageHeight + 180; // Increased for all sections
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${pageWidth * 10} ${extendedHeight * 10}" 
     width="100%" 
     height="100%"
     preserveAspectRatio="xMidYMid meet">
  <defs>
    <style>
      .zone-box { fill: none; stroke: #999; stroke-width: 1; stroke-dasharray: 5,3; }
      .zone-label { font-family: Arial, sans-serif; font-size: 32px; font-weight: normal; fill: #333; }
      .wire { fill: none; stroke-linecap: square; stroke-linejoin: miter; }
      .wire-dc { stroke: #FF0000; stroke-width: 3; }
      .wire-ac { stroke: #8B4513; stroke-width: 3; }
      .wire-label { font-family: Arial, sans-serif; font-size: 24px; fill: #000; }
      .title { font-family: Arial, sans-serif; font-size: 48px; font-weight: bold; fill: #000; }
      .subtitle { font-family: Arial, sans-serif; font-size: 20px; fill: #666; }
      .spec-text { font-family: Arial, sans-serif; font-size: 20px; fill: #000; }
      .component-label { font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; fill: #000; }
      .component-spec { font-family: Arial, sans-serif; font-size: 18px; fill: #666; }
      .section-header { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #000; }
      .footer-text { font-family: Arial, sans-serif; font-size: 18px; fill: #000; }
      #components rect, #components circle, #components path, #components line { stroke-width: 0.8 !important; }
      #components text { display: none; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${pageWidth * 10}" height="${extendedHeight * 10}" fill="#FFFFFF"/>
  
  ${this.generateTitleBlock(data)}
  ${this.generateZones(zones)}
  ${this.generateWires(wires)}
  ${this.generateComponents(components, componentSvgs)}
  ${this.generateWireLabels(wires, components)}
  ${this.generateEnhancedSpecifications(data)}
  ${this.generateEarthingDiagram(data)}
  ${this.generateLegend()}
  ${this.generateFooter(data)}
  
</svg>`;
    
    return svg;
  }
  
  /**
   * Generate title block at top
   */
  private generateTitleBlock(data: WesternPowerSldData): string {
    const blockY = 5 * this.scale;
    const blockX = 10 * this.scale;
    const blockWidth = (this.options.pageWidth - 20) * this.scale;
    const blockHeight = 40 * this.scale;
    
    let block = `  <!-- Title Block -->\n`;
    block += `  <g id="title-block">\n`;
    
    // Border
    block += `    <rect x="${blockX}" y="${blockY}" width="${blockWidth}" height="${blockHeight}" fill="#F5F5F5" stroke="#000" stroke-width="2"/>\n`;
    
    // Title
    let y = blockY + 18 * this.scale;
    block += `    <text x="${blockX + blockWidth / 2}" y="${y}" class="title" text-anchor="middle">SINGLE LINE DIAGRAM</text>\n`;
    
    // Subtitle - Standards
    y += 14 * this.scale;
    block += `    <text x="${blockX + blockWidth / 2}" y="${y}" class="subtitle" text-anchor="middle">${data.compliance.standards.join(' | ')}</text>\n`;
    
    // Job info
    y += 10 * this.scale;
    block += `    <text x="${blockX + 10 * this.scale}" y="${y}" class="spec-text">Job: ${data.project.jobNumber} | System: ${data.project.systemSize}kW | Customer: ${data.project.customerName}</text>\n`;
    
    block += `  </g>\n`;
    return block;
  }
  
  /**
   * Generate zones (from existing generator)
   */
  private generateZones(zones: Zone[]): string {
    let zonesHtml = '  <!-- Zones -->\n  <g id="zones">\n';
    
    zones.forEach((zone) => {
      if (zone.id === 'specifications') return;
      
      zonesHtml += `    <rect class="zone-box" x="${zone.x * this.scale}" y="${zone.y * this.scale}" width="${zone.width * this.scale}" height="${zone.height * this.scale}" rx="${3 * this.scale}"/>\n`;
      zonesHtml += `    <text class="zone-label" x="${(zone.x + zone.width / 2) * this.scale}" y="${(zone.y - 8) * this.scale}" text-anchor="middle">${zone.name}</text>\n`;
    });
    
    zonesHtml += '  </g>\n';
    return zonesHtml;
  }
  
  /**
   * Generate wires
   */
  private generateWires(wires: Wire[]): string {
    let wiresHtml = '  <!-- Wires -->\n  <g id="wires">\n';
    
    wires.forEach((wire) => {
      const path = this.generateWirePath(wire.path);
      const wireClass = wire.color === '#FF0000' || wire.color === 'red' ? 'wire wire-dc' : 'wire wire-ac';
      wiresHtml += `    <path class="${wireClass}" d="${path}"/>\n`;
    });
    
    wiresHtml += '  </g>\n';
    return wiresHtml;
  }
  
  /**
   * Generate wire path
   */
  private generateWirePath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x * this.scale} ${points[0].y * this.scale}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x * this.scale} ${points[i].y * this.scale}`;
    }
    return path;
  }
  
  /**
   * Generate components (simplified)
   */
  private generateComponents(
    components: ComponentPosition[],
    componentSvgs: Map<string, string>
  ): string {
    let componentsHtml = '  <!-- Components -->\n  <g id="components">\n';
    
    components.forEach((comp) => {
      const svgContent = componentSvgs.get(comp.componentType);
      if (svgContent) {
        const x = comp.x * this.scale;
        const y = comp.y * this.scale;
        const width = comp.width * this.scale;
        const height = comp.height * this.scale;
        
        const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
        const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';
        const content = this.extractSvgContent(svgContent);
        
        componentsHtml += `    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">\n`;
        componentsHtml += `      ${content}\n`;
        componentsHtml += `    </svg>\n`;
      }
    });
    
    componentsHtml += '  </g>\n';
    return componentsHtml;
  }
  
  /**
   * Extract SVG content
   */
  private extractSvgContent(svgString: string): string {
    let content = svgString.replace(/<\?xml[^>]*\?>/g, '');
    const match = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    return match && match[1] ? match[1].trim() : content;
  }
  
  /**
   * Generate wire labels
   */
  private generateWireLabels(wires: Wire[], components: ComponentPosition[]): string {
    let labelsHtml = '  <!-- Wire Labels -->\n  <g id="wire-labels">\n';
    
    wires.forEach((wire) => {
      if (wire.label && wire.path.length >= 2) {
        const midPoint = wire.path[Math.floor(wire.path.length / 2)];
        const labelX = midPoint.x * this.scale;
        const labelY = (midPoint.y - 15) * this.scale;
        
        const labelWidth = wire.label.length * 14;
        const labelHeight = 28;
        labelsHtml += `    <rect x="${labelX - labelWidth / 2}" y="${labelY - 20}" width="${labelWidth}" height="${labelHeight}" fill="#FFFFFF" fill-opacity="0.95" stroke="#CCC" stroke-width="0.5"/>\n`;
        labelsHtml += `    <text class="wire-label" x="${labelX}" y="${labelY}" text-anchor="middle">${wire.label}</text>\n`;
      }
    });
    
    labelsHtml += '  </g>\n';
    return labelsHtml;
  }
  
  /**
   * Generate enhanced specifications table
   */
  private generateEnhancedSpecifications(data: WesternPowerSldData): string {
    const tableY = (this.options.pageHeight * 0.55) * this.scale;
    const tableX = 10 * this.scale;
    const tableWidth = (this.options.pageWidth - 20) * this.scale;
    const tableHeight = 100 * this.scale;
    
    let table = `  <!-- Enhanced Specifications -->\n`;
    table += `  <g id="specifications">\n`;
    
    // Main border
    table += `    <rect x="${tableX}" y="${tableY}" width="${tableWidth}" height="${tableHeight}" fill="#FFFFFF" stroke="#000" stroke-width="2"/>\n`;
    
    // Three columns
    const col1Width = tableWidth * 0.33;
    const col2Width = tableWidth * 0.33;
    const col3Width = tableWidth * 0.34;
    
    // Column dividers
    table += `    <line x1="${tableX + col1Width}" y1="${tableY}" x2="${tableX + col1Width}" y2="${tableY + tableHeight}" stroke="#000" stroke-width="1"/>\n`;
    table += `    <line x1="${tableX + col1Width + col2Width}" y1="${tableY}" x2="${tableX + col1Width + col2Width}" y2="${tableY + tableHeight}" stroke="#000" stroke-width="1"/>\n`;
    
    // Column 1: Solar Panels & Inverter
    let y = tableY + 12 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="section-header">SOLAR PANELS</text>\n`;
    y += 10 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">${data.panels.manufacturer} ${data.panels.model}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">CEC: ${data.panels.cecApproval}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">${data.panels.wattage}W | Voc: ${data.panels.voc}V | Isc: ${data.panels.isc}A</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">Config: ${data.strings.length} strings × ${data.strings[0].panelCount} panels</text>\n`;
    
    y += 15 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="section-header">INVERTER</text>\n`;
    y += 10 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">${data.inverter.manufacturer} ${data.inverter.model}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">CEC: ${data.inverter.cecApproval}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">${data.inverter.capacity}kW | ${data.inverter.efficiency}% | AS/NZS 4777.2</text>\n`;
    
    // Column 2: Cables & Protection
    const col2X = tableX + col1Width;
    y = tableY + 12 * this.scale;
    table += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="section-header">CABLES & PROTECTION</text>\n`;
    y += 10 * this.scale;
    table += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="spec-text">DC: ${data.dcCables.size} ${data.dcCables.material} ${data.dcCables.insulation}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="spec-text">${data.dcCables.voltageRating} | ${data.dcCables.length}m | ${data.dcCables.installMethod}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="spec-text">DC Breaker: ${data.dcProtection.breakerRating} ${data.dcProtection.voltageRating}</text>\n`;
    
    y += 12 * this.scale;
    table += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="spec-text">AC: ${data.acCables.size} ${data.acCables.material} ${data.acCables.type}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="spec-text">${data.acCables.length}m | ${data.acCables.installMethod}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="spec-text">AC Breaker: ${data.acProtection.breakerRating} ${data.acProtection.poles}P</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="spec-text">RCD: ${data.acProtection.rcdType} ${data.acProtection.rcdRating}</text>\n`;
    
    // Column 3: Earthing & Switchboard
    const col3X = tableX + col1Width + col2Width;
    y = tableY + 12 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="section-header">EARTHING & METERING</text>\n`;
    y += 10 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="spec-text">System: ${data.earthing.system}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="spec-text">Electrode: ${data.earthing.electrodeType} (${data.earthing.electrodeLocation})</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="spec-text">Conductor: ${data.earthing.conductorSize}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="spec-text">Meter: ${data.metering.type} (${data.metering.location})</text>\n`;
    
    y += 12 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="section-header">MAIN SWITCHBOARD</text>\n`;
    y += 10 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="spec-text">Main Switch: ${data.mainSwitchboard.mainSwitchRating}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="spec-text">Busbar: ${data.mainSwitchboard.busbarRating}</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="spec-text">Export Limit: ${data.waSpecific.exportLimitKw}kW</text>\n`;
    y += 8 * this.scale;
    table += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="spec-text">Phase: ${data.waSpecific.phaseConfiguration}</text>\n`;
    
    table += `  </g>\n`;
    return table;
  }
  
  /**
   * Generate earthing diagram
   */
  private generateEarthingDiagram(data: WesternPowerSldData): string {
    const x = 50 * this.scale;
    const y = (this.options.pageHeight * 0.75) * this.scale;
    
    let earthing = `  <!-- Earthing System -->\n`;
    earthing += `  <g id="earthing-system">\n`;
    
    // Vertical line
    earthing += `    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 30 * this.scale}" stroke="#000" stroke-width="2"/>\n`;
    
    // Earth symbol (three horizontal lines)
    earthing += `    <line x1="${x - 20 * this.scale}" y1="${y + 30 * this.scale}" x2="${x + 20 * this.scale}" y2="${y + 30 * this.scale}" stroke="#000" stroke-width="2"/>\n`;
    earthing += `    <line x1="${x - 15 * this.scale}" y1="${y + 35 * this.scale}" x2="${x + 15 * this.scale}" y2="${y + 35 * this.scale}" stroke="#000" stroke-width="2"/>\n`;
    earthing += `    <line x1="${x - 10 * this.scale}" y1="${y + 40 * this.scale}" x2="${x + 10 * this.scale}" y2="${y + 40 * this.scale}" stroke="#000" stroke-width="2"/>\n`;
    
    // Labels
    earthing += `    <text x="${x + 25 * this.scale}" y="${y + 35 * this.scale}" class="spec-text">${data.earthing.conductorSize}</text>\n`;
    earthing += `    <text x="${x + 25 * this.scale}" y="${y + 45 * this.scale}" class="spec-text">${data.earthing.electrodeType} Electrode</text>\n`;
    earthing += `    <text x="${x + 25 * this.scale}" y="${y + 55 * this.scale}" class="spec-text">${data.earthing.system} System</text>\n`;
    
    earthing += `  </g>\n`;
    return earthing;
  }
  
  /**
   * Generate legend
   */
  private generateLegend(): string {
    const legendY = (this.options.pageHeight + 135) * this.scale;
    const legendX = 10 * this.scale;
    
    let legend = `  <!-- Legend -->\n`;
    legend += `  <g id="legend">\n`;
    
    legend += `    <text x="${legendX}" y="${legendY}" class="section-header">LEGEND:</text>\n`;
    
    // DC wiring
    legend += `    <line x1="${legendX + 50 * this.scale}" y1="${legendY - 5}" x2="${legendX + 80 * this.scale}" y2="${legendY - 5}" stroke="#FF0000" stroke-width="3"/>\n`;
    legend += `    <text x="${legendX + 85 * this.scale}" y="${legendY}" class="spec-text">DC Wiring (Red)</text>\n`;
    
    // AC wiring
    legend += `    <line x1="${legendX + 200 * this.scale}" y1="${legendY - 5}" x2="${legendX + 230 * this.scale}" y2="${legendY - 5}" stroke="#8B4513" stroke-width="3"/>\n`;
    legend += `    <text x="${legendX + 235 * this.scale}" y="${legendY}" class="spec-text">AC Wiring (Brown)</text>\n`;
    
    // Symbols
    legend += `    <text x="${legendX + 350 * this.scale}" y="${legendY}" class="spec-text">⏚ = Earth | MCB = Circuit Breaker | RCD = Residual Current Device</text>\n`;
    
    legend += `  </g>\n`;
    return legend;
  }
  
  /**
   * Generate footer with signatures
   */
  private generateFooter(data: WesternPowerSldData): string {
    const footerY = (this.options.pageHeight + 150) * this.scale;
    const footerX = 10 * this.scale;
    const footerWidth = (this.options.pageWidth - 20) * this.scale;
    const footerHeight = 70 * this.scale;
    
    let footer = `  <!-- Footer -->\n`;
    footer += `  <g id="footer">\n`;
    
    // Border
    footer += `    <rect x="${footerX}" y="${footerY}" width="${footerWidth}" height="${footerHeight}" fill="#FFFFFF" stroke="#000" stroke-width="2"/>\n`;
    
    // Three columns
    const col1Width = footerWidth * 0.35;
    const col2Width = footerWidth * 0.35;
    const col3Width = footerWidth * 0.30;
    
    // Column dividers
    footer += `    <line x1="${footerX + col1Width}" y1="${footerY}" x2="${footerX + col1Width}" y2="${footerY + footerHeight}" stroke="#000" stroke-width="1"/>\n`;
    footer += `    <line x1="${footerX + col1Width + col2Width}" y1="${footerY}" x2="${footerX + col1Width + col2Width}" y2="${footerY + footerHeight}" stroke="#000" stroke-width="1"/>\n`;
    
    // Column 1: Project Details
    let y = footerY + 12 * this.scale;
    footer += `    <text x="${footerX + 5 * this.scale}" y="${y}" class="section-header">PROJECT DETAILS</text>\n`;
    y += 10 * this.scale;
    footer += `    <text x="${footerX + 5 * this.scale}" y="${y}" class="footer-text">Customer: ${data.project.customerName}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${footerX + 5 * this.scale}" y="${y}" class="footer-text">Address: ${data.project.installationAddress}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${footerX + 5 * this.scale}" y="${y}" class="footer-text">Job: ${data.project.jobNumber} | System: ${data.project.systemSize}kW</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${footerX + 5 * this.scale}" y="${y}" class="footer-text">Drawing: ${data.documentControl.drawingNumber} Rev ${data.documentControl.revision}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${footerX + 5 * this.scale}" y="${y}" class="footer-text">Date: ${new Date(data.documentControl.dateDesigned).toLocaleDateString('en-AU')}</text>\n`;
    
    // Column 2: Designer & Approver
    const col2X = footerX + col1Width;
    y = footerY + 12 * this.scale;
    footer += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="section-header">DESIGNED BY</text>\n`;
    y += 10 * this.scale;
    footer += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="footer-text">Name: ${data.designer.name}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="footer-text">CEC: ${data.designer.cecAccreditation}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="footer-text">Signature: _______________</text>\n`;
    
    y += 12 * this.scale;
    footer += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="section-header">APPROVED BY (WP)</text>\n`;
    y += 10 * this.scale;
    footer += `    <text x="${col2X + 5 * this.scale}" y="${y}" class="footer-text">Stamp: _______________</text>\n`;
    
    // Column 3: Company Info
    const col3X = footerX + col1Width + col2Width;
    y = footerY + 12 * this.scale;
    footer += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="section-header">COMPANY DETAILS</text>\n`;
    y += 10 * this.scale;
    footer += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="footer-text">${data.company.name}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="footer-text">ABN: ${data.company.abn}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="footer-text">Lic: ${data.company.electricalLicense}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="footer-text">CEC: ${data.company.cecAccreditation}</text>\n`;
    y += 8 * this.scale;
    footer += `    <text x="${col3X + 5 * this.scale}" y="${y}" class="footer-text">${data.company.phone}</text>\n`;
    
    footer += `  </g>\n`;
    return footer;
  }
}

export default WPCompliantSldGenerator;
