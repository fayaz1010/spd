import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/installer/equipment/[id]
 * Get all equipment for a job (id is jobId)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    const equipment = await prisma.scannedEquipment.findMany({
      where: { jobId },
      orderBy: { scannedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      equipment: equipment.map(item => ({
        id: item.id,
        type: item.type,
        serialNumber: item.serialNumber,
        brand: item.brand,
        model: item.model,
        cecApproved: item.cecApproved,
        scannedAt: item.scannedAt
      }))
    });
  } catch (error: any) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch equipment',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/installer/equipment/[id]
 * Delete an equipment record (id is equipmentId)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const equipmentId = params.id;

    await prisma.scannedEquipment.delete({
      where: { id: equipmentId }
    });

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete equipment',
        details: error.message
      },
      { status: 500 }
    );
  }
}
