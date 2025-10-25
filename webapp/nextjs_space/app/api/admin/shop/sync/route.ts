import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/admin/shop/sync
 * Sync all products from catalog to shop
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { defaultMargin = 30 } = body; // Default 30% margin

    // Create/ensure categories exist
    const categoryMap: Record<string, string> = {};
    const categories = [
      { name: 'Solar Panels', slug: 'solar-panels', productType: 'PANEL', description: 'High-efficiency solar panels from leading manufacturers' },
      { name: 'Inverters', slug: 'inverters', productType: 'INVERTER', description: 'Reliable solar inverters for optimal energy conversion' },
      { name: 'Batteries', slug: 'batteries', productType: 'BATTERY', description: 'Energy storage solutions for home and commercial use' },
      { name: 'EV Chargers', slug: 'ev-chargers', productType: 'EV_CHARGER', description: 'Electric vehicle charging stations' },
      { name: 'Accessories', slug: 'accessories', productType: 'ADDON', description: 'Solar system accessories and add-ons' },
      { name: 'Other Products', slug: 'other', productType: 'OTHER', description: 'Additional solar products' },
    ];

    for (const cat of categories) {
      const category = await prisma.shopCategory.upsert({
        where: { slug: cat.slug },
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          isActive: true,
          displayOrder: categories.indexOf(cat),
        },
        update: {
          name: cat.name,
          description: cat.description,
        },
      });
      categoryMap[cat.productType] = category.id;
    }

    // Get all products with their supplier data
    const products = await prisma.product.findMany({
      include: {
        SupplierProduct: {
          where: { isActive: true },
          orderBy: { retailPrice: 'asc' },
          include: {
            supplier: true,
          },
        },
      },
    });

    let synced = 0;
    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      // Get best supplier pricing
      let costPrice = 100;
      let retailPrice = 150;
      let stockQty = 0;

      if (product.SupplierProduct && product.SupplierProduct.length > 0) {
        const supplier = product.SupplierProduct[0];
        costPrice = supplier.unitCost || 100;
        
        // Apply margin to calculate retail price
        // If supplier has retail price AND it's higher than cost, use it
        // Otherwise, apply margin to cost price
        if (supplier.retailPrice && supplier.retailPrice > costPrice) {
          retailPrice = supplier.retailPrice;
        } else {
          retailPrice = costPrice * (1 + defaultMargin / 100);
        }
        stockQty = supplier.stockLevel || 0;
      } else {
        // No supplier, apply margin to default cost
        retailPrice = costPrice * (1 + defaultMargin / 100);
      }

      // Check if product already exists in shop
      const existing = await prisma.shopProduct.findFirst({
        where: { productId: product.id },
      });

      const specs = product.specifications as any;
      const showInShop = specs?.showInShop !== false; // Default to true
      
      // Determine category based on product type
      const categoryId = categoryMap[product.productType] || categoryMap['OTHER'];

      if (existing) {
        // Update existing shop product (prices, stock, and metadata)
        const shouldBeFeatured = product.tier === 'premium' || product.isRecommended || existing.featured;
        
        if (existing.costPrice !== costPrice || existing.retailPrice !== retailPrice || existing.stockQty !== stockQty) {
          await prisma.shopProduct.update({
            where: { id: existing.id },
            data: {
              costPrice,
              retailPrice,
              commission: parseFloat(((retailPrice - costPrice) / retailPrice * 100).toFixed(2)),
              stockQty,
              allowBackorder: true, // Allow orders even with 0 stock
              categoryId, // Auto-assign category based on product type
              isActive: showInShop,
              featured: shouldBeFeatured,
              metaDescription: product.description || existing.metaDescription,
              tags: [
                product.productType.toLowerCase(),
                product.manufacturer.toLowerCase(),
                product.tier || 'mid',
              ],
            },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Determine if product should be featured (premium tier or recommended)
        const shouldBeFeatured = product.tier === 'premium' || product.isRecommended || false;
        
        // Create new shop product with all required data
        await prisma.shopProduct.create({
          data: {
            productId: product.id,
            costPrice,
            retailPrice,
            salePrice: null,
            commission: parseFloat(((retailPrice - costPrice) / retailPrice * 100).toFixed(2)),
            stockQty,
            lowStockAlert: 5,
            trackInventory: true,
            allowBackorder: true, // Allow orders even with 0 stock (supplier fulfillment)
            categoryId, // Auto-assign category based on product type
            featured: shouldBeFeatured,
            isActive: showInShop,
            metaTitle: product.name,
            metaDescription: product.description || `${product.name} by ${product.manufacturer}`,
            tags: [
              product.productType.toLowerCase(),
              product.manufacturer.toLowerCase(),
              product.tier || 'mid',
            ],
          },
        });
        synced++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete: ${synced} added, ${updated} updated, ${skipped} unchanged`,
      stats: {
        synced,
        updated,
        skipped,
        total: products.length,
        categoriesCreated: categories.length,
      },
    });
  } catch (error: any) {
    console.error('Error syncing products:', error);
    return NextResponse.json(
      { error: 'Failed to sync products', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
