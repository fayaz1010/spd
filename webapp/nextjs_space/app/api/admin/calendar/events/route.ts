
/**
 * Calendar Events API
 * Returns installation jobs formatted for calendar display
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { addHours } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      scheduledDate: { not: null },
    };

    if (teamId && teamId !== 'all') {
      where.teamId = teamId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch jobs
    const jobs = await db.installationJob.findMany({
      where,
      include: {
        lead: true,
        team: true,
        subcontractor: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // Fetch all teams for legend
    const teams = await db.team.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    // Format events for calendar
    const events = jobs.map((job: any) => {
      const startDate = job.scheduledDate!;
      const endDate = addHours(startDate, job.estimatedDuration);

      return {
        id: job.id,
        title: job.jobNumber,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        resource: {
          jobId: job.id,
          jobNumber: job.jobNumber,
          status: job.status,
          teamId: job.teamId,
          teamName: job.team?.name || null,
          teamColor: job.team?.color || null,
          subcontractorName: job.subcontractor?.companyName || null,
          customerName: job.lead.fullName,
          systemSize: job.systemSize,
          address: `${job.lead.address}, ${job.lead.suburb || ''} ${job.lead.postcode || ''}`,
        },
      };
    });

    return NextResponse.json({
      events,
      teams,
    });
  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
