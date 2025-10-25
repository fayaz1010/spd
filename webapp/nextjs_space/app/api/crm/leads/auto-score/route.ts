import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all leads that haven't been scored in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { scoreUpdatedAt: null },
          { scoreUpdatedAt: { lt: sevenDaysAgo } },
        ],
        status: {
          notIn: ['CONVERTED', 'LOST'],
        },
      },
      take: 50, // Limit to 50 leads per batch
    });

    let scoredCount = 0;
    const errors: string[] = [];

    // Score each lead
    for (const lead of leads) {
      try {
        const token = request.headers.get('authorization');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/crm/leads/${lead.id}/score`,
          {
            method: 'POST',
            headers: {
              Authorization: token || '',
            },
          }
        );

        if (response.ok) {
          scoredCount++;
        } else {
          errors.push(`Failed to score lead ${lead.id}`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errors.push(`Error scoring lead ${lead.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      scoredCount,
      totalLeads: leads.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error auto-scoring leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-score leads' },
      { status: 500 }
    );
  }
}
