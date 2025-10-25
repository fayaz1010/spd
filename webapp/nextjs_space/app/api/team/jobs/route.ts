import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Require team member or admin role
    const user = requireRole(request, [UserRole.TEAM_MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    // Build where clause based on role
    const where: any = {};
    
    if (user.role === UserRole.TEAM_MEMBER) {
      // Team members can only see their team's jobs
      if (!user.teamId) {
        return NextResponse.json(
          { error: 'Team member not assigned to a team' },
          { status: 400 }
        );
      }
      where.teamId = user.teamId;
    }
    // Admins can see all jobs (no filter)

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch jobs
    const [jobs, total] = await Promise.all([
      prisma.installationJob.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              suburb: true,
              systemSizeKw: true,
              batterySizeKwh: true,
            },
          },
          team: {
            include: {
              members: true,
            },
          },
          materialOrders: {
            include: {
              supplier: true,
            },
          },
        },
        orderBy: [
          { scheduledDate: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.installationJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      jobs,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Get team jobs error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
