/**
 * Stock Management API
 * Track and manage inventory
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/stock - Get stock information
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'low', 'out', 'all'
    const productId = searchParams.get('productId');

    if (productId) {
      // Get stock history for specific product
      const history = await prisma.stockHistory.findMany({
        where: { shopProductId: productId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          shopProduct: {
            include: {
              product: true,
            },
          },
        },
      });

      return NextResponse.json(history);
    }

    // Get products based on stock status
    let where: any = { trackInventory: true };

    if (type === 'low') {
      // Products at or below low stock alert
      const products = await prisma.shopProduct.findMany({
        where: {
          trackInventory: true,
          isActive: true,
        },
        include: {
          product: true,
          category: true,
        },
      });

      const lowStock = products.filter(p => p.stockQty <= p.lowStockAlert && p.stockQty > 0);
      return NextResponse.json(lowStock);
    }

    if (type === 'out') {
      where.stockQty = 0;
    }

    const products = await prisma.shopProduct.findMany({
      where,
      include: {
        product: true,
        category: true,
      },
      orderBy: { stockQty: 'asc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching stock information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock information' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shop/stock - Adjust stock
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopProductId, quantity, reason, notes, userId } = body;

    if (!shopProductId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Shop product ID and quantity are required' },
        { status: 400 }
      );
    }

    // Get current product
    const product = await prisma.shopProduct.findUnique({
      where: { id: shopProductId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Shop product not found' },
        { status: 404 }
      );
    }

    const newQty = product.stockQty + quantity;

    if (newQty < 0) {
      return NextResponse.json(
        { error: 'Stock quantity cannot be negative' },
        { status: 400 }
      );
    }

    // Update stock
    const updated = await prisma.shopProduct.update({
      where: { id: shopProductId },
      data: { stockQty: newQty },
      include: {
        product: true,
        category: true,
      },
    });

    // Create history entry
    await prisma.stockHistory.create({
      data: {
        shopProductId,
        previousQty: product.stockQty,
        newQty,
        change: quantity,
        reason: reason || 'adjustment',
        notes,
        userId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}
