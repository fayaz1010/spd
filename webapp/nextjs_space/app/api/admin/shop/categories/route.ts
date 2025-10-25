/**
 * Shop Categories API
 * Manage product categories for the shop
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/categories - Get all categories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const categories = await prisma.shopCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
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
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shop/categories - Create new category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, image, parentId, displayOrder, isActive } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.shopCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.shopCategory.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId,
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
