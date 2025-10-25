import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reference prices from the provided list
const referencePrices = {
  // BASE SOLAR INSTALLATION
  solar_3_10kw: { rate: 0.25, unit: 'per watt', description: '3kW - 10.2kW System Installation' },
  solar_over_10kw: { rate: 0.28, unit: 'per watt', description: '10.2kW and over' },
  solar_under_3kw: { rate: 1300, unit: 'fixed', description: 'Below 3kW System' },
  
  // COMPLEXITY FACTORS
  double_storey: { rate: 350, unit: 'per storey', description: 'Double Storey ($100 per storey after)' },
  three_phase: { rate: 150, unit: 'fixed', description: '3 Phase - Up to 15m' },
  additional_inverter: { rate: 350, unit: 'each', description: 'Additional Inverter (Same Day)' },
  split: { rate: 85, unit: 'per split', description: 'Split (Every Split)' },
  optimiser: { rate: 10, unit: 'per panel', description: 'Optimiser - Installation Only' },
  steep_30_40: { rate: 30, unit: 'per panel', description: 'Steep Pitch (Above 30 - 40 Degrees)' },
  steep_40_50: { rate: 45, unit: 'per panel', description: 'Steep Pitch (Above 40 - 50 Degrees)' },
  bristile_slate: { rate: 10, unit: 'per panel', description: 'Bristile/Slate Tiles' },
  raked_ceilings: { rate: 200, unit: 'fixed', description: 'Raked Ceilings' },
  tilt_kit: { rate: 25, unit: 'per panel', description: 'Tilt Kit' },
  klip_lok: { rate: 25, unit: 'per panel', description: 'Klip Lok' },
  landscape: { rate: 30, unit: 'per panel', description: 'Landscape' },
  
  // METERS & INSPECTIONS
  smart_meter_1p: { rate: 150, unit: 'fixed', description: 'Single Phase Smart Meter - Installation Only' },
  smart_meter_3p: { rate: 200, unit: 'fixed', description: 'Three Phase Smart Meter - Installation Only' },
  solar_inspection: { rate: 200, unit: 'fixed', description: 'Solar Site Inspection' },
  battery_inspection: { rate: 250, unit: 'fixed', description: 'Battery Site Inspection' },
  
  // EXTRAS
  extra_labour: { rate: 1000, unit: 'per day', description: 'Extra days Labour (per day)' },
  rcd_rcbo: { rate: 150, unit: 'each', description: 'RCD, RCBO - Changeovers' },
  enclosures: { rate: 95, unit: 'each', description: '4CC1 - 4CC4 Enclosures' },
  main_switch: { rate: 100, unit: 'each', description: 'Main Switch Changeovers' },
  travel: { rate: 3, unit: 'per km', description: 'Travel Per Km (50km from HQ each way)' },
  system_removal: { rate: 20, unit: 'per panel', description: 'System Removal' },
  revisit: { rate: 250, unit: 'fixed', description: 'Re-Visit' },
  external_board: { rate: 250, unit: 'fixed', description: 'External Board' },
  
  // BATTERY INSTALLATION
  battery_dc_with_solar: { rate: 1000, unit: 'fixed', description: 'DC coupled battery with solar (same day)' },
  battery_ac_with_solar: { rate: 1300, unit: 'fixed', description: 'AC coupled battery with solar (same day)' },
  battery_dc_retrofit: { rate: 1300, unit: 'fixed', description: 'DC coupled without solar (retrofit)' },
  battery_ac_retrofit: { rate: 1600, unit: 'fixed', description: 'AC coupled without solar (retrofit)' },
  battery_expansion: { rate: 300, unit: 'per module', description: 'DC coupled battery expansion per module' },
  backup_installation: { rate: 750, unit: 'fixed', description: 'Backup installation (1x backup box + 2x circuits)' },
  bollard: { rate: 150, unit: 'fixed', description: 'Bollard' },
  form_ply: { rate: 250, unit: 'per sheet', description: 'Form Ply' },
  cancellation: { rate: 250, unit: 'fixed', description: 'Cancellation - Once Booked' },
};

async function main() {
  console.log('📊 INSTALLATION PRICE COMPARISON\n');
  console.log('='.repeat(80));

  const dbItems = await prisma.installationCostItem.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  console.log(`\nDatabase Items: ${dbItems.length}`);
  console.log(`Reference Items: ${Object.keys(referencePrices).length}\n`);

  console.log('='.repeat(80));
  console.log('\n🔍 CURRENT DATABASE vs REFERENCE PRICES:\n');

  dbItems.forEach(item => {
    console.log(`${item.name}:`);
    console.log(`  DB: $${item.baseRate} (${item.calculationType})`);
    console.log(`  Filters: ${JSON.stringify({
      roofType: item.roofType,
      phases: item.phases,
      hasBattery: item.hasBattery,
      isOptional: item.isOptional,
    })}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('\n📋 REQUIRED ITEMS (Should be in database):\n');

  const required = [
    '✅ ESSENTIAL:',
    '  - Solar Installation: $0.25/watt (3-10kW) or $0.28/watt (>10kW)',
    '  - Inverter: $300 (1P) or $650 (3P) [We have this]',
    '  - Battery Base: $1,000-$1,300 (DC/AC coupled)',
    '  - Battery per kWh: $50/kWh [We have $50, should verify]',
    '  - Regulatory: $500 [We have this]',
    '',
    '✅ COMPLEXITY (Conditional):',
    '  - Tile Roof: $350 [We have this]',
    '  - Double Storey: $350 first, $100 per additional',
    '  - 3 Phase: $150 extra',
    '  - Steep Pitch 30-40°: $30/panel',
    '  - Steep Pitch 40-50°: $45/panel',
    '  - Klip Lok: $25/panel',
    '  - Landscape: $30/panel',
    '  - Raked Ceilings: $200',
    '',
    '⚠️  OPTIONAL (Should NOT auto-apply):',
    '  - Optimisers: $10/panel',
    '  - Additional Inverter: $350',
    '  - Splits: $85 each',
    '  - Site Inspection: $200-$250',
    '  - Smart Meter: $150-$200',
    '  - Backup Installation: $750',
    '  - System Removal: $20/panel',
  ];

  required.forEach(line => console.log(line));

  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 RECOMMENDATIONS:\n');

  console.log('1. UPDATE Solar Installation Rates:');
  console.log('   ❌ Current: $0.25/watt (all systems)');
  console.log('   ✅ Should be: $0.25/watt (3-10kW), $0.28/watt (>10kW), $1,300 (<3kW)');
  
  console.log('\n2. UPDATE Battery Installation:');
  console.log('   ❌ Current: $800 base + $50/kWh');
  console.log('   ✅ Should be: $1,000-$1,300 base (DC/AC) + verify per kWh rate');
  
  console.log('\n3. ADD Missing Complexity Factors:');
  console.log('   - Double Storey: $350 + $100 per additional');
  console.log('   - Steep Pitch: $30-$45/panel');
  console.log('   - Klip Lok: $25/panel');
  console.log('   - Landscape: $30/panel');
  console.log('   - Raked Ceilings: $200');
  
  console.log('\n4. ADD Optional Items (marked as optional):');
  console.log('   - Optimisers: $10/panel');
  console.log('   - Additional Inverter: $350');
  console.log('   - Splits: $85 each');
  console.log('   - Site Inspections: $200-$250');
  console.log('   - Smart Meter: $150-$200');
  console.log('   - Backup Installation: $750');
  
  console.log('\n5. REMOVE from auto-apply:');
  console.log('   - EV Charger (should be optional add-on)');

  console.log('\n' + '='.repeat(80));
}

main()
  .finally(() => prisma.$disconnect());
