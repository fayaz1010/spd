import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * GET - Get pending bonus payments
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const bonuses = await prisma.bonusPayment.findMany({
      where: {
        paidAt: null,
        approvedAt: null,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ bonuses });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching pending bonuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending bonuses' },
      { status: 500 }
    );
  }
}
