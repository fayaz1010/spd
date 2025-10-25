import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to read SVG files
function readSvg(filePath: string): string {
  const fullPath = path.join(process.cwd(), 'public', filePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

const sldComponents = [
  // ============================================
  // GENERATION COMPONENTS
  // ============================================
  {
    componentType: 'SOLAR_PANEL',
    name: 'solar_panel',
    displayName: 'Solar Panel',
    category: 'generation',
    svgPath: '/sld-components/generation/solar-panel.svg',
    svgContent: '', // Will be populated
    viewBox: '0 0 100 80',
    defaultWidth: 100,
    defaultHeight: 80,
    minWidth: 60,
    maxWidth: 150,
    aspectRatio: 1.25,
    connectionPoints: [
      { id: 'positive', x: 95, y: 30, type: 'output', side: 'right', label: '+' },
      { id: 'negative', x: 95, y: 50, type: 'output', side: 'right', label: '-' }
    ],
    labelConfig: {
      positions: {
        primary: { x: 50, y: -5 },
        secondary: { x: 50, y: 85 },
        technical: { x: 50, y: 95 }
      },
      styles: {
        primary: { fontSize: 10, fontWeight: 'bold', textAnchor: 'middle' },
        secondary: { fontSize: 9, textAnchor: 'middle' },
        technical: { fontSize: 8, textAnchor: 'middle', fill: '#666' }
      }
    },
    standard: 'IEC 60617',
    symbolCode: 'IEC-60617-02-05',
    defaultColors: {
      fill: '#FFF8DC',
      stroke: '#000000',
      highlight: '#FFD700',
      text: '#000000'
    },
    strokeWidth: 2,
    description: 'Standard solar PV panel symbol with cell grid',
    sortOrder: 1
  },

  // ============================================
  // DC PROTECTION COMPONENTS
  // ============================================
  {
    componentType: 'DC_ISOLATOR',
    name: 'dc_isolator',
    displayName: 'DC Isolator',
    category: 'dc_protection',
    svgPath: '/sld-components/dc/dc-isolator.svg',
    svgContent: '',
    viewBox: '0 0 80 60',
    defaultWidth: 80,
    defaultHeight: 60,
    minWidth: 60,
    maxWidth: 120,
    aspectRatio: 1.33,
    connectionPoints: [
      { id: 'input', x: 5, y: 30, type: 'input', side: 'left', label: 'IN' },
      { id: 'output', x: 75, y: 30, type: 'output', side: 'right', label: 'OUT' }
    ],
    labelConfig: {
      positions: {
        primary: { x: 40, y: -5 },
        secondary: { x: 40, y: 70 },
        technical: { x: 40, y: 80 }
      },
      styles: {
        primary: { fontSize: 10, fontWeight: 'bold', textAnchor: 'middle' },
        secondary: { fontSize: 8, textAnchor: 'middle' },
        technical: { fontSize: 7, textAnchor: 'middle', fill: '#666' }
      }
    },
    standard: 'IEC 60617',
    symbolCode: 'IEC-60617-07-15',
    defaultColors: {
      fill: '#F5F5F5',
      stroke: '#000000',
      highlight: '#FFD700',
      text: '#000000'
    },
    strokeWidth: 2,
    description: 'DC isolator switch with lockable mechanism',
    sortOrder: 10
  },

  // ============================================
  // INVERTER COMPONENTS
  // ============================================
  {
    componentType: 'STRING_INVERTER',
    name: 'string_inverter',
    displayName: 'String Inverter',
    category: 'conversion',
    svgPath: '/sld-components/inverters/string-inverter.svg',
    svgContent: '',
    viewBox: '0 0 120 100',
    defaultWidth: 120,
    defaultHeight: 100,
    minWidth: 100,
    maxWidth: 180,
    aspectRatio: 1.2,
    connectionPoints: [
      { id: 'dc_positive', x: 5, y: 35, type: 'input', side: 'left', label: 'DC+' },
      { id: 'dc_negative', x: 5, y: 45, type: 'input', side: 'left', label: 'DC-' },
      { id: 'ac_live', x: 115, y: 35, type: 'output', side: 'right', label: 'L' },
      { id: 'ac_neutral', x: 115, y: 45, type: 'output', side: 'right', label: 'N' },
      { id: 'ac_earth', x: 115, y: 55, type: 'output', side: 'right', label: 'E' }
    ],
    labelConfig: {
      positions: {
        primary: { x: 60, y: -5 },
        secondary: { x: 60, y: 105 },
        technical: { x: 60, y: 115 }
      },
      styles: {
        primary: { fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' },
        secondary: { fontSize: 9, textAnchor: 'middle' },
        technical: { fontSize: 8, textAnchor: 'middle', fill: '#666' }
      }
    },
    standard: 'IEC 60617',
    symbolCode: 'IEC-60617-04-01',
    defaultColors: {
      fill: '#E6F3FF',
      stroke: '#000000',
      highlight: '#4A90E2',
      text: '#000000'
    },
    strokeWidth: 2,
    description: 'String inverter with DC to AC conversion',
    sortOrder: 20
  },

  // ============================================
  // AC PROTECTION COMPONENTS
  // ============================================
  {
    componentType: 'AC_ISOLATOR',
    name: 'ac_isolator',
    displayName: 'AC Isolator',
    category: 'ac_protection',
    svgPath: '/sld-components/ac/ac-isolator.svg',
    svgContent: '',
    viewBox: '0 0 80 60',
    defaultWidth: 80,
    defaultHeight: 60,
    minWidth: 60,
    maxWidth: 120,
    aspectRatio: 1.33,
    connectionPoints: [
      { id: 'input', x: 5, y: 30, type: 'input', side: 'left', label: 'IN' },
      { id: 'output', x: 75, y: 30, type: 'output', side: 'right', label: 'OUT' }
    ],
    labelConfig: {
      positions: {
        primary: { x: 40, y: -5 },
        secondary: { x: 40, y: 70 },
        technical: { x: 40, y: 80 }
      },
      styles: {
        primary: { fontSize: 10, fontWeight: 'bold', textAnchor: 'middle' },
        secondary: { fontSize: 8, textAnchor: 'middle' },
        technical: { fontSize: 7, textAnchor: 'middle', fill: '#666' }
      }
    },
    standard: 'IEC 60617',
    symbolCode: 'IEC-60617-07-15',
    defaultColors: {
      fill: '#FFE6E6',
      stroke: '#000000',
      highlight: '#FF6B6B',
      text: '#000000'
    },
    strokeWidth: 2,
    description: 'AC isolator switch',
    sortOrder: 30
  },

  // ============================================
  // GRID COMPONENTS
  // ============================================
  {
    componentType: 'MAIN_SWITCHBOARD',
    name: 'main_switchboard',
    displayName: 'Main Switchboard',
    category: 'grid',
    svgPath: '/sld-components/grid/main-switchboard.svg',
    svgContent: '',
    viewBox: '0 0 100 120',
    defaultWidth: 100,
    defaultHeight: 120,
    minWidth: 80,
    maxWidth: 150,
    aspectRatio: 0.83,
    connectionPoints: [
      { id: 'input', x: 5, y: 60, type: 'input', side: 'left', label: 'IN' },
      { id: 'output_1', x: 95, y: 40, type: 'output', side: 'right', label: 'OUT1' },
      { id: 'output_2', x: 95, y: 60, type: 'output', side: 'right', label: 'OUT2' },
      { id: 'output_3', x: 95, y: 80, type: 'output', side: 'right', label: 'OUT3' }
    ],
    labelConfig: {
      positions: {
        primary: { x: 50, y: -5 },
        secondary: { x: 50, y: 130 },
        technical: { x: 50, y: 140 }
      },
      styles: {
        primary: { fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' },
        secondary: { fontSize: 9, textAnchor: 'middle' },
        technical: { fontSize: 8, textAnchor: 'middle', fill: '#666' }
      }
    },
    standard: 'AS/NZS 3000',
    symbolCode: 'AS3000-SWITCHBOARD',
    defaultColors: {
      fill: '#F0F0F0',
      stroke: '#000000',
      highlight: '#4CAF50',
      text: '#000000'
    },
    strokeWidth: 2,
    description: 'Main electrical switchboard',
    sortOrder: 40
  },

  // ============================================
  // BATTERY COMPONENTS
  // ============================================
  {
    componentType: 'BATTERY',
    name: 'battery',
    displayName: 'Battery Storage',
    category: 'storage',
    svgPath: '/sld-components/storage/battery.svg',
    svgContent: '',
    viewBox: '0 0 80 100',
    defaultWidth: 80,
    defaultHeight: 100,
    minWidth: 60,
    maxWidth: 120,
    aspectRatio: 0.8,
    connectionPoints: [
      { id: 'positive', x: 40, y: 5, type: 'output', side: 'top', label: '+' },
      { id: 'negative', x: 40, y: 95, type: 'output', side: 'bottom', label: '-' }
    ],
    labelConfig: {
      positions: {
        primary: { x: 40, y: -10 },
        secondary: { x: 40, y: 110 },
        technical: { x: 40, y: 120 }
      },
      styles: {
        primary: { fontSize: 10, fontWeight: 'bold', textAnchor: 'middle' },
        secondary: { fontSize: 9, textAnchor: 'middle' },
        technical: { fontSize: 8, textAnchor: 'middle', fill: '#666' }
      }
    },
    standard: 'IEC 60617',
    symbolCode: 'IEC-60617-06-03',
    defaultColors: {
      fill: '#FFFACD',
      stroke: '#000000',
      highlight: '#FFD700',
      text: '#000000'
    },
    strokeWidth: 2,
    description: 'Battery storage system',
    sortOrder: 50
  },
];

async function seedSldComponents() {
  console.log('🎨 Seeding SLD Components...');

  for (const component of sldComponents) {
    try {
      // Read SVG content if path exists
      if (component.svgPath) {
        try {
          component.svgContent = readSvg(component.svgPath);
        } catch (error) {
          console.warn(`⚠️  SVG file not found: ${component.svgPath}, using placeholder`);
          component.svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${component.viewBox}"><rect x="10" y="10" width="80" height="60" fill="#f0f0f0" stroke="#000" stroke-width="2"/><text x="50" y="50" text-anchor="middle">${component.displayName}</text></svg>`;
        }
      }

      await prisma.sldComponent.upsert({
        where: { name: component.name },
        update: component as any,
        create: component as any,
      });

      console.log(`✅ ${component.displayName}`);
    } catch (error) {
      console.error(`❌ Error seeding ${component.displayName}:`, error);
    }
  }

  console.log('✅ SLD Components seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  seedSldComponents()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedSldComponents };
