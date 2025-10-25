import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// GET /api/admin/payroll/batches
export async function GET(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batches = await prisma.payrollBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        _count: {
          select: {
            payslips: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      batches
    });
  } catch (error) {
    console.error('Error fetching payroll batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll batches' },
      { status: 500 }
    );
  }
}
