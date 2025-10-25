
/**
 * Weather Integration for Installation Safety
 * Checks weather forecasts and creates alerts for risky installations
 */

import { db } from './db';

// Weather data interface
export interface WeatherData {
  date: string;
  temperature: number;
  condition: string;
  rainProbability: number;
  windSpeed: number;
  description: string;
}

/**
 * Check weather forecast for a specific location and date
 * Uses Open-Meteo API (free, no API key required)
 */
export async function checkWeather(
  latitude: number,
  longitude: number,
  date: Date
): Promise<WeatherData> {
  try {
    // Format date for API (YYYY-MM-DD)
    const dateStr = date.toISOString().split('T')[0];
    
    // Calculate date range (3 days before to 7 days after)
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 7);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Call Open-Meteo API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,weathercode&start_date=${startDateStr}&end_date=${endDateStr}&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Find data for the specific date
    const dateIndex = data.daily.time.findIndex((d: string) => d === dateStr);
    
    if (dateIndex === -1) {
      throw new Error('Date not found in weather forecast');
    }
    
    // Extract weather data
    const weatherCode = data.daily.weathercode[dateIndex];
    const condition = getWeatherCondition(weatherCode);
    
    return {
      date: dateStr,
      temperature: (data.daily.temperature_2m_max[dateIndex] + data.daily.temperature_2m_min[dateIndex]) / 2,
      condition,
      rainProbability: data.daily.precipitation_probability_max[dateIndex] || 0,
      windSpeed: data.daily.windspeed_10m_max[dateIndex] || 0,
      description: getWeatherDescription(weatherCode),
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    // Return default data if API fails
    return {
      date: date.toISOString().split('T')[0],
      temperature: 20,
      condition: 'Unknown',
      rainProbability: 0,
      windSpeed: 0,
      description: 'Weather data unavailable',
    };
  }
}

/**
 * Convert WMO weather code to condition string
 */
function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code <= 86) return 'Snow Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

/**
 * Get human-readable weather description
 */
function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  
  return descriptions[code] || 'Unknown conditions';
}

/**
 * Check weather for all upcoming jobs and create alerts
 * To be called by cron job
 */
export async function checkWeatherForUpcomingJobs() {
  try {
    // Get jobs scheduled 3-5 days from now
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);
    
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    fiveDaysFromNow.setHours(23, 59, 59, 999);
    
    const jobs = await db.installationJob.findMany({
      where: {
        scheduledDate: {
          gte: threeDaysFromNow,
          lte: fiveDaysFromNow,
        },
        status: {
          in: ['SCHEDULED', 'SUB_CONFIRMED', 'MATERIALS_READY'],
        },
        siteLatitude: { not: null },
        siteLongitude: { not: null },
      },
      include: {
        lead: true,
        team: true,
        subcontractor: true,
      },
    });
    
    console.log(`Checking weather for ${jobs.length} jobs...`);
    
    const alerts = [];
    
    for (const job of jobs) {
      if (!job.siteLatitude || !job.siteLongitude || !job.scheduledDate) {
        continue;
      }
      
      // Check if alert already exists for this job and date
      const existingAlert = await db.weatherAlert.findFirst({
        where: {
          jobId: job.id,
          alertDate: job.scheduledDate,
        },
      });
      
      if (existingAlert) {
        console.log(`Alert already exists for job ${job.jobNumber}`);
        continue;
      }
      
      // Fetch weather
      const weather = await checkWeather(
        job.siteLatitude,
        job.siteLongitude,
        job.scheduledDate
      );
      
      // Create alert if rain probability >= 70%
      if (weather.rainProbability >= 70) {
        const alert = await db.weatherAlert.create({
          data: {
            id: `alert_${job.id}_${Date.now()}`,
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
        
        alerts.push({
          alert,
          job,
          weather,
        });
        
        console.log(`⚠️ Weather alert created for job ${job.jobNumber}: ${weather.rainProbability}% rain`);
      }
    }
    
    return {
      success: true,
      jobsChecked: jobs.length,
      alertsCreated: alerts.length,
      alerts,
    };
  } catch (error) {
    console.error('Error checking weather:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      jobsChecked: 0,
      alertsCreated: 0,
      alerts: [],
    };
  }
}

/**
 * Get weather alerts for a specific job
 */
export async function getWeatherAlertsForJob(jobId: string) {
  return db.weatherAlert.findMany({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Mark weather alert as sent
 */
export async function markAlertAsSent(alertId: string) {
  return db.weatherAlert.update({
    where: { id: alertId },
    data: {
      alertSent: true,
      alertSentAt: new Date(),
    },
  });
}
