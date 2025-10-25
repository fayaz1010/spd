import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const { trackingId } = params;
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing URL parameter' },
        { status: 400 }
      );
    }

    // Find email tracking record
    const tracking = await prisma.emailTracking.findUnique({
      where: { trackingId },
    });

    if (tracking) {
      const now = new Date();
      
      // Get existing clicked links
      const clickedLinks = (tracking.clickedLinks as any[]) || [];
      
      // Find if this URL was clicked before
      const existingLink = clickedLinks.find((link: any) => link.url === targetUrl);
      
      if (existingLink) {
        // Increment count
        existingLink.count += 1;
        existingLink.lastClickedAt = now.toISOString();
      } else {
        // Add new link
        clickedLinks.push({
          url: targetUrl,
          count: 1,
          firstClickedAt: now.toISOString(),
          lastClickedAt: now.toISOString(),
        });
      }

      // Update tracking record
      const updateData: any = {
        clickCount: tracking.clickCount + 1,
        clickedLinks,
        updatedAt: now,
      };

      if (!tracking.clicked) {
        updateData.clicked = true;
        updateData.clickedAt = now;
      }

      await prisma.emailTracking.update({
        where: { trackingId },
        data: updateData,
      });

      // Update communication record
      await prisma.communication.update({
        where: { id: tracking.communicationId },
        data: {
          clickedAt: tracking.clicked ? tracking.clickedAt : now,
        },
      });

      // Log activity on first click
      if (!tracking.clicked) {
        const communication = await prisma.communication.findUnique({
          where: { id: tracking.communicationId },
          select: { dealId: true, subject: true },
        });

        if (communication) {
          await prisma.activity.create({
            data: {
              dealId: communication.dealId,
              type: 'EMAIL_RECEIVED',
              title: 'Email link clicked',
              description: `Customer clicked link in email: ${communication.subject}`,
              performedBy: 'system',
              completedAt: now,
            },
          });
        }
      }
    }

    // Redirect to target URL
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error('Click tracking error:', error);
    
    // Redirect to target URL even on error
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    
    if (targetUrl) {
      return NextResponse.redirect(targetUrl);
    }

    return NextResponse.json(
      { success: false, error: 'Tracking failed' },
      { status: 500 }
    );
  }
}
