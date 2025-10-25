import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, canAccessJob } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { status, notes } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check access
    if (!canAccessJob(user, job)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      status,
      installationNotes: notes || job.installationNotes,
      updatedAt: new Date(),
    };

    // Auto-set dates based on status
    if (status === 'COMPLETED' && !job.completedAt) {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.installationJob.update({
      where: { id: params.id },
      data: updateData,
      include: {
        lead: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    // TODO: Send notification to customer about status change
    // This could be an email or SMS notification

    return NextResponse.json({
      success: true,
      job: updated,
      message: `Job status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('Update job status error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
