import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/website/live-chat-settings - Get live chat settings
 */
export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.liveChatSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.liveChatSettings.create({
        data: {
          id: 'live-chat-settings',
          enabled: true,
          aiModel: 'gpt-4',
          temperature: 0.7,
          maxTokens: 500,
          aiName: 'Solar Assistant',
          welcomeMessage: 'Hi! I\'m your Solar Assistant. How can I help you today?',
          position: 'bottom-right',
          showOnMobile: true,
          autoOpen: false,
          autoOpenDelay: 5,
          staffOverrideEnabled: true,
          autoTransferToStaff: false,
          notifyStaffOnChat: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching live chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/website/live-chat-settings - Update live chat settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    let settings = await prisma.liveChatSettings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.liveChatSettings.create({
        data: {
          id: 'live-chat-settings',
          ...body,
        },
      });
    } else {
      // Update existing
      settings = await prisma.liveChatSettings.update({
        where: { id: settings.id },
        data: body,
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating live chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}
