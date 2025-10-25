import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const status = searchParams.get('status');
    const campaignId = searchParams.get('campaignId');

    const where: any = {};
    if (dealId) where.dealId = dealId;
    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    const scheduled = await prisma.scheduledMessage.findMany({
      where,
      include: {
        deal: {
          select: {
            title: true,
            lead: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        template: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      scheduled,
    });
  } catch (error) {
    console.error('Scheduled messages fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealId,
      type,
      templateId,
      to,
      subject,
      body: messageBody,
      scheduledFor,
      isRecurring,
      recurringRule,
      campaignId,
      campaignName,
    } = body;

    if (!type || !to || !messageBody || !scheduledFor) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const scheduled = await prisma.scheduledMessage.create({
      data: {
        dealId,
        type,
        templateId,
        to,
        subject,
        body: messageBody,
        scheduledFor: new Date(scheduledFor),
        isRecurring: isRecurring || false,
        recurringRule,
        campaignId,
        campaignName,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      scheduled,
    });
  } catch (error) {
    console.error('Schedule message error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule message' },
      { status: 500 }
    );
  }
}
