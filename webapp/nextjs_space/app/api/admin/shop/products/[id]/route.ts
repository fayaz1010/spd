/**
 * Shop Product API - Single Product Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/products/[id] - Get single shop product
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.shopProduct.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: {
            SupplierProduct: {
              include: {
                supplier: true,
              },
            },
          },
        },
        category: true,
        packageItems: {
          include: {
            package: true,
          },
        },
        stockHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Shop product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching shop product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop product' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/shop/products/[id] - Update shop product
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      costPrice,
      retailPrice,
      salePrice,
      commission,
      stockQty,
      lowStockAlert,
      trackInventory,
      allowBackorder,
      categoryId,
      featured,
      isActive,
      metaTitle,
      metaDescription,
      tags,
    } = body;

    // Check if product exists
    const existing = await prisma.shopProduct.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Shop product not found' },
        { status: 404 }
      );
    }

    // If stock quantity is changing, create history entry
    if (stockQty !== undefined && stockQty !== existing.stockQty) {
      await prisma.stockHistory.create({
        data: {
          shopProductId: params.id,
          previousQty: existing.stockQty,
          newQty: stockQty,
          change: stockQty - existing.stockQty,
          reason: 'adjustment',
          notes: 'Manual stock adjustment',
        },
      });
    }

    const product = await prisma.shopProduct.update({
      where: { id: params.id },
      data: {
        costPrice,
        retailPrice,
        salePrice,
        commission,
        stockQty,
        lowStockAlert,
        trackInventory,
        allowBackorder,
        categoryId,
        featured,
        isActive,
        metaTitle,
        metaDescription,
        tags,
      },
      include: {
        product: true,
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating shop product:', error);
    return NextResponse.json(
      { error: 'Failed to update shop product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shop/products/[id] - Remove product from shop
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product is in any packages
    const product = await prisma.shopProduct.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            packageItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Shop product not found' },
        { status: 404 }
      );
    }

    if (product._count.packageItems > 0) {
      return NextResponse.json(
        { error: 'Cannot remove product that is part of packages. Remove from packages first.' },
        { status: 400 }
      );
    }

    await prisma.shopProduct.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing shop product:', error);
    return NextResponse.json(
      { error: 'Failed to remove shop product' },
      { status: 500 }
    );
  }
}
