import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealId,
      type,
      title,
      description,
      performedBy,
      duration,
      outcome,
      scheduledAt,
      completedAt,
    } = body;

    if (!dealId || !type || !title || !performedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        dealId,
        type,
        title,
        description,
        performedBy,
        duration,
        outcome,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
      include: {
        performer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Update deal's last contact time
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        lastContactAt: new Date(),
        contactCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const leadId = searchParams.get('leadId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (dealId) where.dealId = dealId;
    if (leadId) where.leadId = leadId;
    if (type) where.type = type;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            customerName: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transform to include performedByName
    const transformedActivities = activities.map(activity => ({
      ...activity,
      performedByName: activity.performer?.name || 'System',
    }));

    return NextResponse.json({
      success: true,
      activities: transformedActivities,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
