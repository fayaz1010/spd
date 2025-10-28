import { NextResponse } from 'next/server';
import { getPublicChatSettings } from '@/lib/chat-settings-manager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/chat-settings
 * Returns public-safe chat settings for the frontend widget
 */
export async function GET() {
  try {
    const settings = await getPublicChatSettings();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch public chat settings:', error);
    
    // Return safe defaults on error
    return NextResponse.json({
      enabled: true,
      aiName: 'Solar Assistant',
      welcomeMessage: null,
      position: 'bottom-right',
      showOnMobile: true,
      autoOpen: false,
      autoOpenDelay: 5,
    });
  }
}
