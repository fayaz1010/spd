import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Shop API - Get all available products for purchase
 * Returns products from ShopProduct table with proper pricing and inventory
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('type'); // Optional filter by type
    const category = searchParams.get('category');

    // Build where clause for ShopProduct
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.categoryId = category;
    }

    // Get all active shop products with inventory
    const shopProducts = await prisma.shopProduct.findMany({
      where,
      include: {
        product: true,
        category: true,
      },
      orderBy: [
        { featured: 'desc' },
        { product: { sortOrder: 'asc' } },
        { product: { name: 'asc' } },
      ],
    });

    // Format products for shop
    const formattedProducts = shopProducts
      .map((shopProduct: any) => {
        const product = shopProduct.product;
        const specs = product.specifications as any;

        // Skip if out of stock (unless backorder allowed or inventory not tracked)
        // NOTE: Most products have trackInventory=true but stockQty=0 from sync
        // Only skip if explicitly marked as out of stock AND backorder not allowed
        if (shopProduct.trackInventory && shopProduct.stockQty === 0 && !shopProduct.allowBackorder && shopProduct.stockQty !== null) {
          // For now, allow products with 0 stock to show (they're likely available from supplier)
          // return null;
        }

        // Apply product type filter if specified
        if (productType && product.productType !== productType) {
          return null;
        }

        // Determine icon based on product type
        let iconName = specs?.iconName || 'package';
        if (!specs?.iconName) {
          switch (product.productType) {
            case 'PANEL':
              iconName = 'sun';
              break;
            case 'BATTERY':
              iconName = 'battery';
              break;
            case 'INVERTER':
              iconName = 'zap';
              break;
            case 'EV_CHARGER':
              iconName = 'car';
              break;
            default:
              iconName = 'package';
          }
        }

        // Use sale price if available, otherwise retail price
        const displayPrice = shopProduct.salePrice || shopProduct.retailPrice;

        return {
          addonId: shopProduct.id, // Keep as addonId for cart compatibility
          id: shopProduct.id,
          shopProductId: shopProduct.id,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          manufacturer: product.manufacturer,
          description: product.description || '',
          productType: product.productType,
          category: shopProduct.category?.name || product.productType.toLowerCase(),
          categoryId: shopProduct.categoryId,
          iconName: iconName,
          cost: displayPrice,
          retailPrice: shopProduct.retailPrice,
          salePrice: shopProduct.salePrice,
          originalPrice: shopProduct.retailPrice,
          onSale: !!shopProduct.salePrice,
          benefits: Array.isArray(specs?.benefits) ? specs.benefits : [],
          features: Array.isArray(product.features) ? product.features : [],
          technicalSpecs: specs?.technicalSpecs || {},
          isRecommended: product.isRecommended || false,
          featured: shopProduct.featured,
          sortOrder: product.sortOrder || 0,
          tier: product.tier,
          warrantyYears: product.warrantyYears,
          // Inventory info
          inStock: !shopProduct.trackInventory || shopProduct.stockQty > 0,
          stockQty: shopProduct.stockQty,
          lowStock: shopProduct.trackInventory && shopProduct.stockQty <= shopProduct.lowStockAlert && shopProduct.stockQty > 0,
          allowBackorder: shopProduct.allowBackorder,
        };
      })
      .filter(Boolean);

    // Group by product type
    const groupedByType: Record<string, any[]> = {};
    formattedProducts.forEach((product: any) => {
      const type = product.productType;
      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }
      groupedByType[type].push(product);
    });

    // Group by category (for addons)
    const groupedByCategory: Record<string, any[]> = {};
    formattedProducts.forEach((product: any) => {
      const cat = product.category;
      if (!groupedByCategory[cat]) {
        groupedByCategory[cat] = [];
      }
      groupedByCategory[cat].push(product);
    });

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      count: formattedProducts.length,
      groupedByType,
      groupedByCategory,
    });

  } catch (error: any) {
    console.error('Error fetching shop products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
