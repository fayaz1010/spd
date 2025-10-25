import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    // Fetch job with roof analysis
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: {
          include: {
            RoofAnalysis: true
          }
        }
      }
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Get roof analysis from lead
    const roofAnalysis = job.lead?.RoofAnalysis;
    
    if (!roofAnalysis) {
      return NextResponse.json(
        { error: 'Roof analysis not found for this job' },
        { status: 404 }
      );
    }
    
    // Return job data with roof analysis
    return NextResponse.json({
      id: job.id,
      customerName: (job as any).customerName || job.lead?.name || 'Unknown',
      address: (job as any).address || job.lead?.address || 'Unknown',
      roofAnalysis: {
        id: roofAnalysis.id,
        address: roofAnalysis.address,
        latitude: roofAnalysis.latitude,
        longitude: roofAnalysis.longitude,
        maxArrayPanelsCount: roofAnalysis.maxArrayPanelsCount,
        maxArrayAreaMeters2: roofAnalysis.maxArrayAreaMeters2,
        maxSunshineHoursPerYear: roofAnalysis.maxSunshineHoursPerYear,
        panelCapacityWatts: roofAnalysis.panelCapacityWatts,
        panelHeightMeters: roofAnalysis.panelHeightMeters,
        panelWidthMeters: roofAnalysis.panelWidthMeters,
        solarPanels: (roofAnalysis as any).solarPanels || [],
        roofSegments: (roofAnalysis as any).roofSegments || roofAnalysis.roofSegments || [],
        rgbUrl: roofAnalysis.rgbUrl,
        imageryProvider: (roofAnalysis as any).imageryProvider || 'google',
        imageryResolution: (roofAnalysis as any).imageryResolution || 15,
        imageryQuality: roofAnalysis.imageryQuality,
        confidenceLevel: roofAnalysis.confidenceLevel
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch roof analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roof analysis' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
