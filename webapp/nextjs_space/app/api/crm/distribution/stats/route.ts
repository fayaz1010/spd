import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Count unassigned leads
    const unassignedLeads = await prisma.lead.count({
      where: {
        assignedTo: null,
        status: {
          notIn: ['converted', 'lost', 'archived'],
        },
      },
    });

    // Count leads assigned today
    const assignedToday = await prisma.lead.count({
      where: {
        assignedAt: {
          gte: startOfToday,
        },
      },
    });

    // Calculate average response time (first contact after assignment)
    const recentAssignments = await prisma.lead.findMany({
      where: {
        assignedAt: {
          not: null,
        },
        status: {
          notIn: ['new', 'uncontacted'],
        },
      },
      select: {
        assignedAt: true,
        updatedAt: true,
      },
      take: 100,
      orderBy: {
        assignedAt: 'desc',
      },
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    recentAssignments.forEach(lead => {
      if (lead.assignedAt) {
        const responseTime = lead.updatedAt.getTime() - lead.assignedAt.getTime();
        const hours = responseTime / (1000 * 60 * 60);
        if (hours > 0 && hours < 168) { // Within a week
          totalResponseTime += hours;
          responseCount++;
        }
      }
    });

    const avgResponseTime = responseCount > 0 
      ? Math.round(totalResponseTime / responseCount) 
      : 0;

    return NextResponse.json({
      unassignedLeads,
      assignedToday,
      avgResponseTime,
    });
  } catch (error) {
    console.error('Error fetching distribution stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
