import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// POST - Create user account for staff member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const {
      accountRole = 'TEAM_MEMBER',
      permissions = ['view_assigned_jobs', 'update_job_status'],
      sendEmail = true,
    } = body;

    // Get staff member
    const staff = await prisma.teamMember.findUnique({
      where: { id: params.id },
      include: { user: true, Team: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if account already exists
    if (staff.user) {
      return NextResponse.json(
        { error: 'Account already exists for this staff member' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user account
    const userAccount = await prisma.admin.create({
      data: {
        email: staff.email,
        password: hashedPassword,
        name: staff.name,
        role: accountRole as any,
        teamMember: { connect: { id: staff.id } },
        permissions,
        isActive: true,
      },
    });

    // TODO: Send welcome email with temp password
    console.log('Account created for', staff.email);
    console.log('Temporary password:', tempPassword);

    return NextResponse.json({
      success: true,
      account: {
        id: userAccount.id,
        email: userAccount.email,
        role: userAccount.role,
        tempPassword: tempPassword, // In production, don't return this - send via email
      },
      message: 'Account created successfully',
    });
  } catch (error: any) {
    console.error('Create account error:', error);
    
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

// DELETE - Delete user account for staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    // Get staff member
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

    if (!staff.user) {
      return NextResponse.json(
        { error: 'No account exists for this staff member' },
        { status: 400 }
      );
    }

    // Delete user account
    await prisma.admin.delete({
      where: { id: staff.user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    
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

// Helper function to generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
