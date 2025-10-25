import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - List all staff
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (teamId && teamId !== 'all') {
      where.teamId = teamId;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const staff = await prisma.teamMember.findMany({
      where,
      include: {
        Team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        position: {
          select: {
            id: true,
            title: true,
            positionCode: true,
            department: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      staff,
      total: staff.length,
    });
  } catch (error: any) {
    console.error('Get staff error:', error);
    
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

// POST - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const {
      name,
      email,
      phone,
      teamId,
      role,
      isActive = true,
      createAccount = false,
      accountRole = 'TEAM_MEMBER',
      permissions = ['view_assigned_jobs', 'update_job_status'],
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !teamId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingStaff = await prisma.teamMember.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Staff member with this email already exists' },
        { status: 400 }
      );
    }

    // Create team member
    const teamMember = await prisma.teamMember.create({
      data: {
        id: 'tm-' + Date.now(),
        name,
        email,
        phone,
        teamId,
        role,
        isActive,
        updatedAt: new Date(),
      },
      include: {
        Team: true,
      },
    });

    // Create user account if requested
    let userAccount = null;
    if (createAccount) {
      // Generate temporary password
      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Check if user account already exists
      const existingUser = await prisma.admin.findUnique({
        where: { email },
      });

      if (!existingUser) {
        userAccount = await prisma.admin.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: accountRole as any,
            teamMember: { connect: { id: teamMember.id } },
            permissions,
            isActive: true,
          },
        });

        // TODO: Send welcome email with temp password
        console.log('Temp password for', email, ':', tempPassword);
      }
    }

    return NextResponse.json({
      success: true,
      staff: teamMember,
      account: userAccount ? {
        created: true,
        email: userAccount.email,
        role: userAccount.role,
      } : null,
    });
  } catch (error: any) {
    console.error('Create staff error:', error);
    
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
