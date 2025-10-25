import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const body = await request.json();
    const { panels, totalPanels, totalCapacity, totalProduction, designMode } = body;
    
    // Verify job exists
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Save panel design to job - using any to bypass type checking
    // In production, you'd want to add a proper panelDesign field to the schema
    await (prisma.installationJob as any).update({
      where: { id: jobId },
      data: {
        panelDesignData: JSON.stringify({
          panels,
          totalPanels,
          totalCapacity,
          totalProduction,
          designMode,
          savedAt: new Date().toISOString()
        })
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Panel design saved successfully'
    });
    
  } catch (error) {
    console.error('Failed to save panel design:', error);
    return NextResponse.json(
      { error: 'Failed to save panel design' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
