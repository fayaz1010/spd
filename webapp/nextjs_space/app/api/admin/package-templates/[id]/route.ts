import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/package-templates/[id]
 * Get a single package template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await (prisma as any).systemPackageTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Package template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('❌ Error fetching package template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package template', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/admin/package-templates/[id]
 * Update a package template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Check if template exists
    const existing = await (prisma as any).systemPackageTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Package template not found' },
        { status: 404 }
      );
    }

    const template = await (prisma as any).systemPackageTemplate.update({
      where: { id: params.id },
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        tier: data.tier,
        sortOrder: data.sortOrder,
        active: data.active,
        
        // Solar sizing
        solarSizingStrategy: data.solarSizingStrategy,
        solarCoveragePercent: data.solarCoveragePercent || null,
        solarFixedKw: data.solarFixedKw || null,
        
        // Battery sizing
        batterySizingStrategy: data.batterySizingStrategy,
        batteryCoverageHours: data.batteryCoverageHours || null,
        batteryFixedKwh: data.batteryFixedKwh || null,
        
        // Features
        includeMonitoring: data.includeMonitoring,
        includeWarranty: data.includeWarranty,
        includeMaintenance: data.includeMaintenance,
        
        // Pricing
        priceMultiplier: data.priceMultiplier,
        discountPercent: data.discountPercent,
        
        // UI elements
        badge: data.badge || null,
        highlightColor: data.highlightColor || null,
        features: data.features || [],
        
        updatedAt: new Date(),
      },
    });

    console.log('✅ Updated package template:', template.id);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('❌ Error updating package template:', error);
    return NextResponse.json(
      { error: 'Failed to update package template', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/admin/package-templates/[id]
 * Delete a package template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if template exists
    const existing = await (prisma as any).systemPackageTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Package template not found' },
        { status: 404 }
      );
    }

    await (prisma as any).systemPackageTemplate.delete({
      where: { id: params.id },
    });

    console.log('✅ Deleted package template:', params.id);

    return NextResponse.json({
      success: true,
      message: 'Package template deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deleting package template:', error);
    return NextResponse.json(
      { error: 'Failed to delete package template', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
