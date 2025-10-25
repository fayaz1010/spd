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

    const { assignedTo } = await request.json();

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        assignedTo,
        assignedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: params.id,
        type: 'note',
        description: `Lead assigned to ${assignedTo}`,
        createdBy: assignedTo,
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error assigning lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
