import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - List ALL users from all tables
 * Combines: Admin, Lead (customers), TeamMember, Subcontractor, Electrician
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by user type

    // Fetch all user types in parallel with error handling
    let admins: any[] = [];
    let leads: any[] = [];
    let teamMembers: any[] = [];
    let subcontractors: any[] = [];
    let electricians: any[] = [];

    try {
      admins = await prisma.admin.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          teamMemberId: true,
        },
        where: {
          teamMemberId: null, // Only get admins who are NOT linked to team members
        },
      });
    } catch (e) {
      console.error('Error fetching admins:', e);
    }

    try {
      // Get customers (leads) who have login credentials via Admin table
      const customerAdmins = await prisma.admin.findMany({
        where: {
          leadId: { not: null },
        },
        select: {
          leadId: true,
          lastLoginAt: true,
        },
      });

      const leadIds = customerAdmins.map(a => a.leadId).filter(Boolean) as string[];
      
      if (leadIds.length > 0) {
        leads = await prisma.lead.findMany({
          where: {
            id: { in: leadIds },
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        });

        // Add lastLogin from admin records
        leads = leads.map(lead => {
          const admin = customerAdmins.find(a => a.leadId === lead.id);
          return {
            ...lead,
            lastLoginAt: admin?.lastLoginAt,
          };
        });
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    }

    try {
      // Get team members who have login credentials via Admin table
      const staffAdmins = await prisma.admin.findMany({
        where: {
          teamMemberId: { not: null },
        },
        select: {
          teamMemberId: true,
          lastLoginAt: true,
        },
      });

      const teamMemberIds = staffAdmins.map(a => a.teamMemberId).filter(Boolean) as string[];
      
      if (teamMemberIds.length > 0) {
        teamMembers = await prisma.teamMember.findMany({
          where: {
            id: { in: teamMemberIds },
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

        // Add lastLogin from admin records
        teamMembers = teamMembers.map(tm => {
          const admin = staffAdmins.find(a => a.teamMemberId === tm.id);
          return {
            ...tm,
            lastLoginAt: admin?.lastLoginAt,
          };
        });
      }
    } catch (e) {
      console.error('Error fetching team members:', e);
    }

    try {
      // Get all subcontractors and filter those with portal access
      const allSubcontractors: any = await prisma.subcontractor.findMany({
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          portalAccess: true,
        },
      });
      
      // Filter only those with portal access (login credentials)
      subcontractors = allSubcontractors.filter((s: any) => s.portalAccess === true);
    } catch (e) {
      console.error('Error fetching subcontractors:', e);
    }

    // Electrician table doesn't exist separately - skip for now
    electricians = [];

    // Transform all users into common format
    const allUsers = [
      ...admins.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        type: 'Admin' as const,
        status: u.isActive ? 'Active' : 'Inactive',
        createdAt: u.createdAt,
        lastLogin: u.lastLoginAt,
        role: u.role,
      })),
      ...leads.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        type: 'Customer' as const,
        status: u.status,
        createdAt: u.createdAt,
      })),
      ...teamMembers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        type: 'TeamMember' as const,
        status: u.isActive ? 'Active' : 'Inactive',
        createdAt: u.createdAt,
        position: u.role,
      })),
      ...subcontractors.map(u => ({
        id: u.id,
        name: u.contactName,
        email: u.email,
        phone: u.phone,
        type: 'Subcontractor' as const,
        status: u.isActive ? 'Active' : 'Inactive',
        createdAt: u.createdAt,
        company: u.companyName,
      })),
    ];

    // Filter by type if specified
    const filteredUsers = type && type !== 'all'
      ? allUsers.filter(u => u.type === type)
      : allUsers;

    // Sort by creation date (newest first)
    filteredUsers.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      counts: {
        total: allUsers.length,
        admins: admins.length,
        customers: leads.length,
        teamMembers: teamMembers.length,
        subcontractors: subcontractors.length,
        electricians: electricians.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching all users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}
