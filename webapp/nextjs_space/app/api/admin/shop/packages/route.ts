/**
 * Shop Packages API
 * Create and manage product bundles
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/packages - Get all packages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured') === 'true';
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

    const packages = await prisma.shopPackage.findMany({
      where,
      include: {
        category: true,
        items: {
          include: {
            shopProduct: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shop/packages - Create new package
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      slug,
      categoryId,
      basePrice,
      retailPrice,
      discount,
      image,
      images,
      featured,
      isActive,
      metaTitle,
      metaDescription,
      tags,
      items, // Array of { shopProductId, quantity }
    } = body;

    // Validate required fields
    if (!name || !slug || !retailPrice) {
      return NextResponse.json(
        { error: 'Name, slug, and retail price are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.shopPackage.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Package with this slug already exists' },
        { status: 400 }
      );
    }

    // Calculate base price from items if not provided
    let calculatedBasePrice = basePrice || 0;
    if (items && items.length > 0 && !basePrice) {
      const productIds = items.map((item: any) => item.shopProductId);
      const products = await prisma.shopProduct.findMany({
        where: { id: { in: productIds } },
      });

      calculatedBasePrice = items.reduce((sum: number, item: any) => {
        const product = products.find(p => p.id === item.shopProductId);
        return sum + (product ? product.costPrice * item.quantity : 0);
      }, 0);
    }

    // Create package with items
    const packageData = await prisma.shopPackage.create({
      data: {
        name,
        description,
        slug,
        categoryId,
        basePrice: calculatedBasePrice,
        retailPrice,
        discount: discount || 0,
        image,
        images: images || [],
        featured: featured || false,
        isActive: isActive !== undefined ? isActive : true,
        metaTitle,
        metaDescription,
        tags: tags || [],
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            shopProductId: item.shopProductId,
            quantity: item.quantity || 1,
          })),
        } : undefined,
      },
      include: {
        category: true,
        items: {
          include: {
            shopProduct: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(packageData);
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}
