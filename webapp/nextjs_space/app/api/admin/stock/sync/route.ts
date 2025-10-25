
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/admin/stock/sync - Update stock levels for supplier products
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request: updates array is required' },
        { status: 400 }
      );
    }

    // Update stock levels for multiple products
    const results = await Promise.all(
      updates.map(async (update: any) => {
        const { productId, stockLevel, lowStockThreshold } = update;

        // Determine stock status based on level
        let stockStatus = 'unknown';
        if (stockLevel !== null && stockLevel !== undefined) {
          if (stockLevel === 0) {
            stockStatus = 'out_of_stock';
          } else if (lowStockThreshold && stockLevel <= lowStockThreshold) {
            stockStatus = 'low_stock';
          } else {
            stockStatus = 'in_stock';
          }
        }

        return await prisma.supplierProduct.update({
          where: { id: productId },
          data: {
            stockLevel,
            lowStockThreshold,
            stockStatus,
            lastStockSync: new Date(),
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Updated stock levels for ${results.length} products`,
      results,
    });
  } catch (error) {
    console.error('Error syncing stock levels:', error);
    return NextResponse.json(
      { error: 'Failed to sync stock levels' },
      { status: 500 }
    );
  }
}

// GET /api/admin/stock/sync?supplierId=xxx - Get products needing stock sync
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');

    const where: any = { isActive: true };
    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Get products that haven't been synced recently or are low/out of stock
    const products = await prisma.supplierProduct.findMany({
      where,
      include: {
        supplier: true,
        brandMappings: {
          include: {
            panelBrand: true,
            batteryBrand: true,
            inverterBrand: true,
          },
        },
      },
      orderBy: [
        { stockStatus: 'asc' }, // Out of stock first
        { lastStockSync: 'asc' }, // Oldest syncs first
      ],
    });

    return NextResponse.json({
      products,
      needsSyncCount: products.filter(
        (p) =>
          !p.lastStockSync ||
          Date.now() - p.lastStockSync.getTime() > 24 * 60 * 60 * 1000 // 24 hours
      ).length,
      lowStockCount: products.filter((p) => p.stockStatus === 'low_stock').length,
      outOfStockCount: products.filter((p) => p.stockStatus === 'out_of_stock').length,
    });
  } catch (error) {
    console.error('Error fetching stock sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock sync status' },
      { status: 500 }
    );
  }
}
