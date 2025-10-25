import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateCommissioningReportPDF, validateCommissioningReport } from '@/lib/pdf-generators/commissioning-report-generator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Generate Commissioning Report from installer wizard data
 * POST /api/installer/jobs/[id]/documents/commissioning-report/generate
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
    const installerId = decoded.teamMemberId || decoded.subcontractorId || decoded.electricianId || decoded.userId;

    // Get job with all required data
    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
      include: {
        lead: true,
        leadElectrician: true,
        equipmentSpec: true,
      },
    }) as any;

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

    // Get test results if available
    const testResults = await prisma.testResults.findUnique({
      where: { jobId: job.id },
    });

    // Extract panel serials
    const panelSerials = (wizardData.panelSerials || []).map((scan: any) => scan.serial || scan);

    // Calculate actual hours
    let actualHours = 0;
    if (wizardData.arrivalTime && wizardData.departureTime) {
      const arrival = new Date(wizardData.arrivalTime);
      const departure = new Date(wizardData.departureTime);
      actualHours = (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60);
    }

    // Prepare commissioning report data
    const reportData = {
      jobNumber: job.jobNumber,
      customerName: job.lead.name,
      installationAddress: job.lead.address,
      suburb: job.lead.suburb,
      postcode: job.lead.postcode,
      
      scheduledDate: job.scheduledDate,
      actualStartTime: wizardData.arrivalTime ? new Date(wizardData.arrivalTime) : null,
      actualEndTime: wizardData.departureTime ? new Date(wizardData.departureTime) : null,
      actualHours: actualHours > 0 ? actualHours : null,
      completedAt: job.completedAt || new Date(),
      
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      panelManufacturer: job.equipmentSpec?.panelManufacturer || 'Unknown',
      panelModel: job.equipmentSpec?.panelModel || 'Unknown',
      panelWattage: Math.round((job.systemSize * 1000) / job.panelCount),
      inverterManufacturer: job.equipmentSpec?.inverterManufacturer || 'Unknown',
      inverterModel: job.inverterModel,
      inverterCapacity: job.systemSize * 0.8, // Estimate
      batteryManufacturer: job.equipmentSpec?.batteryManufacturer || null,
      batteryModel: job.equipmentSpec?.batteryModel || null,
      batteryCapacity: job.batteryCapacity,
      
      panelSerials: panelSerials.length > 0 ? panelSerials : ['Serials recorded'],
      inverterSerial: wizardData.inverterSerial?.serial || wizardData.inverterSerial || 'N/A',
      batterySerial: wizardData.batterySerial?.serial || wizardData.batterySerial || null,
      
      installerName: job.leadElectrician?.name || 'Unknown',
      installerCecNumber: job.leadElectrician?.cecAccreditationNumber || 'N/A',
      electricianName: job.leadElectrician?.name || 'Unknown',
      electricianLicense: job.leadElectrician?.licenseNumber || 'N/A',
      teamMembers: wizardData.teamMembers || [],
      
      voltageTest: parseFloat(wizardData.voltageTest) || 0,
      currentTest: parseFloat(wizardData.currentTest) || 0,
      insulationTestDC: testResults?.insulationTestDC || null,
      insulationTestAC: testResults?.insulationTestAC || null,
      earthContinuity: testResults?.earthContinuity || null,
      voltageRise: testResults?.voltageRisePercent || null,
      
      systemPoweredUp: wizardData.inverterOnline || false,
      inverterConfigured: wizardData.inverterOnline || false,
      inverterOnline: wizardData.inverterOnline || false,
      batteryCharging: wizardData.batteryCharging || false,
      gridExportTest: wizardData.gridExportTest || false,
      monitoringActivated: wizardData.monitoringActive || false,
      exportLimitSet: job.lead.exportLimitRequested || null,
      
      systemDemoComplete: wizardData.demoComplete || false,
      monitoringAppSetup: wizardData.appSetup || false,
      warrantyProvided: wizardData.warrantyProvided || false,
      customerRating: wizardData.customerRating || null,
      
      panelWarranty: '25 years product, 25 years performance',
      inverterWarranty: '10 years manufacturer warranty',
      batteryWarranty: job.batteryCapacity ? '10 years manufacturer warranty' : null,
      installationWarranty: '10 years workmanship warranty',
      
      preInstallPhotos: wizardData.preInstallPhotos?.length || 0,
      installationPhotos: wizardData.installationPhotos?.length || 0,
      testPhotos: wizardData.testPhotos?.length || 0,
      compliancePhotos: wizardData.complianceLabels?.length || 0,
      
      notes: wizardData.notes || null,
    };

    // Validate report data
    const validation = validateCommissioningReport(reportData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid commissioning report data', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateCommissioningReportPDF(reportData);
    
    // TODO: Upload to S3 or file storage
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Create GeneratedDocument record
    const document = await prisma.generatedDocument.create({
      data: {
        jobId: job.id,
        documentType: 'COMMISSIONING_REPORT',
        fileName: `CommissioningReport-${job.jobNumber}.pdf`,
        fileUrl: pdfUrl,
        fileSize: pdfBuffer.length,
        generatedData: reportData,
        generatedBy: installerId,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Commissioning report generated successfully',
      documentId: document.id,
      pdfUrl: pdfUrl,
    });

  } catch (error) {
    console.error('Commissioning report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate commissioning report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get existing commissioning report for a job
 * GET /api/installer/jobs/[id]/documents/commissioning-report/generate
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

    const document = await prisma.generatedDocument.findFirst({
      where: {
        jobId: params.id,
        documentType: 'COMMISSIONING_REPORT',
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Commissioning report not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        pdfUrl: document.fileUrl,
        generatedAt: document.generatedAt,
        generatedBy: document.generatedBy,
      },
    });

  } catch (error) {
    console.error('Get commissioning report error:', error);
    return NextResponse.json(
      { error: 'Failed to get commissioning report' },
      { status: 500 }
    );
  }
}
