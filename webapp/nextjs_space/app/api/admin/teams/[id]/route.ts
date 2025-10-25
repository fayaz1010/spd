
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: true,
        availability: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const {
      name,
      description,
      color,
      serviceSuburbs,
      maxConcurrentJobs,
      isActive,
      specialization,
      teamType,
      solarInstallSpeed,
      batteryInstallSpeed,
    } = body;

    const team = await prisma.team.update({
      where: { id: params.id },
      data: {
        name,
        description,
        color,
        serviceSuburbs,
        maxConcurrentJobs,
        isActive,
        ...(specialization !== undefined && { specialization }),
        ...(teamType !== undefined && { teamType }),
        ...(solarInstallSpeed !== undefined && { solarInstallSpeed: parseFloat(solarInstallSpeed) }),
        ...(batteryInstallSpeed !== undefined && { batteryInstallSpeed: parseFloat(batteryInstallSpeed) }),
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({ team });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    // Check if team has active jobs
    const jobCount = await prisma.installationJob.count({
      where: {
        teamId: params.id,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
    });

    if (jobCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete team with ${jobCount} active job(s). Complete or reassign jobs first.`,
        },
        { status: 400 }
      );
    }

    await prisma.team.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
