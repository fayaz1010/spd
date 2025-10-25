import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateElectricalCertPDF, validateElectricalCert, generateCertificateNumber } from '@/lib/pdf-generators/electrical-cert-generator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Generate Electrical Certificate (COES) from installer wizard data
 * POST /api/installer/jobs/[id]/documents/electrical-cert/generate
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
        lead: true,
        leadElectrician: true,
      },
    }) as any;

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if certificate already exists
    const existingCert = await prisma.electricalCertificate.findUnique({
      where: { jobId: job.id },
    });

    if (existingCert && existingCert.pdfUrl) {
      return NextResponse.json({
        success: true,
        message: 'Electrical certificate already exists',
        certificateId: existingCert.id,
        pdfUrl: existingCert.pdfUrl,
        certificateNumber: existingCert.certificateNumber,
      });
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

    // Generate certificate number
    const state = job.lead.suburb?.includes('WA') || job.lead.address?.includes('WA') ? 'WA' : 'WA'; // Default to WA
    const certificateNumber = generateCertificateNumber(job.jobNumber, state);

    // Prepare certificate data
    const certData = {
      certificateNumber,
      certificateType: 'CERTIFICATE OF ELECTRICAL SAFETY',
      state,
      
      jobNumber: job.jobNumber,
      customerName: job.lead.name,
      installationAddress: job.lead.address,
      suburb: job.lead.suburb,
      postcode: job.lead.postcode,
      
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      inverterModel: job.inverterModel,
      inverterCapacity: job.systemSize * 0.8, // Estimate if not available
      batteryCapacity: job.batteryCapacity,
      
      electricianName: job.leadElectrician?.name || 'Unknown',
      electricianLicense: job.leadElectrician?.licenseNumber || 'N/A',
      electricianLicenseState: job.leadElectrician?.licenseState || state,
      electricianPhone: job.leadElectrician?.phone || null,
      electricianEmail: job.leadElectrician?.email || null,
      
      installationDate: job.installationDate || job.scheduledDate || new Date(),
      testingDate: testResults?.testedAt || new Date(),
      
      insulationTestDC: testResults?.insulationTestDC || null,
      insulationTestAC: testResults?.insulationTestAC || null,
      insulationTestVoltage: testResults?.insulationTestVoltage || 500,
      earthContinuityTest: testResults?.earthContinuity || null,
      voltageRiseCalc: testResults?.voltageRisePercent || null,
      
      complianceStandards: [
        'AS/NZS 3000:2018 - Electrical Installations',
        'AS/NZS 5033:2021 - Installation and Safety Requirements for PV Arrays',
      ],
      workType: 'Prescribed Electrical Installation Work',
      
      notes: wizardData.notes || null,
    };

    // Validate certificate data
    const validation = validateElectricalCert(certData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid certificate data', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateElectricalCertPDF(certData);
    
    // TODO: Upload to S3 or file storage
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Create or update ElectricalCertificate record
    const certificate = await prisma.electricalCertificate.upsert({
      where: { jobId: job.id },
      create: {
        jobId: job.id,
        certificateType: certData.certificateType,
        state: certData.state,
        certificateNumber: certData.certificateNumber,
        electricianName: certData.electricianName,
        electricianLicense: certData.electricianLicense,
        installationAddress: certData.installationAddress,
        installationDate: certData.installationDate,
        testingDate: certData.testingDate,
        insulationTestDC: certData.insulationTestDC,
        insulationTestAC: certData.insulationTestAC,
        insulationTestVoltage: certData.insulationTestVoltage,
        earthContinuityTest: certData.earthContinuityTest,
        voltageRiseCalc: certData.voltageRiseCalc,
        complianceStandards: certData.complianceStandards,
        workType: certData.workType,
        pdfUrl: pdfUrl,
      },
      update: {
        pdfUrl: pdfUrl,
        updatedAt: new Date(),
      },
    });

    // Create GeneratedDocument record
    await prisma.generatedDocument.create({
      data: {
        jobId: job.id,
        documentType: 'ELECTRICAL_CERTIFICATE',
        fileName: `ElectricalCert-${job.jobNumber}.pdf`,
        fileUrl: pdfUrl,
        fileSize: pdfBuffer.length,
        generatedData: certData,
        generatedBy: installerId,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Electrical certificate generated successfully',
      certificateId: certificate.id,
      certificateNumber: certificate.certificateNumber,
      pdfUrl: certificate.pdfUrl,
    });

  } catch (error) {
    console.error('Electrical certificate generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate electrical certificate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get existing electrical certificate for a job
 * GET /api/installer/jobs/[id]/documents/electrical-cert/generate
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

    const certificate = await prisma.electricalCertificate.findUnique({
      where: { jobId: params.id },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        pdfUrl: certificate.pdfUrl,
        electricianName: certificate.electricianName,
        testingDate: certificate.testingDate,
      },
    });

  } catch (error) {
    console.error('Get electrical certificate error:', error);
    return NextResponse.json(
      { error: 'Failed to get electrical certificate' },
      { status: 500 }
    );
  }
}
