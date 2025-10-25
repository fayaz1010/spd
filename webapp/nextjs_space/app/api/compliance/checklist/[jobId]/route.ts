import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateComplianceScore } from '@/lib/compliance-scoring';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    let checklist = await prisma.complianceChecklist.findUnique({
      where: { jobId },
    });

    // Create if doesn't exist
    if (!checklist) {
      checklist = await prisma.complianceChecklist.create({
        data: { jobId },
      });
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch checklist' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const body = await request.json();

    // Calculate compliance score
    const score = calculateComplianceScore(body);

    // Update checklist with new values and score
    const checklist = await prisma.complianceChecklist.upsert({
      where: { jobId },
      update: {
        ...body,
        complianceScore: score.totalScore,
        isFullyCompliant: score.isFullyCompliant,
        complianceIssues: score.missingItems,
        updatedAt: new Date(),
      },
      create: {
        jobId,
        ...body,
        complianceScore: score.totalScore,
        isFullyCompliant: score.isFullyCompliant,
        complianceIssues: score.missingItems,
      },
    });

    // Update compliance record
    await updateComplianceRecord(jobId, score);

    return NextResponse.json({
      success: true,
      checklist,
      score,
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update checklist' },
      { status: 500 }
    );
  }
}

async function updateComplianceRecord(jobId: string, score: any) {
  try {
    await prisma.complianceRecord.upsert({
      where: { jobId },
      update: {
        complianceScore: score.totalScore,
        isCompliant: score.isFullyCompliant,
        complianceIssues: score.missingItems,
        updatedAt: new Date(),
      },
      create: {
        jobId,
        complianceScore: score.totalScore,
        isCompliant: score.isFullyCompliant,
        complianceIssues: score.missingItems,
      },
    });
  } catch (error) {
    console.error('Failed to update compliance record:', error);
  }
}
