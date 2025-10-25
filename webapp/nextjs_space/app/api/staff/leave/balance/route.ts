import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// GET /api/staff/leave/balance
export async function GET(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId') || user.teamMemberId;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });
    }

    // Verify access
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.teamMemberId !== staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let balance = await prisma.leaveBalance.findUnique({
      where: { staffId }
    });

    // Create balance if doesn't exist
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          staffId,
          annualLeaveBalance: 0,
          sickLeaveBalance: 0,
          longServiceLeaveBalance: 0,
          rdoBalance: 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave balance' },
      { status: 500 }
    );
  }
}
