import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update quote with energy profile data from Step 2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      bimonthlyBill,
      quarterlyBill,
      householdSize,
      hasEv,
      planningEv,
      evCount,
      evChargingTime,
      evChargingMethod,
      evBatterySize,
      evChargingHours,
      hasPool,
      poolHeated,
      homeOfficeCount,
      acUsage,
      hasElectricHotWater,
      dailyConsumption,
      energyAnalysis,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find quote by sessionId
    const quote = await prisma.customerQuote.findUnique({
      where: { sessionId },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found for this session' },
        { status: 404 }
      );
    }

    // Update quote with energy data
    const updated = await prisma.customerQuote.update({
      where: { sessionId },
      data: {
        bimonthlyBill,
        quarterlyBill,
        householdSize,
        hasEv: hasEv || false,
        planningEv: planningEv || false,
        evCount: evCount || 0,
        evChargingTime,
        evChargingMethod,
        evBatterySize,
        evChargingHours,
        hasPool: hasPool || false,
        poolHeated: poolHeated || false,
        homeOffices: homeOfficeCount || 0,  // Note: field is homeOffices in schema
        acUsage,
        hasElectricHotWater,
        dailyConsumption,
        // Store full energy analysis as JSON
        energyProfile: energyAnalysis || {},
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Updated quote ${updated.quoteReference} with energy profile data`);

    return NextResponse.json({
      success: true,
      quoteId: updated.id,
      quoteReference: updated.quoteReference,
    });

  } catch (error: any) {
    console.error('Error updating quote with energy data:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update quote' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
