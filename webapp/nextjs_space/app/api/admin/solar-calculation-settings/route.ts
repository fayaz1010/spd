import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET - Fetch solar calculation settings
 */
export async function GET(request: NextRequest) {
  try {
    // Try to fetch settings from database
    // For now, we'll use a simple key-value store approach
    // You can create a dedicated SolarCalculationSettings table if needed
    
    const settings = await prisma.systemSetting.findFirst({
      where: { key: 'solarCalculationSettings' }
    });

    if (settings && settings.value) {
      return NextResponse.json({
        success: true,
        settings: typeof settings.value === 'string' 
          ? JSON.parse(settings.value)
          : settings.value
      });
    }

    // Return defaults if no settings found
    return NextResponse.json({
      success: true,
      settings: {
        // Electricity Rates (Perth defaults)
        electricityRetailRate: 0.27,
        feedInTariff: 0.07,
        annualRateIncrease: 0.03,
        
        // System Parameters (Industry standards)
        systemEfficiency: 0.87,
        shadingLoss: 0.05,
        soilingLoss: 0.03,
        systemDegradation: 0.005,
        
        // Perth-Specific
        defaultTilt: 20,
        defaultAzimuth: 0,
        peakSunHours: 4.5,
        
        // Financial
        inverterReplacementYear: 12,
        inverterReplacementCost: 2000,
        discountRate: 0.05,
      }
    });
  } catch (error: any) {
    console.error('Error fetching solar calculation settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST - Save solar calculation settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate settings
    const {
      electricityRetailRate,
      feedInTariff,
      annualRateIncrease,
      systemEfficiency,
      shadingLoss,
      soilingLoss,
      systemDegradation,
      defaultTilt,
      defaultAzimuth,
      peakSunHours,
      inverterReplacementYear,
      inverterReplacementCost,
      discountRate,
    } = body;

    // Basic validation
    if (electricityRetailRate <= 0 || feedInTariff < 0) {
      return NextResponse.json(
        { error: 'Invalid electricity rates' },
        { status: 400 }
      );
    }

    if (systemEfficiency <= 0 || systemEfficiency > 1) {
      return NextResponse.json(
        { error: 'System efficiency must be between 0 and 1' },
        { status: 400 }
      );
    }

    if (peakSunHours <= 0 || peakSunHours > 12) {
      return NextResponse.json(
        { error: 'Peak sun hours must be between 0 and 12' },
        { status: 400 }
      );
    }

    // Save to database
    const saved = await prisma.systemSetting.upsert({
      where: { key: 'solarCalculationSettings' },
      update: {
        value: JSON.stringify(body),
        updatedAt: new Date(),
      },
      create: {
        key: 'solarCalculationSettings',
        value: JSON.stringify(body),
        description: 'Solar production calculation and financial projection settings',
      },
    });

    console.log('✅ Solar calculation settings saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: typeof saved.value === 'string' 
        ? JSON.parse(saved.value)
        : saved.value
    });
  } catch (error: any) {
    console.error('Error saving solar calculation settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
