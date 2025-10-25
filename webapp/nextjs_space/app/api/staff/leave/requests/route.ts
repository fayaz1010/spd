import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { differenceInBusinessDays } from 'date-fns';

// GET /api/staff/leave/requests
export async function GET(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId') || user.teamMemberId;
    const status = searchParams.get('status');

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });
    }

    // Verify access
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.teamMemberId !== staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const where: any = { staffId };
    if (status) {
      where.status = status;
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

// POST /api/staff/leave/requests
export async function POST(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { staffId, leaveType, startDate, endDate, reason } = body;

    // Verify access
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.teamMemberId !== staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate business days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = differenceInBusinessDays(end, start) + 1;

    // Get current leave balance
    const balance = await prisma.leaveBalance.findUnique({
      where: { staffId }
    });

    let balanceBefore = 0;
    let balanceAfter = 0;

    if (balance) {
      switch (leaveType) {
        case 'ANNUAL':
          balanceBefore = balance.annualLeaveBalance;
          balanceAfter = balanceBefore - totalDays;
          break;
        case 'SICK':
        case 'PERSONAL':
        case 'CARER':
          balanceBefore = balance.sickLeaveBalance;
          balanceAfter = balanceBefore - totalDays;
          break;
        case 'LONG_SERVICE':
          balanceBefore = balance.longServiceLeaveBalance;
          balanceAfter = balanceBefore - totalDays;
          break;
      }
    }

    const request = await prisma.leaveRequest.create({
      data: {
        staffId,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        balanceBefore,
        balanceAfter,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
