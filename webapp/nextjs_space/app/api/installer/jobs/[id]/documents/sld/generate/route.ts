import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Generate Single Line Diagram from installer wizard data
 * POST /api/installer/jobs/[id]/documents/sld/generate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const installerId = decoded.teamMemberId || decoded.subcontractorId || decoded.electricianId;

    // Get job with all required data
    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
      include: {
        lead: {
          include: {
            CustomerQuote: true,
          },
        },
        leadElectrician: true,
        team: {
          include: {
            members: {
              include: {
                electrician: true,
              },
            },
          },
        },
        subcontractor: true,
        equipmentSpec: true,
      },
    }) as any; // Type assertion for complex Prisma include

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Parse wizard data
    let wizardData: any = {};
    try {
      wizardData = job.installationNotes ? JSON.parse(job.installationNotes) : {};
    } catch (e) {
      console.error('Failed to parse wizard data:', e);
    }

    // Check if SLD already exists
    const existingSLD = await prisma.singleLineDiagram.findUnique({
      where: { jobId: job.id },
    }) as any;

    if (existingSLD && existingSLD.pdfUrl) {
      return NextResponse.json({
        success: true,
        message: 'SLD already exists',
        sldId: existingSLD.id,
        pdfUrl: existingSLD.pdfUrl,
        svgUrl: existingSLD.svgUrl,
      });
    }

    // Prepare SLD data from wizard and job
    const sldData = {
      // System configuration
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      batteryCapacity: job.batteryCapacity,
      inverterModel: job.inverterModel,
      
      // Equipment from wizard Stage 1
      panelSerials: wizardData.panelSerials || [],
      inverterSerial: wizardData.inverterSerial?.serial || null,
      batterySerial: wizardData.batterySerial?.serial || null,
      
      // Test results from wizard Stage 4
      voltageTest: wizardData.voltageTest || null,
      currentTest: wizardData.currentTest || null,
      inverterOnline: wizardData.inverterOnline || false,
      batteryCharging: wizardData.batteryCharging || false,
      gridExportTest: wizardData.gridExportTest || false,
      
      // Equipment specifications
      equipmentSpec: job.equipmentSpec,
      
      // Customer and site details
      customerName: job.lead.name,
      installationAddress: job.lead.address,
      suburb: job.lead.suburb,
      
      // Electrician details
      electrician: job.leadElectrician,
      
      // Installation details
      installationDate: job.installationDate || job.scheduledDate,
      completedAt: job.completedAt,
    };

    // Call the existing SLD generator API
    // We'll use an internal API call to the admin SLD generator
    const sldGeneratorUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/design/sld/${job.id}/export/pdf`;
    
    const sldResponse = await fetch(sldGeneratorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Pass through auth
      },
      body: JSON.stringify({
        jobId: job.id,
        wizardData: sldData,
        generatedBy: installerId,
        source: 'installer_wizard',
      }),
    });

    if (!sldResponse.ok) {
      const error = await sldResponse.json();
      console.error('SLD generation failed:', error);
      return NextResponse.json(
        { error: 'Failed to generate SLD', details: error },
        { status: 500 }
      );
    }

    // Get the PDF buffer
    const pdfBuffer = await sldResponse.arrayBuffer();
    
    // TODO: Upload to S3 or file storage
    // For now, we'll store it in the database as base64 (not recommended for production)
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Create or update SingleLineDiagram record
    const sld = await prisma.singleLineDiagram.upsert({
      where: { jobId: job.id },
      create: {
        jobId: job.id,
        systemData: sldData,
        dcVoltage: parseFloat(wizardData.voltageTest) || 0,
        dcCurrent: parseFloat(wizardData.currentTest) || 0,
        acVoltage: 230, // Default for single phase
        acCurrent: 0, // Calculate if needed
        strings: [],
        isolators: {},
        protection: {},
        standard: 'AS/NZS 5033:2021',
        compliant: true,
        pdfUrl: pdfUrl,
        generatedBy: installerId,
      },
      update: {
        systemData: sldData,
        dcVoltage: parseFloat(wizardData.voltageTest) || 0,
        dcCurrent: parseFloat(wizardData.currentTest) || 0,
        pdfUrl: pdfUrl,
        updatedAt: new Date(),
      },
    });

    // Create GeneratedDocument record for tracking
    await prisma.generatedDocument.create({
      data: {
        jobId: job.id,
        documentType: 'SINGLE_LINE_DIAGRAM',
        fileName: `SLD-${job.jobNumber}.pdf`,
        fileUrl: pdfUrl,
        fileSize: pdfBuffer.byteLength,
        generatedData: sldData,
        generatedBy: installerId,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'SLD generated successfully',
      sldId: sld.id,
      pdfUrl: sld.pdfUrl,
      svgUrl: sld.svgUrl,
    });

  } catch (error) {
    console.error('SLD generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SLD', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get existing SLD for a job
 * GET /api/installer/jobs/[id]/documents/sld/generate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sld = await prisma.singleLineDiagram.findUnique({
      where: { jobId: params.id },
    }) as any;

    if (!sld) {
      return NextResponse.json({ error: 'SLD not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sld: {
        id: sld.id,
        pdfUrl: sld.pdfUrl,
        svgUrl: sld.svgUrl,
        generatedAt: sld.generatedAt,
        designedBy: sld.designedBy,
      },
    });

  } catch (error) {
    console.error('Get SLD error:', error);
    return NextResponse.json(
      { error: 'Failed to get SLD' },
      { status: 500 }
    );
  }
}
