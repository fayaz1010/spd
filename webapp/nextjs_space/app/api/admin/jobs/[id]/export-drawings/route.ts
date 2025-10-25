import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AerialViewGenerator } from '@/lib/drawing/aerial-view-generator';
import { PDFPackageGenerator } from '@/lib/drawing/pdf-package-generator';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const body = await request.json();
    const { panels } = body;
    
    // Fetch job data
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
    
    const roofAnalysis = job.lead?.RoofAnalysis;
    
    if (!roofAnalysis) {
      return NextResponse.json(
        { error: 'Roof analysis not found' },
        { status: 404 }
      );
    }
    
    // Prepare data
    const customerName = (job as any).customerName || job.lead?.name || 'Unknown';
    const address = (job as any).address || job.lead?.address || 'Unknown';
    const panelWattage = roofAnalysis.panelCapacityWatts;
    const systemSize = (panels.length * panelWattage) / 1000;
    const totalProduction = panels.reduce((sum: number, p: any) => sum + (p.yearlyEnergyKwh || 0), 0);
    
    // Generate aerial view with panel overlay
    console.log('Generating aerial view...');
    const aerialGenerator = new AerialViewGenerator();
    const aerialViewImage = await aerialGenerator.generate(
      roofAnalysis.rgbUrl || '',
      panels,
      (roofAnalysis as any).roofSegments || [],
      {
        projectName: customerName,
        address: address,
        systemSize: systemSize,
        totalPanels: panels.length,
        panelWattage: panelWattage,
        panelWidthMeters: roofAnalysis.panelWidthMeters,
        panelHeightMeters: roofAnalysis.panelHeightMeters
      }
    );
    
    // Generate complete PDF package
    console.log('Generating PDF package...');
    const pdfGenerator = new PDFPackageGenerator();
    const pdfBuffer = await pdfGenerator.generate(
      aerialViewImage,
      panels,
      {
        projectName: customerName,
        address: address,
        customerName: customerName,
        systemSize: systemSize,
        totalPanels: panels.length,
        panelWattage: panelWattage,
        totalProduction: totalProduction
      }
    );
    
    console.log('PDF generation complete!');
    
    // Return PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="solar-plan-${jobId}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('Failed to export drawings:', error);
    return NextResponse.json(
      { error: 'Failed to export drawings: ' + (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
