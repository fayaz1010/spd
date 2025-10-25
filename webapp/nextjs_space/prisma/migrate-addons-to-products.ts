import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migrate Addons from AddonPricing to Product table
 * This creates proper Product entries with productType: 'ADDON'
 */
async function main() {
  console.log('🔄 Migrating Addons from AddonPricing to Product table...\n');

  // Get or create default supplier
  let supplier = await prisma.supplier.findFirst({
    where: { name: 'Sun Direct Power' }
  });

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        id: 'supplier_sundirect',
        name: 'Sun Direct Power',
        email: 'sales@sundirectpower.com.au',
        isActive: true,
        updatedAt: new Date(),
      }
    });
    console.log('✓ Created default supplier');
  }

  // Get all addons from AddonPricing
  const addonPricingItems = await prisma.addonPricing.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' }
  });

  console.log(`📦 Found ${addonPricingItems.length} addons in AddonPricing table\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const addon of addonPricingItems) {
    try {
      const productId = `prod_addon_${addon.addonId}`;
      const sku = `ADDON-${addon.addonId.toUpperCase()}`;

      // Check if product already exists
      const existing = await prisma.product.findUnique({
        where: { id: productId }
      });

      const productData = {
        id: productId,
        sku: sku,
        name: addon.name,
        manufacturer: 'Sun Direct Power',
        productType: 'ADDON' as any,
        description: addon.description || '',
        specifications: {
          addonCategory: addon.category,
          showAtCheckout: true, // Default to showing at checkout
          showBeforeCheckout: false,
          benefits: addon.benefits || [],
          iconName: addon.iconName || 'Package',
        },
        isAvailable: addon.active,
        isRecommended: addon.sortOrder <= 3, // Top 3 are recommended
        sortOrder: addon.sortOrder,
        updatedAt: new Date(),
      };

      let product;
      if (existing) {
        product = await prisma.product.update({
          where: { id: productId },
          data: productData,
        });
        console.log(`✓ Updated: ${addon.name}`);
        updated++;
      } else {
        product = await prisma.product.create({
          data: productData,
        });
        console.log(`✓ Created: ${addon.name}`);
        created++;
      }

      // Create/Update SupplierProduct
      await prisma.supplierProduct.upsert({
        where: {
          id: `sp_${productId}`,
        },
        update: {
          retailPrice: addon.cost,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          id: `sp_${productId}`,
          supplierId: supplier.id,
          productId: product.id,
          category: addon.category,
          brand: 'Sun Direct Power',
          model: addon.name,
          unitCost: addon.cost * 0.7, // Assume 30% margin
          unit: 'unit',
          retailPrice: addon.cost,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      // Create ProductInstallationRequirement if has installation cost
      if (addon.installationCost > 0) {
        // Get or create standard labor type
        let laborType = await prisma.installationLaborType.findFirst({
          where: { name: 'Standard Installation' }
        });

        if (!laborType) {
          laborType = await prisma.installationLaborType.create({
            data: {
              id: 'labor_standard',
              code: 'STANDARD',
              name: 'Standard Installation',
              category: 'INSTALLATION',
              baseRate: 75,
              description: 'Standard installation labor',
              updatedAt: new Date(),
            }
          });
        }

        const laborHours = addon.installationCost / 75; // Calculate hours from cost

        await prisma.productInstallationRequirement.upsert({
          where: {
            id: `inst_${productId}`,
          },
          update: {
            quantityMultiplier: laborHours,
            updatedAt: new Date(),
          },
          create: {
            id: `inst_${productId}`,
            productId: product.id,
            laborTypeId: laborType.id,
            quantityMultiplier: laborHours,
            updatedAt: new Date(),
          },
        });
      }

    } catch (error) {
      console.error(`❌ Error processing ${addon.name}:`, error);
      skipped++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`📊 Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  console.log(`🔌 Total processed: ${addonPricingItems.length}`);

  // Verify migration
  const productAddons = await prisma.product.findMany({
    where: { productType: 'ADDON' },
    include: {
      SupplierProduct: true,
      installationReqs: true,
    }
  });

  console.log(`\n✓ Verification: ${productAddons.length} addons now in Product table`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
