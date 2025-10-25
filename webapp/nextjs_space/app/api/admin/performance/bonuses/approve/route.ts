import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * POST - Approve bonus payments
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    const body = await request.json();
    const { bonusIds } = body;

    if (!bonusIds || !Array.isArray(bonusIds)) {
      return NextResponse.json(
        { error: 'bonusIds array is required' },
        { status: 400 }
      );
    }

    // Update all bonuses to approved
    await prisma.bonusPayment.updateMany({
      where: {
        id: {
          in: bonusIds,
        },
        paidAt: null,
      },
      data: {
        approvedAt: new Date(),
        approvedBy: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      approved: bonusIds.length,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error approving bonuses:', error);
    return NextResponse.json(
      { error: 'Failed to approve bonuses' },
      { status: 500 }
    );
  }
}
