import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { SingleLineDiagram } from '@/lib/documents/sld-generator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Fetch job from database with all related data
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

    // Parse selected components
    const components = job.selectedComponents as any || {};
    
    // Calculate string configuration
    // Assuming standard 440W panels, 12 panels per string for typical systems
    const panelsPerString = 12;
    const stringCount = Math.ceil(job.panelCount / panelsPerString);
    const panelVoltage = 40; // Typical Voc per panel
    const panelCurrent = 11.5; // Typical Isc per panel
    
    const strings = Array.from({ length: stringCount }, (_, i) => {
      const panelsInString = i === stringCount - 1 
        ? job.panelCount - (i * panelsPerString)
        : panelsPerString;
      
      return {
        id: i + 1,
        panels: panelsInString,
        voltage: panelsInString * panelVoltage,
        current: panelCurrent,
        wattage: 440, // Default wattage
      };
    });

    // Calculate inverter specs
    const inverterCapacity = job.systemSize;
    const acVoltage = 230; // Single phase (or 400 for 3-phase)
    const maxACCurrent = (inverterCapacity * 1000) / acVoltage;

    // Prepare SLD data
    const sldData = {
      jobId: job.id,
      jobNumber: job.jobNumber,
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      strings,
      inverter: {
        model: job.inverterModel || 'Premium Inverter',
        capacity: inverterCapacity,
        acVoltage,
        maxCurrent: maxACCurrent,
      },
      isolators: {
        dc: `DC Isolator ${Math.ceil(inverterCapacity)}kW`,
        ac: `AC Isolator ${Math.ceil(maxACCurrent)}A`,
      },
      protection: {
        dcBreaker: `${Math.ceil(panelCurrent * stringCount * 1.25)}A DC`,
        acBreaker: `${Math.ceil(maxACCurrent * 1.25)}A AC`,
      },
      cables: {
        dcSize: job.systemSize > 10 ? 6 : 4, // mm²
        acSize: job.systemSize > 10 ? 10 : 6, // mm²
        dcLength: 20, // meters (estimate)
        acLength: 15, // meters (estimate)
      },
      earthing: {
        method: 'TN-S',
        conductor: '6mm² Earth',
      },
      battery: job.batteryCapacity ? {
        model: components.battery?.name || 'Battery Storage',
        capacity: job.batteryCapacity,
        voltage: 48, // Typical battery voltage
      } : undefined,
      address: job.lead?.address || 'Installation Address',
      installationDate: job.installationDate?.toISOString().split('T')[0],
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <SingleLineDiagram data={sldData} />
    );

    // Calculate DC voltage and current for database
    const totalDCVoltage = strings[0]?.voltage || 0;
    const totalDCCurrent = strings.reduce((sum, str) => sum + str.current, 0);

    // Save SLD record to database
    const sld = await prisma.singleLineDiagram.upsert({
      where: { jobId },
      update: {
        systemData: sldData,
        dcVoltage: totalDCVoltage,
        dcCurrent: totalDCCurrent,
        acVoltage,
        acCurrent: maxACCurrent,
        strings: strings,
        isolators: sldData.isolators,
        protection: sldData.protection,
        generatedBy: 'system', // TODO: Get from auth
        updatedAt: new Date(),
      },
      create: {
        jobId,
        systemData: sldData,
        dcVoltage: totalDCVoltage,
        dcCurrent: totalDCCurrent,
        acVoltage,
        acCurrent: maxACCurrent,
        strings: strings,
        isolators: sldData.isolators,
        protection: sldData.protection,
        generatedBy: 'system', // TODO: Get from auth
      },
    });

    // TODO: Upload PDF to cloud storage (S3/Cloudinary) and save URL
    // For now, we'll return the PDF directly

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SLD-${job.jobNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating SLD:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Single Line Diagram' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing SLD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const sld = await prisma.singleLineDiagram.findUnique({
      where: { jobId },
    });

    if (!sld) {
      return NextResponse.json(
        { success: false, error: 'SLD not found for this job' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sld,
    });
  } catch (error) {
    console.error('Error fetching SLD:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SLD' },
      { status: 500 }
    );
  }
}
