import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/products/[id]
 * Get a single product by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
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

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/admin/products/[id]
 * Update a product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If SKU is changing, check if new SKU already exists
    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 409 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(manufacturer && { manufacturer }),
        ...(productType && { productType }),
        ...(specifications !== undefined && { specifications }),
        ...(warrantyYears !== undefined && { warrantyYears }),
        ...(tier !== undefined && { tier }),
        ...(features !== undefined && { features }),
        ...(bestFor !== undefined && { bestFor }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(isRecommended !== undefined && { isRecommended }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(description !== undefined && { description }),
        ...(dataSheetUrl !== undefined && { dataSheetUrl }),
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete the product (cascade will handle related records)
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
