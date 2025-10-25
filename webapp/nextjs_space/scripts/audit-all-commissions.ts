/**
 * COMPLETE COMMISSION AUDIT SCRIPT
 * 
 * This script audits ALL possible sources of commission/markup in the system:
 * 1. System Settings (subbieCommissionPercent, internalMarginPercent)
 * 2. Product Markups (defaultPanelMarkup, defaultBatteryMarkup, defaultInverterMarkup)
 * 3. Supplier Product Markups (markupPercent, retailPrice vs unitCost)
 * 4. Installation Pricing (hardcoded margins in calculator)
 * 5. InstallationPricing table (internalMarginPercent, subbieCommissionPercent)
 * 
 * Run with: npx tsx scripts/audit-all-commissions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`\n${'█'.repeat(100)}`);
  console.log(`█  COMPLETE COMMISSION & MARKUP AUDIT`);
  console.log(`█  Checking ALL sources of commission/markup in the system`);
  console.log(`${'█'.repeat(100)}\n`);
  
  // ============================================================================
  // SOURCE 1: System Settings
  // ============================================================================
  console.log(`\n${'═'.repeat(100)}`);
  console.log(`SOURCE 1: SYSTEM SETTINGS TABLE`);
  console.log(`${'═'.repeat(100)}\n`);
  
  const systemSettings = await prisma.systemSettings.findFirst();
  
  if (systemSettings) {
    console.log(`✅ System Settings Found:\n`);
    
    console.log(`Product Markups (Fallback when no supplier mapping):`);
    console.log(`  Default Panel Markup: ${systemSettings.defaultPanelMarkup}%`);
    console.log(`  Default Battery Markup: ${systemSettings.defaultBatteryMarkup}%`);
    console.log(`  Default Inverter Markup: ${systemSettings.defaultInverterMarkup}%`);
    console.log(``);
    
    console.log(`Installation Commission:`);
    console.log(`  Subbie Commission: ${systemSettings.subbieCommissionPercent || 'NOT SET'}%`);
    console.log(`  Internal Margin: ${systemSettings.internalMarginPercent || 'NOT SET'}%`);
    console.log(``);
    
    console.log(`Supplier Selection Strategy: ${systemSettings.supplierStrategy}`);
    console.log(`Commission Weight: ${(systemSettings.commissionWeight * 100).toFixed(0)}%`);
    
    if (systemSettings.defaultPanelMarkup > 20 || 
        systemSettings.defaultBatteryMarkup > 20 || 
        systemSettings.defaultInverterMarkup > 20) {
      console.log(`\n⚠️ WARNING: Product markups are HIGH (>20%)`);
      console.log(`   These are applied when no supplier product mapping exists.`);
    }
    
    if (systemSettings.subbieCommissionPercent && systemSettings.subbieCommissionPercent > 0) {
      console.log(`\n⚠️ COMMISSION CONFIGURED: ${systemSettings.subbieCommissionPercent}%`);
      console.log(`   This may be applied to installation costs.`);
    }
  } else {
    console.log(`❌ No system settings found`);
  }
  
  // ============================================================================
  // SOURCE 2: Supplier Product Markups
  // ============================================================================
  console.log(`\n\n${'═'.repeat(100)}`);
  console.log(`SOURCE 2: SUPPLIER PRODUCT MARKUPS`);
  console.log(`${'═'.repeat(100)}\n`);
  
  const supplierProducts = await prisma.supplierProduct.findMany({
    where: { isActive: true },
    include: {
      product: true,
      supplier: true,
    },
    orderBy: { unitCost: 'asc' },
  });
  
  console.log(`Found ${supplierProducts.length} active supplier products\n`);
  
  const productTypes = {
    PANEL: [] as any[],
    INVERTER: [] as any[],
    BATTERY: [] as any[],
  };
  
  supplierProducts.forEach(sp => {
    const productType = sp.product.productType as keyof typeof productTypes;
    if (productTypes[productType]) {
      const markup = sp.retailPrice && sp.unitCost > 0 
        ? ((sp.retailPrice - sp.unitCost) / sp.unitCost * 100)
        : 0;
      
      productTypes[productType].push({
        name: sp.product.name,
        supplier: sp.supplier.name,
        unitCost: sp.unitCost,
        retailPrice: sp.retailPrice || 0,
        markupPercent: sp.markupPercent || 0,
        calculatedMarkup: markup,
      });
    }
  });
  
  // Show panels
  console.log(`PANELS (${productTypes.PANEL.length} products):`);
  productTypes.PANEL.slice(0, 5).forEach(p => {
    console.log(`  ${p.name} (${p.supplier})`);
    console.log(`    Unit Cost: $${p.unitCost.toFixed(2)}`);
    console.log(`    Retail Price: $${p.retailPrice.toFixed(2)}`);
    console.log(`    Markup in DB: ${p.markupPercent.toFixed(1)}%`);
    console.log(`    Calculated Markup: ${p.calculatedMarkup.toFixed(1)}%`);
    
    if (p.calculatedMarkup > 30) {
      console.log(`    ⚠️ HIGH MARKUP (>30%)`);
    }
  });
  
  console.log(``);
  
  // Show inverters
  console.log(`INVERTERS (${productTypes.INVERTER.length} products):`);
  productTypes.INVERTER.slice(0, 5).forEach(p => {
    console.log(`  ${p.name} (${p.supplier})`);
    console.log(`    Unit Cost: $${p.unitCost.toFixed(2)}`);
    console.log(`    Retail Price: $${p.retailPrice.toFixed(2)}`);
    console.log(`    Markup in DB: ${p.markupPercent.toFixed(1)}%`);
    console.log(`    Calculated Markup: ${p.calculatedMarkup.toFixed(1)}%`);
    
    if (p.calculatedMarkup > 30) {
      console.log(`    ⚠️ HIGH MARKUP (>30%)`);
    }
  });
  
  console.log(``);
  
  // Show batteries
  console.log(`BATTERIES (${productTypes.BATTERY.length} products):`);
  productTypes.BATTERY.slice(0, 5).forEach(p => {
    console.log(`  ${p.name} (${p.supplier})`);
    console.log(`    Unit Cost: $${p.unitCost.toFixed(2)}`);
    console.log(`    Retail Price: $${p.retailPrice.toFixed(2)}`);
    console.log(`    Markup in DB: ${p.markupPercent.toFixed(1)}%`);
    console.log(`    Calculated Markup: ${p.calculatedMarkup.toFixed(1)}%`);
    
    if (p.calculatedMarkup > 30) {
      console.log(`    ⚠️ HIGH MARKUP (>30%)`);
    }
  });
  
  // ============================================================================
  // SOURCE 3: Installation Pricing Table
  // ============================================================================
  console.log(`\n\n${'═'.repeat(100)}`);
  console.log(`SOURCE 3: INSTALLATION PRICING TABLE`);
  console.log(`${'═'.repeat(100)}\n`);
  
  const installationPricing = await prisma.installationPricing.findFirst({
    where: { region: 'WA' },
  });
  
  if (installationPricing) {
    console.log(`✅ Installation Pricing Found (Region: WA):\n`);
    
    console.log(`Commission Settings:`);
    console.log(`  Internal Margin: ${installationPricing.internalMarginPercent || 'NOT SET'}%`);
    console.log(`  Subbie Commission: ${installationPricing.subbieCommissionPercent || 'NOT SET'}%`);
    console.log(``);
    
    console.log(`Base Rates:`);
    console.log(`  Base Callout Fee: $${installationPricing.baseCalloutFee}`);
    console.log(`  Hourly Rate: $${installationPricing.hourlyRate}`);
    console.log(`  Panel Install Per Unit: $${installationPricing.panelInstallPerUnit}`);
    console.log(`  Inverter Install: $${installationPricing.inverterInstall}`);
    console.log(`  Battery Install Base: $${installationPricing.batteryInstallBase}`);
    console.log(`  Battery Install Per kWh: $${installationPricing.batteryInstallPerKwh}`);
    
    if (installationPricing.internalMarginPercent && installationPricing.internalMarginPercent > 0) {
      console.log(`\n⚠️ INTERNAL MARGIN CONFIGURED: ${installationPricing.internalMarginPercent}%`);
    }
    
    if (installationPricing.subbieCommissionPercent && installationPricing.subbieCommissionPercent > 0) {
      console.log(`\n⚠️ SUBBIE COMMISSION CONFIGURED: ${installationPricing.subbieCommissionPercent}%`);
    }
  } else {
    console.log(`❌ No installation pricing found for WA`);
  }
  
  // ============================================================================
  // SOURCE 4: Hardcoded Margins in Calculator
  // ============================================================================
  console.log(`\n\n${'═'.repeat(100)}`);
  console.log(`SOURCE 4: HARDCODED MARGINS IN CALCULATOR CODE`);
  console.log(`${'═'.repeat(100)}\n`);
  
  console.log(`Checking unified-quote-calculator.ts for hardcoded margins...\n`);
  
  console.log(`Line 339: const wholesaleCost = ... + (installationCost * 0.7);`);
  console.log(`  ⚠️ HARDCODED: Assumes 30% installation margin`);
  console.log(`  This means: If installation cost is $3,000, wholesale is calculated as $2,100`);
  console.log(`  Implied profit: $900 (30%)`);
  console.log(``);
  
  console.log(`Line 159-162 in /api/calculate-unified-quote/route.ts:`);
  console.log(`  installationMethod: 'allin'`);
  console.log(`  installationMarginPercent: 15`);
  console.log(`  useConservativePricing: true`);
  console.log(`  ⚠️ HARDCODED: 15% commission for public calculators`);
  
  // ============================================================================
  // SOURCE 5: InstallationCostItem Table
  // ============================================================================
  console.log(`\n\n${'═'.repeat(100)}`);
  console.log(`SOURCE 5: INSTALLATION COST ITEMS (New System)`);
  console.log(`${'═'.repeat(100)}\n`);
  
  const costItems = await prisma.installationCostItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });
  
  console.log(`Found ${costItems.length} active installation cost items\n`);
  
  const categories = {
    BASE: [] as any[],
    COMPLEXITY: [] as any[],
    LABOR: [] as any[],
    EQUIPMENT: [] as any[],
    RENTAL: [] as any[],
    REGULATORY: [] as any[],
  };
  
  costItems.forEach(item => {
    const cat = item.category as keyof typeof categories;
    if (categories[cat]) {
      categories[cat].push(item);
    }
  });
  
  Object.entries(categories).forEach(([category, items]) => {
    if (items.length > 0) {
      console.log(`${category} (${items.length} items):`);
      items.forEach(item => {
        console.log(`  ${item.code} - ${item.name}`);
        console.log(`    Provider: ${item.providerType || 'ANY'}`);
        console.log(`    Base Rate: $${item.baseRate.toFixed(2)}`);
        console.log(`    Type: ${item.calculationType}`);
        console.log(`    Optional: ${item.isOptional ? 'Yes' : 'No'}`);
        console.log(`    Default Included: ${item.defaultIncluded ? 'Yes' : 'No'}`);
        
        if (!item.isOptional && item.defaultIncluded) {
          console.log(`    ⚠️ ALWAYS INCLUDED (not optional)`);
        }
      });
      console.log(``);
    }
  });
  
  // ============================================================================
  // SUMMARY & RECOMMENDATIONS
  // ============================================================================
  console.log(`\n\n${'█'.repeat(100)}`);
  console.log(`█  SUMMARY & RECOMMENDATIONS`);
  console.log(`${'█'.repeat(100)}\n`);
  
  const issues = [];
  
  // Check for high product markups
  const highPanelMarkup = productTypes.PANEL.some(p => p.calculatedMarkup > 30);
  const highInverterMarkup = productTypes.INVERTER.some(p => p.calculatedMarkup > 30);
  const highBatteryMarkup = productTypes.BATTERY.some(p => p.calculatedMarkup > 30);
  
  if (highPanelMarkup || highInverterMarkup || highBatteryMarkup) {
    issues.push({
      severity: 'HIGH',
      issue: 'Product markups exceed 30%',
      location: 'SupplierProduct table',
      impact: 'Equipment costs are inflated',
      fix: 'Update retailPrice to be closer to unitCost (e.g., unitCost * 1.15 for 15% markup)',
    });
  }
  
  // Check for commission mismatch
  if (systemSettings?.subbieCommissionPercent && 
      installationPricing?.subbieCommissionPercent &&
      systemSettings.subbieCommissionPercent !== installationPricing.subbieCommissionPercent) {
    issues.push({
      severity: 'MEDIUM',
      issue: 'Commission mismatch between SystemSettings and InstallationPricing',
      location: 'SystemSettings vs InstallationPricing tables',
      impact: 'Inconsistent commission rates',
      fix: 'Ensure both tables have the same commission percentage',
    });
  }
  
  // Check for hardcoded margin
  issues.push({
    severity: 'HIGH',
    issue: 'Hardcoded 30% installation margin in calculator',
    location: 'lib/unified-quote-calculator.ts line 339',
    impact: 'Profit calculation assumes 30% margin regardless of actual commission',
    fix: 'Use actual commission from database instead of hardcoded 0.7 multiplier',
  });
  
  // Check for non-optional items
  const alwaysIncluded = costItems.filter(item => !item.isOptional && item.defaultIncluded);
  if (alwaysIncluded.length > 5) {
    issues.push({
      severity: 'MEDIUM',
      issue: `${alwaysIncluded.length} installation items are always included`,
      location: 'InstallationCostItem table',
      impact: 'Installation costs are inflated with items that should be optional',
      fix: 'Set isOptional=true for items like TILT_KIT, SYSTEM_REMOVAL, REVISIT_CHARGE, etc.',
    });
  }
  
  // Display issues
  if (issues.length > 0) {
    console.log(`Found ${issues.length} issues:\n`);
    
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.issue}`);
      console.log(`   Location: ${issue.location}`);
      console.log(`   Impact: ${issue.impact}`);
      console.log(`   Fix: ${issue.fix}`);
      console.log(``);
    });
  } else {
    console.log(`✅ No major issues found!`);
  }
  
  // ============================================================================
  // RECOMMENDED STRATEGY
  // ============================================================================
  console.log(`\n${'█'.repeat(100)}`);
  console.log(`█  RECOMMENDED STRATEGY (Zero Markup + Final Commission)`);
  console.log(`${'█'.repeat(100)}\n`);
  
  console.log(`1. SET ALL PRODUCT MARKUPS TO ZERO:`);
  console.log(`   - Update SupplierProduct.retailPrice = SupplierProduct.unitCost`);
  console.log(`   - Set markupPercent = 0`);
  console.log(`   - Use cost prices for all quotes`);
  console.log(``);
  
  console.log(`2. SET ALL INSTALLATION ITEMS TO COST:`);
  console.log(`   - Use actual subcontractor rates (no markup)`);
  console.log(`   - Make optional items truly optional (isOptional=true)`);
  console.log(``);
  
  console.log(`3. CREATE SINGLE QUOTE COMMISSION SETTING:`);
  console.log(`   - Add QuoteSettings table with single commission %`);
  console.log(`   - Apply commission to FINAL quote amount (after rebates)`);
  console.log(`   - Example: Cost $10,000 → After rebates $5,000 → +15% = $5,750`);
  console.log(``);
  
  console.log(`4. KEEP SHOP PRICING SEPARATE:`);
  console.log(`   - Shop products use retailPrice (with markup)`);
  console.log(`   - Quotes use unitCost (no markup)`);
  console.log(`   - Clear separation of business logic`);
  console.log(``);
  
  console.log(`BENEFITS:`);
  console.log(`  ✅ Transparent pricing (customers see real costs)`);
  console.log(`  ✅ Competitive quotes (no hidden markups)`);
  console.log(`  ✅ Simple calculations (one commission at end)`);
  console.log(`  ✅ Easy to adjust (change one setting)`);
  console.log(`  ✅ Matches Excel quotes`);
  
  await prisma.$disconnect();
}

main();
