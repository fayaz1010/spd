import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * GET - Get leaderboards (speed, quality, bonus)
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Get top performers by speed (lowest hrs/kW)
    const speedLeaders = await prisma.teamMember.findMany({
      where: {
        isActive: true,
        averageInstallSpeed: {
          not: null,
        },
        totalInstallations: {
          gte: 3, // At least 3 jobs to qualify
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        averageInstallSpeed: true,
        totalInstallations: true,
      },
      orderBy: {
        averageInstallSpeed: 'asc',
      },
      take: 10,
    });

    // Get top performers by quality (highest score)
    const qualityLeaders = await prisma.teamMember.findMany({
      where: {
        isActive: true,
        qualityScore: {
          not: null,
        },
        totalInstallations: {
          gte: 3,
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        qualityScore: true,
        totalInstallations: true,
      },
      orderBy: {
        qualityScore: 'desc',
      },
      take: 10,
    });

    // Get top bonus earners for the month
    const bonusLeaders = await prisma.teamMember.findMany({
      where: {
        isActive: true,
        currentMonthBonus: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        currentMonthBonus: true,
        totalBonusEarned: true,
      },
      orderBy: {
        currentMonthBonus: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      speed: speedLeaders,
      quality: qualityLeaders,
      bonus: bonusLeaders,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching leaderboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboards' },
      { status: 500 }
    );
  }
}
