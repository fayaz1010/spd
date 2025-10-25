import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/jobs/[id]/serial-numbers
 * Get all equipment serial numbers for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const jobId = params.id;

    const serials = await prisma.equipmentSerial.findMany({
      where: { jobId },
      orderBy: { equipmentType: 'asc' }
    });

    return NextResponse.json({
      success: true,
      serials
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching serial numbers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch serial numbers',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/jobs/[id]/serial-numbers
 * Save equipment serial numbers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const jobId = params.id;
    const body = await request.json();
    const { serials } = body;

    if (!serials || !Array.isArray(serials)) {
      return NextResponse.json(
        { success: false, error: 'Invalid serials data' },
        { status: 400 }
      );
    }

    // Delete existing serials for this job
    await prisma.equipmentSerial.deleteMany({
      where: { jobId }
    });

    // Create new serials
    const created = await Promise.all(
      serials.map((serial: any) =>
        prisma.equipmentSerial.create({
          data: {
            jobId,
            equipmentType: serial.equipmentType,
            serialNumber: serial.serialNumber,
            brand: serial.brand,
            model: serial.model,
            qrCodeData: serial.qrCodeData,
            cecApproved: serial.cecApproved || false,
            notes: serial.notes
          }
        })
      )
    );

    // Create activity log
    await prisma.leadActivity.create({
      data: {
        leadId: (await prisma.installationJob.findUnique({ 
          where: { id: jobId },
          select: { leadId: true }
        }))!.leadId,
        type: 'compliance',
        description: `Equipment serial numbers updated: ${serials.length} items`,
        createdBy: 'admin',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      serials: created
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error saving serial numbers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save serial numbers',
        details: error.message
      },
      { status: 500 }
    );
  }
}
