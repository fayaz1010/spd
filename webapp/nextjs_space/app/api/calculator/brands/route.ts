
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper to ensure features and bestFor are always arrays
function normalizeBrand(brand: any) {
  return {
    ...brand,
    features: Array.isArray(brand.features) ? brand.features : [],
    bestFor: Array.isArray(brand.bestFor) ? brand.bestFor : [],
  };
}

// Helper to add stock availability info to brands
async function addStockInfo(brands: any[], category: string) {
  const brandsWithStock = await Promise.all(
    brands.map(async (brand) => {
      // Get supplier mappings for this brand
      const mappings = await prisma.brandSupplier.findMany({
        where: {
          brandCategory: category as any,
          ...(category === 'PANEL' && { panelBrandId: brand.id }),
          ...(category === 'BATTERY' && { batteryBrandId: brand.id }),
          ...(category === 'INVERTER' && { inverterBrandId: brand.id }),
          isActive: true,
        },
        include: {
          supplierProduct: {
            include: {
              supplier: true,
            },
          },
        },
      });

      // Determine overall stock status
      let stockStatus = 'unknown';
      let availableSuppliers = 0;
      let minLeadTime: number | null = null;

      for (const mapping of mappings) {
        const product = mapping.supplierProduct;
        if (product.stockStatus === 'in_stock' || product.stockStatus === 'low_stock') {
          availableSuppliers++;
          const leadTime = mapping.leadTimeDays || product.leadTime || 0;
          if (minLeadTime === null || leadTime < minLeadTime) {
            minLeadTime = leadTime;
          }
        }
      }

      if (availableSuppliers > 0) {
        stockStatus = 'in_stock';
      } else if (mappings.length > 0 && mappings.some(m => m.supplierProduct.stockStatus === 'out_of_stock')) {
        stockStatus = 'out_of_stock';
      }

      return {
        ...normalizeBrand(brand),
        stockStatus,
        availableSuppliers,
        estimatedLeadTime: minLeadTime,
        lastStockCheck: mappings[0]?.supplierProduct.lastStockSync || null,
      };
    })
  );

  return brandsWithStock;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const includeStock = searchParams.get('includeStock') !== 'false'; // Default true

    const where: any = { isAvailable: true };
    if (tier) where.tier = tier;

    const [panelBrands, batteryBrands, inverterBrands] = await Promise.all([
      prisma.panelBrand.findMany({
        where,
        orderBy: [{ isRecommended: 'desc' }, { sortOrder: 'asc' }],
      }),
      prisma.batteryBrand.findMany({
        where,
        orderBy: [{ isRecommended: 'desc' }, { sortOrder: 'asc' }],
      }),
      prisma.inverterBrand.findMany({
        where,
        orderBy: [{ isRecommended: 'desc' }, { sortOrder: 'asc' }],
      }),
    ]);

    // Add stock info if requested
    const [panelBrandsWithStock, batteryBrandsWithStock, inverterBrandsWithStock] = includeStock
      ? await Promise.all([
          addStockInfo(panelBrands, 'PANEL'),
          addStockInfo(batteryBrands, 'BATTERY'),
          addStockInfo(inverterBrands, 'INVERTER'),
        ])
      : [
          panelBrands.map(normalizeBrand),
          batteryBrands.map(normalizeBrand),
          inverterBrands.map(normalizeBrand),
        ];

    return NextResponse.json({
      panelBrands: panelBrandsWithStock,
      batteryBrands: batteryBrandsWithStock,
      inverterBrands: inverterBrandsWithStock,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}
