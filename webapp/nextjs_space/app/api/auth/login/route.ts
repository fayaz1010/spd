import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { signToken, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.admin.findUnique({
      where: { email },
      include: {
        teamMember: {
          include: { Team: true }
        },
        lead: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.admin.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Build auth payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
      permissions: user.permissions,
      teamMemberId: user.teamMemberId || undefined,
      teamId: user.teamMember?.teamId || undefined,
      teamName: user.teamMember?.Team?.name || undefined,
      leadId: user.leadId || undefined,
    };

    const token = signToken(payload);

    // Determine redirect based on role
    let redirectTo = '/admin/dashboard';
    if (user.role === 'TEAM_MEMBER') {
      redirectTo = '/team/jobs';
    } else if (user.role === 'CUSTOMER') {
      redirectTo = '/portal/dashboard';
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirectTo,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
