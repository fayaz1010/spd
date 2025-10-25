import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    // Get the most recent NEM12 upload
    const upload = await prisma.nEM12Upload.findFirst({
      where: { 
        leadId,
        status: 'COMPLETED',
      },
      orderBy: { uploadedAt: 'desc' },
    });

    if (!upload) {
      return NextResponse.json(
        { success: false, error: 'No NEM12 data found for this lead' },
        { status: 404 }
      );
    }

    // Return full analysis
    return NextResponse.json({
      success: true,
      analysis: {
        // Basic info
        nmi: upload.nmi,
        startDate: upload.startDate,
        endDate: upload.endDate,
        intervalMinutes: upload.intervalMinutes,
        
        // Statistics
        totalDays: upload.totalDays,
        totalReadings: upload.totalReadings,
        totalConsumption: upload.totalConsumption,
        averageDaily: upload.averageDaily,
        averagePer30Min: upload.averagePer30Min,
        
        // Peak analysis
        peakDemand: upload.peakDemand,
        peakDemandTime: upload.peakDemandTime,
        peakDemandDay: upload.peakDemandDay,
        
        // Patterns
        hourlyPattern: upload.hourlyPattern,
        dailyPattern: upload.dailyPattern,
        weeklyPattern: upload.weeklyPattern,
        monthlyPattern: upload.monthlyPattern,
        seasonalPattern: upload.seasonalPattern,
        
        // Time-of-use
        peakUsage: upload.peakUsage,
        shoulderUsage: upload.shoulderUsage,
        offPeakUsage: upload.offPeakUsage,
        
        // AI insights
        aiRecommendations: upload.aiRecommendations,
        householdType: upload.householdType,
        
        // Quality
        qualityScore: upload.qualityScore,
        missingIntervals: upload.missingIntervals,
      },
    });
  } catch (error) {
    console.error('NEM12 analysis fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
