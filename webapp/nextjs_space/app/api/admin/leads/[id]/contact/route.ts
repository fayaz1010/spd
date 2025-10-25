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

    const body = await request.json();

    // Update lead contact tracking
    const updateData: any = {
      lastContactedAt: new Date(),
      contactAttempts: { increment: 1 },
    };

    if (body.isFirstContact) {
      updateData.firstContactedAt = new Date();
    }

    if (body.updateStatus) {
      updateData.status = body.updateStatus;
    }

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
    });

    // Create activity
    await prisma.activity.create({
      data: {
        leadId: params.id,
        type: body.type, // call, email, sms
        direction: 'outbound',
        subject: body.subject,
        description: body.description,
        outcome: body.outcome,
        contactMethod: body.type,
        duration: body.duration,
        completedAt: new Date(),
        createdBy: body.createdBy,
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error logging contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
