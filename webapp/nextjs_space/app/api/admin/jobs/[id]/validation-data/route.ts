import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/jobs/[id]/validation-data
 * Get all data needed for pre-submission validation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const jobId = params.id;

    // Fetch job with all related data
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: {
          include: {
            regulatoryApplication: true,
            rebateTracking: true,
            loanApplication: true
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

    // Fetch serial numbers
    const serials = await prisma.equipmentSerial.findMany({
      where: { jobId }
    });

    // Fetch photos
    const photos = await prisma.compliancePhoto.findMany({
      where: { jobId }
    });

    // Fetch checklist items
    const checklistItems = await prisma.complianceChecklistItem.findMany({
      where: { jobId }
    });

    // Fetch documents
    const documents = await prisma.complianceDocument.findMany({
      where: { jobId }
    });

    return NextResponse.json({
      success: true,
      job,
      lead: job.lead,
      serials,
      photos,
      checklistItems,
      documents
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching validation data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch validation data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
