/**
 * Shop Products API
 * Manage products in the shop with pricing, inventory, and categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/products - Get all shop products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured') === 'true';
    const lowStock = searchParams.get('lowStock') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (featured) {
      where.featured = true;
    }

    if (lowStock) {
      where.AND = [
        { trackInventory: true },
        {
          OR: [
            { stockQty: { lte: prisma.shopProduct.fields.lowStockAlert } },
            { stockQty: 0 },
          ],
        },
      ];
    }

    const products = await prisma.shopProduct.findMany({
      where,
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
        _count: {
          select: {
            packageItems: true,
            stockHistory: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { product: { name: 'asc' } },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching shop products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shop/products - Add product to shop
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
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

    // Validate required fields
    if (!productId || costPrice === undefined || retailPrice === undefined) {
      return NextResponse.json(
        { error: 'Product ID, cost price, and retail price are required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is already in shop
    const existing = await prisma.shopProduct.findUnique({
      where: { productId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Product is already in shop' },
        { status: 400 }
      );
    }

    const shopProduct = await prisma.shopProduct.create({
      data: {
        productId,
        costPrice,
        retailPrice,
        salePrice,
        commission: commission || 0,
        stockQty: stockQty || 0,
        lowStockAlert: lowStockAlert || 5,
        trackInventory: trackInventory !== undefined ? trackInventory : true,
        allowBackorder: allowBackorder || false,
        categoryId,
        featured: featured || false,
        isActive: isActive !== undefined ? isActive : true,
        metaTitle,
        metaDescription,
        tags: tags || [],
      },
      include: {
        product: true,
        category: true,
      },
    });

    // Create initial stock history entry
    if (stockQty && stockQty > 0) {
      await prisma.stockHistory.create({
        data: {
          shopProductId: shopProduct.id,
          previousQty: 0,
          newQty: stockQty,
          change: stockQty,
          reason: 'initial_stock',
          notes: 'Initial stock when added to shop',
        },
      });
    }

    return NextResponse.json(shopProduct);
  } catch (error) {
    console.error('Error adding product to shop:', error);
    return NextResponse.json(
      { error: 'Failed to add product to shop' },
      { status: 500 }
    );
  }
}
