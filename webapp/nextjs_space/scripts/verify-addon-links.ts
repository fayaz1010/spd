import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verify that all addon products have:
 * 1. Supplier links (SupplierProduct)
 * 2. Installation requirements (ProductInstallationRequirement)
 */
async function verifyAddonLinks() {
  console.log('🔍 Verifying Addon Links...\n');

  try {
    // Get all addon products
    const addons = await prisma.product.findMany({
      where: { productType: 'ADDON' },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          include: {
            supplier: true,
          },
        },
        installationReqs: {
          include: {
            laborType: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    console.log(`📦 Found ${addons.length} addon products\n`);

    // Check supplier links
    console.log('═══════════════════════════════════════════════════════');
    console.log('1️⃣  SUPPLIER LINKS');
    console.log('═══════════════════════════════════════════════════════\n');

    const addonsWithoutSuppliers: any[] = [];
    const addonsWithSuppliers: any[] = [];

    addons.forEach(addon => {
      if (addon.SupplierProduct.length === 0) {
        addonsWithoutSuppliers.push(addon);
      } else {
        addonsWithSuppliers.push(addon);
      }
    });

    console.log(`✅ Addons WITH supplier links: ${addonsWithSuppliers.length}/${addons.length}`);
    addonsWithSuppliers.forEach(addon => {
      const sp = addon.SupplierProduct[0];
      console.log(`   ✓ ${addon.name}`);
      console.log(`     Supplier: ${sp.Supplier.name}`);
      console.log(`     Cost: $${sp.unitCost} | Retail: $${sp.retailPrice || 'N/A'}`);
    });

    if (addonsWithoutSuppliers.length > 0) {
      console.log(`\n❌ Addons WITHOUT supplier links: ${addonsWithoutSuppliers.length}`);
      addonsWithoutSuppliers.forEach(addon => {
        console.log(`   ✗ ${addon.name}`);
      });
    }

    // Check installation requirements
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('2️⃣  INSTALLATION REQUIREMENTS');
    console.log('═══════════════════════════════════════════════════════\n');

    const addonsWithoutInstallation: any[] = [];
    const addonsWithInstallation: any[] = [];

    addons.forEach(addon => {
      if (addon.installationReqs.length === 0) {
        addonsWithoutInstallation.push(addon);
      } else {
        addonsWithInstallation.push(addon);
      }
    });

    console.log(`✅ Addons WITH installation requirements: ${addonsWithInstallation.length}/${addons.length}`);
    addonsWithInstallation.forEach(addon => {
      const req = addon.installationReqs[0];
      console.log(`   ✓ ${addon.name}`);
      console.log(`     Labor: ${req.laborType.name}`);
      console.log(`     Multiplier: ${req.quantityMultiplier}x`);
    });

    if (addonsWithoutInstallation.length > 0) {
      console.log(`\n⚠️  Addons WITHOUT installation requirements: ${addonsWithoutInstallation.length}`);
      addonsWithoutInstallation.forEach(addon => {
        const specs = addon.specifications as any;
        console.log(`   ✗ ${addon.name} (${specs.addonCategory})`);
      });
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    const fullyLinked = addons.filter(a => 
      a.SupplierProduct.length > 0 && a.installationReqs.length > 0
    );

    console.log(`Total Addons: ${addons.length}`);
    console.log(`✅ Fully Linked (Supplier + Installation): ${fullyLinked.length}`);
    console.log(`⚠️  Missing Supplier Links: ${addonsWithoutSuppliers.length}`);
    console.log(`⚠️  Missing Installation Requirements: ${addonsWithoutInstallation.length}`);

    if (fullyLinked.length === addons.length) {
      console.log('\n🎉 All addons are fully linked!');
    } else {
      console.log('\n⚠️  Some addons need linking. Run the fix scripts:');
      if (addonsWithoutSuppliers.length > 0) {
        console.log('   npx tsx scripts/verify-supplier-links.ts');
      }
      if (addonsWithoutInstallation.length > 0) {
        console.log('   npx tsx scripts/link-addon-installation.ts');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyAddonLinks()
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
