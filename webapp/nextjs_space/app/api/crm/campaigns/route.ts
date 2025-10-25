import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await prisma.dripCampaign.findMany({
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, trigger, steps } = body;

    if (!name || !trigger || !steps || steps.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger, steps' },
        { status: 400 }
      );
    }

    const campaign = await prisma.dripCampaign.create({
      data: {
        name,
        description,
        trigger,
        enabled: false,
        enrolledCount: 0,
        completedCount: 0,
        steps: {
          create: steps.map((step: any, index: number) => ({
            order: index + 1,
            delay: step.delay,
            action: step.action,
            templateId: step.templateId,
          })),
        },
      },
      include: {
        steps: true,
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
