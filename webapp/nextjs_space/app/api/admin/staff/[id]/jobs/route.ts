import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * GET - Get jobs for a staff member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    // Get job assignments for this staff member
    const assignments = await prisma.jobAssignment.findMany({
      where: {
        staffId: params.id,
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            systemSize: true,
            status: true,
            actualHours: true,
            netWorkHours: true,
            actualHoursPerKw: true,
            speedEfficiency: true,
            performanceRating: true,
            qualityScore: true,
            timeSaved: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Map to include bonus earned by this staff member
    const jobs = assignments.map(assignment => ({
      ...assignment.job,
      bonusEarned: assignment.bonusEarned,
      hoursWorked: assignment.hoursWorked,
      role: assignment.role,
    }));

    return NextResponse.json({ jobs });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
