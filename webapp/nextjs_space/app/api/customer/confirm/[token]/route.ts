import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const confirmScheduleSchema = z.object({
  confirmedBy: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
});

export const dynamic = 'force-dynamic';

// GET - Fetch job details for customer confirmation
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const job = await prisma.installationJob.findUnique({
      where: { customerConfirmationToken: params.token },
      include: {
        lead: true,
        team: true,
        subcontractor: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Invalid or expired confirmation link' }, { status: 404 });
    }

    // Check if already confirmed
    if (job.customerConfirmedAt) {
      return NextResponse.json({ 
        error: 'Installation already confirmed',
        confirmedAt: job.customerConfirmedAt,
        confirmedBy: job.customerConfirmedBy,
      }, { status: 400 });
    }

    const installerName = job.team?.name || job.subcontractor?.companyName || 'Installation team';

    // Return job details
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        customerName: job.lead.name,
        systemSize: job.systemSize,
        panelCount: job.panelCount,
        batteryCapacity: job.batteryCapacity,
        scheduledDate: job.scheduledDate,
        scheduledStartTime: job.scheduledStartTime,
        estimatedDuration: job.estimatedDuration,
        installerName,
      },
    });
  } catch (error) {
    console.error('Error fetching job for customer confirmation:', error);
    return NextResponse.json({ error: 'Failed to fetch installation details' }, { status: 500 });
  }
}

// POST - Confirm installation schedule
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const data = confirmScheduleSchema.parse(body);

    const job = await prisma.installationJob.findUnique({
      where: { customerConfirmationToken: params.token },
      include: {
        lead: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Invalid or expired confirmation link' }, { status: 404 });
    }

    if (job.customerConfirmedAt) {
      return NextResponse.json({ error: 'Installation already confirmed' }, { status: 400 });
    }

    // Update job with customer confirmation
    const updatedJob = await prisma.installationJob.update({
      where: { id: job.id },
      data: {
        customerConfirmedAt: new Date(),
        customerConfirmedBy: data.confirmedBy,
      },
      include: {
        lead: true,
      },
    });

    // TODO: Send confirmation to admin
    console.log('Customer confirmed installation:', updatedJob.jobNumber);
    console.log('Confirmed by:', data.confirmedBy);

    return NextResponse.json({
      success: true,
      message: 'Installation confirmed! We look forward to seeing you on the scheduled date.',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error confirming installation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to confirm installation' }, { status: 500 });
  }
}
