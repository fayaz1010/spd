import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { electricianId } = await request.json();

    if (!electricianId) {
      return NextResponse.json(
        { error: 'Electrician ID is required' },
        { status: 400 }
      );
    }

    // Verify electrician exists
    const electrician = await prisma.electrician.findUnique({
      where: { id: electricianId },
    });

    if (!electrician) {
      return NextResponse.json(
        { error: 'Electrician not found' },
        { status: 404 }
      );
    }

    // Update job
    const job = await prisma.installationJob.update({
      where: { id: params.id },
      data: {
        leadElectricianId: electricianId,
      },
      include: {
        leadElectrician: true,
      },
    });

    return NextResponse.json({
      success: true,
      job,
      message: `Electrician ${electrician.firstName} ${electrician.lastName} assigned successfully`,
    });

  } catch (error) {
    console.error('Error assigning electrician:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove electrician assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.installationJob.update({
      where: { id: params.id },
      data: {
        leadElectricianId: null,
      },
    });

    return NextResponse.json({
      success: true,
      job,
      message: 'Electrician assignment removed',
    });

  } catch (error) {
    console.error('Error removing electrician:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
