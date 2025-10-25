import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use singleton pattern for Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * PUT /api/admin/zone-ratings/[id]
 * Update a zone rating
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { postcodeStart, postcodeEnd, zone, zoneRating, state, description } = body;

    // Validation
    if (postcodeStart && postcodeEnd && postcodeStart > postcodeEnd) {
      return NextResponse.json(
        { success: false, error: 'Postcode start must be less than or equal to postcode end' },
        { status: 400 }
      );
    }

    const zoneRatingRecord = await prisma.postcodeZoneRating.update({
      where: { id: params.id },
      data: {
        ...(postcodeStart !== undefined && { postcodeStart }),
        ...(postcodeEnd !== undefined && { postcodeEnd }),
        ...(zone !== undefined && { zone }),
        ...(zoneRating !== undefined && { zoneRating }),
        ...(state !== undefined && { state }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      success: true,
      zoneRating: zoneRatingRecord,
    });
  } catch (error) {
    console.error('Error updating zone rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update zone rating' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/zone-ratings/[id]
 * Delete a zone rating
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.postcodeZoneRating.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Zone rating deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting zone rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete zone rating' },
      { status: 500 }
    );
  }
}
