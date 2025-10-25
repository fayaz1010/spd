import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get distribution settings
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    const distributionSettings = settings?.distributionSettings
      ? JSON.parse(settings.distributionSettings as string)
      : { assignmentMethod: 'round-robin' };

    // Get unassigned leads
    const unassignedLeads = await prisma.lead.findMany({
      where: {
        assignedTo: null,
        status: {
          notIn: ['converted', 'lost', 'archived'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (unassignedLeads.length === 0) {
      return NextResponse.json({
        assigned: 0,
        message: 'No unassigned leads found',
      });
    }

    // Get active team members
    const teamMembers = await prisma.admin.findMany({
      where: {
        isActive: true,
        role: {
          in: ['ADMIN', 'TEAM_MEMBER'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (teamMembers.length === 0) {
      return NextResponse.json(
        { error: 'No active team members found' },
        { status: 400 }
      );
    }

    let assignedCount = 0;
    const method = distributionSettings.assignmentMethod || 'round-robin';

    if (method === 'round-robin') {
      // Round-robin distribution
      for (let i = 0; i < unassignedLeads.length; i++) {
        const lead = unassignedLeads[i];
        const teamMember = teamMembers[i % teamMembers.length];

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            assignedTo: teamMember.id,
            assignedAt: new Date(),
            status: 'assigned',
          },
        });

        // Create activity log
        await prisma.activity.create({
          data: {
            type: 'NOTE_ADDED',
            description: `Lead auto-assigned to ${teamMember.name}`,
            performedBy: admin.id,
            leadId: lead.id,
          },
        });

        assignedCount++;

        // Send notification if enabled
        if (distributionSettings.notifyOnAssignment) {
          // TODO: Send email/SMS notification
          console.log(`Notify ${teamMember.email} about new lead ${lead.id}`);
        }
      }
    } else if (method === 'load-balance') {
      // Load balance - assign to team member with fewest leads
      for (const lead of unassignedLeads) {
        // Count current assignments for each team member
        const memberLoads = await Promise.all(
          teamMembers.map(async (member) => {
            const count = await prisma.lead.count({
              where: {
                assignedTo: member.id,
                status: {
                  notIn: ['converted', 'lost', 'archived'],
                },
              },
            });
            return { member, count };
          })
        );

        // Find member with lowest load
        const leastBusy = memberLoads.reduce((min, current) =>
          current.count < min.count ? current : min
        );

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            assignedTo: leastBusy.member.id,
            assignedAt: new Date(),
            status: 'assigned',
          },
        });

        await prisma.activity.create({
          data: {
            type: 'NOTE_ADDED',
            description: `Lead auto-assigned to ${leastBusy.member.name} (load balancing)`,
            performedBy: admin.id,
            leadId: lead.id,
          },
        });

        assignedCount++;

        if (distributionSettings.notifyOnAssignment) {
          console.log(`Notify ${leastBusy.member.email} about new lead ${lead.id}`);
        }
      }
    } else if (method === 'territory') {
      // Territory-based assignment
      const territoryRules = distributionSettings.territoryRules || [];

      for (const lead of unassignedLeads) {
        let assigned = false;

        // Try to match postcode to territory
        if (lead.postcode) {
          for (const rule of territoryRules) {
            if (rule.active && rule.postcodes.includes(lead.postcode)) {
              await prisma.lead.update({
                where: { id: lead.id },
                data: {
                  assignedTo: rule.assignedTo,
                  assignedAt: new Date(),
                  status: 'assigned',
                },
              });

              await prisma.activity.create({
                data: {
                  type: 'NOTE_ADDED',
                  description: `Lead auto-assigned to ${rule.assignedToName} (territory: ${rule.name})`,
                  performedBy: admin.id,
                  leadId: lead.id,
                },
              });

              assignedCount++;
              assigned = true;
              break;
            }
          }
        }

        // Fallback to round-robin if no territory match
        if (!assigned) {
          const teamMember = teamMembers[assignedCount % teamMembers.length];
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              assignedTo: teamMember.id,
              assignedAt: new Date(),
              status: 'assigned',
            },
          });

          await prisma.activity.create({
            data: {
              type: 'NOTE_ADDED',
              description: `Lead auto-assigned to ${teamMember.name} (no territory match)`,
              performedBy: admin.id,
              leadId: lead.id,
            },
          });

          assignedCount++;
        }
      }
    }

    return NextResponse.json({
      assigned: assignedCount,
      method,
      message: `Successfully assigned ${assignedCount} leads using ${method} method`,
    });
  } catch (error) {
    console.error('Error distributing leads:', error);
    return NextResponse.json(
      { error: 'Failed to distribute leads' },
      { status: 500 }
    );
  }
}
