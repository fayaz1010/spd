import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/complexity-factors
 * Get all complexity factors
 */
export async function GET(request: NextRequest) {
  try {
    const factors = await prisma.installationComplexityFactor.findMany({
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ factors });
  } catch (error: any) {
    console.error('Error fetching complexity factors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complexity factors', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/complexity-factors
 * Create a new complexity factor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      code,
      category,
      description,
      multiplier,
      fixedCost,
      appliesTo,
      isActive,
      sortOrder,
    } = body;

    // Validate required fields
    if (!name || !code || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code, category' },
        { status: 400 }
      );
    }

    // Must have either multiplier or fixedCost
    if (!multiplier && !fixedCost) {
      return NextResponse.json(
        { error: 'Must provide either multiplier or fixed cost' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.installationComplexityFactor.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Complexity factor with this code already exists' },
        { status: 409 }
      );
    }

    const factor = await prisma.installationComplexityFactor.create({
      data: {
        id: `factor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        code,
        category,
        description: description || null,
        multiplier: multiplier ? parseFloat(multiplier) : null,
        fixedCost: fixedCost ? parseFloat(fixedCost) : null,
        appliesTo: appliesTo || [],
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ factor }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating complexity factor:', error);
    return NextResponse.json(
      { error: 'Failed to create complexity factor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/admin/complexity-factors
 * Update a complexity factor
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Factor ID is required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await prisma.installationComplexityFactor.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Complexity factor not found' },
        { status: 404 }
      );
    }

    // If code is changing, check uniqueness
    if (updateData.code && updateData.code !== existing.code) {
      const codeExists = await prisma.installationComplexityFactor.findUnique({
        where: { code: updateData.code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Complexity factor with this code already exists' },
          { status: 409 }
        );
      }
    }

    const factor = await prisma.installationComplexityFactor.update({
      where: { id },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.code && { code: updateData.code }),
        ...(updateData.category && { category: updateData.category }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.multiplier !== undefined && { multiplier: updateData.multiplier ? parseFloat(updateData.multiplier) : null }),
        ...(updateData.fixedCost !== undefined && { fixedCost: updateData.fixedCost ? parseFloat(updateData.fixedCost) : null }),
        ...(updateData.appliesTo !== undefined && { appliesTo: updateData.appliesTo }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        ...(updateData.sortOrder !== undefined && { sortOrder: parseInt(updateData.sortOrder) }),
      },
    });

    return NextResponse.json({ factor });
  } catch (error: any) {
    console.error('Error updating complexity factor:', error);
    return NextResponse.json(
      { error: 'Failed to update complexity factor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/admin/complexity-factors
 * Delete a complexity factor
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Factor ID is required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await prisma.installationComplexityFactor.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Complexity factor not found' },
        { status: 404 }
      );
    }

    await prisma.installationComplexityFactor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Complexity factor deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting complexity factor:', error);
    return NextResponse.json(
      { error: 'Failed to delete complexity factor', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
