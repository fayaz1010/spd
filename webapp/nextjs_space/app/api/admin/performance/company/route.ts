import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * GET - Get company-wide performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Get date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all completed jobs in the period
    const jobs = await prisma.installationJob.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
        bonusEligible: true,
      },
      select: {
        id: true,
        costSaved: true,
        bonusPaidToTeam: true,
        bonusRetainedByCompany: true,
        actualHoursPerKw: true,
        qualityScore: true,
        systemSize: true,
        actualHours: true,
        teamId: true,
        subcontractorId: true,
      },
    });

    // Calculate metrics
    const totalSavings = jobs.reduce((sum, j) => sum + (j.costSaved || 0), 0);
    const totalBonuses = jobs.reduce((sum, j) => sum + (j.bonusPaidToTeam || 0), 0);
    const avgSpeed = jobs.length > 0
      ? jobs.reduce((sum, j) => sum + (j.actualHoursPerKw || 0), 0) / jobs.length
      : 0;
    const avgQuality = jobs.length > 0
      ? jobs.reduce((sum, j) => sum + (j.qualityScore || 0), 0) / jobs.length
      : 0;

    // Get unique staff count
    const staffCount = await prisma.teamMember.count({
      where: {
        isActive: true,
        currentMonthBonus: {
          gt: 0,
        },
      },
    });

    // Get previous month for comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const prevJobs = await prisma.installationJob.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        bonusEligible: true,
      },
      select: {
        costSaved: true,
      },
    });

    const prevSavings = prevJobs.reduce((sum, j) => sum + (j.costSaved || 0), 0);
    const savingsChange = prevSavings > 0
      ? ((totalSavings - prevSavings) / prevSavings) * 100
      : 0;

    return NextResponse.json({
      totalSavings,
      totalBonuses,
      avgSpeed,
      avgQuality,
      staffCount,
      jobsCompleted: jobs.length,
      savingsChange,
      companyProfit: totalSavings - totalBonuses,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching company metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
