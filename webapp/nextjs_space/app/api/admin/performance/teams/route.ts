import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * GET - Get team performance comparison
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

    // Get all teams with their performance
    const teams = await prisma.team.findMany({
      where: {
        isActive: true,
      },
      include: {
        members: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            averageInstallSpeed: true,
            qualityScore: true,
            currentMonthBonus: true,
          },
        },
        jobs: {
          where: {
            status: 'COMPLETED',
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            actualHoursPerKw: true,
            qualityScore: true,
            bonusPaidToTeam: true,
            costSaved: true,
          },
        },
      },
    });

    // Calculate team metrics
    const teamMetrics = teams.map(team => {
      const jobs = team.jobs;
      const members = team.members;

      const avgSpeed = jobs.length > 0
        ? jobs.reduce((sum, j) => sum + (j.actualHoursPerKw || 0), 0) / jobs.length
        : 0;

      const avgQuality = jobs.length > 0
        ? jobs.reduce((sum, j) => sum + (j.qualityScore || 0), 0) / jobs.length
        : 0;

      const totalBonus = jobs.reduce((sum, j) => sum + (j.bonusPaidToTeam || 0), 0);
      const totalSavings = jobs.reduce((sum, j) => sum + (j.costSaved || 0), 0);

      return {
        id: team.id,
        name: team.name,
        color: team.color,
        memberCount: members.length,
        jobsCompleted: jobs.length,
        avgSpeed,
        avgQuality,
        totalBonus,
        totalSavings,
      };
    });

    // Sort by total savings (best performing teams)
    teamMetrics.sort((a, b) => b.totalSavings - a.totalSavings);

    return NextResponse.json({ teams: teamMetrics });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching team performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team performance' },
      { status: 500 }
    );
  }
}
