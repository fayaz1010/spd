import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, thisWeek, newLeads, converted, bySource] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.lead.count({ where: { status: 'new' } }),
      prisma.lead.count({
        where: {
          InstallationJob: {
            isNot: null,
          },
        },
      }),
      prisma.lead.groupBy({
        by: ['leadSource'],
        _count: true,
        orderBy: { _count: { leadSource: 'desc' } },
      }),
    ]);

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      total,
      thisWeek,
      new: newLeads,
      converted,
      conversionRate,
      bySource: bySource.map((item) => ({
        source: item.leadSource,
        count: item._count,
      })),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching lead stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
