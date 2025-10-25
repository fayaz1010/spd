
/**
 * Reschedule Job API
 * Admin can update job scheduled date and duration
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scheduledDate, estimatedDuration } = body;

    if (!scheduledDate) {
      return NextResponse.json(
        { error: 'Scheduled date is required' },
        { status: 400 }
      );
    }

    const job = await db.installationJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update job
    const updatedJob = await db.installationJob.update({
      where: { id: params.id },
      data: {
        scheduledDate: new Date(scheduledDate),
        ...(estimatedDuration && { estimatedDuration }),
        updatedAt: new Date(),
      },
    });

    // TODO: Send notification to customer and team

    return NextResponse.json({
      success: true,
      job: updatedJob,
    });
  } catch (error) {
    console.error('Reschedule job error:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule job' },
      { status: 500 }
    );
  }
}
