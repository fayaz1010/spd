
/**
 * Weather Check Cron Job
 * Run daily at 6am to check weather for upcoming installations
 */

import { NextResponse } from 'next/server';
import { checkWeatherForUpcomingJobs } from '@/lib/weather';

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Starting weather check cron job...');
    
    const result = await checkWeatherForUpcomingJobs();
    
    // TODO: Send email notifications for new alerts
    // This would be implemented in Phase 24 (Email Notifications)
    
    return NextResponse.json({
      message: 'Weather check completed',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather check cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET requests without authentication in development
export const dynamic = 'force-dynamic';
export const revalidate = 0;
