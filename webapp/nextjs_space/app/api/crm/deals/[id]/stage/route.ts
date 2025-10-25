import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { stage, performedBy } = body;

    if (!stage || !performedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current deal
    const currentDeal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!currentDeal) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Update deal stage
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        stage,
        previousStage: currentDeal.stage,
        stageChangedAt: new Date(),
        lastContactAt: new Date(),
        contactCount: currentDeal.contactCount + 1,
      },
      include: {
        lead: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        dealId: id,
        type: 'STAGE_CHANGED',
        title: `Stage changed to ${stage}`,
        description: `Deal moved from ${currentDeal.stage} to ${stage}`,
        performedBy,
        completedAt: new Date(),
      },
    });

    // Update probability based on stage
    let newProbability = deal.probability;
    switch (stage) {
      case 'NEW_LEAD':
        newProbability = 10;
        break;
      case 'CONTACTED':
        newProbability = 25;
        break;
      case 'QUOTE_SENT':
        newProbability = 40;
        break;
      case 'FOLLOW_UP':
        newProbability = 50;
        break;
      case 'NEGOTIATION':
        newProbability = 75;
        break;
      case 'WON':
        newProbability = 100;
        break;
      case 'LOST':
        newProbability = 0;
        break;
    }

    if (newProbability !== deal.probability) {
      await prisma.deal.update({
        where: { id },
        data: { probability: newProbability },
      });
    }

    return NextResponse.json({
      success: true,
      deal: {
        ...deal,
        probability: newProbability,
      },
    });
  } catch (error) {
    console.error('Error updating deal stage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update deal stage' },
      { status: 500 }
    );
  }
}
