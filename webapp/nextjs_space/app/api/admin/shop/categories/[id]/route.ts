/**
 * Shop Category API - Single Category Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/categories/[id] - Get single category
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.shopCategory.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            shopProducts: true,
            packages: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/shop/categories/[id] - Update category
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, slug, description, image, parentId, displayOrder, isActive } = body;

    // Check if category exists
    const existing = await prisma.shopCategory.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // If slug is changing, check if new slug is available
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.shopCategory.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.shopCategory.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description,
        image,
        parentId,
        displayOrder,
        isActive,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shop/categories/[id] - Delete category
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if category has products or packages
    const category = await prisma.shopCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            shopProducts: true,
            packages: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (category._count.shopProducts > 0 || category._count.packages > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products or packages. Please reassign them first.' },
        { status: 400 }
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please delete subcategories first.' },
        { status: 400 }
      );
    }

    await prisma.shopCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
