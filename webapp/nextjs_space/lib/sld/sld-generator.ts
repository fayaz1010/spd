/**
 * Professional SLD Generator Service
 * Main service that orchestrates layout, wiring, and SVG generation
 */

import { SldLayoutEngine, ComponentPosition } from './layout-engine';
import { SldWiringEngine, Wire } from './wiring-engine';
import { SvgGenerator } from './svg-generator';
import { EquipmentSpecs } from './component-specs-enhancer';

export interface JobData {
  jobId: string;
  jobNumber: string;
  systemSize: number;
  panelCount: number;
  inverterModel: string;
  batteryCapacity?: number;
  address: string;
  installationDate: string;
  panelModel?: string;
  panelWattage?: number;
  customerName?: string;
  customerAddress?: string;
  designedBy?: string;
  equipmentSpecs?: EquipmentSpecs; // Optional detailed equipment specifications
}

export interface SldGeneratorResult {
  svg: string;
  components: ComponentPosition[];
  wires: Wire[];
  metadata: {
    generatedAt: Date;
    jobId: string;
    systemSize: number;
  };
}

export class ProfessionalSldGenerator {
  private layoutEngine: SldLayoutEngine;
  private wiringEngine: SldWiringEngine;
  private svgGenerator: SvgGenerator;
  private componentSvgs: Map<string, string>;

  constructor() {
    this.layoutEngine = new SldLayoutEngine();
    this.wiringEngine = new SldWiringEngine();
    this.svgGenerator = new SvgGenerator({
      pageWidth: 297,
      pageHeight: 210,
      title: '', // No title - will be added by title block
      showZones: true,
      showGrid: false,
    });
    this.componentSvgs = new Map();
  }

  /**
   * Load SVG components from public folder
   */
  async loadComponents(): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    
    // Map component types to their SVG file paths
    const componentPaths: Record<string, string> = {
      'SOLAR_STRING': 'public/sld-components/generation/solar-string.svg',
      'DC_COMBINER': 'public/sld-components/dc/dc-combiner.svg',
      'DC_ISOLATOR': 'public/sld-components/dc/dc-isolator.svg',
      'STRING_INVERTER': 'public/sld-components/inverters/string-inverter.svg',
      'HYBRID_INVERTER': 'public/sld-components/inverters/hybrid-inverter.svg',
      'AC_ISOLATOR': 'public/sld-components/ac/ac-isolator.svg',
      'AC_BREAKER': 'public/sld-components/ac/ac-breaker.svg',
      'AC_METER': 'public/sld-components/ac/ac-meter.svg',
      'MAIN_SWITCHBOARD': 'public/sld-components/grid/main-switchboard.svg',
      'GRID_CONNECTION': 'public/sld-components/grid/grid-connection.svg',
      'BATTERY': 'public/sld-components/storage/battery.svg',
    };

    // Load each SVG file
    for (const [componentType, filePath] of Object.entries(componentPaths)) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        const svgContent = fs.readFileSync(fullPath, 'utf-8');
        this.componentSvgs.set(componentType, svgContent);
      } catch (error) {
        console.warn(`Failed to load component ${componentType} from ${filePath}:`, error);
        // Fallback to simple placeholder if file doesn't exist
        this.componentSvgs.set(componentType, this.createFallbackComponent(componentType));
      }
    }
  }

  /**
   * Create fallback component if SVG file is missing
   */
  private createFallbackComponent(type: string): string {
    const label = type.replace(/_/g, ' ');
    return `
      <svg viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#F0F0F0" stroke="#000" stroke-width="2" rx="3"/>
        <text x="50" y="55" text-anchor="middle" font-size="8" font-weight="bold">${label}</text>
      </svg>
    `;
  }

  /**
   * Generate complete SLD from job data
   */
  async generateSld(jobData: JobData): Promise<SldGeneratorResult> {
    // Load components if not already loaded
    if (this.componentSvgs.size === 0) {
      await this.loadComponents();
    }

    // Calculate electrical parameters (rounded for professional display)
    const stringsCount = Math.ceil(jobData.panelCount / 11); // 11 panels per string
    const panelWattage = 400; // Default panel wattage
    const dcVoltage = Math.round(panelWattage * 11 * 0.85); // Voc calculation, rounded
    const dcCurrent = 10 * stringsCount; // Isc per string
    const acVoltage = 230; // Standard AC voltage
    const acCurrent = Math.round((jobData.systemSize * 1000) / acVoltage); // Rounded to whole number

    // Auto-layout components
    const components = this.layoutEngine.autoLayout({
      strings: stringsCount,
      hasInverter: true,
      hasBattery: !!jobData.batteryCapacity,
      hasGrid: true,
    });

    // Auto-wire system
    const wires = this.wiringEngine.autoWireSystem(components, {
      systemSize: jobData.systemSize,
      dcVoltage,
      dcCurrent,
      acVoltage,
      acCurrent,
    });

    // Generate SVG
    const zones = this.layoutEngine.getZones();
    
    console.log('🎨 SLD Generation Debug:');
    console.log('  - Components:', components.length);
    console.log('  - Wires:', wires.length);
    console.log('  - Zones:', zones.length);
    console.log('  - Component SVGs loaded:', this.componentSvgs.size);
    
    let svg = this.svgGenerator.generateSvg(
      components,
      wires,
      zones,
      this.componentSvgs,
      jobData.equipmentSpecs
    );
    
    console.log('  - SVG length:', svg.length, 'characters');

    // Add specifications table with enhanced details
    const specsTable = this.svgGenerator.generateSpecificationsTable({
      systemSize: jobData.systemSize,
      panelCount: jobData.panelCount,
      inverterModel: jobData.inverterModel,
      batteryCapacity: jobData.batteryCapacity,
      dcVoltage,
      dcCurrent,
      acVoltage,
      acCurrent,
      panelModel: jobData.panelModel || 'Solar Panel',
      panelWattage: panelWattage,
      stringsCount: stringsCount,
      panelsPerString: Math.ceil(jobData.panelCount / stringsCount),
      customerName: jobData.customerName,
      customerAddress: jobData.customerAddress,
      jobNumber: jobData.jobNumber,
      designedBy: jobData.designedBy,
    });

    // Insert specs table before closing svg tag
    svg = svg.replace('</svg>', specsTable + '</svg>');

    return {
      svg,
      components,
      wires,
      metadata: {
        generatedAt: new Date(),
        jobId: jobData.jobId,
        systemSize: jobData.systemSize,
      },
    };
  }

  /**
   * Generate SLD and save to file (not available in Next.js API routes)
   */
  async generateAndSave(jobData: JobData, outputPath: string): Promise<string> {
    const result = await this.generateSld(jobData);
    
    // In Next.js, we can't write to filesystem from API routes
    // This method is for Node.js scripts only
    console.warn('generateAndSave not available in Next.js API routes');
    
    return outputPath;
  }

  /**
   * Generate SLD as base64 data URL
   */
  async generateAsDataUrl(jobData: JobData): Promise<string> {
    const result = await this.generateSld(jobData);
    const base64 = Buffer.from(result.svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}

// Export singleton instance
export const sldGenerator = new ProfessionalSldGenerator();

export default ProfessionalSldGenerator;
