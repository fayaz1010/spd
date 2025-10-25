
/**
 * Installation Dashboard Stats API
 * Calculates and returns all KPIs for the installation operations dashboard
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // 1. Pending Schedule
    const pendingSchedule = await db.installationJob.count({
      where: { status: 'PENDING_SCHEDULE' },
    });

    // 2. Jobs This Week
    const jobsThisWeek = await db.installationJob.count({
      where: {
        scheduledDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: {
          in: ['SCHEDULED', 'SUB_CONFIRMED', 'MATERIALS_READY', 'IN_PROGRESS'],
        },
      },
    });

    // 3. Jobs Overdue (past scheduling deadline and still pending)
    const jobsOverdue = await db.installationJob.count({
      where: {
        status: 'PENDING_SCHEDULE',
        schedulingDeadline: {
          lt: now,
        },
      },
    });

    // 4. Avg Time: Payment → Installation
    const completedJobs = await db.installationJob.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
      take: 50, // Last 50 completed jobs
      orderBy: {
        completedAt: 'desc',
      },
    });

    const avgTimePaymentToInstall =
      completedJobs.length > 0
        ? completedJobs.reduce((sum: number, job: any) => {
            return sum + differenceInDays(job.completedAt!, job.createdAt);
          }, 0) / completedJobs.length
        : 0;

    // 5. Team Utilization
    const teams = await db.team.findMany({
      where: { isActive: true },
      include: {
        jobs: {
          where: {
            scheduledDate: {
              gte: weekStart,
              lte: weekEnd,
            },
            status: {
              in: ['SCHEDULED', 'SUB_CONFIRMED', 'MATERIALS_READY', 'IN_PROGRESS'],
            },
          },
        },
      },
    });

    const teamUtilization =
      teams.length > 0
        ? teams.reduce((sum: number, team: any) => {
            const utilization = Math.min((team.jobs.length / team.maxConcurrentJobs) * 100, 100);
            return sum + utilization;
          }, 0) / teams.length
        : 0;

    // 6. Pending Sub Confirmations
    const pendingSubConfirmations = await db.installationJob.count({
      where: { status: 'PENDING_SUB_CONFIRM' },
    });

    // 7. Weather Alerts
    const weatherAlerts = await db.weatherAlert.count({
      where: {
        alertSent: false,
        rainProbability: { gte: 70 },
      },
    });

    // 8. This Month Stats
    const totalJobsThisMonth = await db.installationJob.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    const completedThisMonth = await db.installationJob.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    // 9. Jobs by Status
    const allJobs = await db.installationJob.groupBy({
      by: ['status'],
      _count: true,
    });

    const jobsByStatus = allJobs.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // 10. Jobs by Team
    const jobsByTeamData = await db.installationJob.groupBy({
      by: ['teamId'],
      where: {
        teamId: { not: null },
        status: {
          in: ['SCHEDULED', 'SUB_CONFIRMED', 'MATERIALS_READY', 'IN_PROGRESS'],
        },
      },
      _count: true,
    });

    const teamIds = jobsByTeamData.map((item) => item.teamId).filter(Boolean) as string[];
    const teamsData = await db.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true, color: true },
    });

    const jobsByTeam = jobsByTeamData.map((item: any) => {
      const team = teamsData.find((t: any) => t.id === item.teamId);
      return {
        teamName: team?.name || 'Unknown',
        count: item._count,
        color: team?.color || '#64748b',
      };
    });

    // 11. Installation Trend (Last 3 Months)
    const installationTrend = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      const completed = await db.installationJob.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const scheduled = await db.installationJob.count({
        where: {
          status: {
            in: ['SCHEDULED', 'SUB_CONFIRMED', 'MATERIALS_READY', 'IN_PROGRESS'],
          },
          scheduledDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      installationTrend.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        completed,
        scheduled,
      });
    }

    return NextResponse.json({
      pendingSchedule,
      jobsThisWeek,
      jobsOverdue,
      avgTimePaymentToInstall,
      teamUtilization,
      pendingSubConfirmations,
      weatherAlerts,
      totalJobsThisMonth,
      completedThisMonth,
      jobsByStatus,
      jobsByTeam,
      installationTrend,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
