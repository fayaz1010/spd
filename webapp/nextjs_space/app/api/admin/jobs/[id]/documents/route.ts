import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/admin/jobs/[id]/documents
 * Get all compliance documents for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const jobId = params.id;

    const documents = await prisma.complianceDocument.findMany({
      where: { jobId },
      orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      documents
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch documents',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/jobs/[id]/documents
 * Upload compliance document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const jobId = params.id;
    const formData = await request.formData();
    
    const document = formData.get('document') as File;
    const documentType = formData.get('documentType') as string;
    const signedBy = formData.get('signedBy') as string | null;

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'No document provided' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents', jobId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${documentType}_${timestamp}_${document.name}`;
    const filepath = join(uploadDir, filename);

    // Save file
    const bytes = await document.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create database record
    const documentUrl = `/uploads/documents/${jobId}/${filename}`;
    
    const complianceDocument = await prisma.complianceDocument.create({
      data: {
        jobId,
        documentType,
        documentUrl,
        fileName: document.name,
        fileSize: document.size,
        uploadedBy: 'admin',
        signedBy
      }
    });

    // Create activity log
    await prisma.leadActivity.create({
      data: {
        leadId: (await prisma.installationJob.findUnique({ 
          where: { id: jobId },
          select: { leadId: true }
        }))!.leadId,
        type: 'compliance',
        description: `Compliance document uploaded: ${documentType}`,
        createdBy: 'admin',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      document: complianceDocument
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload document',
        details: error.message
      },
      { status: 500 }
    );
  }
}
