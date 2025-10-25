import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateCustomerDeclarationPDF, validateCustomerDeclaration, calculateSTCs } from '@/lib/pdf-generators/customer-declaration-generator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Generate Customer Declaration (STC Assignment) from installer wizard data
 * POST /api/installer/jobs/[id]/documents/customer-declaration/generate
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

    // Check if declaration already exists
    const existingDeclaration = await prisma.customerDeclaration.findUnique({
      where: { jobId: job.id },
    });

    if (existingDeclaration && existingDeclaration.pdfUrl) {
      return NextResponse.json({
        success: true,
        message: 'Customer declaration already exists',
        declarationId: existingDeclaration.id,
        pdfUrl: existingDeclaration.pdfUrl,
      });
    }

    // Parse wizard data
    let wizardData: any = {};
    try {
      wizardData = job.installationNotes ? JSON.parse(job.installationNotes) : {};
    } catch (e) {
      console.error('Failed to parse wizard data:', e);
    }

    // Calculate STCs
    const stcCalculation = calculateSTCs(job.systemSize, 'Zone 3'); // Perth is Zone 3

    // Prepare customer declaration data
    const declarationData = {
      jobNumber: job.jobNumber,
      installationDate: job.installationDate || job.scheduledDate || new Date(),
      
      customerName: job.lead.name,
      customerAddress: job.lead.address,
      suburb: job.lead.suburb,
      postcode: job.lead.postcode,
      customerEmail: job.lead.email,
      customerPhone: job.lead.phone,
      
      propertyOwner: true, // Assume true unless specified
      ownerName: null,
      
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      panelWattage: Math.round((job.systemSize * 1000) / job.panelCount),
      inverterModel: job.inverterModel,
      batteryCapacity: job.batteryCapacity,
      
      stcCount: stcCalculation.count,
      stcValue: stcCalculation.estimatedValue,
      stcAssignedTo: 'Sun Direct Power',
      stcAssignedToABN: '12345678901', // TODO: Get from company settings
      
      declarations: {
        systemOwnership: true,
        newInstallation: true,
        notPreviouslyClaimed: true,
        accurateInformation: true,
        authorizeAssignment: true,
      },
      
      customerSignature: wizardData.customerSignature || null,
      signedAt: wizardData.customerSignature ? new Date() : null,
      
      installerName: job.leadElectrician?.name || 'Unknown',
      installerCompany: 'Sun Direct Power',
      installerCecNumber: job.leadElectrician?.cecAccreditationNumber || 'N/A',
    };

    // Validate declaration data
    const validation = validateCustomerDeclaration(declarationData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid declaration data', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateCustomerDeclarationPDF(declarationData);
    
    // TODO: Upload to S3 or file storage
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Create or update CustomerDeclaration record
    const declaration = await prisma.customerDeclaration.upsert({
      where: { jobId: job.id },
      create: {
        jobId: job.id,
        customerName: declarationData.customerName,
        customerAddress: declarationData.customerAddress,
        customerEmail: declarationData.customerEmail,
        customerPhone: declarationData.customerPhone,
        customerSignature: declarationData.customerSignature || 'Pending',
        signedAt: declarationData.signedAt,
        systemSize: declarationData.systemSize,
        stcCount: declarationData.stcCount,
        stcValue: declarationData.stcValue,
        stcAssignedTo: declarationData.stcAssignedTo,
        stcAssignedToABN: declarationData.stcAssignedToABN,
        declarations: declarationData.declarations,
        pdfUrl: pdfUrl,
      },
      update: {
        customerSignature: declarationData.customerSignature || 'Pending',
        signedAt: declarationData.signedAt,
        pdfUrl: pdfUrl,
        updatedAt: new Date(),
      },
    });

    // Create GeneratedDocument record
    await prisma.generatedDocument.create({
      data: {
        jobId: job.id,
        documentType: 'CUSTOMER_DECLARATION',
        fileName: `CustomerDeclaration-${job.jobNumber}.pdf`,
        fileUrl: pdfUrl,
        fileSize: pdfBuffer.length,
        generatedData: declarationData,
        generatedBy: installerId,
        status: declarationData.customerSignature ? 'COMPLETED' : 'DRAFT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Customer declaration generated successfully',
      declarationId: declaration.id,
      pdfUrl: declaration.pdfUrl,
      stcCount: stcCalculation.count,
      stcValue: stcCalculation.estimatedValue,
    });

  } catch (error) {
    console.error('Customer declaration generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate customer declaration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get existing customer declaration for a job
 * GET /api/installer/jobs/[id]/documents/customer-declaration/generate
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

    const declaration = await prisma.customerDeclaration.findUnique({
      where: { jobId: params.id },
    });

    if (!declaration) {
      return NextResponse.json({ error: 'Customer declaration not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      declaration: {
        id: declaration.id,
        pdfUrl: declaration.pdfUrl,
        customerName: declaration.customerName,
        signedAt: declaration.signedAt,
        stcCount: declaration.stcCount,
        stcValue: declaration.stcValue,
      },
    });

  } catch (error) {
    console.error('Get customer declaration error:', error);
    return NextResponse.json(
      { error: 'Failed to get customer declaration' },
      { status: 500 }
    );
  }
}
