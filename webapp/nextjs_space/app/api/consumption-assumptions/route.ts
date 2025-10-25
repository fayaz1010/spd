
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/consumption-assumptions
 * Returns all active consumption assumptions grouped by type
 */
export async function GET(request: NextRequest) {
  try {
    const assumptions = await prisma.consumptionAssumption.findMany({
      where: { active: true },
      orderBy: [
        { assumptionType: 'asc' },
        { householdSize: 'asc' },
      ],
    });

    // Group by type for easier consumption
    const grouped = {
      baselines: assumptions.filter(a => a.assumptionType === 'baseline'),
      acTiers: assumptions.filter(a => a.assumptionType === 'ac'),
      pools: assumptions.filter(a => a.assumptionType === 'pool'),
      office: assumptions.find(a => a.assumptionType === 'office'),
      ev: assumptions.find(a => a.assumptionType === 'ev'),
    };

    return NextResponse.json({
      success: true,
      data: grouped,
      all: assumptions,
    });
  } catch (error) {
    console.error('Error fetching consumption assumptions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch consumption assumptions',
      },
      { status: 500 }
    );
  }
}
