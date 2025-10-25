import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * GET - Get staff performance metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    // Get current month for filtering
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get monthly metrics
    const monthlyMetric = await prisma.performanceMetric.findUnique({
      where: {
        staffId_month_year: {
          staffId: params.id,
          month: currentMonth,
          year: currentYear,
        },
      },
    });

    // Get staff with calculated fields
    const staff = await prisma.teamMember.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        role: true,
        averageInstallSpeed: true,
        totalInstallations: true,
        totalInstallHours: true,
        totalSystemsKw: true,
        qualityScore: true,
        callbackRate: true,
        totalBonusEarned: true,
        lifetimeSavings: true,
        currentMonthBonus: true,
        lastBonusDate: true,
      },
    });

    return NextResponse.json({
      metrics: monthlyMetric,
      staff,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
