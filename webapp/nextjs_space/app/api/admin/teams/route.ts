
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    requireAdmin(request);

    const teams = await prisma.team.findMany({
      include: {
        members: true,
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ teams });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    requireAdmin(request);

    const body = await request.json();
    const {
      name,
      description,
      color,
      serviceSuburbs,
      maxConcurrentJobs,
      specialization,
      teamType,
      solarInstallSpeed,
      batteryInstallSpeed,
      members,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Create team with members
    const team = await prisma.team.create({
      data: {
        id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: description || null,
        color: color || '#3b82f6',
        serviceSuburbs: serviceSuburbs || [],
        maxConcurrentJobs: maxConcurrentJobs || 2,
        specialization: specialization || [],
        teamType: teamType || 'internal',
        solarInstallSpeed: solarInstallSpeed ? parseFloat(solarInstallSpeed) : null,
        batteryInstallSpeed: batteryInstallSpeed ? parseFloat(batteryInstallSpeed) : null,
        updatedAt: new Date(),
        members: {
          create: members || [],
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
