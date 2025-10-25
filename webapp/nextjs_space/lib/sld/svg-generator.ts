/**
 * Professional SLD SVG Generator
 * Generates complete SVG diagrams from components and wiring
 */

import { ComponentPosition, Zone } from './layout-engine';
import { Wire } from './wiring-engine';
import { EquipmentSpecs, getComponentSpecLabel as getEnhancedSpecLabel } from './component-specs-enhancer';

export interface SvgGeneratorOptions {
  pageWidth: number;
  pageHeight: number;
  title?: string;
  showZones?: boolean;
  showGrid?: boolean;
}

export class SvgGenerator {
  private options: SvgGeneratorOptions;
  private scale: number = 10; // Scale factor for better resolution

  constructor(options: SvgGeneratorOptions) {
    this.options = {
      showZones: true,
      showGrid: false,
      ...options,
    };
  }

  /**
   * Generate complete SVG diagram
   */
  generateSvg(
    components: ComponentPosition[],
    wires: Wire[],
    zones: Zone[],
    componentSvgs: Map<string, string>,
    equipmentSpecs?: EquipmentSpecs
  ): string {
    const { pageWidth, pageHeight, title } = this.options;

    // Extend page height to accommodate full specifications
    const extendedHeight = pageHeight + 50; // Add 50mm for bottom sections
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${pageWidth * 10} ${extendedHeight * 10}" 
     width="100%" 
     height="100%">
  
  <!-- Styles -->
  <defs>
    <style>
      .zone-box { fill: none; stroke: #999; stroke-width: 1; stroke-dasharray: 5,3; }
      .zone-label { font-family: Arial, sans-serif; font-size: 32px; font-weight: normal; fill: #333; }
      .wire { fill: none; stroke-linecap: square; stroke-linejoin: miter; }
      .wire-dc { stroke: #FF0000; stroke-width: 3; }
      .wire-ac { stroke: #8B4513; stroke-width: 3; }
      .wire-label { font-family: Arial, sans-serif; font-size: 24px; fill: #000; }
      .title { font-family: Arial, sans-serif; font-size: 48px; font-weight: bold; fill: #000; }
      .grid-line { stroke: #E0E0E0; stroke-width: 0.5; }
      .spec-text { font-family: Arial, sans-serif; font-size: 20px; fill: #000; }
      .component-label { font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; fill: #000; }
      .component-spec { font-family: Arial, sans-serif; font-size: 18px; fill: #666; }
      /* Reduce component border weights globally */
      #components rect, #components circle, #components path, #components line { stroke-width: 0.8 !important; }
      #components .panel-outline { stroke-width: 1 !important; }
      #components .connection { stroke-width: 1.5 !important; }
      /* Hide all internal component labels - we use external spec labels instead */
      #components text { display: none; }
      #components .label-text { display: none; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${pageWidth * 10}" height="${extendedHeight * 10}" fill="#FFFFFF"/>`;

    // Add grid if enabled
    if (this.options.showGrid) {
      svg += this.generateGrid(pageWidth, pageHeight);
    }

    // Add title at top with proper spacing (moved down to avoid cutting)
    if (title) {
      svg += `  <text x="${(pageWidth * this.scale) / 2}" y="${50 * this.scale / 10}" class="title" text-anchor="middle">${title}</text>\n`;
    }

    // Add zones
    if (this.options.showZones) {
      svg += this.generateZones(zones);
    }

    // Add wires (behind components) - lines only, no labels yet
    svg += this.generateWires(wires, false);

    // Add components
    svg += this.generateComponents(components, componentSvgs, equipmentSpecs);

    // Add wire labels (on top of everything) - with intelligent positioning
    svg += this.generateWireLabels(wires, components);

    svg += `</svg>`;

    return svg;
  }

  /**
   * Generate grid lines
   */
  private generateGrid(width: number, height: number): string {
    let grid = '  <!-- Grid -->\n  <g id="grid">\n';
    
    const spacing = 5; // 5mm grid
    
    // Vertical lines
    for (let x = 0; x <= width; x += spacing) {
      grid += `    <line x1="${x}" y1="0" x2="${x}" y2="${height}" class="grid-line"/>\n`;
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += spacing) {
      grid += `    <line x1="0" y1="${y}" x2="${width}" y2="${y}" class="grid-line"/>\n`;
    }
    
    grid += '  </g>\n';
    return grid;
  }

  /**
   * Generate zone boxes and labels
   */
  private generateZones(zones: Zone[]): string {
    let zonesHtml = '  <!-- Zones -->\n  <g id="zones">\n';

    zones.forEach((zone) => {
      if (zone.id === 'specifications') return; // Skip specs zone

      zonesHtml += `    <rect class="zone-box" x="${zone.x * this.scale}" y="${zone.y * this.scale}" width="${zone.width * this.scale}" height="${zone.height * this.scale}" rx="${3 * this.scale}"/>\n`;
      // Position label ABOVE the zone with adequate clearance
      const labelOffset = zone.id === 'battery' ? -5 : -3; // Extra clearance for battery zone
      zonesHtml += `    <text class="zone-label" x="${(zone.x + zone.width / 2) * this.scale}" y="${(zone.y + labelOffset) * this.scale}" text-anchor="middle">${zone.name}</text>\n`;
    });

    zonesHtml += '  </g>\n';
    return zonesHtml;
  }

  /**
   * Generate wires (lines only)
   */
  private generateWires(wires: Wire[], includeLabels: boolean = true): string {
    let wiresHtml = '  <!-- Wires -->\n  <g id="wires">\n';

    wires.forEach((wire) => {
      const path = this.generateWirePath(wire.path);
      
      // Determine wire class based on color (DC = red, AC = brown/black)
      const wireClass = wire.color === '#FF0000' || wire.color === 'red' ? 'wire wire-dc' : 'wire wire-ac';
      wiresHtml += `    <path class="${wireClass}" d="${path}"/>\n`;
    });

    wiresHtml += '  </g>\n';
    return wiresHtml;
  }

  /**
   * Intelligent label positioning - avoids components
   */
  private findOptimalLabelPosition(
    wire: Wire,
    components: ComponentPosition[]
  ): { x: number; y: number } {
    // Find all candidate positions along the wire
    const candidates: Array<{ x: number; y: number; score: number }> = [];
    
    // Check each segment of the wire
    for (let i = 0; i < wire.path.length - 1; i++) {
      const p1 = wire.path[i];
      const p2 = wire.path[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      
      // Calculate segment length
      const segmentLength = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      
      // Check if this position overlaps with any component
      let overlapsComponent = false;
      let minDistanceToComponent = Infinity;
      
      for (const comp of components) {
        // Component bounding box (including label space below) - MAXIMUM PROTECTION
        const compLeft = comp.x - 15;
        const compRight = comp.x + comp.width + 15;
        const compTop = comp.y - 15;
        const compBottom = comp.y + comp.height + 70; // Extra space for labels (increased to 70)
        
        // Check if label position is inside component area
        if (midX >= compLeft && midX <= compRight && 
            midY >= compTop && midY <= compBottom) {
          overlapsComponent = true;
        }
        
        // Calculate distance to component
        const distX = Math.max(compLeft - midX, 0, midX - compRight);
        const distY = Math.max(compTop - midY, 0, midY - compBottom);
        const distance = Math.sqrt(distX * distX + distY * distY);
        minDistanceToComponent = Math.min(minDistanceToComponent, distance);
      }
      
      // Score: prefer longer segments, far from components
      const score = overlapsComponent ? -1000 : segmentLength + minDistanceToComponent * 2;
      
      candidates.push({ x: midX, y: midY, score });
    }
    
    // Find best candidate
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0] || { x: wire.path[0].x, y: wire.path[0].y };
    
    return { x: best.x * this.scale, y: (best.y - 15) * this.scale };
  }

  /**
   * Generate wire labels (on top of everything)
   */
  private generateWireLabels(wires: Wire[], components: ComponentPosition[]): string {
    let labelsHtml = '  <!-- Wire Labels -->\n  <g id="wire-labels">\n';

    wires.forEach((wire) => {
      if (wire.label) {
        // Use intelligent positioning
        const position = this.findOptimalLabelPosition(wire, components);
        const labelX = position.x;
        const labelY = position.y;
        
        // Estimate label width and add background rectangle (larger for bigger font)
        const labelWidth = wire.label.length * 14;
        const labelHeight = 28;
        labelsHtml += `    <rect x="${labelX - labelWidth / 2}" y="${labelY - 20}" width="${labelWidth}" height="${labelHeight}" fill="#FFFFFF" fill-opacity="0.95" stroke="#CCC" stroke-width="0.5"/>\n`;
        labelsHtml += `    <text class="wire-label" x="${labelX}" y="${labelY}" text-anchor="middle">${wire.label}</text>\n`;
        
        // Add polarity markings for DC wires (only if label exists to avoid duplicates)
        if (wire.type === 'DC' && wire.path.length >= 2) {
          const startPoint = wire.path[0];
          const endPoint = wire.path[wire.path.length - 1];
          
          // Only add polarity if wire is long enough (avoid clutter on short wires)
          const wireLength = Math.sqrt(
            Math.pow((endPoint.x - startPoint.x) * this.scale, 2) + 
            Math.pow((endPoint.y - startPoint.y) * this.scale, 2)
          );
          
          if (wireLength > 200) { // Only show on wires longer than 200 scaled units
            // + symbol at start (red) - offset slightly from wire end
            const startX = startPoint.x * this.scale;
            const startY = startPoint.y * this.scale;
            labelsHtml += `    <circle cx="${startX}" cy="${startY}" r="10" fill="#FFFFFF" stroke="#FF0000" stroke-width="2"/>\n`;
            labelsHtml += `    <text x="${startX}" y="${startY + 6}" text-anchor="middle" font-size="20" font-weight="bold" fill="#FF0000">+</text>\n`;
            
            // - symbol at end (black)
            const endX = endPoint.x * this.scale;
            const endY = endPoint.y * this.scale;
            labelsHtml += `    <circle cx="${endX}" cy="${endY}" r="10" fill="#FFFFFF" stroke="#000" stroke-width="2"/>\n`;
            labelsHtml += `    <text x="${endX}" y="${endY + 6}" text-anchor="middle" font-size="20" font-weight="bold" fill="#000">−</text>\n`;
          }
        }
      }
    });

    labelsHtml += '  </g>\n';
    return labelsHtml;
  }

  /**
   * Generate SVG path from points
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
   * Generate components
   */
  private generateComponents(
    components: ComponentPosition[],
    componentSvgs: Map<string, string>,
    equipmentSpecs?: EquipmentSpecs
  ): string {
    let componentsHtml = '  <!-- Components -->\n  <g id="components">\n';

    console.log('🔍 Generating components:', components.length);
    console.log('🔍 Available SVGs:', Array.from(componentSvgs.keys()));
    
    components.forEach((comp) => {
      const svgContent = componentSvgs.get(comp.componentType);
      console.log(`🔍 Component ${comp.componentType}: ${svgContent ? 'FOUND' : 'MISSING'}`);
      
      if (svgContent) {
        // Embed component SVG at position with proper dimensions
        const x = comp.x * this.scale;
        const y = comp.y * this.scale;
        const width = comp.width * this.scale;
        const height = comp.height * this.scale;
        
        // Extract viewBox from original SVG if it exists
        const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
        const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';
        
        // Extract the SVG content and wrap it with proper dimensions
        const content = this.extractSvgContent(svgContent);
        componentsHtml += `    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">\n`;
        componentsHtml += `      ${content}\n`;
        componentsHtml += `    </svg>\n`;
      } else {
        // Fallback: draw a placeholder rectangle
        componentsHtml += `    <rect x="${comp.x * this.scale}" y="${comp.y * this.scale}" width="${comp.width * this.scale}" height="${comp.height * this.scale}" fill="#F0F0F0" stroke="#000" stroke-width="${this.scale}"/>\n`;
        componentsHtml += `    <text x="${(comp.x + comp.width / 2) * this.scale}" y="${(comp.y + comp.height / 2) * this.scale}" text-anchor="middle" font-size="${18 * this.scale / 10}">${comp.componentType}</text>\n`;
      }
    });

    componentsHtml += '  </g>\n';
    
    // Add component labels AFTER components group (so they're not affected by component CSS)
    componentsHtml += '  <!-- Component Labels -->\n  <g id="component-labels">\n';
    
    components.forEach((comp) => {
      const x = comp.x * this.scale;
      const y = comp.y * this.scale;
      const width = comp.width * this.scale;
      const height = comp.height * this.scale;
      
      const componentName = this.getComponentName(comp.componentType);
      const specLabels = this.getComponentSpecLabels(comp.componentType, equipmentSpecs);
      
      // Component name (bold, readable) - optimized spacing
      const nameY = y + height + (20 * this.scale / 10);
      componentsHtml += `    <text x="${x + width / 2}" y="${nameY}" class="component-label" text-anchor="middle" font-size="17">${componentName}</text>\n`;
      
      // Specifications (multiple lines, clear, readable) - optimized spacing
      let currentY = nameY + (18 * this.scale / 10);
      specLabels.forEach((label: string, index: number) => {
        if (index < 3) { // Limit to 3 lines to reduce cramping
          componentsHtml += `    <text x="${x + width / 2}" y="${currentY}" class="component-spec" text-anchor="middle" font-size="14">${label}</text>\n`;
          currentY += (16 * this.scale / 10); // Increased from 14 to 16 for more breathing room
        }
      });
    });
    
    componentsHtml += '  </g>\n';
    
    return componentsHtml;
  }

  /**
   * Get component display name
   */
  private getComponentName(componentType: string): string {
    const names: Record<string, string> = {
      'SOLAR_STRING': 'Solar Array',
      'DC_COMBINER': 'DC Combiner',
      'DC_ISOLATOR': 'DC Isolator',
      'STRING_INVERTER': 'Inverter',
      'HYBRID_INVERTER': 'Hybrid Inverter',
      'AC_ISOLATOR': 'AC Isolator',
      'AC_BREAKER': 'AC Breaker',
      'AC_METER': 'AC Meter',
      'MAIN_SWITCHBOARD': 'Main Switchboard',
      'GRID_CONNECTION': 'Grid',
      'BATTERY': 'Battery',
    };
    return names[componentType] || componentType;
  }

  /**
   * Get component specification labels (enhanced with real data)
   */
  private getComponentSpecLabels(componentType: string, equipmentSpecs?: EquipmentSpecs): string[] {
    // If equipment specs provided, use enhanced labels
    if (equipmentSpecs) {
      const enhancedLabels = getEnhancedSpecLabel(componentType, equipmentSpecs);
      if (enhancedLabels.length > 0) {
        return enhancedLabels;
      }
    }
    
    // Fallback to generic specs
    const genericSpecs: Record<string, string[]> = {
      'SOLAR_STRING': ['600V DC | 10A'],
      'DC_COMBINER': ['600V DC | 40A'],
      'DC_ISOLATOR': ['600V DC | 32A | IP65'],
      'STRING_INVERTER': ['5kW | 230V AC'],
      'HYBRID_INVERTER': ['5kW | 230V AC'],
      'AC_ISOLATOR': ['250V | 32A'],
      'AC_BREAKER': ['MCB 25A | RCD 30mA Type B'],
      'AC_METER': ['230V | 100A | Bi-directional'],
      'MAIN_SWITCHBOARD': ['Main Switch: 63A'],
      'GRID_CONNECTION': ['230V AC Single Phase'],
      'BATTERY': ['51.2V | 100Ah'],
    };
    return genericSpecs[componentType] || [];
  }

  /**
   * Extract content from SVG string (remove outer svg tag)
   */
  private extractSvgContent(svgString: string): string {
    // Remove <?xml...?> declaration
    let content = svgString.replace(/<\?xml[^>]*\?>/g, '');
    
    // Extract content between <svg> tags
    const match = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return content;
  }

  /**
   * Generate specifications table
   */
  generateSpecificationsTable(specs: {
    systemSize: number;
    panelCount: number;
    inverterModel: string;
    batteryCapacity?: number;
    dcVoltage: number;
    dcCurrent: number;
    acVoltage: number;
    acCurrent: number;
    panelModel?: string;
    panelWattage?: number;
    stringsCount?: number;
    panelsPerString?: number;
    customerName?: string;
    customerAddress?: string;
    jobNumber?: string;
    designedBy?: string;
  }): string {
    // Position table AFTER the diagram area
    // Diagram uses 50% of working height + top margin
    const workingHeight = this.options.pageHeight - 20; // minus top/bottom margins
    const diagramHeight = workingHeight * 0.50;
    const tableY = (10 + diagramHeight + 10) * this.scale; // top margin + diagram + gap
    const tableX = 10 * this.scale;
    const tableWidth = (this.options.pageWidth - 20) * this.scale;
    const tableHeight = 70 * this.scale;

    let table = `  <!-- Specifications Table -->\n`;
    table += `  <g id="specifications">\n`;
    
    // Main border
    table += `    <rect x="${tableX}" y="${tableY}" width="${tableWidth}" height="${tableHeight}" fill="#FFFFFF" stroke="#000" stroke-width="2"/>\n`;
    
    // Left section: System Specifications
    const leftWidth = tableWidth * 0.65;
    const rightWidth = tableWidth * 0.35;
    
    // Section divider
    table += `    <line x1="${tableX + leftWidth}" y1="${tableY}" x2="${tableX + leftWidth}" y2="${tableY + tableHeight}" stroke="#000" stroke-width="1"/>\n`;
    
    // Left section header
    table += `    <rect x="${tableX}" y="${tableY}" width="${leftWidth}" height="${15 * this.scale}" fill="#E8E8E8" stroke="#000" stroke-width="1"/>\n`;
    table += `    <text x="${tableX + 5 * this.scale}" y="${tableY + 11 * this.scale}" class="component-label">System Specifications</text>\n`;
    
    // Modules and Strings
    let y = tableY + 25 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="component-label">Modules and Strings</text>\n`;
    y += 12 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">${specs.stringsCount || 2} Strings: ${specs.panelsPerString || Math.ceil(specs.panelCount / 2)} × ${specs.panelWattage || 400}W per string (${specs.panelModel || 'Solar Panel'})</text>\n`;
    
    // Inverters
    y += 15 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="component-label">Inverters</text>\n`;
    y += 12 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">${specs.inverterModel} | ${specs.systemSize}kW | Efficiency: 97.5% | Max Input: ${specs.dcVoltage}V DC</text>\n`;
    
    // Battery Storage (if applicable)
    if (specs.batteryCapacity) {
      y += 15 * this.scale;
      table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="component-label">Battery Storage (ESS)</text>\n`;
      y += 12 * this.scale;
      table += `    <text x="${tableX + 5 * this.scale}" y="${y}" class="spec-text">${specs.batteryCapacity}kWh | Voltage: ${specs.dcVoltage}V DC | Max Charge/Discharge: ${specs.acCurrent}A</text>\n`;
    }
    
    // Right section: Project Details
    const rightX = tableX + leftWidth;
    table += `    <rect x="${rightX}" y="${tableY}" width="${rightWidth}" height="${15 * this.scale}" fill="#E8E8E8" stroke="#000" stroke-width="1"/>\n`;
    table += `    <text x="${rightX + 5 * this.scale}" y="${tableY + 11 * this.scale}" class="component-label">Project Details</text>\n`;
    
    y = tableY + 25 * this.scale;
    table += `    <text x="${rightX + 5 * this.scale}" y="${y}" class="spec-text">System Size: ${specs.systemSize}kW</text>\n`;
    y += 12 * this.scale;
    table += `    <text x="${rightX + 5 * this.scale}" y="${y}" class="spec-text">Phases: ${specs.acVoltage >= 400 ? '3-Phase' : 'Single Phase'}</text>\n`;
    y += 12 * this.scale;
    table += `    <text x="${rightX + 5 * this.scale}" y="${y}" class="spec-text">AC Voltage: ${specs.acVoltage}V</text>\n`;
    y += 12 * this.scale;
    table += `    <text x="${rightX + 5 * this.scale}" y="${y}" class="spec-text">Max AC Current: ${specs.acCurrent.toFixed(1)}A</text>\n`;
    
    // Bottom section with Notes, Version Control, and Company Info
    const bottomY = tableY + tableHeight + 5 * this.scale;
    const bottomHeight = 35 * this.scale;
    
    // Bottom section border
    table += `    <rect x="${tableX}" y="${bottomY}" width="${tableWidth}" height="${bottomHeight}" fill="#FFFFFF" stroke="#000" stroke-width="2"/>\n`;
    
    // Divide into 3 columns: Notes (40%), Version Control (30%), Company (30%)
    const notesWidth = tableWidth * 0.4;
    const versionWidth = tableWidth * 0.3;
    const companyWidth = tableWidth * 0.3;
    
    // Column dividers
    table += `    <line x1="${tableX + notesWidth}" y1="${bottomY}" x2="${tableX + notesWidth}" y2="${bottomY + bottomHeight}" stroke="#000" stroke-width="1"/>\n`;
    table += `    <line x1="${tableX + notesWidth + versionWidth}" y1="${bottomY}" x2="${tableX + notesWidth + versionWidth}" y2="${bottomY + bottomHeight}" stroke="#000" stroke-width="1"/>\n`;
    
    // Notes section
    let noteY = bottomY + 12 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${noteY}" class="component-label">Notes:</text>\n`;
    noteY += 10 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${noteY}" class="spec-text">• Installation to AS/NZS 5033:2021</text>\n`;
    noteY += 8 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${noteY}" class="spec-text">• Wiring to AS/NZS 3000:2018</text>\n`;
    noteY += 8 * this.scale;
    table += `    <text x="${tableX + 5 * this.scale}" y="${noteY}" class="spec-text">• DC cables rated 1000V minimum</text>\n`;
    
    // Version Control section
    const versionX = tableX + notesWidth;
    let versionY = bottomY + 12 * this.scale;
    table += `    <text x="${versionX + 5 * this.scale}" y="${versionY}" class="component-label">Version Control:</text>\n`;
    versionY += 10 * this.scale;
    table += `    <text x="${versionX + 5 * this.scale}" y="${versionY}" class="spec-text">Design: ${specs.designedBy || 'SunDirect Power'}</text>\n`;
    versionY += 8 * this.scale;
    table += `    <text x="${versionX + 5 * this.scale}" y="${versionY}" class="spec-text">Ver: ${specs.jobNumber || 'V1.0'}</text>\n`;
    versionY += 8 * this.scale;
    const today = new Date().toLocaleDateString('en-AU');
    table += `    <text x="${versionX + 5 * this.scale}" y="${versionY}" class="spec-text">Date: ${today}</text>\n`;
    
    // Company & Customer section
    const companyX = tableX + notesWidth + versionWidth;
    let companyY = bottomY + 12 * this.scale;
    table += `    <text x="${companyX + 5 * this.scale}" y="${companyY}" class="component-label">Company & Certification:</text>\n`;
    companyY += 10 * this.scale;
    table += `    <text x="${companyX + 5 * this.scale}" y="${companyY}" class="spec-text">SunDirect Power Pty Ltd</text>\n`;
    companyY += 8 * this.scale;
    table += `    <text x="${companyX + 5 * this.scale}" y="${companyY}" class="spec-text">CEC Accredited | Lic: EC123456</text>\n`;
    companyY += 8 * this.scale;
    table += `    <text x="${companyX + 5 * this.scale}" y="${companyY}" class="spec-text">Customer: ${specs.customerName || 'N/A'}</text>\n`;
    
    // Add Legend section below
    const legendY = bottomY + bottomHeight + 10 * this.scale;
    table += `    <!-- Legend -->\n`;
    table += `    <text x="${tableX}" y="${legendY}" class="component-label">Legend:</text>\n`;
    table += `    <line x1="${tableX + 50 * this.scale}" y1="${legendY}" x2="${tableX + 80 * this.scale}" y2="${legendY}" stroke="#FF0000" stroke-width="3"/>\n`;
    table += `    <text x="${tableX + 85 * this.scale}" y="${legendY + 5}" class="spec-text">DC Wiring (Red)</text>\n`;
    table += `    <line x1="${tableX + 180 * this.scale}" y1="${legendY}" x2="${tableX + 210 * this.scale}" y2="${legendY}" stroke="#8B4513" stroke-width="3"/>\n`;
    table += `    <text x="${tableX + 215 * this.scale}" y="${legendY + 5}" class="spec-text">AC Wiring (Brown)</text>\n`;
    table += `    <text x="${tableX + 320 * this.scale}" y="${legendY + 5}" class="spec-text">⏚ = Earth Connection</text>\n`;
    table += `    <text x="${tableX + 450 * this.scale}" y="${legendY + 5}" class="spec-text">MCB = Miniature Circuit Breaker</text>\n`;
    table += `    <text x="${tableX + 620 * this.scale}" y="${legendY + 5}" class="spec-text">RCD = Residual Current Device</text>\n`;
    
    table += `  </g>\n`;
    
    return table;
  }
}

export default SvgGenerator;
