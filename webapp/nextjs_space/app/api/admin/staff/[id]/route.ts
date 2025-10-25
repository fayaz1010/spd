import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get staff member details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    const staff = await prisma.teamMember.findUnique({
      where: { id: params.id },
      include: {
        Team: true,
        position: {
          select: {
            id: true,
            positionCode: true,
            title: true,
            department: true,
            level: true,
            hourlyRateMin: true,
            hourlyRateMax: true,
            annualSalaryMin: true,
            annualSalaryMax: true,
            superannuationRate: true,
            overtimeRate: true,
            salaryType: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            permissions: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error: any) {
    console.error('Get staff error:', error);
    
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

// PUT - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const {
      name,
      email,
      phone,
      teamId,
      positionId,
      role,
      isActive,
      hourlyRate,
      overtimeRate,
      superannuationRate,
      workersCompRate,
    } = body;

    // Check if staff exists
    const existingStaff = await prisma.teamMember.findUnique({
      where: { id: params.id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingStaff.email) {
      const emailInUse = await prisma.teamMember.findUnique({
        where: { email },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update team member
    const updated = await prisma.teamMember.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        teamId: teamId || null,
        positionId: positionId || null,
        role,
        isActive,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        overtimeRate: overtimeRate ? parseFloat(overtimeRate) : null,
        superannuationRate: superannuationRate ? parseFloat(superannuationRate) : 11.5,
        workersCompRate: workersCompRate ? parseFloat(workersCompRate) : 6.5,
        updatedAt: new Date(),
      },
      include: {
        Team: true,
        position: true,
        user: true,
      },
    });

    // Update user account email if it exists and email changed
    if (updated.user && email && email !== existingStaff.email) {
      await prisma.admin.update({
        where: { id: updated.user.id },
        data: { email },
      });
    }

    return NextResponse.json({
      success: true,
      staff: updated,
    });
  } catch (error: any) {
    console.error('Update staff error:', error);
    
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

// DELETE - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    // Check if staff exists
    const staff = await prisma.teamMember.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Delete user account if exists
    if (staff.user) {
      await prisma.admin.delete({
        where: { id: staff.user.id },
      });
    }

    // Delete team member
    await prisma.teamMember.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete staff error:', error);
    
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
