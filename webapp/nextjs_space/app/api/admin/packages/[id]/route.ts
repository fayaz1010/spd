import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update basic fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.badge !== undefined) updateData.badge = body.badge;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    // Update features JSON if any feature fields provided
    if (
      body.suitability !== undefined || 
      body.dailyUsage !== undefined ||
      body.heroImageUrl !== undefined ||
      body.infographicUrl !== undefined ||
      body.hookText !== undefined ||
      body.ctaText !== undefined ||
      body.featureList !== undefined
    ) {
      const existing = await prisma.systemPackageTemplate.findUnique({
        where: { id },
      });

      if (existing) {
        const features = (existing.features as any) || {};
        
        // Update all feature fields
        if (body.suitability !== undefined) features.suitability = body.suitability;
        if (body.dailyUsage !== undefined) features.dailyUsage = body.dailyUsage;
        if (body.heroImageUrl !== undefined) features.heroImageUrl = body.heroImageUrl;
        if (body.infographicUrl !== undefined) features.infographicUrl = body.infographicUrl;
        if (body.hookText !== undefined) features.hookText = body.hookText;
        if (body.ctaText !== undefined) features.ctaText = body.ctaText;
        if (body.featureList !== undefined) features.featureList = body.featureList;
        
        updateData.features = features;
      }
    }

    const updated = await prisma.systemPackageTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      package: updated,
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.systemPackageTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Package deleted',
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}
