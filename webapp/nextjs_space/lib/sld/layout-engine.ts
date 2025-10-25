/**
 * Professional SLD Layout Engine
 * Positions components in zones with proper spacing and alignment
 */

export interface Point {
  x: number;
  y: number;
}

export interface ComponentPosition {
  componentId: string;
  componentType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zone: string;
}

export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  components: ComponentPosition[];
}

export interface LayoutConfig {
  pageWidth: number;
  pageHeight: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  zones: Zone[];
  spacing: {
    horizontal: number;
    vertical: number;
    component: number;
  };
}

export class SldLayoutEngine {
  private config: LayoutConfig;

  constructor(config?: Partial<LayoutConfig>) {
    // Default A4 Landscape layout - set basic config first
    const pageWidth = config?.pageWidth || 297; // mm
    const pageHeight = config?.pageHeight || 210; // mm
    const margins = config?.margins || {
      top: 25, // Increased from 10 to 25 for title and zone labels
      right: 10,
      bottom: 10,
      left: 10,
    };
    const spacing = config?.spacing || {
      horizontal: 40,
      vertical: 10,
      component: 10,
    };

    // Set config with basic values first
    this.config = {
      pageWidth,
      pageHeight,
      margins,
      spacing,
      zones: [], // Will be set below
    };

    // Now create zones (this.config is available)
    this.config.zones = config?.zones || this.createDefaultZones();
  }

  /**
   * Create default zone layout for residential solar system
   */
  private createDefaultZones(): Zone[] {
    const workingWidth = this.config.pageWidth - this.config.margins.left - this.config.margins.right;
    const workingHeight = this.config.pageHeight - this.config.margins.top - this.config.margins.bottom;
    
    const diagramHeight = workingHeight * 0.50; // 50% for diagram (reduced to prevent overflow)
    const specsHeight = workingHeight * 0.50; // 50% for specifications (increased for more info)

    return [
      {
        id: 'roof_array',
        name: 'Roof Array',
        x: this.config.margins.left,
        y: this.config.margins.top,
        width: workingWidth * 0.22, // Reduced from 0.25
        height: diagramHeight,
        components: [],
      },
      {
        id: 'dc_protection',
        name: 'DC Protection',
        x: this.config.margins.left + workingWidth * 0.22 + 8,
        y: this.config.margins.top,
        width: workingWidth * 0.14, // Slightly reduced
        height: diagramHeight,
        components: [],
      },
      {
        id: 'inverter',
        name: 'Inverter',
        x: this.config.margins.left + workingWidth * 0.36 + 16,
        y: this.config.margins.top,
        width: workingWidth * 0.20,
        height: diagramHeight * 0.6,
        components: [],
      },
      {
        id: 'battery',
        name: 'Battery Storage',
        x: this.config.margins.left + workingWidth * 0.36 + 16,
        y: this.config.margins.top + diagramHeight * 0.6 + 10,
        width: workingWidth * 0.20,
        height: diagramHeight * 0.4 - 10,
        components: [],
      },
      {
        id: 'ac_protection',
        name: 'AC Protection',
        x: this.config.margins.left + workingWidth * 0.56 + 24,
        y: this.config.margins.top,
        width: workingWidth * 0.20, // INCREASED from 0.15 to 0.20 (33% wider!)
        height: diagramHeight,
        components: [],
      },
      {
        id: 'grid',
        name: 'Grid Connection',
        x: this.config.margins.left + workingWidth * 0.76 + 32,
        y: this.config.margins.top,
        width: workingWidth * 0.24 - 32,
        height: diagramHeight,
        components: [],
      },
      {
        id: 'specifications',
        name: 'System Specifications',
        x: this.config.margins.left,
        y: this.config.margins.top + diagramHeight + 10,
        width: workingWidth,
        height: specsHeight - 10,
        components: [],
      },
    ];
  }

  /**
   * Position a component in a specific zone
   */
  positionComponent(
    componentType: string,
    zoneId: string,
    width: number,
    height: number,
    options?: {
      align?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
      offset?: Point;
    }
  ): ComponentPosition {
    const zone = this.config.zones.find((z) => z.id === zoneId);
    if (!zone) {
      throw new Error(`Zone ${zoneId} not found`);
    }

    const align = options?.align || 'center';
    const valign = options?.valign || 'middle';
    const offset = options?.offset || { x: 0, y: 0 };

    // Calculate position based on alignment
    let x = zone.x;
    let y = zone.y;

    // Horizontal alignment
    switch (align) {
      case 'left':
        x = zone.x + this.config.spacing.component;
        break;
      case 'center':
        x = zone.x + (zone.width - width) / 2;
        break;
      case 'right':
        x = zone.x + zone.width - width - this.config.spacing.component;
        break;
    }

    // Vertical alignment
    switch (valign) {
      case 'top':
        y = zone.y + this.config.spacing.component;
        break;
      case 'middle':
        y = zone.y + (zone.height - height) / 2;
        break;
      case 'bottom':
        y = zone.y + zone.height - height - this.config.spacing.component;
        break;
    }

    // Apply offset
    x += offset.x;
    y += offset.y;

    // NEVER auto-stack - we calculate positions explicitly
    // This prevents components from falling out of zones on regeneration

    const position: ComponentPosition = {
      componentId: `${componentType}_${Date.now()}`,
      componentType,
      x,
      y,
      width,
      height,
      rotation: 0,
      zone: zoneId,
    };

    zone.components.push(position);
    return position;
  }

  /**
   * Calculate optimal component size based on zone and number of components
   */
  private calculateOptimalSize(
    zoneId: string,
    componentCount: number,
    aspectRatio: number = 1.5 // width/height ratio
  ): { width: number; height: number } {
    const zone = this.getZone(zoneId);
    if (!zone) {
      return { width: 40, height: 30 };
    }

    // Calculate available space considering spacing
    const availableWidth = zone.width - (this.config.spacing.component * 2);
    const availableHeight = zone.height - (this.config.spacing.component * 2);
    
    // For stacked components, divide height by count
    const heightPerComponent = availableHeight / componentCount;
    const spacing = this.config.spacing.vertical;
    const effectiveHeight = heightPerComponent - spacing;
    
    // Calculate width based on aspect ratio
    let height = Math.min(effectiveHeight, availableWidth / aspectRatio);
    let width = height * aspectRatio;
    
    // Ensure components don't exceed zone width
    if (width > availableWidth) {
      width = availableWidth;
      height = width / aspectRatio;
    }
    
    // Minimum sizes for readability
    width = Math.max(width, 25);
    height = Math.max(height, 20);
    
    return { width, height };
  }

  /**
   * Auto-layout components based on system configuration
   */
  autoLayout(systemConfig: {
    strings: number;
    hasInverter: boolean;
    hasBattery: boolean;
    hasGrid: boolean;
  }): ComponentPosition[] {
    const positions: ComponentPosition[] = [];
    
    // Calculate optimal sizes for each zone
    const roofArraySize = this.calculateOptimalSize('roof_array', systemConfig.strings, 1.8);
    const dcProtectionSize = this.calculateOptimalSize('dc_protection', 2, 1.2);
    const inverterSize = this.calculateOptimalSize('inverter', 1, 1.3);
    const batterySize = this.calculateOptimalSize('battery', 1, 1.5);
    const acProtectionSize = this.calculateOptimalSize('ac_protection', 3, 1.2);
    const gridSize = this.calculateOptimalSize('grid', 2, 1.0);

    // 1. Position solar strings in roof array zone
    for (let i = 0; i < systemConfig.strings; i++) {
      positions.push(
        this.positionComponent('SOLAR_STRING', 'roof_array', roofArraySize.width, roofArraySize.height, {
          align: 'center',
          valign: 'top',
          offset: { x: 0, y: i * (roofArraySize.height + this.config.spacing.vertical) },
        })
      );
    }

    // 2. Position DC protection components
    positions.push(
      this.positionComponent('DC_COMBINER', 'dc_protection', dcProtectionSize.width, dcProtectionSize.height, {
        align: 'center',
        valign: 'top',
      })
    );
    positions.push(
      this.positionComponent('DC_ISOLATOR', 'dc_protection', dcProtectionSize.width, dcProtectionSize.height, {
        align: 'center',
        valign: 'middle',
      })
    );

    // 3. Position inverter
    if (systemConfig.hasInverter) {
      const inverterType = systemConfig.hasBattery ? 'HYBRID_INVERTER' : 'STRING_INVERTER';
      positions.push(
        this.positionComponent(inverterType, 'inverter', inverterSize.width, inverterSize.height, {
          align: 'center',
          valign: 'middle',
        })
      );
    }

    // 4. Position battery if present
    if (systemConfig.hasBattery) {
      positions.push(
        this.positionComponent('BATTERY', 'battery', batterySize.width, batterySize.height, {
          align: 'center',
          valign: 'middle',
        })
      );
    }

    // 5. Position AC protection
    positions.push(
      this.positionComponent('AC_ISOLATOR', 'ac_protection', acProtectionSize.width, acProtectionSize.height, {
        align: 'center',
        valign: 'top',
      })
    );
    positions.push(
      this.positionComponent('AC_BREAKER', 'ac_protection', acProtectionSize.width, acProtectionSize.height, {
        align: 'center',
        valign: 'middle',
      })
    );
    positions.push(
      this.positionComponent('AC_METER', 'ac_protection', acProtectionSize.width, acProtectionSize.height, {
        align: 'center',
        valign: 'bottom',
      })
    );

    // 6. Position grid connection
    if (systemConfig.hasGrid) {
      positions.push(
        this.positionComponent('MAIN_SWITCHBOARD', 'grid', gridSize.width, gridSize.height, {
          align: 'center',
          valign: 'top',
        })
      );
      positions.push(
        this.positionComponent('GRID_CONNECTION', 'grid', gridSize.width, gridSize.height, {
          align: 'center',
          valign: 'bottom',
        })
      );
    }

    return positions;
  }

  /**
   * Get zone by ID
   */
  getZone(zoneId: string): Zone | undefined {
    return this.config.zones.find((z) => z.id === zoneId);
  }

  /**
   * Get all zones
   */
  getZones(): Zone[] {
    return this.config.zones;
  }

  /**
   * Get layout configuration
   */
  getConfig(): LayoutConfig {
    return this.config;
  }

  /**
   * Calculate connection points between two components
   */
  calculateConnectionPath(from: ComponentPosition, to: ComponentPosition): Point[] {
    // Simple orthogonal routing (right-angle connections)
    const fromPoint: Point = {
      x: from.x + from.width,
      y: from.y + from.height / 2,
    };

    const toPoint: Point = {
      x: to.x,
      y: to.y + to.height / 2,
    };

    // Create orthogonal path
    const midX = (fromPoint.x + toPoint.x) / 2;

    return [
      fromPoint,
      { x: midX, y: fromPoint.y },
      { x: midX, y: toPoint.y },
      toPoint,
    ];
  }
}

export default SldLayoutEngine;
