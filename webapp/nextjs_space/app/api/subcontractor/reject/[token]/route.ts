
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const rejectJobSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
  alternativeDates: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const data = rejectJobSchema.parse(body);

    const job = await prisma.installationJob.findUnique({
      where: { subConfirmationToken: params.token },
      include: {
        lead: true,
        subcontractor: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Invalid or expired confirmation link' }, { status: 404 });
    }

    if (job.subConfirmedAt) {
      return NextResponse.json({ error: 'Job already confirmed, cannot reject' }, { status: 400 });
    }

    if (job.subRejectedAt) {
      return NextResponse.json({ error: 'Job already rejected' }, { status: 400 });
    }

    // Update job - mark as rejected and reset to PENDING_SCHEDULE
    const rejectionDetails = data.alternativeDates 
      ? `${data.reason}\n\nAlternative dates suggested: ${data.alternativeDates}`
      : data.reason;

    const updatedJob = await prisma.installationJob.update({
      where: { id: job.id },
      data: {
        status: 'PENDING_SCHEDULE',
        subRejectedAt: new Date(),
        subRejectionReason: rejectionDetails,
        subcontractorId: null, // Unassign subcontractor
        subConfirmationToken: null,
        scheduledDate: null,
        scheduledStartTime: null,
      },
      include: {
        lead: true,
        subcontractor: true,
      },
    });

    // TODO: Send notification to admin about rejection
    console.log('Notify admin: Job', updatedJob.jobNumber, 'rejected by subcontractor');
    console.log('Reason:', data.reason);
    console.log('Alternative dates:', data.alternativeDates);

    return NextResponse.json({
      success: true,
      message: 'Your response has been recorded. The admin team will be in touch shortly.',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error rejecting job:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process rejection' }, { status: 500 });
  }
}
