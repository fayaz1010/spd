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

    // Count total rules
    const totalRules = await prisma.followUpRule.count();

    // Count active rules
    const activeRules = await prisma.followUpRule.count({
      where: { enabled: true },
    });

    // Count scheduled messages sent today (as proxy for executed automations)
    const executedToday = await prisma.scheduledMessage.count({
      where: {
        sentAt: {
          gte: startOfToday,
        },
      },
    });

    return NextResponse.json({
      totalRules,
      activeRules,
      executedToday,
    });
  } catch (error) {
    console.error('Error fetching automation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
