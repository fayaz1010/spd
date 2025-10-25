import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/crm/deals - List all deals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');

    const where: any = {};
    if (stage) where.stage = stage;
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;

    const deals = await prisma.deal.findMany({
      where,
      include: {
        lead: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            systemSizeKw: true,
            batterySizeKwh: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        activities: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
        proposals: {
          take: 1,
          orderBy: {
            sentAt: 'desc',
          },
        },
      },
      orderBy: [
        { stage: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    // Calculate pipeline metrics
    const metrics = {
      totalDeals: deals.length,
      totalValue: deals.reduce((sum, deal) => sum + deal.value, 0),
      byStage: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    deals.forEach(deal => {
      metrics.byStage[deal.stage] = (metrics.byStage[deal.stage] || 0) + 1;
      metrics.byStatus[deal.status] = (metrics.byStatus[deal.status] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      deals,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// POST /api/crm/deals - Create new deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leadId,
      title,
      value,
      probability,
      expectedCloseDate,
      ownerId,
    } = body;

    if (!leadId || !title || !value || !ownerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if deal already exists for this lead
    const existingDeal = await prisma.deal.findUnique({
      where: { leadId },
    });

    if (existingDeal) {
      return NextResponse.json(
        { success: false, error: 'Deal already exists for this lead' },
        { status: 400 }
      );
    }

    // Calculate initial lead score
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    let leadScore = 50; // Base score
    if (lead) {
      // Demographics (20%)
      if (lead.systemSizeKw && lead.systemSizeKw > 6) leadScore += 10;
      if (lead.batterySizeKwh && lead.batterySizeKwh > 0) leadScore += 10;
      
      // Engagement (30%)
      if (lead.status === 'contacted') leadScore += 15;
      if (lead.depositPaid) leadScore += 15;
      
      // Budget (20%)
      if (lead.depositAmount && lead.depositAmount > 1000) leadScore += 20;
    }

    const deal = await prisma.deal.create({
      data: {
        leadId,
        title,
        value,
        probability: probability || 50,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        ownerId,
        stage: 'NEW_LEAD',
        status: 'OPEN',
        leadScore: Math.min(100, leadScore),
        firstContactAt: new Date(),
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
        dealId: deal.id,
        type: 'NOTE_ADDED',
        title: 'Deal Created',
        description: `Deal created with value $${value}`,
        performedBy: ownerId,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      deal,
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}
