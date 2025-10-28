import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - List users without login credentials
 * Returns users from Lead, TeamMember, or Subcontractor tables
 * who don't have an associated Admin record
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let availableUsers: any[] = [];

    if (type === 'Customer') {
      // Get leads without admin accounts
      const leads = await prisma.lead.findMany({
        where: {
          email: { not: '' },
          admin: null, // No linked admin account
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        take: 100,
      });
      availableUsers = leads;
    } else if (type === 'TeamMember') {
      // Get team members without admin accounts
      const teamMembers = await prisma.teamMember.findMany({
        where: {
          admin: null, // No linked admin account
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });
      availableUsers = teamMembers;
    } else if (type === 'Subcontractor') {
      // Get subcontractors without admin accounts
      const subcontractors = await prisma.subcontractor.findMany({
        where: {
          password: null, // No password set
        },
        select: {
          id: true,
          contactName: true,
          companyName: true,
          email: true,
          phone: true,
        },
      });
      availableUsers = subcontractors.map(s => ({
        id: s.id,
        name: s.contactName,
        email: s.email,
        phone: s.phone,
        companyName: s.companyName,
      }));
    }

    return NextResponse.json({
      success: true,
      users: availableUsers,
    });
  } catch (error: any) {
    console.error('Error fetching available users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available users', details: error.message },
      { status: 500 }
    );
  }
}
