import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/service-areas/[id] - Get single service area
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const area = await prisma.serviceArea.findUnique({
      where: { id: params.id },
    });

    if (!area) {
      return NextResponse.json(
        { error: 'Service area not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(area);
  } catch (error: any) {
    console.error('Error fetching service area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service area', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/service-areas/[id] - Update service area
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const area = await prisma.serviceArea.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      area,
    });
  } catch (error: any) {
    console.error('Error updating service area:', error);
    return NextResponse.json(
      { error: 'Failed to update service area', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/service-areas/[id] - Delete service area
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.serviceArea.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Service area deleted',
    });
  } catch (error: any) {
    console.error('Error deleting service area:', error);
    return NextResponse.json(
      { error: 'Failed to delete service area', details: error.message },
      { status: 500 }
    );
  }
}
