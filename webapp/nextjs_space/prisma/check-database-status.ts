// prisma/check-database-status.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('═'.repeat(80));
  console.log('🔍 DATABASE STATUS CHECK');
  console.log('═'.repeat(80));
  console.log('\n');

  try {
    // 1. Check legacy product tables (skip if not in Prisma client)
    console.log('📦 LEGACY PRODUCT TABLES:');
    console.log('─'.repeat(80));
    
    let panelCount = 0;
    let inverterCount = 0;
    let batteryCount = 0;
    
    try {
      panelCount = await (prisma as any).panel?.count() || 0;
      inverterCount = await (prisma as any).inverter?.count() || 0;
      batteryCount = await (prisma as any).battery?.count() || 0;
      
      console.log(`   Panel:    ${panelCount} records`);
      console.log(`   Inverter: ${inverterCount} records`);
      console.log(`   Battery:  ${batteryCount} records`);
      console.log(`   Status:   ${panelCount + inverterCount + batteryCount > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);
    } catch (e) {
      console.log(`   Status:   ⚠️  LEGACY TABLES NOT IN SCHEMA (using new Product table)\n`);
    }

    // 2. Check new Product table
    console.log('📦 NEW PRODUCT TABLE:');
    console.log('─'.repeat(80));
    
    const productsByType = await prisma.product.groupBy({
      by: ['productType'],
      where: { isAvailable: true },
      _count: true,
    });
    
    productsByType.forEach((item) => {
      console.log(`   ${item.productType.padEnd(20)} ${item._count} products`);
    });
    
    const totalProducts = await prisma.product.count({ where: { isAvailable: true } });
    console.log(`   ${'TOTAL'.padEnd(20)} ${totalProducts} products`);
    console.log(`   Status:   ${totalProducts > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);

    // 3. Check tiered products
    console.log('🏷️  PRODUCT TIERS:');
    console.log('─'.repeat(80));
    
    const productsByTier = await prisma.product.groupBy({
      by: ['tier'],
      where: { tier: { not: null } },
      _count: true,
    });
    
    productsByTier.forEach((item) => {
      console.log(`   ${(item.tier || 'NULL').padEnd(20)} ${item._count} products`);
    });
    
    const popularCount = await prisma.product.count({ where: { isPopular: true } });
    console.log(`   ${'POPULAR'.padEnd(20)} ${popularCount} products`);
    console.log(`   Status:   ${productsByTier.length > 0 ? '✅ TIERED' : '⚠️  NO TIERS'}\n`);

    // 4. Check suppliers
    console.log('🏢 SUPPLIERS:');
    console.log('─'.repeat(80));
    
    const supplierCount = await prisma.supplier.count();
    const suppliers = await prisma.supplier.findMany({
      select: { name: true, isActive: true },
    });
    
    suppliers.forEach((s) => {
      console.log(`   ${s.name.padEnd(25)} ${s.isActive ? '✅ Active' : '❌ Inactive'}`);
    });
    console.log(`   Status:   ${supplierCount > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);

    // 5. Check supplier products
    console.log('💰 SUPPLIER PRODUCTS (CATALOG):');
    console.log('─'.repeat(80));
    
    const supplierProductCount = await prisma.supplierProduct.count();
    console.log(`   Total Links: ${supplierProductCount}`);
    console.log(`   Status:      ${supplierProductCount > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);

    // 6. Check teams and staff
    console.log('👥 TEAMS & STAFF:');
    console.log('─'.repeat(80));
    
    const teams = await prisma.team.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
    
    teams.forEach((team) => {
      console.log(`   ${team.name.padEnd(20)} ${team._count.members} members | ${team.isActive ? '✅ Active' : '❌ Inactive'}`);
    });
    
    const totalStaff = await prisma.teamMember.count();
    console.log(`   ${'TOTAL STAFF'.padEnd(20)} ${totalStaff} members`);
    console.log(`   Status:   ${teams.length > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);

    // 7. Check installation costs
    console.log('💵 INSTALLATION COSTS:');
    console.log('─'.repeat(80));
    
    const laborTypes = await prisma.installationLaborType.count();
    const complexityFactors = await prisma.installationComplexityFactor.count();
    const timeStandards = await prisma.installationTimeStandard.count();
    
    console.log(`   Labor Types:        ${laborTypes}`);
    console.log(`   Complexity Factors: ${complexityFactors}`);
    console.log(`   Time Standards:     ${timeStandards}`);
    console.log(`   Status:   ${laborTypes > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);

    // 8. Check rebates
    console.log('💰 REBATE CONFIGURATIONS:');
    console.log('─'.repeat(80));
    
    const rebates = await prisma.rebateConfig.findMany({
      where: { active: true },
      select: { name: true, type: true },
    });
    
    rebates.forEach((r) => {
      console.log(`   ${r.name.padEnd(30)} ${r.type}`);
    });
    console.log(`   Status:   ${rebates.length > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);

    // 9. Check electricity providers
    console.log('⚡ ELECTRICITY PROVIDERS:');
    console.log('─'.repeat(80));
    
    try {
      const providerCount = await (prisma as any).electricityProvider?.count() || 0;
      const rateCount = await (prisma as any).electricityRate?.count() || 0;
      
      console.log(`   Providers: ${providerCount}`);
      console.log(`   Rates:     ${rateCount}`);
      console.log(`   Status:    ${providerCount > 0 ? '✅ HAS DATA' : '⚠️  EMPTY - NEED TO SEED'}\n`);
    } catch (e) {
      console.log(`   Status:    ⚠️  NOT IN SCHEMA - NEED TO ADD\n`);
    }

    // 10. Check package templates
    console.log('📦 PACKAGE TEMPLATES:');
    console.log('─'.repeat(80));
    
    try {
      const packageCount = await prisma.systemPackageTemplate.count();
      console.log(`   Templates: ${packageCount}`);
      console.log(`   Status:    ${packageCount > 0 ? '✅ HAS DATA' : '⚠️  EMPTY - NEED TO SEED'}\n`);
    } catch (e) {
      console.log(`   Status:    ⚠️  NOT IN SCHEMA\n`);
    }

    // 11. Check system settings
    console.log('⚙️  SYSTEM SETTINGS:');
    console.log('─'.repeat(80));
    
    try {
      const settingsCount = await prisma.systemSettings.count();
      console.log(`   Settings: ${settingsCount}`);
      console.log(`   Status:   ${settingsCount > 0 ? '✅ HAS DATA' : '⚠️  EMPTY - NEED TO SEED'}\n`);
    } catch (e) {
      console.log(`   Status:   ⚠️  NOT IN SCHEMA\n`);
    }

    // 12. Check customers/leads
    console.log('👤 CUSTOMERS & LEADS:');
    console.log('─'.repeat(80));
    
    let leadCount = 0;
    let customerCount = 0;
    
    try {
      leadCount = await prisma.lead.count();
      customerCount = await (prisma as any).customer?.count() || 0;
      
      console.log(`   Leads:     ${leadCount}`);
      console.log(`   Customers: ${customerCount}`);
      console.log(`   Status:    ${leadCount + customerCount > 0 ? '✅ HAS DATA' : '⚠️  EMPTY - NEED TEST DATA'}\n`);
    } catch (e) {
      console.log(`   Status:    ⚠️  TABLES NOT FULLY IN SCHEMA\n`);
    }

    // 13. Check material pricing
    console.log('🔧 MATERIAL PRICING:');
    console.log('─'.repeat(80));
    
    try {
      const materialCategoryCount = await prisma.materialCategory.count();
      const materialPricingCount = await prisma.materialPricing.count();
      
      console.log(`   Categories: ${materialCategoryCount}`);
      console.log(`   Pricing:    ${materialPricingCount}`);
      console.log(`   Status:     ${materialPricingCount > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);
    } catch (e) {
      console.log(`   Status:     ⚠️  NOT IN SCHEMA\n`);
    }

    // 14. Check admin accounts
    console.log('🔐 ADMIN ACCOUNTS:');
    console.log('─'.repeat(80));
    
    const admins = await prisma.admin.findMany({
      where: { isActive: true },
      select: { name: true, role: true, email: true },
    });
    
    admins.forEach((a) => {
      console.log(`   ${a.name.padEnd(25)} ${a.role.padEnd(15)} ${a.email}`);
    });
    console.log(`   Status:   ${admins.length > 0 ? '✅ HAS DATA' : '⚠️  EMPTY'}\n`);

    // Summary
    console.log('═'.repeat(80));
    console.log('📊 READINESS SUMMARY:');
    console.log('═'.repeat(80));
    
    const checks = [
      { name: 'Products', ready: totalProducts > 0 },
      { name: 'Suppliers', ready: supplierCount > 0 },
      { name: 'Teams & Staff', ready: teams.length > 0 },
      { name: 'Installation Costs', ready: laborTypes > 0 },
      { name: 'Rebates', ready: rebates.length > 0 },
      { name: 'Test Customers', ready: leadCount + customerCount > 0 },
      { name: 'Admin Accounts', ready: admins.length > 0 },
    ];
    
    const readyCount = checks.filter((c) => c.ready).length;
    const totalChecks = checks.length;
    const percentage = Math.round((readyCount / totalChecks) * 100);
    
    console.log('\n');
    checks.forEach((check) => {
      const status = check.ready ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
    });
    
    console.log('\n');
    console.log(`   Overall Readiness: ${readyCount}/${totalChecks} (${percentage}%)`);
    console.log('\n');
    
    if (percentage === 100) {
      console.log('   🎉 SYSTEM FULLY READY FOR TESTING!');
    } else if (percentage >= 70) {
      console.log('   🟡 SYSTEM MOSTLY READY - Few items need seeding');
    } else {
      console.log('   🔴 SYSTEM NOT READY - Critical data missing');
    }
    
    console.log('\n' + '═'.repeat(80));

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  }
}

async function main() {
  await checkDatabaseStatus();
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
