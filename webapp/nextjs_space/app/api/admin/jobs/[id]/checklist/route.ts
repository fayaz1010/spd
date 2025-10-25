import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/jobs/[id]/checklist
 * Get compliance checklist items for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const jobId = params.id;

    const items = await prisma.complianceChecklistItem.findMany({
      where: { jobId },
      orderBy: [
        { checklistType: 'asc' },
        { itemName: 'asc' }
      ]
    });

    // Calculate progress
    const required = items.filter(i => i.isRequired);
    const completed = required.filter(i => i.isCompleted);
    
    const progress = {
      total: required.length,
      completed: completed.length,
      percentage: required.length > 0 ? Math.round((completed.length / required.length) * 100) : 0
    };

    return NextResponse.json({
      success: true,
      items,
      progress
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching checklist:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch checklist',
        details: error.message
      },
      { status: 500 }
    );
  }
}
