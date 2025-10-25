
/**
 * Manual weather check for a specific job
 * Admin can trigger this on-demand
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkWeather, getWeatherAlertsForJob } from '@/lib/weather';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const job = await db.installationJob.findUnique({
      where: { id: params.jobId },
      include: { lead: true },
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    if (!job.scheduledDate || !job.siteLatitude || !job.siteLongitude) {
      return NextResponse.json(
        { error: 'Job missing scheduling or location data' },
        { status: 400 }
      );
    }
    
    // Check weather
    const weather = await checkWeather(
      job.siteLatitude,
      job.siteLongitude,
      job.scheduledDate
    );
    
    // Create alert if rain probability >= 70%
    let alert = null;
    if (weather.rainProbability >= 70) {
      alert = await db.weatherAlert.create({
        data: {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          jobId: job.id,
          alertDate: job.scheduledDate,
          checkDate: new Date(),
          rainProbability: weather.rainProbability,
          condition: weather.condition,
          temperature: weather.temperature,
          windSpeed: weather.windSpeed,
          alertSent: false,
        },
      });
    }
    
    // Get all existing alerts
    const alerts = await getWeatherAlertsForJob(job.id);
    
    return NextResponse.json({
      success: true,
      weather,
      alert,
      allAlerts: alerts,
    });
  } catch (error) {
    console.error('Manual weather check error:', error);
    return NextResponse.json(
      { error: 'Failed to check weather' },
      { status: 500 }
    );
  }
}
