import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const { createdBy } = await request.json();

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        proposalSentAt: new Date(),
        lastFollowUpAt: new Date(),
        status: 'quoted',
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: params.id,
        type: 'proposal_sent',
        description: 'Proposal sent to customer',
        createdBy,
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error marking proposal sent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
