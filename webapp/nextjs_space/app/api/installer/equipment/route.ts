import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/installer/equipment
 * Add equipment manually
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, type, serialNumber, brand, model } = body;

    if (!jobId || !type || !serialNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create equipment record
    const equipment = await prisma.scannedEquipment.create({
      data: {
        jobId,
        type,
        serialNumber,
        brand: brand || null,
        model: model || null,
        cecApproved: false, // TODO: Check against CEC list
        scannedAt: new Date(),
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      equipment: {
        id: equipment.id,
        type: equipment.type,
        serialNumber: equipment.serialNumber,
        brand: equipment.brand,
        model: equipment.model,
        cecApproved: equipment.cecApproved,
        scannedAt: equipment.scannedAt
      }
    });
  } catch (error: any) {
    console.error('Error adding equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add equipment',
        details: error.message
      },
      { status: 500 }
    );
  }
}
