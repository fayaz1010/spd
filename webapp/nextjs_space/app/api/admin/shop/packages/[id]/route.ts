/**
 * Shop Package API - Single Package Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/packages/[id] - Get single package
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageData = await prisma.shopPackage.findUnique({
      where: { id: params.id },
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

    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(packageData);
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/shop/packages/[id] - Update package
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if package exists
    const existing = await prisma.shopPackage.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // If slug is changing, check if new slug is available
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.shopPackage.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Package with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // If items are provided, update them
    if (items) {
      // Delete existing items
      await prisma.shopPackageItem.deleteMany({
        where: { packageId: params.id },
      });

      // Calculate base price from items if not provided
      let calculatedBasePrice = basePrice;
      if (!basePrice && items.length > 0) {
        const productIds = items.map((item: any) => item.shopProductId);
        const products = await prisma.shopProduct.findMany({
          where: { id: { in: productIds } },
        });

        calculatedBasePrice = items.reduce((sum: number, item: any) => {
          const product = products.find(p => p.id === item.shopProductId);
          return sum + (product ? product.costPrice * item.quantity : 0);
        }, 0);
      }

      // Update package with new items
      const packageData = await prisma.shopPackage.update({
        where: { id: params.id },
        data: {
          name,
          description,
          slug,
          categoryId,
          basePrice: calculatedBasePrice,
          retailPrice,
          discount,
          image,
          images,
          featured,
          isActive,
          metaTitle,
          metaDescription,
          tags,
          items: {
            create: items.map((item: any) => ({
              shopProductId: item.shopProductId,
              quantity: item.quantity || 1,
            })),
          },
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
    } else {
      // Update package without changing items
      const packageData = await prisma.shopPackage.update({
        where: { id: params.id },
        data: {
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
    }
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shop/packages/[id] - Delete package
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageData = await prisma.shopPackage.findUnique({
      where: { id: params.id },
    });

    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Delete package (items will be cascade deleted)
    await prisma.shopPackage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}
