import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Get all documents for a job
 * GET /api/installer/jobs/[id]/documents
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

    // Get all document types for this job
    const [
      sld,
      electricalCert,
      complianceStatement,
      testResults,
      customerDeclaration,
      handoverPack,
      generatedDocs,
    ] = await Promise.all([
      prisma.singleLineDiagram.findUnique({ where: { jobId: params.id } }) as any,
      prisma.electricalCertificate.findUnique({ where: { jobId: params.id } }),
      prisma.complianceStatement.findUnique({ where: { jobId: params.id } }),
      prisma.testResults.findUnique({ where: { jobId: params.id } }),
      prisma.customerDeclaration.findUnique({ where: { jobId: params.id } }),
      prisma.handoverPack.findUnique({ where: { jobId: params.id } }) as any,
      prisma.generatedDocument.findMany({
        where: { jobId: params.id },
        orderBy: { generatedAt: 'desc' },
      }),
    ]);

    // Format documents for response
    const documents = [];

    if (sld) {
      documents.push({
        id: sld.id,
        type: 'SINGLE_LINE_DIAGRAM',
        name: 'Single Line Diagram',
        description: 'AS/NZS 5033:2021 compliant system diagram',
        pdfUrl: sld.pdfUrl,
        svgUrl: sld.svgUrl,
        generatedAt: sld.generatedAt,
        generatedBy: sld.generatedBy,
        status: sld.pdfUrl ? 'COMPLETED' : 'DRAFT',
      });
    }

    if (testResults) {
      documents.push({
        id: testResults.id,
        type: 'TEST_RESULTS',
        name: 'Test Results',
        description: 'Commissioning and electrical test results',
        pdfUrl: testResults.pdfUrl,
        generatedAt: testResults.createdAt,
        testedBy: testResults.testedBy,
        status: testResults.pdfUrl ? 'COMPLETED' : 'DRAFT',
      });
    }

    if (electricalCert) {
      documents.push({
        id: electricalCert.id,
        type: 'ELECTRICAL_CERTIFICATE',
        name: 'Electrical Certificate',
        description: `${electricalCert.certificateType} - ${electricalCert.state}`,
        pdfUrl: electricalCert.pdfUrl,
        generatedAt: electricalCert.createdAt,
        certificateNumber: electricalCert.certificateNumber,
        status: electricalCert.submittedToAuthority ? 'SUBMITTED' : electricalCert.pdfUrl ? 'COMPLETED' : 'DRAFT',
      });
    }

    if (complianceStatement) {
      documents.push({
        id: complianceStatement.id,
        type: 'COMPLIANCE_STATEMENT',
        name: 'Compliance Statement',
        description: 'CEC compliance statement',
        pdfUrl: complianceStatement.pdfUrl,
        generatedAt: complianceStatement.createdAt,
        status: complianceStatement.signedAt ? 'SIGNED' : complianceStatement.pdfUrl ? 'COMPLETED' : 'DRAFT',
      });
    }

    if (customerDeclaration) {
      documents.push({
        id: customerDeclaration.id,
        type: 'CUSTOMER_DECLARATION',
        name: 'Customer Declaration',
        description: 'STC assignment declaration',
        pdfUrl: customerDeclaration.pdfUrl,
        generatedAt: customerDeclaration.createdAt,
        signedAt: customerDeclaration.signedAt,
        status: customerDeclaration.signedAt ? 'SIGNED' : 'DRAFT',
      });
    }

    if (handoverPack) {
      documents.push({
        id: handoverPack.id,
        type: 'HANDOVER_PACK',
        name: 'Handover Pack',
        description: 'Complete documentation package',
        pdfUrl: handoverPack.pdfUrl,
        generatedAt: handoverPack.createdAt,
        status: handoverPack.deliveredToCustomer ? 'DELIVERED' : handoverPack.pdfUrl ? 'COMPLETED' : 'DRAFT',
      });
    }

    // Add other generated documents
    generatedDocs.forEach(doc => {
      if (!documents.find(d => d.id === doc.id)) {
        documents.push({
          id: doc.id,
          type: doc.documentType,
          name: doc.fileName,
          description: `Generated ${new Date(doc.generatedAt).toLocaleDateString()}`,
          pdfUrl: doc.fileUrl,
          generatedAt: doc.generatedAt,
          generatedBy: doc.generatedBy,
          status: doc.status,
        });
      }
    });

    return NextResponse.json({
      success: true,
      documents,
      summary: {
        total: documents.length,
        completed: documents.filter(d => d.status === 'COMPLETED' || d.status === 'SIGNED').length,
        draft: documents.filter(d => d.status === 'DRAFT').length,
        submitted: documents.filter(d => d.status === 'SUBMITTED' || d.status === 'DELIVERED').length,
      },
    });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}
