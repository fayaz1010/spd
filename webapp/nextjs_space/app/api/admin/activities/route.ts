import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (type && type !== 'all') where.type = type;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, activities });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();

    const activity = await prisma.activity.create({
      data: {
        leadId: body.leadId,
        type: body.type,
        direction: body.direction,
        subject: body.subject,
        description: body.description,
        outcome: body.outcome,
        contactMethod: body.contactMethod,
        duration: body.duration,
        scheduledFor: body.scheduledFor,
        completedAt: body.completedAt,
        createdBy: body.createdBy,
      },
    });

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
