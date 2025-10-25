
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { addDays, startOfDay, endOfDay, isSaturday, isSunday, format } from 'date-fns';

export async function GET(
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
        exp?: number;
      };

      if (decoded.jobId !== params.jobId) {
        return NextResponse.json({ error: 'Invalid token for this job' }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get job details
    const job = await prisma.installationJob.findUnique({
      where: { id: params.jobId },
      include: {
        lead: true,
        team: true,
        subcontractor: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Generate available dates (next 30 days, excluding weekends and fully booked days)
    const availableDates: Array<{
      date: string;
      available: boolean;
      reason?: string;
    }> = [];

    const today = startOfDay(new Date());

    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i);
      
      // Skip weekends
      if (isSaturday(date) || isSunday(date)) {
        availableDates.push({
          date: format(date, 'yyyy-MM-dd'),
          available: false,
          reason: 'Weekend',
        });
        continue;
      }

      // If job is already assigned to a team, check team availability
      if (job.teamId) {
        const teamAvailability = await prisma.teamAvailability.findUnique({
          where: {
            teamId_date: {
              teamId: job.teamId,
              date: date,
            },
          },
        });

        if (teamAvailability && !teamAvailability.isAvailable) {
          availableDates.push({
            date: format(date, 'yyyy-MM-dd'),
            available: false,
            reason: teamAvailability.reason || 'Team unavailable',
          });
          continue;
        }

        // Check how many jobs the team already has on this date
        const jobsOnDate = await prisma.installationJob.count({
          where: {
            teamId: job.teamId,
            scheduledDate: {
              gte: startOfDay(date),
              lte: endOfDay(date),
            },
            status: {
              in: ['SCHEDULED', 'SUB_CONFIRMED', 'MATERIALS_ORDERED', 'MATERIALS_READY', 'IN_PROGRESS'],
            },
          },
        });

        const team = await prisma.team.findUnique({
          where: { id: job.teamId },
        });

        const maxJobs = teamAvailability?.maxJobs || team?.maxConcurrentJobs || 2;

        if (jobsOnDate >= maxJobs) {
          availableDates.push({
            date: format(date, 'yyyy-MM-dd'),
            available: false,
            reason: 'Fully booked',
          });
          continue;
        }
      }

      // Date is available
      availableDates.push({
        date: format(date, 'yyyy-MM-dd'),
        available: true,
      });
    }

    return NextResponse.json({
      success: true,
      availableDates: availableDates.filter(d => d.available).map(d => d.date),
      allDates: availableDates,
      job: {
        jobNumber: job.jobNumber,
        systemSize: job.systemSize,
        estimatedDuration: job.estimatedDuration,
      },
    });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return NextResponse.json({ error: 'Failed to fetch available dates' }, { status: 500 });
  }
}
