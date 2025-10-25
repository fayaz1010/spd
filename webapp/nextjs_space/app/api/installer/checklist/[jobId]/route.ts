import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/installer/checklist/[jobId]
 * Get checklist for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    const checklist = await prisma.installerChecklist.findUnique({
      where: { jobId }
    });

    if (!checklist) {
      return NextResponse.json({
        success: true,
        checklist: null
      });
    }

    return NextResponse.json({
      success: true,
      checklist: JSON.parse(checklist.checklistData)
    });
  } catch (error: any) {
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

/**
 * POST /api/installer/checklist/[jobId]
 * Save checklist for a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const body = await request.json();
    const { checklist } = body;

    // Calculate completion
    const allItems = checklist.flatMap((section: any) => section.items);
    const requiredItems = allItems.filter((item: any) => item.required);
    const checkedRequired = requiredItems.filter((item: any) => item.checked);
    const isComplete = checkedRequired.length === requiredItems.length;

    // Upsert checklist
    const saved = await prisma.installerChecklist.upsert({
      where: { jobId },
      create: {
        jobId,
        checklistData: JSON.stringify(checklist),
        isComplete,
        completedAt: isComplete ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      update: {
        checklistData: JSON.stringify(checklist),
        isComplete,
        completedAt: isComplete ? new Date() : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      checklist: saved
    });
  } catch (error: any) {
    console.error('Error saving checklist:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save checklist',
        details: error.message
      },
      { status: 500 }
    );
  }
}
