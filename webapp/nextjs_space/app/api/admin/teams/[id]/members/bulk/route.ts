import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

/**
 * POST - Add multiple existing staff/electricians to a team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { members } = body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: 'Members array is required' },
        { status: 400 }
      );
    }

    const teamId = params.id;

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const results = {
      added: [] as any[],
      updated: [] as any[],
      errors: [] as any[],
    };

    for (const member of members) {
      try {
        const { id, type, teamRole } = member;

        if (!id || !type || !teamRole) {
          results.errors.push({
            id,
            error: 'Missing required fields (id, type, teamRole)',
          });
          continue;
        }

        if (type === 'staff') {
          // Update existing staff member's team
          const existingStaff = await prisma.teamMember.findUnique({
            where: { id },
          });

          if (!existingStaff) {
            results.errors.push({
              id,
              error: 'Staff member not found',
            });
            continue;
          }

          // Update the staff member to assign to this team
          const updated = await prisma.teamMember.update({
            where: { id },
            data: {
              teamId,
              role: teamRole,
              updatedAt: new Date(),
            },
          });

          results.updated.push({
            id: updated.id,
            name: updated.name,
            type: 'staff',
          });

        } else if (type === 'electrician') {
          // Check if electrician exists
          const electrician = await prisma.electrician.findUnique({
            where: { id },
          });

          if (!electrician) {
            results.errors.push({
              id,
              error: 'Electrician not found',
            });
            continue;
          }

          // Check if this electrician already has a team member record
          const existingTeamMember = await prisma.teamMember.findFirst({
            where: { electricianId: id },
          });

          if (existingTeamMember) {
            // Update existing team member
            const updated = await prisma.teamMember.update({
              where: { id: existingTeamMember.id },
              data: {
                teamId,
                role: teamRole,
                updatedAt: new Date(),
              },
            });

            results.updated.push({
              id: updated.id,
              name: updated.name,
              type: 'electrician',
            });
          } else {
            // Create new team member linked to electrician
            const fullName = `${electrician.firstName} ${electrician.lastName}`;
            const newMember = await prisma.teamMember.create({
              data: {
                id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                teamId,
                name: fullName,
                email: electrician.email,
                phone: electrician.phone || electrician.mobile || '',
                role: teamRole,
                electricianId: electrician.id,
                isActive: electrician.status === 'ACTIVE',
                updatedAt: new Date(),
              },
            });

            results.added.push({
              id: newMember.id,
              name: newMember.name,
              type: 'electrician',
            });
          }
        } else {
          results.errors.push({
            id,
            error: `Invalid member type: ${type}`,
          });
        }
      } catch (error: any) {
        console.error(`Error adding member ${member.id}:`, error);
        results.errors.push({
          id: member.id,
          error: error.message || 'Failed to add member',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: members.length,
        added: results.added.length,
        updated: results.updated.length,
        errors: results.errors.length,
      },
    }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error adding team members:', error);
    return NextResponse.json(
      { error: 'Failed to add team members' },
      { status: 500 }
    );
  }
}
