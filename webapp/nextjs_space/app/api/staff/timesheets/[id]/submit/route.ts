import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// POST /api/staff/timesheets/[id]/submit
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: params.id }
    });

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    // Verify access
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.teamMemberId !== timesheet.staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (timesheet.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Timesheet already submitted' },
        { status: 400 }
      );
    }

    const updated = await prisma.timesheet.update({
      where: { id: params.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedBy: user.teamMemberId || user.userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Timesheet submitted successfully',
      timesheet: updated
    });
  } catch (error) {
    console.error('Error submitting timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to submit timesheet' },
      { status: 500 }
    );
  }
}
