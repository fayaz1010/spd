import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get position details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    const position = await prisma.position.findUnique({
      where: { id: params.id },
      include: {
        teamMembers: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
            isActive: true,
          }
        },
        _count: {
          select: { teamMembers: true }
        }
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      position,
    });
  } catch (error: any) {
    console.error('Get position error:', error);
    
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

// PUT - Update position
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const {
      positionCode,
      title,
      department,
      level,
      description,
      responsibilities,
      essentialRequirements,
      desirableRequirements,
      requiredLicenses,
      requiredCerts,
      salaryType,
      hourlyRateMin,
      hourlyRateMax,
      annualSalaryMin,
      annualSalaryMax,
      superannuationRate,
      overtimeAvailable,
      overtimeRate,
      bonusStructure,
      benefits,
      employmentType,
      hoursPerWeek,
      workSchedule,
      rdoAvailable,
      workLocations,
      travelRequired,
      travelDetails,
      physicalRequirements,
      isActive,
      isPublic,
    } = body;

    // Check if position exists
    const existing = await prisma.position.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Check if position code is being changed and if it's already in use
    if (positionCode && positionCode !== existing.positionCode) {
      const codeInUse = await prisma.position.findUnique({
        where: { positionCode },
      });

      if (codeInUse) {
        return NextResponse.json(
          { error: 'Position code already in use' },
          { status: 400 }
        );
      }
    }

    const position = await prisma.position.update({
      where: { id: params.id },
      data: {
        positionCode,
        title,
        department,
        level,
        description,
        responsibilities,
        essentialRequirements,
        desirableRequirements,
        requiredLicenses,
        requiredCerts,
        salaryType,
        hourlyRateMin,
        hourlyRateMax,
        annualSalaryMin,
        annualSalaryMax,
        superannuationRate,
        overtimeAvailable,
        overtimeRate,
        bonusStructure,
        benefits,
        employmentType,
        hoursPerWeek,
        workSchedule,
        rdoAvailable,
        workLocations,
        travelRequired,
        travelDetails,
        physicalRequirements,
        isActive,
        isPublic,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      position,
    });
  } catch (error: any) {
    console.error('Update position error:', error);
    
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

// DELETE - Delete position
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    // Check if position exists
    const position = await prisma.position.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { teamMembers: true }
        }
      }
    });

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Check if position has staff assigned
    if (position._count.teamMembers > 0) {
      return NextResponse.json(
        { error: `Cannot delete position with ${position._count.teamMembers} staff member(s) assigned. Please reassign staff first.` },
        { status: 400 }
      );
    }

    await prisma.position.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Position deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete position error:', error);
    
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
