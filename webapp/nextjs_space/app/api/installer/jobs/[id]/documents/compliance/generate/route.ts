import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateComplianceStatementPDF, validateComplianceStatement } from '@/lib/pdf-generators/compliance-statement-generator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Generate CEC Compliance Statement from installer wizard data
 * POST /api/installer/jobs/[id]/documents/compliance/generate
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
    }) as any;

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if compliance statement already exists
    const existingStatement = await prisma.complianceStatement.findUnique({
      where: { jobId: job.id },
    });

    if (existingStatement && existingStatement.pdfUrl) {
      return NextResponse.json({
        success: true,
        message: 'Compliance statement already exists',
        statementId: existingStatement.id,
        pdfUrl: existingStatement.pdfUrl,
      });
    }

    // Parse wizard data
    let wizardData: any = {};
    try {
      wizardData = job.installationNotes ? JSON.parse(job.installationNotes) : {};
    } catch (e) {
      console.error('Failed to parse wizard data:', e);
    }

    // Extract panel serials from wizard Stage 1
    const panelSerials = (wizardData.panelSerials || []).map((scan: any) => scan.serial || scan);
    const inverterSerial = wizardData.inverterSerial?.serial || wizardData.inverterSerial || 'N/A';
    const batterySerial = wizardData.batterySerial?.serial || wizardData.batterySerial || null;

    // Prepare compliance statement data
    const complianceData = {
      jobNumber: job.jobNumber,
      customerName: job.lead.name,
      installationAddress: job.lead.address,
      suburb: job.lead.suburb,
      postcode: job.lead.postcode,
      
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      panelManufacturer: job.equipmentSpec?.panelManufacturer || 'Unknown',
      panelModel: job.equipmentSpec?.panelModel || 'Unknown',
      inverterManufacturer: job.equipmentSpec?.inverterManufacturer || 'Unknown',
      inverterModel: job.inverterModel,
      batteryManufacturer: job.equipmentSpec?.batteryManufacturer || null,
      batteryModel: job.equipmentSpec?.batteryModel || null,
      batteryCapacity: job.batteryCapacity,
      
      installerName: job.leadElectrician?.name || 'Unknown',
      installerCecNumber: job.leadElectrician?.cecAccreditationNumber || 'N/A',
      installerCecExpiry: job.leadElectrician?.cecAccreditationExpiry || new Date(),
      installerCompany: 'Sun Direct Power',
      
      designerName: job.leadElectrician?.name || null,
      designerCecNumber: job.leadElectrician?.cecAccreditationNumber || null,
      designerCecExpiry: job.leadElectrician?.cecAccreditationExpiry || null,
      
      electricianName: job.leadElectrician?.name || 'Unknown',
      electricianLicense: job.leadElectrician?.licenseNumber || 'N/A',
      electricianLicenseState: job.leadElectrician?.licenseState || 'WA',
      
      panelSerials: panelSerials.length > 0 ? panelSerials : ['Serial numbers to be verified'],
      inverterSerial: inverterSerial,
      batterySerial: batterySerial,
      
      installationDate: job.installationDate || job.scheduledDate || new Date(),
      
      confirmations: {
        cecApprovedEquipment: true,
        correctInstallation: true,
        safetyCompliance: true,
        gridCompliance: true,
        documentationComplete: true,
      },
      
      onSitePhotos: [],
      notes: wizardData.notes || null,
    };

    // Validate compliance data
    const validation = validateComplianceStatement(complianceData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid compliance data', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateComplianceStatementPDF(complianceData);
    
    // TODO: Upload to S3 or file storage
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Create or update ComplianceStatement record
    const statement = await prisma.complianceStatement.upsert({
      where: { jobId: job.id },
      create: {
        jobId: job.id,
        installerName: complianceData.installerName,
        installerCecNumber: complianceData.installerCecNumber,
        installerCecExpiry: complianceData.installerCecExpiry,
        designerName: complianceData.designerName,
        designerCecNumber: complianceData.designerCecNumber,
        designerCecExpiry: complianceData.designerCecExpiry,
        electricianName: complianceData.electricianName,
        electricianLicense: complianceData.electricianLicense,
        confirmations: complianceData.confirmations,
        panelSerials: panelSerials,
        inverterSerial: inverterSerial,
        inverterModel: complianceData.inverterModel,
        batterySerial: batterySerial,
        batteryModel: complianceData.batteryModel,
        onSitePhotos: [],
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
        documentType: 'COMPLIANCE_STATEMENT',
        fileName: `ComplianceStatement-${job.jobNumber}.pdf`,
        fileUrl: pdfUrl,
        fileSize: pdfBuffer.length,
        generatedData: complianceData,
        generatedBy: installerId,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Compliance statement generated successfully',
      statementId: statement.id,
      pdfUrl: statement.pdfUrl,
    });

  } catch (error) {
    console.error('Compliance statement generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance statement', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get existing compliance statement for a job
 * GET /api/installer/jobs/[id]/documents/compliance/generate
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

    const statement = await prisma.complianceStatement.findUnique({
      where: { jobId: params.id },
    });

    if (!statement) {
      return NextResponse.json({ error: 'Compliance statement not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      statement: {
        id: statement.id,
        pdfUrl: statement.pdfUrl,
        installerName: statement.installerName,
        installerCecNumber: statement.installerCecNumber,
      },
    });

  } catch (error) {
    console.error('Get compliance statement error:', error);
    return NextResponse.json(
      { error: 'Failed to get compliance statement' },
      { status: 500 }
    );
  }
}
