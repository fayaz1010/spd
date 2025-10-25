/**
 * Professional SLD Wiring Engine
 * Auto-routes wires between components with proper styling and labels
 */

import { ComponentPosition, Point } from './layout-engine';

export interface Wire {
  id: string;
  from: {
    componentId: string;
    connectionPoint: string;
  };
  to: {
    componentId: string;
    connectionPoint: string;
  };
  path: Point[];
  type: 'DC' | 'AC';
  voltage: number;
  current: number;
  label?: string;
  color: string;
  strokeWidth: number;
}

export interface WireLabel {
  text: string;
  position: Point;
  rotation: number;
}

export class SldWiringEngine {
  private wires: Wire[] = [];
  
  // AS/NZS 3000 Color Standards
  private readonly COLORS = {
    DC_POSITIVE: '#FF0000',  // Red
    DC_NEGATIVE: '#000000',  // Black
    AC_ACTIVE: '#8B4513',    // Brown
    AC_NEUTRAL: '#0000FF',   // Blue
    AC_EARTH: '#00FF00',     // Green/Yellow
  };

  /**
   * Create a wire connection between two components
   */
  createWire(
    from: ComponentPosition,
    to: ComponentPosition,
    options: {
      type: 'DC' | 'AC';
      voltage: number;
      current: number;
      polarity?: 'positive' | 'negative' | 'neutral' | 'earth';
      label?: string;
    }
  ): Wire {
    const wireId = `wire_${from.componentId}_to_${to.componentId}_${Date.now()}`;
    
    // Calculate path
    const path = this.calculateOrthogonalPath(from, to);
    
    // Determine color based on type and polarity
    let color = '#000000';
    if (options.type === 'DC') {
      color = options.polarity === 'positive' 
        ? this.COLORS.DC_POSITIVE 
        : this.COLORS.DC_NEGATIVE;
    } else {
      switch (options.polarity) {
        case 'positive':
          color = this.COLORS.AC_ACTIVE;
          break;
        case 'neutral':
          color = this.COLORS.AC_NEUTRAL;
          break;
        case 'earth':
          color = this.COLORS.AC_EARTH;
          break;
        default:
          color = this.COLORS.AC_ACTIVE;
      }
    }

    // Determine stroke width based on current
    const strokeWidth = this.calculateStrokeWidth(options.current);

    const wire: Wire = {
      id: wireId,
      from: {
        componentId: from.componentId,
        connectionPoint: 'output',
      },
      to: {
        componentId: to.componentId,
        connectionPoint: 'input',
      },
      path,
      type: options.type,
      voltage: options.voltage,
      current: options.current,
      label: options.label || this.generateWireLabel(options),
      color,
      strokeWidth,
    };

    this.wires.push(wire);
    return wire;
  }

  /**
   * Calculate orthogonal (right-angle) path between components
   */
  private calculateOrthogonalPath(
    from: ComponentPosition,
    to: ComponentPosition
  ): Point[] {
    // Start point (right side of 'from' component)
    const start: Point = {
      x: from.x + from.width,
      y: from.y + from.height / 2,
    };

    // End point (left side of 'to' component)
    const end: Point = {
      x: to.x,
      y: to.y + to.height / 2,
    };

    // Calculate midpoint for orthogonal routing
    const midX = (start.x + end.x) / 2;

    // Create path with right angles
    const path: Point[] = [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end,
    ];

    return path;
  }

  /**
   * Calculate stroke width based on current rating
   */
  private calculateStrokeWidth(current: number): number {
    if (current < 10) return 1.5;
    if (current < 20) return 2;
    if (current < 40) return 2.5;
    return 3;
  }

  /**
   * Generate automatic wire label
   */
  private generateWireLabel(options: {
    type: 'DC' | 'AC';
    voltage: number;
    current: number;
    polarity?: string;
  }): string {
    const voltageStr = `${options.voltage}V`;
    const currentStr = `${options.current}A`;
    const typeStr = options.type;
    
    return `${voltageStr} ${typeStr} ${currentStr}`;
  }

  /**
   * Create wire label positioned at midpoint
   */
  createWireLabel(wire: Wire): WireLabel {
    // Find midpoint of path
    const midIndex = Math.floor(wire.path.length / 2);
    const position = wire.path[midIndex];

    return {
      text: wire.label || '',
      position: {
        x: position.x,
        y: position.y - 5, // Offset above wire
      },
      rotation: 0,
    };
  }

  /**
   * Auto-wire a complete system
   */
  autoWireSystem(components: ComponentPosition[], systemConfig: {
    systemSize: number;
    dcVoltage: number;
    dcCurrent: number;
    acVoltage: number;
    acCurrent: number;
  }): Wire[] {
    const wires: Wire[] = [];

    // Find components by type
    const strings = components.filter(c => c.componentType === 'SOLAR_STRING');
    const dcCombiner = components.find(c => c.componentType === 'DC_COMBINER');
    const dcIsolator = components.find(c => c.componentType === 'DC_ISOLATOR');
    const inverter = components.find(c => 
      c.componentType === 'STRING_INVERTER' || c.componentType === 'HYBRID_INVERTER'
    );
    const acIsolator = components.find(c => c.componentType === 'AC_ISOLATOR');
    const acBreaker = components.find(c => c.componentType === 'AC_BREAKER');
    const acMeter = components.find(c => c.componentType === 'AC_METER');
    const switchboard = components.find(c => c.componentType === 'MAIN_SWITCHBOARD');
    const grid = components.find(c => c.componentType === 'GRID_CONNECTION');
    const battery = components.find(c => c.componentType === 'BATTERY');

    // DC Side Wiring
    if (strings.length > 0 && dcCombiner) {
      // Wire each string to combiner
      strings.forEach((string, index) => {
        wires.push(
          this.createWire(string, dcCombiner, {
            type: 'DC',
            voltage: systemConfig.dcVoltage,
            current: systemConfig.dcCurrent / strings.length,
            polarity: 'positive',
            label: `String ${index + 1}+`,
          })
        );
      });
    }

    if (dcCombiner && dcIsolator) {
      wires.push(
        this.createWire(dcCombiner, dcIsolator, {
          type: 'DC',
          voltage: systemConfig.dcVoltage,
          current: systemConfig.dcCurrent,
          polarity: 'positive',
          label: `2C × 6mm² + 1 × 6mm² E Cu V-90 ${systemConfig.dcVoltage}V DC (Conduit)`,
        })
      );
    }

    if (dcIsolator && inverter) {
      wires.push(
        this.createWire(dcIsolator, inverter, {
          type: 'DC',
          voltage: systemConfig.dcVoltage,
          current: systemConfig.dcCurrent,
          polarity: 'positive',
          label: `2C × 6mm² + 1 × 6mm² E Cu V-90 1000V DC (Conduit)`,
        })
      );
    }

    // Battery wiring (if hybrid inverter)
    if (battery && inverter && inverter.componentType === 'HYBRID_INVERTER') {
      wires.push(
        this.createWire(battery, inverter, {
          type: 'DC',
          voltage: 400, // Typical battery voltage
          current: 25,  // Typical battery current
          polarity: 'positive',
          label: 'Battery DC',
        })
      );
    }

    // AC Side Wiring
    if (inverter && acIsolator) {
      wires.push(
        this.createWire(inverter, acIsolator, {
          type: 'AC',
          voltage: systemConfig.acVoltage,
          current: systemConfig.acCurrent,
          polarity: 'positive',
          label: `3C × 4mm² + E Cu TPS ${systemConfig.acVoltage}V AC (Trunking)`,
        })
      );
    }

    if (acIsolator && acBreaker) {
      wires.push(
        this.createWire(acIsolator, acBreaker, {
          type: 'AC',
          voltage: systemConfig.acVoltage,
          current: systemConfig.acCurrent,
          polarity: 'positive',
          label: 'AC Output',
        })
      );
    }

    if (acBreaker && acMeter) {
      wires.push(
        this.createWire(acBreaker, acMeter, {
          type: 'AC',
          voltage: systemConfig.acVoltage,
          current: systemConfig.acCurrent,
          polarity: 'positive',
        })
      );
    }

    if (acMeter && switchboard) {
      wires.push(
        this.createWire(acMeter, switchboard, {
          type: 'AC',
          voltage: systemConfig.acVoltage,
          current: systemConfig.acCurrent,
          polarity: 'positive',
          label: 'To MSB',
        })
      );
    }

    if (switchboard && grid) {
      wires.push(
        this.createWire(switchboard, grid, {
          type: 'AC',
          voltage: systemConfig.acVoltage,
          current: systemConfig.acCurrent,
          polarity: 'positive',
          label: 'Grid Connection',
        })
      );
    }

    return wires;
  }

  /**
   * Generate SVG path string from points
   */
  generateSvgPath(points: Point[]): string {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return path;
  }

  /**
   * Get all wires
   */
  getWires(): Wire[] {
    return this.wires;
  }

  /**
   * Clear all wires
   */
  clearWires(): void {
    this.wires = [];
  }
}

export default SldWiringEngine;
