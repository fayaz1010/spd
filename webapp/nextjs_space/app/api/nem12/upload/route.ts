import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  parseNEM12, 
  validateNEM12, 
  calculateNEM12Statistics,
  analyzeNEM12Patterns,
  analyzeTimeOfUse
} from '@/lib/nem12-parser';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('leadId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Validate NEM12 format
    const validation = validateNEM12(fileContent);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid NEM12 file format',
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Parse NEM12 file
    let parsedData;
    try {
      parsedData = parseNEM12(fileContent);
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse NEM12 file',
          details: error.message 
        },
        { status: 400 }
      );
    }

    // Calculate statistics
    const statistics = calculateNEM12Statistics(parsedData.intervals);
    
    // Analyze patterns
    const patterns = analyzeNEM12Patterns(parsedData.intervals);
    
    // Analyze time-of-use
    const timeOfUse = analyzeTimeOfUse(parsedData.intervals);

    // Convert intervals to JSON format
    const intervalData = parsedData.intervals.map(i => ({
      timestamp: i.timestamp.toISOString(),
      consumption: i.consumption,
      quality: i.quality,
    }));

    // Create NEM12Upload record
    const nem12Upload = await prisma.nEM12Upload.create({
      data: {
        leadId,
        fileName: file.name,
        fileSize: file.size,
        status: 'COMPLETED',
        processedAt: new Date(),
        
        // Meter info
        nmi: parsedData.nmi,
        meterSerial: parsedData.meterSerial,
        suffix: parsedData.suffix,
        
        // Date range
        startDate: parsedData.startDate,
        endDate: parsedData.endDate,
        intervalMinutes: parsedData.intervalMinutes,
        
        // Interval data
        intervalData,
        
        // Statistics
        totalDays: statistics.totalDays,
        totalReadings: statistics.totalReadings,
        totalConsumption: statistics.totalConsumption,
        averageDaily: statistics.averageDaily,
        averagePer30Min: statistics.averagePer30Min,
        
        // Peak analysis
        peakDemand: statistics.peakDemand,
        peakDemandTime: statistics.peakDemandTime,
        peakDemandDay: statistics.peakDemandDay,
        
        // Patterns
        hourlyPattern: patterns.hourlyPattern,
        dailyPattern: patterns.dailyPattern,
        
        // Time-of-use
        peakUsage: timeOfUse.peakUsage,
        shoulderUsage: timeOfUse.shoulderUsage,
        offPeakUsage: timeOfUse.offPeakUsage,
        
        // Quality
        missingIntervals: parsedData.missingIntervals,
        qualityScore: parsedData.qualityScore,
      },
    });

    // Update Lead with NEM12 flag
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        hasNEM12Data: true,
        nem12DataSource: 'uploaded',
        // Update consumption data
        dailyConsumption: statistics.averageDaily,
        annualConsumption: statistics.averageDaily * 365,
        usageSource: 'nem12',
      },
    });

    return NextResponse.json({
      success: true,
      uploadId: nem12Upload.id,
      summary: {
        nmi: parsedData.nmi,
        startDate: parsedData.startDate,
        endDate: parsedData.endDate,
        totalDays: statistics.totalDays,
        averageDaily: statistics.averageDaily,
        peakDemand: statistics.peakDemand,
        qualityScore: parsedData.qualityScore,
      },
    });
  } catch (error: any) {
    console.error('NEM12 upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process NEM12 file',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
