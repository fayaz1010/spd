import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/products/[id]/installation
 * Get all installation requirements for a product
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
          orderBy: {
            createdAt: 'asc',
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

    return NextResponse.json({
      product,
      installationReqs: product.installationReqs,
    });
  } catch (error: any) {
    console.error('Error fetching installation requirements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installation requirements', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/products/[id]/installation
 * Add installation requirement to a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const {
      laborTypeId,
      quantityMultiplier,
      isRequired,
      additionalCost,
      notes,
    } = body;

    // Validate required fields
    if (!laborTypeId) {
      return NextResponse.json(
        { error: 'Missing required field: laborTypeId' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if labor type exists
    const laborType = await prisma.installationLaborType.findUnique({
      where: { id: laborTypeId },
    });

    if (!laborType) {
      return NextResponse.json(
        { error: 'Labor type not found' },
        { status: 404 }
      );
    }

    // Check if requirement already exists
    const existing = await prisma.productInstallationRequirement.findFirst({
      where: {
        productId: params.id,
        laborTypeId: laborTypeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This labor type is already linked to this product' },
        { status: 409 }
      );
    }

    // Create installation requirement
    const requirement = await prisma.productInstallationRequirement.create({
      data: {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: params.id,
        laborTypeId: laborTypeId,
        quantityMultiplier: quantityMultiplier ? parseFloat(quantityMultiplier) : 1.0,
        isRequired: isRequired !== undefined ? isRequired : true,
        additionalCost: additionalCost ? parseFloat(additionalCost) : 0,
        notes: notes || null,
        updatedAt: new Date(),
      },
      include: {
        laborType: true,
      },
    });

    return NextResponse.json({ requirement }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating installation requirement:', error);
    return NextResponse.json(
      { error: 'Failed to create installation requirement', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/admin/products/[id]/installation
 * Update an installation requirement
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { requirementId, ...updateData } = body;

    if (!requirementId) {
      return NextResponse.json(
        { error: 'Requirement ID is required' },
        { status: 400 }
      );
    }

    const requirement = await prisma.productInstallationRequirement.update({
      where: { id: requirementId },
      data: {
        ...(updateData.quantityMultiplier !== undefined && { 
          quantityMultiplier: parseFloat(updateData.quantityMultiplier) 
        }),
        ...(updateData.isRequired !== undefined && { isRequired: updateData.isRequired }),
        ...(updateData.additionalCost !== undefined && { 
          additionalCost: parseFloat(updateData.additionalCost) 
        }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        updatedAt: new Date(),
      },
      include: {
        laborType: true,
      },
    });

    return NextResponse.json({ requirement });
  } catch (error: any) {
    console.error('Error updating installation requirement:', error);
    return NextResponse.json(
      { error: 'Failed to update installation requirement', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/admin/products/[id]/installation
 * Remove an installation requirement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const requirementId = searchParams.get('requirementId');

    if (!requirementId) {
      return NextResponse.json(
        { error: 'Requirement ID is required' },
        { status: 400 }
      );
    }

    await prisma.productInstallationRequirement.delete({
      where: { id: requirementId },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Installation requirement removed successfully' 
    });
  } catch (error: any) {
    console.error('Error removing installation requirement:', error);
    return NextResponse.json(
      { error: 'Failed to remove installation requirement', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
