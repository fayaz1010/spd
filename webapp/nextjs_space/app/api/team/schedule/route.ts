import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get team schedule
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {
      OR: [
        { scheduledDate: { not: null } },
        { installationDate: { not: null } },
      ],
    };

    // Filter by team for team members
    if (user.role === UserRole.TEAM_MEMBER) {
      if (!user.teamId) {
        return NextResponse.json(
          { error: 'Team member not assigned to a team' },
          { status: 400 }
        );
      }
      where.teamId = user.teamId;
    }

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      where.OR = [
        {
          scheduledDate: {
            gte: start,
            lte: end,
          },
        },
        {
          installationDate: {
            gte: start,
            lte: end,
          },
        },
      ];
    }

    // Fetch jobs
    const jobs = await prisma.installationJob.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            address: true,
            suburb: true,
            phone: true,
            systemSizeKw: true,
            batterySizeKwh: true,
          },
        },
        team: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // Format jobs
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
      scheduledDate: job.scheduledDate,
      systemSize: job.lead.systemSizeKw || 0,
      customer: {
        name: job.lead.name || 'Unknown',
        address: job.lead.address || '',
        phone: job.lead.phone,
      },
      team: job.team ? {
        id: job.team.id,
        name: job.team.name,
        members: job.team.members,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      total: formattedJobs.length,
      teamId: user.teamId,
      teamName: user.teamName,
    });
  } catch (error: any) {
    console.error('Get schedule error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
