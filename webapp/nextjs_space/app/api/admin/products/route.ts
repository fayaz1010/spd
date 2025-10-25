import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/products
 * Get all products with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType') as ProductType | null;
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');

    const where: any = {};

    if (productType) {
      where.productType = productType;
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { isRecommended: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        installationReqs: {
          include: {
            laborType: true,
          },
        },
        SupplierProduct: {
          include: {
            supplier: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      sku,
      manufacturer,
      productType,
      specifications,
      warrantyYears,
      tier,
      features,
      bestFor,
      isAvailable,
      isRecommended,
      sortOrder,
      imageUrl,
      description,
      dataSheetUrl,
    } = body;

    // Validate required fields
    if (!name || !sku || !manufacturer || !productType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, manufacturer, productType' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existing = await prisma.product.findUnique({
      where: { sku },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        sku,
        manufacturer,
        productType,
        specifications: specifications || {},
        warrantyYears: warrantyYears || null,
        tier: tier || null,
        features: features || [],
        bestFor: bestFor || [],
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isRecommended: isRecommended !== undefined ? isRecommended : false,
        sortOrder: sortOrder || 0,
        imageUrl: imageUrl || null,
        description: description || null,
        dataSheetUrl: dataSheetUrl || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
