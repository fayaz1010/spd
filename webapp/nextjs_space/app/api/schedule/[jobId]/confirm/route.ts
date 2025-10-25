
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { startOfDay } from 'date-fns';

const confirmScheduleSchema = z.object({
  scheduledDate: z.string(),
  timeSlot: z.enum(['morning', 'afternoon']), // morning: 9am-12pm, afternoon: 1pm-4pm
});

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 401 });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key') as {
        jobId: string;
      };

      if (decoded.jobId !== params.jobId) {
        return NextResponse.json({ error: 'Invalid token for this job' }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const data = confirmScheduleSchema.parse(body);

    // Get job
    const job = await prisma.installationJob.findUnique({
      where: { id: params.jobId },
      include: {
        lead: true,
        team: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if job is already scheduled
    if (job.status !== 'PENDING_SCHEDULE') {
      return NextResponse.json({ 
        error: 'This job has already been scheduled',
        currentStatus: job.status,
      }, { status: 400 });
    }

    // Determine start time based on time slot
    const scheduledStartTime = data.timeSlot === 'morning' ? '09:00' : '13:00';

    // Update job
    const updatedJob = await prisma.installationJob.update({
      where: { id: params.jobId },
      data: {
        scheduledDate: new Date(data.scheduledDate),
        scheduledStartTime: scheduledStartTime,
        customerScheduledAt: new Date(),
        status: 'SCHEDULED',
      },
      include: {
        lead: true,
        team: true,
      },
    });

    // TODO: Send confirmation email to customer
    console.log('Send installation confirmation to customer:', updatedJob.lead.email);
    console.log('Scheduled date:', data.scheduledDate, 'at', scheduledStartTime);

    // TODO: Notify admin
    console.log('Notify admin: Customer scheduled job', updatedJob.jobNumber);

    return NextResponse.json({
      success: true,
      message: 'Installation scheduled successfully',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error confirming schedule:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to confirm schedule' }, { status: 500 });
  }
}
