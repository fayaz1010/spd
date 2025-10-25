import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/installation-labor
 * Get all installation labor types
 */
export async function GET(request: NextRequest) {
  try {
    const laborTypes = await prisma.installationLaborType.findMany({
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ laborTypes });
  } catch (error: any) {
    console.error('Error fetching labor types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labor types', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/installation-labor
 * Create a new labor type
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      code,
      description,
      category,
      baseRate,
      perUnitRate,
      hourlyRate,
      estimatedHours,
      skillLevel,
      teamSize,
      isActive,
      sortOrder,
      notes,
    } = body;

    // Validate required fields
    if (!name || !code || !category || baseRate === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code, category, baseRate' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.installationLaborType.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Labor type with this code already exists' },
        { status: 409 }
      );
    }

    const laborType = await prisma.installationLaborType.create({
      data: {
        id: `labor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        code,
        description: description || null,
        category,
        baseRate: parseFloat(baseRate),
        perUnitRate: perUnitRate ? parseFloat(perUnitRate) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        skillLevel: skillLevel || 'standard',
        teamSize: teamSize ? parseInt(teamSize) : 1,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        notes: notes || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ laborType }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating labor type:', error);
    return NextResponse.json(
      { error: 'Failed to create labor type', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/admin/installation-labor
 * Update a labor type
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Labor type ID is required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await prisma.installationLaborType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Labor type not found' },
        { status: 404 }
      );
    }

    // If code is changing, check uniqueness
    if (updateData.code && updateData.code !== existing.code) {
      const codeExists = await prisma.installationLaborType.findUnique({
        where: { code: updateData.code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Labor type with this code already exists' },
          { status: 409 }
        );
      }
    }

    const laborType = await prisma.installationLaborType.update({
      where: { id },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.code && { code: updateData.code }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.category && { category: updateData.category }),
        ...(updateData.baseRate !== undefined && { baseRate: parseFloat(updateData.baseRate) }),
        ...(updateData.perUnitRate !== undefined && { perUnitRate: updateData.perUnitRate ? parseFloat(updateData.perUnitRate) : null }),
        ...(updateData.hourlyRate !== undefined && { hourlyRate: updateData.hourlyRate ? parseFloat(updateData.hourlyRate) : null }),
        ...(updateData.estimatedHours !== undefined && { estimatedHours: updateData.estimatedHours ? parseFloat(updateData.estimatedHours) : null }),
        ...(updateData.skillLevel && { skillLevel: updateData.skillLevel }),
        ...(updateData.teamSize !== undefined && { teamSize: parseInt(updateData.teamSize) }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        ...(updateData.sortOrder !== undefined && { sortOrder: parseInt(updateData.sortOrder) }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
      },
    });

    return NextResponse.json({ laborType });
  } catch (error: any) {
    console.error('Error updating labor type:', error);
    return NextResponse.json(
      { error: 'Failed to update labor type', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/admin/installation-labor
 * Delete a labor type
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Labor type ID is required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await prisma.installationLaborType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Labor type not found' },
        { status: 404 }
      );
    }

    await prisma.installationLaborType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Labor type deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting labor type:', error);
    return NextResponse.json(
      { error: 'Failed to delete labor type', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
