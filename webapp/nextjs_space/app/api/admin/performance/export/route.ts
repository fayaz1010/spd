import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * GET - Export performance report as CSV
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Get date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all staff with their performance
    const staff = await prisma.teamMember.findMany({
      where: {
        isActive: true,
      },
      include: {
        Team: {
          select: {
            name: true,
          },
        },
        jobAssignments: {
          where: {
            job: {
              status: 'COMPLETED',
              completedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          include: {
            job: {
              select: {
                jobNumber: true,
                systemSize: true,
                actualHoursPerKw: true,
                qualityScore: true,
                completedAt: true,
              },
            },
          },
        },
      },
    });

    // Build CSV
    const headers = [
      'Staff Name',
      'Role',
      'Team',
      'Jobs Completed',
      'Avg Speed (hrs/kW)',
      'Avg Quality',
      'Total Bonus',
      'Lifetime Bonus',
      'Callback Rate',
    ];

    const rows = staff.map(member => {
      const jobs = member.jobAssignments;
      const avgSpeed = jobs.length > 0
        ? jobs.reduce((sum, a) => sum + (a.job.actualHoursPerKw || 0), 0) / jobs.length
        : 0;
      const avgQuality = jobs.length > 0
        ? jobs.reduce((sum, a) => sum + (a.job.qualityScore || 0), 0) / jobs.length
        : 0;

      return [
        member.name,
        member.role,
        member.Team.name,
        jobs.length,
        avgSpeed.toFixed(2),
        avgQuality.toFixed(0),
        member.currentMonthBonus?.toFixed(2) || '0.00',
        member.totalBonusEarned?.toFixed(2) || '0.00',
        member.callbackRate?.toFixed(1) || '0.0',
      ];
    });

    // Convert to CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="performance-report-${year}-${month}.csv"`,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}
