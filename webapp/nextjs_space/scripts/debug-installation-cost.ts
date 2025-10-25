/**
 * DEBUG INSTALLATION COST
 * 
 * Check what installation items are being included
 */

import { calculateInstallationCost } from '../lib/installation-cost-calculator';

async function main() {
  console.log(`\nDEBUGGING INSTALLATION COST FOR 6.6kW SYSTEM\n`);
  
  const result = await calculateInstallationCost({
    systemSize: 6.9,
    panelCount: 16,
    hasBattery: false,
    batteryCapacity: 0,
    batteryType: 'dc_coupled',
    isRetrofit: false,
    storeys: 1,
    roofType: 'tile',
    roofPitch: 'standard',
    orientation: 'portrait',
    rakedCeilings: false,
    phases: 1,
    hasOptimisers: false,
    additionalInverters: 0,
    splits: 0,
    preferredProvider: 'SUBCONTRACTOR',
  });
  
  console.log(`Items included:\n`);
  result.items.forEach(item => {
    console.log(`  ${item.code} - ${item.name}`);
    console.log(`    Optional: ${item.isOptional}`);
    console.log(`    Cost: $${item.totalCost.toFixed(2)}`);
    console.log(``);
  });
  
  console.log(`\nTotal: $${result.total.toFixed(2)}`);
  console.log(`\n⚠️ Problem: Optional items are being included!`);
  console.log(`These should only be added when customer selects them.`);
}

main().catch(console.error);
