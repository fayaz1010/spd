import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const { trackingId } = params;

    // Find email tracking record
    const tracking = await prisma.emailTracking.findUnique({
      where: { trackingId },
    });

    if (tracking) {
      // Update tracking record
      const now = new Date();
      const updateData: any = {
        openCount: tracking.openCount + 1,
        lastOpenedAt: now,
        updatedAt: now,
      };

      if (!tracking.opened) {
        updateData.opened = true;
        updateData.openedAt = now;
      }

      // Extract device info from user agent
      const userAgent = request.headers.get('user-agent') || '';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';

      if (!tracking.userAgent) {
        updateData.userAgent = userAgent;
        updateData.ipAddress = ipAddress;
        
        // Simple device detection
        if (userAgent.includes('Mobile')) {
          updateData.device = 'mobile';
        } else if (userAgent.includes('Tablet')) {
          updateData.device = 'tablet';
        } else {
          updateData.device = 'desktop';
        }

        // Simple browser detection
        if (userAgent.includes('Chrome')) {
          updateData.browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
          updateData.browser = 'Firefox';
        } else if (userAgent.includes('Safari')) {
          updateData.browser = 'Safari';
        } else if (userAgent.includes('Edge')) {
          updateData.browser = 'Edge';
        }

        // Simple OS detection
        if (userAgent.includes('Windows')) {
          updateData.os = 'Windows';
        } else if (userAgent.includes('Mac')) {
          updateData.os = 'macOS';
        } else if (userAgent.includes('Linux')) {
          updateData.os = 'Linux';
        } else if (userAgent.includes('Android')) {
          updateData.os = 'Android';
        } else if (userAgent.includes('iOS')) {
          updateData.os = 'iOS';
        }
      }

      await prisma.emailTracking.update({
        where: { trackingId },
        data: updateData,
      });

      // Update communication record
      await prisma.communication.update({
        where: { id: tracking.communicationId },
        data: {
          openedAt: tracking.opened ? tracking.openedAt : now,
        },
      });

      // Log activity on first open
      if (!tracking.opened) {
        const communication = await prisma.communication.findUnique({
          where: { id: tracking.communicationId },
          select: { dealId: true, subject: true },
        });

        if (communication) {
          await prisma.activity.create({
            data: {
              dealId: communication.dealId,
              type: 'EMAIL_RECEIVED',
              title: 'Email opened',
              description: `Customer opened email: ${communication.subject}`,
              performedBy: 'system',
              completedAt: now,
            },
          });
        }
      }
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Email tracking error:', error);
    
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  }
}
