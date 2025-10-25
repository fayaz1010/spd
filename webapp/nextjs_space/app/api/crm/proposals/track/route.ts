import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealId,
      quoteId,
      event,
      deviceType,
      browser,
      os,
      timeSpent,
      scrollDepth,
    } = body;

    if (!dealId || !quoteId || !event) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create proposal tracking
    let tracking = await prisma.proposalTracking.findUnique({
      where: { quoteId },
    });

    const now = new Date();

    if (!tracking) {
      // Create new tracking
      tracking = await prisma.proposalTracking.create({
        data: {
          dealId,
          quoteId,
          sentAt: now,
          firstViewedAt: event === 'viewed' ? now : null,
          lastViewedAt: event === 'viewed' ? now : null,
          viewCount: event === 'viewed' ? 1 : 0,
          deviceType,
          browser,
          os,
          totalTimeSpent: timeSpent || 0,
          scrollDepth,
          downloadedAt: event === 'downloaded' ? now : null,
          signedAt: event === 'signed' ? now : null,
          converted: event === 'signed',
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          dealId,
          type: 'PROPOSAL_SENT',
          title: 'Proposal Sent',
          description: 'Proposal was sent to customer',
          performedBy: 'system', // TODO: Get actual user
          completedAt: now,
        },
      });
    } else {
      // Update existing tracking
      const updateData: any = {
        lastViewedAt: event === 'viewed' ? now : tracking.lastViewedAt,
        viewCount: event === 'viewed' ? tracking.viewCount + 1 : tracking.viewCount,
        totalTimeSpent: tracking.totalTimeSpent + (timeSpent || 0),
        updatedAt: now,
      };

      if (!tracking.firstViewedAt && event === 'viewed') {
        updateData.firstViewedAt = now;
      }

      if (event === 'downloaded' && !tracking.downloadedAt) {
        updateData.downloadedAt = now;
      }

      if (event === 'signed' && !tracking.signedAt) {
        updateData.signedAt = now;
        updateData.converted = true;
      }

      if (scrollDepth && (!tracking.scrollDepth || scrollDepth > tracking.scrollDepth)) {
        updateData.scrollDepth = scrollDepth;
      }

      tracking = await prisma.proposalTracking.update({
        where: { quoteId },
        data: updateData,
      });

      // Log activity for significant events
      if (event === 'viewed' && tracking.viewCount === 1) {
        await prisma.activity.create({
          data: {
            dealId,
            type: 'PROPOSAL_VIEWED',
            title: 'Proposal Viewed',
            description: 'Customer viewed the proposal for the first time',
            performedBy: 'system',
            completedAt: now,
          },
        });
      }

      if (event === 'signed') {
        await prisma.activity.create({
          data: {
            dealId,
            type: 'PROPOSAL_SIGNED',
            title: 'Proposal Signed',
            description: 'Customer signed the proposal',
            performedBy: 'system',
            completedAt: now,
          },
        });

        // Update deal stage to WON
        await prisma.deal.update({
          where: { id: dealId },
          data: {
            stage: 'WON',
            status: 'WON',
            wonAt: now,
            probability: 100,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error('Error tracking proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track proposal' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const quoteId = searchParams.get('quoteId');

    const where: any = {};
    if (dealId) where.dealId = dealId;
    if (quoteId) where.quoteId = quoteId;

    const tracking = await prisma.proposalTracking.findMany({
      where,
      include: {
        quote: {
          select: {
            quoteReference: true,
            totalCostAfterRebates: true,
            systemSizeKw: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error('Error fetching proposal tracking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
