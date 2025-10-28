import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * POST - Create login credentials for existing user
 * Links Lead, TeamMember, or Subcontractor to Admin table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userType, password } = body;

    if (!userId || !userType || !password) {
      return NextResponse.json(
        { error: 'userId, userType, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (userType === 'Customer') {
      // Create admin linked to lead
      const lead = await prisma.lead.findUnique({ where: { id: userId } });
      if (!lead) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const admin = await prisma.admin.create({
        data: {
          name: lead.name,
          email: lead.email,
          password: hashedPassword,
          role: 'CUSTOMER',
          leadId: userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Login created for customer',
        adminId: admin.id,
      });
    } else if (userType === 'TeamMember') {
      // Create admin linked to team member
      const teamMember = await prisma.teamMember.findUnique({ where: { id: userId } });
      if (!teamMember) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
      }

      const admin = await prisma.admin.create({
        data: {
          name: teamMember.name,
          email: teamMember.email,
          password: hashedPassword,
          role: 'STAFF',
          teamMemberId: userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Login created for team member',
        adminId: admin.id,
      });
    } else if (userType === 'Subcontractor') {
      // Update subcontractor with password
      const subcontractor = await prisma.subcontractor.findUnique({ where: { id: userId } });
      if (!subcontractor) {
        return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
      }

      await prisma.subcontractor.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          portalAccess: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Login created for subcontractor',
      });
    }

    return NextResponse.json(
      { error: 'Invalid user type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error creating login:', error);
    return NextResponse.json(
      { error: 'Failed to create login', details: error.message },
      { status: 500 }
    );
  }
}
