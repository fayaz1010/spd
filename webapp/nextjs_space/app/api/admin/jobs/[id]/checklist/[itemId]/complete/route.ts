import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/jobs/[id]/checklist/[itemId]/complete
 * Mark checklist item as complete/incomplete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    requireAdmin(request);

    const { id: jobId, itemId } = params;
    const body = await request.json();
    
    const {
      checklistType,
      itemName,
      itemDescription,
      isRequired,
      isCompleted
    } = body;

    // Check if item exists
    const existing = await prisma.complianceChecklistItem.findFirst({
      where: {
        jobId,
        itemName
      }
    });

    let item;
    
    if (existing) {
      // Update existing item
      item = await prisma.complianceChecklistItem.update({
        where: { id: existing.id },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          completedBy: isCompleted ? 'admin' : null
        }
      });
    } else {
      // Create new item
      item = await prisma.complianceChecklistItem.create({
        data: {
          jobId,
          checklistType,
          itemName,
          itemDescription,
          isRequired,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          completedBy: isCompleted ? 'admin' : null
        }
      });
    }

    return NextResponse.json({
      success: true,
      item
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error updating checklist item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update checklist item',
        details: error.message
      },
      { status: 500 }
    );
  }
}
