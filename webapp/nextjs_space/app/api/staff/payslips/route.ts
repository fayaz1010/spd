import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// GET /api/staff/payslips
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

    const payslips = await prisma.payslip.findMany({
      where: { staffId },
      orderBy: { payDate: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      payslips
    });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payslips' },
      { status: 500 }
    );
  }
}
