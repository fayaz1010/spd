import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// POST /api/admin/leave/[id]/approve
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { approved, notes } = await req.json();

    const request = await (prisma as any).leaveRequest?.findUnique({
      where: { id: params.id }
    });

    if (!request) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Leave request already processed' },
        { status: 400 }
      );
    }

    // Update leave request
    const updated = await (prisma as any).leaveRequest?.update({
      where: { id: params.id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewedBy: user.userId,
        reviewedAt: new Date(),
        approvalNotes: notes
      }
    });

    // If approved, update leave balance
    if (approved) {
      const balance = await (prisma as any).leaveBalance?.findUnique({
        where: { staffId: request.staffId }
      });

      if (balance) {
        const updateData: any = {};

        switch (request.leaveType) {
          case 'ANNUAL':
            updateData.annualLeaveBalance = balance.annualLeaveBalance - request.totalDays;
            updateData.annualLeaveUsed = balance.annualLeaveUsed + request.totalDays;
            break;
          case 'SICK':
          case 'PERSONAL':
          case 'CARER':
            updateData.sickLeaveBalance = balance.sickLeaveBalance - request.totalDays;
            updateData.sickLeaveUsed = balance.sickLeaveUsed + request.totalDays;
            break;
          case 'LONG_SERVICE':
            updateData.longServiceLeaveBalance = balance.longServiceLeaveBalance - request.totalDays;
            updateData.longServiceLeaveUsed = balance.longServiceLeaveUsed + request.totalDays;
            break;
        }

        if (Object.keys(updateData).length > 0) {
          await (prisma as any).leaveBalance?.update({
            where: { staffId: request.staffId },
            data: updateData
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: approved ? 'Leave request approved' : 'Leave request rejected',
      request: updated
    });
  } catch (error) {
    console.error('Error processing leave request:', error);
    return NextResponse.json(
      { error: 'Failed to process leave request' },
      { status: 500 }
    );
  }
}
