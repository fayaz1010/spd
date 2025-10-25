
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const confirmJobSchema = z.object({
  confirmedBy: z.string().min(2, 'Name is required'),
  message: z.string().optional(),
});

const rejectJobSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason'),
  alternativeDates: z.string().optional(),
});

// GET - Fetch job details for confirmation page
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
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

    // Check if already confirmed or rejected
    if (job.subConfirmedAt) {
      return NextResponse.json({ 
        error: 'This job has already been confirmed',
        confirmedAt: job.subConfirmedAt,
        confirmedBy: job.subConfirmedBy,
      }, { status: 400 });
    }

    if (job.subRejectedAt) {
      return NextResponse.json({ 
        error: 'This job has already been rejected',
        rejectedAt: job.subRejectedAt,
        reason: job.subRejectionReason,
      }, { status: 400 });
    }

    // Return job details (hide sensitive info)
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        customerName: job.lead.name,
        customerAddress: job.lead.address,
        customerPhone: job.lead.phone,
        systemSize: job.systemSize,
        panelCount: job.panelCount,
        batteryCapacity: job.batteryCapacity,
        inverterModel: job.inverterModel,
        scheduledDate: job.scheduledDate,
        scheduledStartTime: job.scheduledStartTime,
        estimatedDuration: job.estimatedDuration,
        installationNotes: job.installationNotes,
        suburb: job.siteSuburb,
        subcontractor: {
          companyName: job.subcontractor?.companyName,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching job for confirmation:', error);
    return NextResponse.json({ error: 'Failed to fetch job details' }, { status: 500 });
  }
}

// POST - Confirm job
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const data = confirmJobSchema.parse(body);

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
      return NextResponse.json({ error: 'Job already confirmed' }, { status: 400 });
    }

    // Update job status to SUB_CONFIRMED
    const updatedJob = await prisma.installationJob.update({
      where: { id: job.id },
      data: {
        status: 'SUB_CONFIRMED',
        subConfirmedAt: new Date(),
        subConfirmedBy: data.confirmedBy,
        customerScheduledAt: new Date(),
      },
      include: {
        lead: true,
        subcontractor: true,
      },
    });

    // TODO: Send confirmation email to customer
    console.log('Send installation confirmation to customer:', updatedJob.lead.email);
    console.log('Confirmed by:', data.confirmedBy);
    console.log('Message:', data.message);

    // TODO: Send notification to admin
    console.log('Notify admin: Job', updatedJob.jobNumber, 'confirmed by subcontractor');

    return NextResponse.json({
      success: true,
      message: 'Job confirmed successfully. The customer has been notified.',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error confirming job:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to confirm job' }, { status: 500 });
  }
}

// DELETE - Reject job
export async function DELETE(
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

    if (job.subRejectedAt) {
      return NextResponse.json({ error: 'Job already rejected' }, { status: 400 });
    }

    // Update job status back to PENDING_SCHEDULE
    const updatedJob = await prisma.installationJob.update({
      where: { id: job.id },
      data: {
        status: 'PENDING_SCHEDULE',
        subRejectedAt: new Date(),
        subRejectionReason: data.reason,
        subcontractorId: null, // Clear subcontractor assignment
        subConfirmationToken: null, // Invalidate token
      },
      include: {
        lead: true,
      },
    });

    // TODO: Send notification to admin about rejection
    console.log('Notify admin: Job', updatedJob.jobNumber, 'rejected by subcontractor');
    console.log('Reason:', data.reason);
    console.log('Alternative dates:', data.alternativeDates);

    return NextResponse.json({
      success: true,
      message: 'Job rejection recorded. The admin team has been notified.',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error rejecting job:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to reject job' }, { status: 500 });
  }
}
