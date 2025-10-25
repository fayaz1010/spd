import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch existing SLD design
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Fetch job data
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch existing SLD design
    const design = await (prisma as any).sLDDesign?.findUnique({
      where: { jobId },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        systemSize: job.systemSize,
        panelCount: job.panelCount,
        batteryCapacity: job.batteryCapacity,
      },
      design: design ? {
        nodes: design.components,
        edges: design.cables,
        calculations: {
          dcVoltage: design.dcVoltage || 0,
          dcCurrent: design.dcCurrent || 0,
          acVoltage: design.acVoltage || 230,
          acCurrent: design.acCurrent || 0,
          voltageRise: design.voltageRise || 0,
        }
      } : null,
    });
  } catch (error) {
    console.error('Error fetching SLD design:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch design' },
      { status: 500 }
    );
  }
}

// POST - Save SLD design
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    const { nodes, edges, calculations } = body;

    // Calculate totals
    const dcVoltage = calculations?.dcVoltage || 0;
    const dcCurrent = calculations?.dcCurrent || 0;
    const acVoltage = calculations?.acVoltage || 230;
    const acCurrent = calculations?.acCurrent || 0;
    const voltageRise = calculations?.voltageRise || 0;

    // Calculate cable length from edges
    const totalCableLength = edges.reduce((sum: number, edge: any) => {
      return sum + (edge.data?.length || 0);
    }, 0);

    // Check compliance
    const compliance = voltageRise <= 3.0; // AS/NZS 3000:2018 - max 3% voltage drop

    // Save or update design
    const design = await (prisma as any).sLDDesign?.upsert({
      where: { jobId },
      update: {
        components: nodes,
        cables: edges,
        layout: {
          viewport: { x: 0, y: 0, zoom: 1 },
          settings: {}
        },
        dcVoltage,
        dcCurrent,
        acVoltage,
        acCurrent,
        voltageRise,
        cableLength: totalCableLength,
        compliance,
        updatedBy: 'admin', // TODO: Get from auth
        version: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        jobId,
        components: nodes,
        cables: edges,
        layout: {
          viewport: { x: 0, y: 0, zoom: 1 },
          settings: {}
        },
        dcVoltage,
        dcCurrent,
        acVoltage,
        acCurrent,
        voltageRise,
        cableLength: totalCableLength,
        compliance,
        createdBy: 'admin', // TODO: Get from auth
        version: 1,
      },
    });

    return NextResponse.json({
      success: true,
      design: {
        id: design.id,
        compliance: design.compliance,
        voltageRise: design.voltageRise,
      },
    });
  } catch (error) {
    console.error('Error saving SLD design:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save design' },
      { status: 500 }
    );
  }
}

// DELETE - Delete SLD design
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    await (prisma as any).sLDDesign?.delete({
      where: { jobId },
    });

    return NextResponse.json({
      success: true,
      message: 'Design deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting SLD design:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete design' },
      { status: 500 }
    );
  }
}
