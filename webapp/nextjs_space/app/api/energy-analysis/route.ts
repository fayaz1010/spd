import { NextRequest, NextResponse } from 'next/server';
import { getDetailedEnergyBreakdown } from '@/lib/services/consumption-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      sessionId, // Session ID to save analysis
      householdSize,
      hasEv,
      planningEv,
      evCount,
      evChargingTime,
      evChargingMethod,
      evChargingHours,
      evBatterySize,
      hasPool,
      poolHeated,
      homeOfficeCount,
      acUsage,
      hasElectricHotWater,
      bimonthlyBill,
    } = body;

    console.log('API Request Body:', {
      householdSize,
      hasEv,
      planningEv,
      evCount,
      evChargingMethod,
      evChargingHours,
      evBatterySize,
      hasPool,
      poolHeated,
      homeOfficeCount,
      bimonthlyBill,
    });

    // Validate required fields
    if (!householdSize || householdSize < 1 || householdSize > 8) {
      return NextResponse.json(
        { error: 'Invalid household size' },
        { status: 400 }
      );
    }

    // Calculate energy analysis using database values
    const analysis = await getDetailedEnergyBreakdown({
      householdSize,
      hasEv: hasEv || false,
      planningEv: planningEv || false,
      evCount: evCount || 0,
      evChargingTime,
      evChargingMethod,
      evChargingHours,
      evBatterySize,
      hasPool: hasPool || false,
      poolHeated: poolHeated || false,
      homeOfficeCount: homeOfficeCount || 0,
      acUsage: acUsage || 'moderate',
      hasElectricHotWater: hasElectricHotWater !== undefined ? hasElectricHotWater : true,
      bimonthlyBill,
    });

    console.log('Analysis Result - EV Breakdown:', analysis.breakdown.ev);

    // Save energy analysis to database
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await prisma.customerQuote.upsert({
        where: { sessionId: finalSessionId },
        update: {
          energyProfile: JSON.stringify(analysis),
          dailyConsumption: analysis.dailyConsumption,
          annualConsumption: analysis.annualConsumption,
          bimonthlyBill: bimonthlyBill,
          householdSize: householdSize,
          hasEv: hasEv || false,
          planningEv: planningEv || false,
          evCount: evCount || 0,
          hasPool: hasPool || false,
          poolHeated: poolHeated || false,
          homeOffices: homeOfficeCount || 0,
          hvacUsage: acUsage || 'moderate',
          hasElectricHotWater: hasElectricHotWater !== undefined ? hasElectricHotWater : true,
          updatedAt: new Date(),
        },
        create: {
          id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: finalSessionId,
          status: 'draft',
          energyProfile: JSON.stringify(analysis),
          dailyConsumption: analysis.dailyConsumption,
          annualConsumption: analysis.annualConsumption,
          bimonthlyBill: bimonthlyBill,
          householdSize: householdSize,
          hasEv: hasEv || false,
          planningEv: planningEv || false,
          evCount: evCount || 0,
          hasPool: hasPool || false,
          poolHeated: poolHeated || false,
          homeOffices: homeOfficeCount || 0,
          hvacUsage: acUsage || 'moderate',
          hasElectricHotWater: hasElectricHotWater !== undefined ? hasElectricHotWater : true,
          updatedAt: new Date(),
        },
      });
      
      console.log(`✅ Saved energy analysis for session: ${finalSessionId}`);
    } catch (dbError) {
      console.error('⚠️  Failed to save energy analysis to database:', dbError);
      // Continue even if save fails - analysis is still returned
    }

    return NextResponse.json(
      {
        success: true,
        data: analysis,
        sessionId: finalSessionId, // Return sessionId for client to use
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Energy analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate energy analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
