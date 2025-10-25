import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateHandoverPackPDF, validateHandoverPack } from '@/lib/pdf-generators/handover-pack-generator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Generate Handover Pack from all generated documents
 * POST /api/installer/jobs/[id]/documents/handover-pack/generate
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
      },
    }) as any;

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get all generated documents
    const [sld, testResults, electricalCert, compliance, customerDeclaration, generatedDocs] = await Promise.all([
      prisma.singleLineDiagram.findUnique({ where: { jobId: job.id } }),
      prisma.testResults.findUnique({ where: { jobId: job.id } }),
      prisma.electricalCertificate.findUnique({ where: { jobId: job.id } }),
      prisma.complianceStatement.findUnique({ where: { jobId: job.id } }),
      prisma.customerDeclaration.findUnique({ where: { jobId: job.id } }),
      prisma.generatedDocument.findMany({
        where: { 
          jobId: job.id,
          documentType: 'COMMISSIONING_REPORT',
        },
        orderBy: { generatedAt: 'desc' },
        take: 1,
      }),
    ]);

    const commissioningReport = generatedDocs[0];

    // Prepare handover pack data
    const handoverData = {
      jobNumber: job.jobNumber,
      customerName: job.lead.name,
      installationAddress: job.lead.address,
      suburb: job.lead.suburb,
      postcode: job.lead.postcode,
      completedAt: job.completedAt || new Date(),
      
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      inverterModel: job.inverterModel,
      batteryCapacity: job.batteryCapacity,
      
      installerName: job.leadElectrician?.name || 'Unknown',
      installerCompany: 'Sun Direct Power',
      installerPhone: job.leadElectrician?.phone || null,
      installerEmail: job.leadElectrician?.email || null,
      
      documents: {
        sld: sld ? { generated: true, date: sld.generatedAt } : { generated: false },
        testResults: testResults ? { generated: true, date: testResults.createdAt } : { generated: false },
        electricalCert: electricalCert ? { 
          generated: true, 
          date: electricalCert.createdAt,
          certNumber: electricalCert.certificateNumber,
        } : { generated: false },
        compliance: compliance ? { generated: true, date: compliance.createdAt } : { generated: false },
        customerDeclaration: customerDeclaration ? { 
          generated: true, 
          date: customerDeclaration.createdAt,
          stcCount: customerDeclaration.stcCount,
        } : { generated: false },
        commissioningReport: commissioningReport ? { 
          generated: true, 
          date: commissioningReport.generatedAt,
        } : { generated: false },
      },
      
      warranties: {
        panels: '25 years product warranty, 25 years performance warranty',
        inverter: '10 years manufacturer warranty',
        battery: job.batteryCapacity ? '10 years manufacturer warranty' : null,
        installation: '10 years workmanship warranty',
      },
      
      emergencyContact: '1300 XXX XXX',
      supportEmail: 'support@sundirectpower.com.au',
      supportPhone: '1300 XXX XXX',
      
      exportLimit: job.lead.exportLimitRequested || null,
      monitoringUrl: null, // TODO: Get from system settings
      monitoringUsername: null,
      
      nextSteps: [
        'Monitor your system performance daily via the monitoring app',
        'Keep all documentation in a safe place for warranty claims',
        'Clean solar panels every 6-12 months for optimal performance',
        'Contact us immediately if you notice any error messages on the inverter',
        'Schedule an annual system health check (recommended)',
        'Review your electricity bills to see your savings',
      ],
    };

    // Validate handover pack data
    const validation = validateHandoverPack(handoverData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid handover pack data', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateHandoverPackPDF(handoverData);
    
    // TODO: Upload to S3 or file storage
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Create GeneratedDocument record
    const document = await prisma.generatedDocument.create({
      data: {
        jobId: job.id,
        documentType: 'HANDOVER_PACK',
        fileName: `HandoverPack-${job.jobNumber}.pdf`,
        fileUrl: pdfUrl,
        fileSize: pdfBuffer.length,
        generatedData: handoverData,
        generatedBy: installerId,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Handover pack generated successfully',
      documentId: document.id,
      pdfUrl: pdfUrl,
      documentsIncluded: Object.values(handoverData.documents).filter(d => d.generated).length,
    });

  } catch (error) {
    console.error('Handover pack generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate handover pack', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get existing handover pack for a job
 * GET /api/installer/jobs/[id]/documents/handover-pack/generate
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
        documentType: 'HANDOVER_PACK',
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Handover pack not found' }, { status: 404 });
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
    console.error('Get handover pack error:', error);
    return NextResponse.json(
      { error: 'Failed to get handover pack' },
      { status: 500 }
    );
  }
}
