import { calculateUnifiedQuote } from '../lib/unified-quote-calculator';

async function main() {
  console.log('\nTracing 6.6kW calculation:\n');
  
  const quote = await calculateUnifiedQuote({
    systemSizeKw: 6.6,
    batterySizeKwh: 0,
    postcode: '6000',
    region: 'WA',
    includeInstallation: true,
  });
  
  console.log('Selected Panel:', quote.selectedPanel.name);
  console.log('  Wattage:', quote.selectedPanel.wattage);
  console.log('  Unit Cost:', quote.selectedPanel.unitCost);
  console.log('  Retail Price:', quote.selectedPanel.retailPrice);
  console.log('  Count:', quote.panelCount);
  console.log('  Total:', quote.costs.panelCost);
  console.log('  Calculation:', `${quote.panelCount} × $${quote.selectedPanel.unitCost} = $${quote.panelCount * quote.selectedPanel.unitCost}`);
  
  console.log('\nSelected Inverter:', quote.selectedInverter.name);
  console.log('  Unit Cost:', quote.selectedInverter.unitCost);
  console.log('  Retail Price:', quote.selectedInverter.retailPrice);
  console.log('  Total:', quote.costs.inverterCost);
  
  console.log('\n⚠️ The calculator is using:', quote.selectedPanel.retailPrice > quote.selectedPanel.unitCost ? 'RETAIL PRICE' : 'UNIT COST');
}

main();
