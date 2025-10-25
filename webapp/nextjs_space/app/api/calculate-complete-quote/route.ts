
/**
 * ============================================================================
 * COMPLETE QUOTE CALCULATION API
 * ============================================================================
 * 
 * This API endpoint uses the centralized solar-calculator module to generate
 * a complete, consistent quote from Google Solar API data and user preferences.
 * 
 * This is the NEW single source of truth for quote generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateCompleteSolarQuote } from '@/lib/solar-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      // Google Solar API data
      googleSolarData,
      
      // User preferences
      quarterlyBill,
      
      // Household characteristics
      householdSize,
      acTier,
      poolType,
      homeOfficeCount,
      evCount,
      hasEv,
      planningEv,
      
      // NEW: EV-specific data from Step 3
      dailyConsumption,
      evUsageTier,
      evChargingTime,
      
      // System preferences
      batterySizeKwh,
      panelBrandId,
      batteryBrandId,
      inverterBrandId,
    } = body;
    
    // Validate required fields
    if (!googleSolarData) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: googleSolarData' },
        { status: 400 }
      );
    }
    
    if (!householdSize || householdSize <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid household size' },
        { status: 400 }
      );
    }
    
    // Calculate complete quote
    const quote = await calculateCompleteSolarQuote(
      googleSolarData,
      {
        quarterlyBill,
        householdSize,
        acTier: acTier || 'moderate',
        poolType: poolType || 'none',
        homeOfficeCount: homeOfficeCount || 0,
        evCount: evCount || 0,
        hasEv: hasEv || false,
        planningEv: planningEv || false,
        // NEW: Pass EV-specific data
        dailyConsumption,
        evUsageTier,
        evChargingTime,
        batterySizeKwh,
        panelBrandId,
        batteryBrandId,
        inverterBrandId,
      }
    );
    
    return NextResponse.json({
      success: true,
      quote,
    });
    
  } catch (error: any) {
    console.error('Error calculating complete quote:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate quote' },
      { status: 500 }
    );
  }
}

